package hh.syntax.calendar.controller;

import hh.syntax.calendar.model.Event;
import hh.syntax.calendar.model.User;
import hh.syntax.calendar.repository.EventRepository;
import hh.syntax.calendar.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    // GET /api/events — hakee vain kirjautuneen käyttäjän omat tapahtumat
    @GetMapping
    public List<Event> getAllEvents(Authentication authentication) {
        return eventRepository.findByOwner_Username(authentication.getName());
    }

    // GET /api/events/5 — hakee yhden tapahtuman id:n perusteella
    @GetMapping("/{id}")
    public ResponseEntity<Event> getEventById(@PathVariable Long id) {
        return eventRepository.findById(id)
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

    // DELETE /api/events/5 — poistaa tapahtuman
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        eventRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // PUT /api/events/5 - muokkaa tapahtumaa
    @PutMapping("/{id}")
    public ResponseEntity<Event> updateEvent(@PathVariable Long id, @RequestBody Event updatedEvent) {
        return eventRepository.findById(id)
            .map(event -> {
                event.setTitle(updatedEvent.getTitle());
                event.setDescription(updatedEvent.getDescription());
                event.setStartTime(updatedEvent.getStartTime());
                event.setEndTime(updatedEvent.getEndTime());

                return ResponseEntity.ok(eventRepository.save(event));
            })
            .orElse(ResponseEntity.notFound().build());
    }
}