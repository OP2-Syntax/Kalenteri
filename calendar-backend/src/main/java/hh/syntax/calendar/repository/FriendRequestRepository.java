package hh.syntax.calendar.repository;

import hh.syntax.calendar.model.FriendRequest;
import hh.syntax.calendar.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FriendRequestRepository extends JpaRepository<FriendRequest, Long> {

    // minulle saapuneet pyynnöt
    List<FriendRequest> findByReceiver(User receiver);

    // minun lähettämäni pyynnöt
    List<FriendRequest> findBySender(User sender);

    boolean existsBySenderAndReceiver(User sender, User receiver);
}