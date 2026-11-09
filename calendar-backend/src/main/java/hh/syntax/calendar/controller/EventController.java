package hh.syntax.calendar.controller;

import hh.syntax.calendar.dto.EventRequest;
import hh.syntax.calendar.dto.EventResponse;
import hh.syntax.calendar.dto.UserDto;
import hh.syntax.calendar.model.Event;
import hh.syntax.calendar.model.User;
import hh.syntax.calendar.repository.EventRepository;
import hh.syntax.calendar.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    public EventController(EventRepository eventRepository, UserRepository userRepository) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
    }

    // hakee kirjautuneen käyttäjän Authentication-objektista
    private User getCurrentUser(Authentication authentication) {
        return userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Käyttäjää ei löytynyt"));
    }

    private EventResponse toResponse(Event event, User currentUser) {
        List<UserDto> participants = event.getParticipants().stream()
                .map(user -> new UserDto(user.getId(), user.getUsername()))
                .sorted(Comparator.comparing(UserDto::username, String.CASE_INSENSITIVE_ORDER))
                .toList();

        return new EventResponse(
                event.getId(),
                event.getTitle(),
                event.getDescription(),
                event.getStartTime(),
                event.getEndTime(),
                event.getOwner().getUsername(),
                event.getOwner().getId().equals(currentUser.getId()),
                participants);
    }

    private Set<User> resolveParticipants(User owner, List<Long> participantIds) {
        Set<User> participants = new HashSet<>();
        if (participantIds == null) {
            return participants;
        }
        for (Long participantId : participantIds) {
            if (participantId == null || participantId.equals(owner.getId())) {
                continue;
            }
            User friend = owner.getFriends().stream()
                    .filter(candidate -> candidate.getId().equals(participantId))
                    .findFirst()
                    .orElse(null);
            if (friend == null) {
                return null;
            }
            participants.add(friend);
        }
        return participants;
    }

    // GET /api/events — hakee vain kirjautuneen käyttäjän omat tapahtumat
    @GetMapping
    public List<Event> getAllEvents(Authentication authentication) {
        return eventRepository.findByOwner_Username(authentication.getName());
    }

    // GET /api/events/shared — omat tapahtumat sekä tapahtumat, joihin käyttäjä on kutsuttu
    @GetMapping("/shared")
    @Transactional(readOnly = true)
    public List<EventResponse> getSharedEvents(Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        return eventRepository.findVisibleTo(currentUser.getUsername()).stream()
                .map(event -> toResponse(event, currentUser))
                .toList();
    }

    // GET /api/events/5 — hakee yhden tapahtuman id:n perusteella
    @GetMapping("/{id}")
    public ResponseEntity<Event> getEventById(@PathVariable Long id, Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        return eventRepository.findById(id)
                .filter(event -> event.getOwner().getId().equals(currentUser.getId())
                        || event.getParticipants().contains(currentUser))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // POST /api/events — luo uuden tapahtuman, owner asetetaan kirjautuneesta käyttäjästä
    @PostMapping
    public Event createEvent(@RequestBody Event event, Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        event.setOwner(currentUser);
        return eventRepository.save(event);
    }

    // POST /api/events/shared — luo tapahtuman ja kutsuu halutut kaverit
    @PostMapping("/shared")
    @Transactional
    public ResponseEntity<EventResponse> createSharedEvent(@RequestBody EventRequest request,
                                                           Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        Set<User> participants = resolveParticipants(currentUser, request.participantIds());
        if (participants == null) {
            return ResponseEntity.badRequest().build();
        }

        Event event = new Event();
        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setStartTime(request.startTime());
        event.setEndTime(request.endTime());
        event.setOwner(currentUser);
        event.setParticipants(participants);
        return ResponseEntity.ok(toResponse(eventRepository.save(event), currentUser));
    }

    // DELETE /api/events/5 — poistaa tapahtuman
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id, Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        Event event = eventRepository.findById(id).orElse(null);
        if (event == null || !event.getOwner().getId().equals(currentUser.getId())) {
            return ResponseEntity.notFound().build();
        }
        eventRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // PUT /api/events/5 - muokkaa tapahtumaa
    @PutMapping("/{id}")
    public ResponseEntity<Event> updateEvent(@PathVariable Long id, @RequestBody Event updatedEvent,
                                             Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        return eventRepository.findById(id)
            .filter(event -> event.getOwner().getId().equals(currentUser.getId()))
            .map(event -> {
                event.setTitle(updatedEvent.getTitle());
                event.setDescription(updatedEvent.getDescription());
                event.setStartTime(updatedEvent.getStartTime());
                event.setEndTime(updatedEvent.getEndTime());

                return ResponseEntity.ok(eventRepository.save(event));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    // PUT /api/events/shared/5 — päivittää tapahtuman säilyttäen osallistujat, ellei listaa anneta
    @PutMapping("/shared/{id}")
    @Transactional
    public ResponseEntity<EventResponse> updateSharedEvent(@PathVariable Long id,
                                                           @RequestBody EventRequest request,
                                                           Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        Event event = eventRepository.findById(id).orElse(null);
        if (event == null || !event.getOwner().getId().equals(currentUser.getId())) {
            return ResponseEntity.notFound().build();
        }
        if (request.participantIds() != null) {
            Set<User> participants = resolveParticipants(currentUser, request.participantIds());
            if (participants == null) {
                return ResponseEntity.badRequest().build();
            }
            event.setParticipants(participants);
        }

        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setStartTime(request.startTime());
        event.setEndTime(request.endTime());
        return ResponseEntity.ok(toResponse(eventRepository.save(event), currentUser));
    }

    // POST /api/events/5/participants/7 — omistaja kutsuu kaverin tapahtumaan
    @PostMapping("/{id}/participants/{userId}")
    @Transactional
    public ResponseEntity<EventResponse> addParticipant(@PathVariable Long id,
                                                        @PathVariable Long userId,
                                                        Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        Event event = eventRepository.findById(id).orElse(null);
        if (event == null || !event.getOwner().getId().equals(currentUser.getId())) {
            return ResponseEntity.notFound().build();
        }

        Set<User> participants = resolveParticipants(currentUser, List.of(userId));
        if (participants == null || participants.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        event.getParticipants().addAll(participants);
        return ResponseEntity.ok(toResponse(eventRepository.save(event), currentUser));
    }

    // DELETE /api/events/5/participants/7 — omistaja poistaa osallistujan, osallistuja voi poistua itse
    @DeleteMapping("/{id}/participants/{userId}")
    @Transactional
    public ResponseEntity<Void> removeParticipant(@PathVariable Long id,
                                                  @PathVariable Long userId,
                                                  Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        Event event = eventRepository.findById(id).orElse(null);
        boolean owner = event != null && event.getOwner().getId().equals(currentUser.getId());
        boolean participant = event != null && event.getParticipants().contains(currentUser);
        if (event == null || (!owner && !participant)) {
            return ResponseEntity.notFound().build();
        }
        if (!owner && !currentUser.getId().equals(userId)) {
            return ResponseEntity.status(403).build();
        }

        event.getParticipants().removeIf(user -> user.getId().equals(userId));
        eventRepository.save(event);
        return ResponseEntity.noContent().build();
    }
}