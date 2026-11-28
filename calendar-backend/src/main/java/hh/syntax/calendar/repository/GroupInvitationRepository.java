package hh.syntax.calendar.repository;

import hh.syntax.calendar.model.CalendarGroup;
import hh.syntax.calendar.model.GroupInvitation;
import hh.syntax.calendar.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GroupInvitationRepository extends JpaRepository<GroupInvitation, Long> {
    List<GroupInvitation> findByReceiver(User receiver);
    Optional<GroupInvitation> findByGroupAndReceiver(CalendarGroup group, User receiver);
    boolean existsByGroupAndReceiver(CalendarGroup group, User receiver);
}
