package hh.syntax.calendar.service;

import hh.syntax.calendar.model.Event;
import hh.syntax.calendar.model.TimeOption;
import hh.syntax.calendar.model.TimeVote;
import hh.syntax.calendar.model.User;
import hh.syntax.calendar.repository.EventRepository;
import hh.syntax.calendar.repository.TimeVoteRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class VotingExpiryService {

    private static final int DEFAULT_DURATION_HOURS = 24;

    private final EventRepository eventRepository;
    private final TimeVoteRepository voteRepository;

    public VotingExpiryService(EventRepository eventRepository, TimeVoteRepository voteRepository) {
        this.eventRepository = eventRepository;
        this.voteRepository = voteRepository;
    }

    @Scheduled(fixedDelay = 30_000L)
    @Transactional
    public void expireDueVotings() {
        LocalDateTime now = LocalDateTime.now();
        for (Event event : eventRepository.findOpenVotings()) {
            closeIfExpired(event, now);
        }
    }

    public boolean closeIfExpired(Event event, LocalDateTime now) {
        if (event.isVotingClosed() || event.getTimeOptions().isEmpty()) {
            return false;
        }
        if (event.getVotingDeadline() == null) {
            event.setVotingDeadline(now.plusHours(DEFAULT_DURATION_HOURS));
            return false;
        }
        if (event.getVotingDeadline().isAfter(now)) {
            return false;
        }

        TimeOption winner = chooseWinner(event);
        if (winner != null) {
            event.setStartTime(winner.getStartTime());
            event.setEndTime(winner.getEndTime());
        }
        event.setVotingClosed(true);
        return true;
    }

    public TimeOption chooseWinner(Event event) {
        List<TimeVote> eligibleVotes = voteRepository.findByEventId(event.getId()).stream()
                .filter(vote -> isMember(event, vote.getUser()))
                .toList();
        Map<Long, Long> counts = eligibleVotes.stream()
                .collect(Collectors.groupingBy(vote -> vote.getOption().getId(), Collectors.counting()));
        long highestCount = counts.values().stream().mapToLong(Long::longValue).max().orElse(0);
        if (highestCount == 0) {
            return null;
        }

        List<TimeOption> tiedOptions = event.getTimeOptions().stream()
                .filter(option -> counts.getOrDefault(option.getId(), 0L) == highestCount)
                .toList();
        return tiedOptions.get(ThreadLocalRandom.current().nextInt(tiedOptions.size()));
    }

    private static boolean isMember(Event event, User user) {
        return event.getOwner().getId().equals(user.getId())
                || event.getParticipants().contains(user)
                || event.getGroups().stream().anyMatch(group -> group.getMembers().contains(user));
    }
}
