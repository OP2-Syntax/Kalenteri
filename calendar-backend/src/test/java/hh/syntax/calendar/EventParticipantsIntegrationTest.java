package hh.syntax.calendar;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
class EventParticipantsIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private static final String EVENT_JSON = """
        {"title": "Elokuvat", "description": "Kaverien kanssa",
         "startTime": "2030-01-01T18:00:00", "endTime": "2030-01-01T20:00:00"%s}
        """;

    private String uniqueUser() {
        return "user" + UUID.randomUUID().toString().substring(0, 8);
    }

    private String extract(String text, String regex) {
        Matcher matcher = Pattern.compile(regex).matcher(text);
        assertTrue(matcher.find(), "Vastauksesta ei löytynyt: " + regex);
        return matcher.group(1);
    }

    private String register(String username) throws Exception {
        String response = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"username": "%s", "email": "%s@example.com", "password": "salasana123"}
                            """.formatted(username, username)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return extract(response, "\"token\"\\s*:\\s*\"([^\"]+)\"");
    }

    private long userId(String username, String token) throws Exception {
        String response = mockMvc.perform(get("/api/users/search")
                        .param("q", username)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return Long.parseLong(extract(response, "\"id\"\\s*:\\s*(\\d+)"));
    }

    private void befriend(String ownerToken, String friendToken, String friendName) throws Exception {
        long friendId = userId(friendName, ownerToken);
        String response = mockMvc.perform(post("/api/friends/requests/" + friendId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String requestId = extract(response, "\"id\"\\s*:\\s*(\\d+)");
        mockMvc.perform(post("/api/friends/requests/" + requestId + "/accept")
                        .header("Authorization", "Bearer " + friendToken))
                .andExpect(status().isOk());
    }

    private long createEvent(String token, String participants) throws Exception {
        String response = mockMvc.perform(post("/api/events/shared")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(EVENT_JSON.formatted(participants)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return Long.parseLong(extract(response, "\"id\"\\s*:\\s*(\\d+)"));
    }

    @Test
    void invitedFriendCanSeeEventAndOnlySafeParticipantDetails() throws Exception {
        String ownerName = uniqueUser();
        String friendName = uniqueUser();
        String ownerToken = register(ownerName);
        String friendToken = register(friendName);
        befriend(ownerToken, friendToken, friendName);
        long friendId = userId(friendName, ownerToken);

        long eventId = createEvent(ownerToken, ", \"participantIds\": [" + friendId + "]");

        mockMvc.perform(get("/api/events/shared").header("Authorization", "Bearer " + friendToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + eventId + ")].title").value("Elokuvat"))
                .andExpect(jsonPath("$[?(@.id == " + eventId + ")].ownerUsername").value(ownerName));
        mockMvc.perform(get("/api/events/shared").header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + eventId + ")].participants[0].username").value(friendName))
                .andExpect(jsonPath("$[?(@.id == " + eventId + ")].participants[0].password").doesNotExist())
                .andExpect(jsonPath("$[?(@.id == " + eventId + ")].participants[0].email").doesNotExist());
    }

    @Test
    void nonFriendCannotBeInvited() throws Exception {
        String ownerToken = register(uniqueUser());
        String strangerName = uniqueUser();
        register(strangerName);
        long strangerId = userId(strangerName, ownerToken);

        mockMvc.perform(post("/api/events/shared")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(EVENT_JSON.formatted(", \"participantIds\": [" + strangerId + "]")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void ownerCanAddAndRemoveParticipant() throws Exception {
        String ownerName = uniqueUser();
        String friendName = uniqueUser();
        String ownerToken = register(ownerName);
        String friendToken = register(friendName);
        befriend(ownerToken, friendToken, friendName);
        long friendId = userId(friendName, ownerToken);
        long eventId = createEvent(ownerToken, "");

        mockMvc.perform(post("/api/events/" + eventId + "/participants/" + friendId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.participants[0].username").value(friendName));
        mockMvc.perform(delete("/api/events/" + eventId + "/participants/" + friendId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isNoContent());
    }

    @Test
    void updateWithoutParticipantIdsKeepsInvitedFriends() throws Exception {
        String ownerName = uniqueUser();
        String friendName = uniqueUser();
        String ownerToken = register(ownerName);
        String friendToken = register(friendName);
        befriend(ownerToken, friendToken, friendName);
        long friendId = userId(friendName, ownerToken);
        long eventId = createEvent(ownerToken, ", \"participantIds\": [" + friendId + "]");

        mockMvc.perform(put("/api/events/shared/" + eventId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"title": "Uusi nimi", "description": "x",
                             "startTime": "2030-01-01T18:00:00", "endTime": "2030-01-01T20:00:00"}
                            """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Uusi nimi"))
                .andExpect(jsonPath("$.participants[0].username").value(friendName));
    }

    @Test
    void nonOwnerCannotEditOrDeleteEvent() throws Exception {
        String ownerToken = register(uniqueUser());
        String otherToken = register(uniqueUser());
        long eventId = createEvent(ownerToken, "");

        mockMvc.perform(put("/api/events/" + eventId)
                        .header("Authorization", "Bearer " + otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(EVENT_JSON.formatted("")))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/events/" + eventId)
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());
    }
}
