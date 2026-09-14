package hh.syntax.calendar.config;

import hh.syntax.calendar.model.Event;
import hh.syntax.calendar.model.User;
import hh.syntax.calendar.repository.EventRepository;
import hh.syntax.calendar.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

// Tämä luokka lisää testidataa tietokantaan sovelluksen käynnistyessä
@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final EventRepository eventRepository;

    public DataSeeder(UserRepository userRepository, EventRepository eventRepository) {
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
    }

    @Override
    public void run(String... args) {
        // lisätään dataa vain, jos tietokanta on tyhjä (ettei duplikaatteja synny joka käynnistyksellä)
        if (userRepository.count() == 0) {

            // luodaan testikäyttäjä
            User testUser = new User();
            testUser.setUsername("testuser");
            testUser.setEmail("test@example.com");
            testUser.setPassword("salasana123"); // huom: ei vielä hashattu, korjataan myöhemmin Securityn kanssa
            userRepository.save(testUser);

            // luodaan muutama testitapahtuma tälle käyttäjälle
            Event event1 = new Event();
            event1.setTitle("Tiimipalaveri");
            event1.setDescription("Viikoittainen tiimipalaveri");
            event1.setStartTime(LocalDateTime.now().plusDays(1).withHour(10).withMinute(0));
            event1.setEndTime(LocalDateTime.now().plusDays(1).withHour(11).withMinute(0));
            event1.setOwner(testUser);
            eventRepository.save(event1);

            Event event2 = new Event();
            event2.setTitle("Lääkärikäynti");
            event2.setDescription("Vuosittainen tarkastus");
            event2.setStartTime(LocalDateTime.now().plusDays(3).withHour(14).withMinute(30));
            event2.setEndTime(LocalDateTime.now().plusDays(3).withHour(15).withMinute(0));
            event2.setOwner(testUser);
            eventRepository.save(event2);

            Event event3 = new Event();
            event3.setTitle("Syntymäpäivät");
            event3.setDescription("Kaverin synttärit");
            event3.setStartTime(LocalDateTime.now().plusDays(5).withHour(18).withMinute(0));
            event3.setOwner(testUser);
            eventRepository.save(event3);

            System.out.println("Testidata lisätty tietokantaan!");
        }
    }
}