package hh.syntax.calendar.repository;

import hh.syntax.calendar.model.TimeVote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TimeVoteRepository extends JpaRepository<TimeVote, Long> {
    List<TimeVote> findByEventId(Long eventId);
    Optional<TimeVote> findByEventIdAndUserId(Long eventId, Long userId);
}
