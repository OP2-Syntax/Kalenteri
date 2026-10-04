package hh.syntax.calendar;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import hh.syntax.calendar.model.Event;
import hh.syntax.calendar.repository.EventRepository;

// Tapahtuman haku id:llä, muokkaus (PUT) ja poisto (DELETE).
// Jokainen testi luo oman käyttäjänsä, joten testit eivät riipu toisistaan.
@SpringBootTest
@AutoConfigureMockMvc
class EventCrudIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private EventRepository eventRepository;

    private static final String EVENT_JSON = """
        {"title": "Palaveri", "description": "Alkuperäinen",
         "startTime": "2030-01-01T10:00:00", "endTime": "2030-01-01T11:00:00"}
        """;

    private static final String UPDATED_JSON = """
        {"title": "Muokattu palaveri", "description": "Päivitetty",
         "startTime": "2030-02-02T12:00:00", "endTime": "2030-02-02T13:00:00"}
        """;

    // --- apumetodit ---

    private String uniqueUser() {
        return "user" + UUID.randomUUID().toString().substring(0, 8);
    }

    private String registerAndGetToken(String username) throws Exception {
        String body = """
            {"username": "%s", "email": "%s@example.com", "password": "salasana123"}
            """.formatted(username, username);

        String response = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        return extract(response, "\"token\"\\s*:\\s*\"([^\"]+)\"");
    }

    // luo tapahtuman annetulle tokenille ja palauttaa sen id:n
    private long createEvent(String token) throws Exception {
        String response = mockMvc.perform(post("/api/events")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(EVENT_JSON))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        return Long.parseLong(extract(response, "\"id\"\\s*:\\s*(\\d+)"));
    }

    private String extract(String text, String regex) {
        Matcher m = Pattern.compile(regex).matcher(text);
        assertTrue(m.find(), "Vastauksesta ei löytynyt: " + regex);
        return m.group(1);
    }

    // --- GET /api/events/{id} ---

    @Test
    void getEventById_returnsOwnEvent() throws Exception {
        String token = registerAndGetToken(uniqueUser());
        long id = createEvent(token);

        mockMvc.perform(get("/api/events/" + id)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.title").value("Palaveri"));
    }

    // --- PUT /api/events/{id} ---

    @Test
    void updateEvent_changesFields() throws Exception {
        String token = registerAndGetToken(uniqueUser());
        long id = createEvent(token);

        mockMvc.perform(put("/api/events/" + id)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(UPDATED_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Muokattu palaveri"))
                .andExpect(jsonPath("$.description").value("Päivitetty"));

        // tarkistetaan muutos myös tietokannasta
        Event saved = eventRepository.findById(id).orElseThrow();
        assertEquals("Muokattu palaveri", saved.getTitle());
        assertEquals(2, saved.getStartTime().getMonthValue());
    }

    @Test
    void updateEvent_whenMissing_returns404() throws Exception {
        String token = registerAndGetToken(uniqueUser());

        mockMvc.perform(put("/api/events/999999")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(UPDATED_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateEvent_withoutToken_isRejected() throws Exception {
        mockMvc.perform(put("/api/events/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(UPDATED_JSON))
                .andExpect(status().is4xxClientError());
    }

    // --- DELETE /api/events/{id} ---

    @Test
    void deleteEvent_removesOwnEvent() throws Exception {
        String token = registerAndGetToken(uniqueUser());
        long id = createEvent(token);

        mockMvc.perform(delete("/api/events/" + id)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        assertTrue(eventRepository.findById(id).isEmpty());
    }

    @Test
    void deleteEvent_withoutToken_isRejected() throws Exception {
        mockMvc.perform(delete("/api/events/1"))
                .andExpect(status().is4xxClientError());
    }
}