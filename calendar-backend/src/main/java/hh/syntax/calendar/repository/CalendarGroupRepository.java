package hh.syntax.calendar.repository;

import hh.syntax.calendar.model.CalendarGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CalendarGroupRepository extends JpaRepository<CalendarGroup, Long> {
    Optional<CalendarGroup> findByInviteCodeIgnoreCase(String inviteCode);
    List<CalendarGroup> findByMembers_IdOrderByNameAsc(Long userId);
}
