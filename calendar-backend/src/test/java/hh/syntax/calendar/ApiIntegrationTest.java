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

@SpringBootTest
@AutoConfigureMockMvc
class ApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private String registerAndGetToken(String username) throws Exception {
        String body = """
            {"username": "%s", "email": "%s@example.com", "password": "salasana123"}
            """.formatted(username, username);

        String response = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Matcher m = Pattern.compile("\"token\"\\s*:\\s*\"([^\"]+)\"").matcher(response);
        assertTrue(m.find(), "Vastauksessa pitäisi olla token");
        return m.group(1);
    }

    private String uniqueUser() {
        return "user" + UUID.randomUUID().toString().substring(0, 8);
    }

    private static final String EVENT_JSON = """
        {"title": "Palaveri", "description": "Testitapahtuma",
         "startTime": "2030-01-01T10:00:00", "endTime": "2030-01-01T11:00:00"}
        """;

    @Test
    void register_returnsToken() throws Exception {
        String token = registerAndGetToken(uniqueUser());

        assertFalse(token.isBlank());
    }

    @Test
    void login_withCorrectCredentials_returnsToken() throws Exception {
        String username = uniqueUser();
        registerAndGetToken(username);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"username": "%s", "password": "salasana123"}
                            """.formatted(username)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void login_withWrongPassword_isRejected() throws Exception {
        String username = uniqueUser();
        registerAndGetToken(username);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"username": "%s", "password": "vaaraSalasana"}
                            """.formatted(username)))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void getEvents_withoutToken_isRejected() throws Exception {
        mockMvc.perform(get("/api/events"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void createEvent_thenGetEvents_returnsOwnEvent() throws Exception {
        String token = registerAndGetToken(uniqueUser());

        mockMvc.perform(post("/api/events")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(EVENT_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Palaveri"));

        mockMvc.perform(get("/api/events")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Palaveri"));
    }

    @Test
    void getEvents_doesNotReturnOtherUsersEvents() throws Exception {
        String tokenA = registerAndGetToken(uniqueUser());
        String tokenB = registerAndGetToken(uniqueUser());

        mockMvc.perform(post("/api/events")
                .header("Authorization", "Bearer " + tokenA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(EVENT_JSON)).andExpect(status().isOk());

        mockMvc.perform(get("/api/events")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void getEventById_whenMissing_returns404() throws Exception {
        String token = registerAndGetToken(uniqueUser());

        mockMvc.perform(get("/api/events/999999")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }
}