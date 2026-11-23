package hh.syntax.calendar.controller;

import hh.syntax.calendar.dto.ConfirmResponse;
import hh.syntax.calendar.dto.EventResponse;
import hh.syntax.calendar.dto.TimeOptionDto;
import hh.syntax.calendar.dto.TimeOptionRequest;
import hh.syntax.calendar.dto.UserDto;
import hh.syntax.calendar.dto.VoteRequest;
import hh.syntax.calendar.dto.VotingRequest;
import hh.syntax.calendar.dto.VotingResponse;
import hh.syntax.calendar.model.Event;
import hh.syntax.calendar.model.TimeOption;
import hh.syntax.calendar.model.TimeVote;
import hh.syntax.calendar.model.User;
import hh.syntax.calendar.repository.EventRepository;
import hh.syntax.calendar.repository.TimeVoteRepository;
import hh.syntax.calendar.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

// Tapahtuman ajankohdasta äänestäminen: omistaja asettaa vaihtoehdot,
// omistaja ja kutsutut osallistujat äänestävät, omistaja vahvistaa ajan (eniten ääniä saanut voittaa).
@RestController
@RequestMapping("/api/events/{eventId}/voting")
public class VotingController {

    private static final int MAX_OPTIONS = 10;

    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final TimeVoteRepository voteRepository;

