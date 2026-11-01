package hh.syntax.calendar.repository;

import hh.syntax.calendar.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    // haku käyttäjänimen osalla, isot/pienet kirjaimet eivät merkitse
    List<User> findByUsernameContainingIgnoreCase(String username);
}