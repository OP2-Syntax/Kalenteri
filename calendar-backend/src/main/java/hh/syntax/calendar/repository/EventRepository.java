package hh.syntax.calendar.repository;

import hh.syntax.calendar.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByOwnerId(Long ownerId);
    List<Event> findByOwner_Username(String username);

    @Query("select distinct e from Event e "
         + "left join e.participants p "
         + "left join e.groups g "
         + "left join g.members gm "
         + "where e.owner.username = :username or p.username = :username or gm.username = :username")
    List<Event> findVisibleTo(@Param("username") String username);

    @Query("select distinct e from Event e join fetch e.timeOptions where e.votingClosed = false")
    List<Event> findOpenVotings();
}