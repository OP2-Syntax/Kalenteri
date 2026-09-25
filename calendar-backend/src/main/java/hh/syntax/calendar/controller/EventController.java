package hh.syntax.calendar.controller;

import hh.syntax.calendar.model.Event;
import hh.syntax.calendar.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import hh.syntax.calendar.model.User;
import hh.syntax.calendar.repository.UserRepository;

import java.util.List;

@RestController
@RequestMapping("/api/events")
public class EventController {

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private UserRepository userRepository;  

    // GET /api/events — hakee kaikki tapahtumat
    @GetMapping
    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }

    // GET /api/events/5 — hakee yhden tapahtuman id:n perusteella
    @GetMapping("/{id}")
    public ResponseEntity<Event> getEventById(@PathVariable Long id) {
        return eventRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // POST /api/events — luo uuden tapahtuman
    @PostMapping
    public Event createEvent(@RequestBody Event event) {

        User user = userRepository.findById(1L)
            .orElseThrow(() -> new RuntimeException("Käyttäjää ei löytynyt"));

        event.setOwner(user); // asettaa ownerin tapahtumalle

        return eventRepository.save(event);
    }

    // DELETE /api/events/5 — poistaa tapahtuman
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        eventRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}