    public VotingController(EventRepository eventRepository,
                            UserRepository userRepository,
                            TimeVoteRepository voteRepository) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.voteRepository = voteRepository;
    }

    private User getCurrentUser(Authentication authentication) {
        return userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private static boolean isOwner(Event event, User user) {
        return event.getOwner().getId().equals(user.getId());
    }

    // äänestää saa tapahtuman omistaja ja kutsutut osallistujat
    private static boolean isMember(Event event, User user) {
        return isOwner(event, user) || event.getParticipants().contains(user);
    }

    // NONE / OPEN / CLOSED
    public static String statusOf(Event event) {
        if (event.getTimeOptions().isEmpty()) {
            return "NONE";
        }
        if (event.isVotingClosed()) {
            return "CLOSED";
        }
        return "OPEN";
    }

    private static ResponseEntity<Object> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("message", message));
    }

    private VotingResponse toVotingResponse(Event event, User currentUser) {
        String status = statusOf(event);

        // lasketaan vain nykyisten jäsenten äänet (poistetun osallistujan ääni ei enää paina)
        List<TimeVote> votes = voteRepository.findByEventId(event.getId()).stream()
                .filter(vote -> isMember(event, vote.getUser()))
                .toList();

        List<TimeOption> sorted = event.getTimeOptions().stream()
                .sorted(Comparator.comparing(TimeOption::getStartTime).thenComparing(TimeOption::getId))
                .toList();

        Long myVote = votes.stream()
                .filter(vote -> vote.getUser().getId().equals(currentUser.getId()))
                .map(vote -> vote.getOption().getId())
                .findFirst()
                .orElse(null);

        List<TimeOptionDto> options = sorted.stream()
                .map(option -> {
                    List<UserDto> voters = votes.stream()
                            .filter(vote -> vote.getOption().getId().equals(option.getId()))
                            .map(vote -> new UserDto(vote.getUser().getId(), vote.getUser().getUsername()))
                            .sorted(Comparator.comparing(UserDto::username, String.CASE_INSENSITIVE_ORDER))
                            .toList();
                    return new TimeOptionDto(option.getId(), option.getStartTime(), option.getEndTime(),
                            voters.size(), voters);
                })
                .toList();

        // vahvistuksen jälkeen voittaja on se vaihtoehto, jonka aika on tapahtuman aika
        Long winner = null;
        if ("CLOSED".equals(status)) {
            winner = sorted.stream()
                    .filter(option -> option.getStartTime().equals(event.getStartTime())
                            && option.getEndTime().equals(event.getEndTime()))
                    .map(TimeOption::getId)
                    .findFirst()
                    .orElse(null);
        }

        return new VotingResponse(status, "OPEN".equals(status),
                myVote, winner, options);
    }

    private EventResponse toEventResponse(Event event, User currentUser) {
        List<UserDto> participants = event.getParticipants().stream()
                .map(user -> new UserDto(user.getId(), user.getUsername()))
                .sorted(Comparator.comparing(UserDto::username, String.CASE_INSENSITIVE_ORDER))
                .toList();
        return new EventResponse(event.getId(), event.getTitle(), event.getDescription(),
                event.getStartTime(), event.getEndTime(), event.getOwner().getUsername(),
                isOwner(event, currentUser), participants, event.getColor(),
                statusOf(event));
    }

    // GET /api/events/5/voting — äänestyksen tila, tulokset ja oma ääni
    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<Object> getVoting(@PathVariable Long eventId, Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        Event event = eventRepository.findById(eventId).orElse(null);
        if (event == null || !isMember(event, currentUser)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(toVotingResponse(event, currentUser));
    }

    // PUT /api/events/5/voting — omistaja asettaa vaihtoehdot (korvaa vanhat, nollaa äänet)
    @PutMapping
    @Transactional
    public ResponseEntity<Object> setVoting(@PathVariable Long eventId,
                                            @RequestBody VotingRequest request,
                                            Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        Event event = eventRepository.findById(eventId).orElse(null);
        if (event == null || !isOwner(event, currentUser)) {
            return ResponseEntity.notFound().build();
        }
        if (event.isVotingClosed()) {
            return error(HttpStatus.CONFLICT, "The time has already been confirmed");
        }
        List<TimeOptionRequest> requested = request.options();
        if (requested == null || requested.size() < 2 || requested.size() > MAX_OPTIONS) {
            return error(HttpStatus.BAD_REQUEST, "Give 2-" + MAX_OPTIONS + " options");
        }
        Set<String> seen = new HashSet<>();
        for (TimeOptionRequest option : requested) {
            if (option == null || option.startTime() == null || option.endTime() == null
                    || !option.endTime().isAfter(option.startTime())) {
                return error(HttpStatus.BAD_REQUEST, "Each option needs a start and an end, and the end must be after the start");
            }
            if (!seen.add(option.startTime() + "|" + option.endTime())) {
                return error(HttpStatus.BAD_REQUEST, "The same option was given more than once");
            }
        }

        // vanhat vaihtoehdot (ja niiden äänet) poistuvat orphanRemovalin kautta
        event.getTimeOptions().clear();
        for (TimeOptionRequest option : requested) {
            TimeOption created = new TimeOption();
            created.setEvent(event);
            created.setStartTime(option.startTime());
            created.setEndTime(option.endTime());
            event.getTimeOptions().add(created);
        }

        // äänestyksen aikana tapahtuma näkyy kalenterissa aikaisimman vaihtoehdon kohdalla
        TimeOptionRequest earliest = requested.stream()
                .min(Comparator.comparing(TimeOptionRequest::startTime))
                .orElseThrow();
        event.setStartTime(earliest.startTime());
        event.setEndTime(earliest.endTime());

        eventRepository.saveAndFlush(event);
        return ResponseEntity.ok(toVotingResponse(event, currentUser));
    }

    // POST /api/events/5/voting/vote — antaa tai vaihtaa oman äänen
    @PostMapping("/vote")
    @Transactional
    public ResponseEntity<Object> vote(@PathVariable Long eventId,
                                       @RequestBody VoteRequest request,
                                       Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        Event event = eventRepository.findById(eventId).orElse(null);
        if (event == null || !isMember(event, currentUser)) {
            return ResponseEntity.notFound().build();
        }
        String status = statusOf(event);
        if ("NONE".equals(status)) {
            return error(HttpStatus.CONFLICT, "This event has no voting");
        }
        if (!"OPEN".equals(status)) {
            return error(HttpStatus.CONFLICT, "Voting has ended");
        }
        TimeOption chosen = request.optionId() == null ? null : event.getTimeOptions().stream()
                .filter(option -> option.getId().equals(request.optionId()))
                .findFirst()
                .orElse(null);
        if (chosen == null) {
            return error(HttpStatus.BAD_REQUEST, "That option does not belong to this event");
        }

        // olemassa olevaa ääntä päivitetään (ei poisteta + lisätä), jotta uniikki-rajoite ei laukea
        TimeVote vote = voteRepository.findByEventIdAndUserId(event.getId(), currentUser.getId())
                .orElseGet(() -> {
                    TimeVote created = new TimeVote();
                    created.setEvent(event);
                    created.setUser(currentUser);
                    return created;
                });
        vote.setOption(chosen);
        voteRepository.saveAndFlush(vote);
        return ResponseEntity.ok(toVotingResponse(event, currentUser));
    }

    // POST /api/events/5/voting/confirm — omistaja vahvistaa ajan (eniten ääniä saanut vaihtoehto) ja sulkee äänestyksen
    @PostMapping("/confirm")
    @Transactional
    public ResponseEntity<Object> confirm(@PathVariable Long eventId, Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        Event event = eventRepository.findById(eventId).orElse(null);
        if (event == null || !isOwner(event, currentUser)) {
            return ResponseEntity.notFound().build();
        }
        if ("NONE".equals(statusOf(event))) {
            return error(HttpStatus.CONFLICT, "This event has no voting");
        }
        if (event.isVotingClosed()) {
            return error(HttpStatus.CONFLICT, "The time has already been confirmed");
        }

        List<TimeOption> options = event.getTimeOptions().stream()
                .sorted(Comparator.comparing(TimeOption::getId))
                .toList();
        Map<Long, Long> counts = voteRepository.findByEventId(event.getId()).stream()
                .filter(vote -> isMember(event, vote.getUser()))
                .collect(Collectors.groupingBy(vote -> vote.getOption().getId(), Collectors.counting()));

        // eniten ääniä saanut voittaa, tasatilanteessa aikaisempi vaihtoehto
        TimeOption winner = options.stream()
                .filter(option -> counts.getOrDefault(option.getId(), 0L) > 0)
                .max(Comparator.comparing((TimeOption option) -> counts.get(option.getId()))
                        .thenComparing(TimeOption::getStartTime, Comparator.reverseOrder()))
                .orElse(null);
        if (winner == null) {
            return error(HttpStatus.CONFLICT, "No votes, the time cannot be confirmed");
        }

        event.setStartTime(winner.getStartTime());
        event.setEndTime(winner.getEndTime());
        event.setVotingClosed(true);
        eventRepository.saveAndFlush(event);

        return ResponseEntity.ok(new ConfirmResponse(
                winner.getId(), toVotingResponse(event, currentUser), toEventResponse(event, currentUser)));
    }
}
