package hh.syntax.calendar.controller;

import hh.syntax.calendar.dto.FriendRequestDto;
import hh.syntax.calendar.dto.UserDto;
import hh.syntax.calendar.model.FriendRequest;
import hh.syntax.calendar.model.User;
import hh.syntax.calendar.repository.FriendRequestRepository;
import hh.syntax.calendar.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api")
public class FriendController {

    private final UserRepository userRepository;
    private final FriendRequestRepository friendRequestRepository;

    public FriendController(UserRepository userRepository, FriendRequestRepository friendRequestRepository) {
        this.userRepository = userRepository;
        this.friendRequestRepository = friendRequestRepository;
    }

    // hakee kirjautuneen käyttäjän Authentication-objektista
    private User getCurrentUser(Authentication authentication) {
        return userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Käyttäjää ei löytynyt"));
    }

    // palautetaan vain id ja käyttäjänimi (ei salasanaa eikä sähköpostia)
    private UserDto toDto(User user) {
        return new UserDto(user.getId(), user.getUsername());
    }

    // GET /api/users/search?q=ann — hakee käyttäjiä käyttäjänimellä (ei omaa itseä)
    @GetMapping("/users/search")
    public List<UserDto> searchUsers(@RequestParam String q, Authentication authentication) {
        if (q.isBlank()) {
            return List.of();
        }

        return userRepository.findByUsernameContainingIgnoreCase(q.trim()).stream()
                .filter(user -> !user.getUsername().equals(authentication.getName()))
                .limit(20)
                .map(this::toDto)
                .toList();
    }

    // GET /api/friends — kaverilista (vain hyväksytyt)
    @GetMapping("/friends")
    @Transactional(readOnly = true)
    public List<UserDto> getFriends(Authentication authentication) {
        return getCurrentUser(authentication).getFriends().stream()
                .map(this::toDto)
                .sorted(Comparator.comparing(UserDto::username, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    // GET /api/friends/requests/incoming — minulle saapuneet pyynnöt
    @GetMapping("/friends/requests/incoming")
    @Transactional(readOnly = true)
    public List<FriendRequestDto> getIncomingRequests(Authentication authentication) {
        return friendRequestRepository.findByReceiver(getCurrentUser(authentication)).stream()
                .map(r -> new FriendRequestDto(r.getId(), toDto(r.getSender())))
                .toList();
    }

    // GET /api/friends/requests/outgoing — minun lähettämäni pyynnöt
    @GetMapping("/friends/requests/outgoing")
    @Transactional(readOnly = true)
    public List<FriendRequestDto> getOutgoingRequests(Authentication authentication) {
        return friendRequestRepository.findBySender(getCurrentUser(authentication)).stream()
                .map(r -> new FriendRequestDto(r.getId(), toDto(r.getReceiver())))
                .toList();
    }

    // POST /api/friends/requests/5 — lähettää kaveripyynnön käyttäjälle 5
    @PostMapping("/friends/requests/{userId}")
    @Transactional
    public ResponseEntity<FriendRequestDto> sendRequest(@PathVariable Long userId, Authentication authentication) {
        User me = getCurrentUser(authentication);

        // itselle ei voi lähettää pyyntöä
        if (me.getId().equals(userId)) {
            return ResponseEntity.badRequest().build();
        }

        User target = userRepository.findById(userId).orElse(null);
        if (target == null) {
            return ResponseEntity.notFound().build();
        }

        // on jo kaveri
        if (me.getFriends().contains(target)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        // pyyntö on jo olemassa, kumpaan suuntaan tahansa
        if (friendRequestRepository.existsBySenderAndReceiver(me, target)
                || friendRequestRepository.existsBySenderAndReceiver(target, me)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        FriendRequest request = new FriendRequest();
        request.setSender(me);
        request.setReceiver(target);
        FriendRequest saved = friendRequestRepository.save(request);

        return ResponseEntity.ok(new FriendRequestDto(saved.getId(), toDto(target)));
    }

    // POST /api/friends/requests/5/accept — hyväksyy saapuneen pyynnön (vain vastaanottaja)
    @PostMapping("/friends/requests/{requestId}/accept")
    @Transactional
    public ResponseEntity<UserDto> acceptRequest(@PathVariable Long requestId, Authentication authentication) {
        User me = getCurrentUser(authentication);
        FriendRequest request = friendRequestRepository.findById(requestId).orElse(null);

        // muiden pyyntöihin vastataan 404, ettei niiden olemassaoloa paljasteta
        if (request == null || !request.getReceiver().getId().equals(me.getId())) {
            return ResponseEntity.notFound().build();
        }

        User sender = request.getSender();
        me.getFriends().add(sender);
        sender.getFriends().add(me);
        friendRequestRepository.delete(request);

        return ResponseEntity.ok(toDto(sender));
    }

    // DELETE /api/friends/requests/5 — lähettäjä peruu tai vastaanottaja hylkää pyynnön
    @DeleteMapping("/friends/requests/{requestId}")
    @Transactional
    public ResponseEntity<Void> deleteRequest(@PathVariable Long requestId, Authentication authentication) {
        User me = getCurrentUser(authentication);
        FriendRequest request = friendRequestRepository.findById(requestId).orElse(null);

        boolean involved = request != null
                && (request.getSender().getId().equals(me.getId())
                    || request.getReceiver().getId().equals(me.getId()));
        if (!involved) {
            return ResponseEntity.notFound().build();
        }

        friendRequestRepository.delete(request);
        return ResponseEntity.noContent().build();
    }
}