package hh.syntax.calendar;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.hamcrest.Matchers.nullValue;

import com.jayway.jsonpath.JsonPath;
import hh.syntax.calendar.model.Event;
import hh.syntax.calendar.repository.EventRepository;
import hh.syntax.calendar.service.VotingExpiryService;
import java.time.LocalDateTime;
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
class VotingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private VotingExpiryService votingExpiryService;

    private static final String EVENT_JSON = """
        {"title": "Elokuvat", "description": "Kaverien kanssa",
         "startTime": "2030-01-01T18:00:00", "endTime": "2030-01-01T20:00:00"%s}
        """;

    private static final String OPTION_A = "{\"startTime\": \"2030-02-01T18:00:00\", \"endTime\": \"2030-02-01T20:00:00\"}";
    private static final String OPTION_B = "{\"startTime\": \"2030-02-02T18:00:00\", \"endTime\": \"2030-02-02T20:00:00\"}";

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

    private long createEvent(String token, long friendId) throws Exception {
        String response = mockMvc.perform(post("/api/events/shared")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(EVENT_JSON.formatted(", \"participantIds\": [" + friendId + "]")))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return Long.parseLong(extract(response, "\"id\"\\s*:\\s*(\\d+)"));
    }

    private String votingBody(String... options) {
        return "{\"options\": [" + String.join(",", options) + "]}";
    }

    private String setVoting(String token, long eventId, String body) throws Exception {
        return mockMvc.perform(put("/api/events/" + eventId + "/voting")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
    }

    private long optionId(String votingJson, int index) {
        return ((Number) JsonPath.read(votingJson, "$.options[" + index + "].id")).longValue();
    }

    private void vote(String token, long eventId, long optionId, int expectedStatus) throws Exception {
        mockMvc.perform(post("/api/events/" + eventId + "/voting/vote")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"optionId\": " + optionId + "}"))
                .andExpect(status().is(expectedStatus));
    }

    // omistaja + yksi kaveri + valmis äänestys kahdella vaihtoehdolla
    private record Setup(String ownerToken, String friendToken, long eventId, long optionA, long optionB) {}

    private Setup setup() throws Exception {
        String ownerName = uniqueUser();
        String friendName = uniqueUser();
        String ownerToken = register(ownerName);
        String friendToken = register(friendName);
        befriend(ownerToken, friendToken, friendName);
        long eventId = createEvent(ownerToken, userId(friendName, ownerToken));
        String voting = setVoting(ownerToken, eventId, votingBody(OPTION_A, OPTION_B));
        return new Setup(ownerToken, friendToken, eventId, optionId(voting, 0), optionId(voting, 1));
    }

    @Test
    void membersVoteAndCanChangeVote() throws Exception {
        Setup s = setup();

        vote(s.friendToken(), s.eventId(), s.optionA(), 200);
        vote(s.friendToken(), s.eventId(), s.optionB(), 200); // äänen vaihto
        vote(s.ownerToken(), s.eventId(), s.optionB(), 200);

        mockMvc.perform(get("/api/events/" + s.eventId() + "/voting")
                        .header("Authorization", "Bearer " + s.friendToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.canVote").value(true))
                .andExpect(jsonPath("$.myVoteOptionId").value(s.optionB()))
                .andExpect(jsonPath("$.options[0].votes").value(0))
                .andExpect(jsonPath("$.options[1].votes").value(2));
    }

    @Test
    void eventShowsEarliestOptionWhileVoting() throws Exception {
        Setup s = setup();
        mockMvc.perform(get("/api/events/shared").header("Authorization", "Bearer " + s.ownerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + s.eventId() + ")].votingStatus").value("OPEN"))
                .andExpect(jsonPath("$[?(@.id == " + s.eventId() + ")].startTime").value("2030-02-01T18:00:00"));
    }

    @Test
    void strangerCannotSeeOrVote() throws Exception {
        Setup s = setup();
        String strangerToken = register(uniqueUser());

        mockMvc.perform(get("/api/events/" + s.eventId() + "/voting")
                        .header("Authorization", "Bearer " + strangerToken))
                .andExpect(status().isNotFound());
        vote(strangerToken, s.eventId(), s.optionA(), 404);
    }

    @Test
    void onlyOwnerCanSetVotingAndConfirm() throws Exception {
        Setup s = setup();

        mockMvc.perform(put("/api/events/" + s.eventId() + "/voting")
                        .header("Authorization", "Bearer " + s.friendToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(votingBody(OPTION_A, OPTION_B)))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/events/" + s.eventId() + "/voting/confirm")
                        .header("Authorization", "Bearer " + s.friendToken()))
                .andExpect(status().isNotFound());
    }

    @Test
    void invalidVotingRequestsAreRejected() throws Exception {
        Setup s = setup();

        // vain yksi vaihtoehto
        mockMvc.perform(put("/api/events/" + s.eventId() + "/voting")
                        .header("Authorization", "Bearer " + s.ownerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(votingBody(OPTION_A)))
                .andExpect(status().isBadRequest());
        // loppu ennen alkua
        String backwards = "{\"startTime\": \"2030-02-01T20:00:00\", \"endTime\": \"2030-02-01T18:00:00\"}";
        mockMvc.perform(put("/api/events/" + s.eventId() + "/voting")
                        .header("Authorization", "Bearer " + s.ownerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(votingBody(OPTION_A, backwards)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void cannotVoteForOptionOfAnotherEvent() throws Exception {
        Setup first = setup();
        Setup second = setup();
        vote(first.ownerToken(), first.eventId(), second.optionA(), 400);
    }

    @Test
    void confirmWithoutVotesIsRejected() throws Exception {
        Setup s = setup();
        mockMvc.perform(post("/api/events/" + s.eventId() + "/voting/confirm")
                        .header("Authorization", "Bearer " + s.ownerToken()))
                .andExpect(status().isConflict());
    }

    @Test
    void confirmPicksVotedOptionSetsEventTimeAndClosesVoting() throws Exception {
        Setup s = setup();
        // vain B saa ääniä, joten se voittaa
        vote(s.friendToken(), s.eventId(), s.optionB(), 200);

        mockMvc.perform(post("/api/events/" + s.eventId() + "/voting/confirm")
                        .header("Authorization", "Bearer " + s.ownerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.winnerOptionId").value(s.optionB()))
                .andExpect(jsonPath("$.voting.status").value("CLOSED"))
                .andExpect(jsonPath("$.voting.winnerOptionId").value(s.optionB()))
                .andExpect(jsonPath("$.event.startTime").value("2030-02-02T18:00:00"))
                .andExpect(jsonPath("$.event.endTime").value("2030-02-02T20:00:00"));

        // sulkemisen jälkeen ei voi äänestää, vahvistaa uudestaan tai asettaa uutta äänestystä
        vote(s.friendToken(), s.eventId(), s.optionA(), 409);
        mockMvc.perform(post("/api/events/" + s.eventId() + "/voting/confirm")
                        .header("Authorization", "Bearer " + s.ownerToken()))
                .andExpect(status().isConflict());
        mockMvc.perform(put("/api/events/" + s.eventId() + "/voting")
                        .header("Authorization", "Bearer " + s.ownerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(votingBody(OPTION_A, OPTION_B)))
                .andExpect(status().isConflict());
    }

    @Test
    void confirmPicksOptionWithMostVotes() throws Exception {
        Setup s = setup();
        vote(s.friendToken(), s.eventId(), s.optionB(), 200);
        vote(s.ownerToken(), s.eventId(), s.optionB(), 200);

        String confirm = mockMvc.perform(post("/api/events/" + s.eventId() + "/voting/confirm")
                        .header("Authorization", "Bearer " + s.ownerToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertEquals(s.optionB(), ((Number) JsonPath.read(confirm, "$.winnerOptionId")).longValue());
    }

    @Test
    void tieIsWonByOneOfTheTiedOptions() throws Exception {
        Setup s = setup();
        vote(s.friendToken(), s.eventId(), s.optionB(), 200);
        vote(s.ownerToken(), s.eventId(), s.optionA(), 200);

        String confirm = mockMvc.perform(post("/api/events/" + s.eventId() + "/voting/confirm")
                        .header("Authorization", "Bearer " + s.ownerToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        long winner = ((Number) JsonPath.read(confirm, "$.winnerOptionId")).longValue();
        assertTrue(winner == s.optionA() || winner == s.optionB());
    }

    @Test
    void votingDurationIsReturnedAsDeadline() throws Exception {
        Setup s = setup();
        LocalDateTime beforeUpdate = LocalDateTime.now();

        String result = mockMvc.perform(put("/api/events/" + s.eventId() + "/voting")
                        .header("Authorization", "Bearer " + s.ownerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"options\": [" + OPTION_A + ", " + OPTION_B + "], \"durationHours\": 36}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        LocalDateTime deadline = LocalDateTime.parse(JsonPath.read(result, "$.deadline"));
        assertTrue(deadline.isAfter(beforeUpdate.plusHours(35)));
        assertTrue(deadline.isBefore(LocalDateTime.now().plusHours(37)));
    }

    @Test
    void expiredVotingChoosesTheMostVotedOptionAndCloses() throws Exception {
        Setup s = setup();
        vote(s.friendToken(), s.eventId(), s.optionB(), 200);
        vote(s.ownerToken(), s.eventId(), s.optionB(), 200);
        Event event = eventRepository.findById(s.eventId()).orElseThrow();
        event.setVotingDeadline(LocalDateTime.now().minusMinutes(1));
        eventRepository.saveAndFlush(event);

        votingExpiryService.expireDueVotings();

        mockMvc.perform(get("/api/events/" + s.eventId() + "/voting")
                        .header("Authorization", "Bearer " + s.friendToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"))
                .andExpect(jsonPath("$.winnerOptionId").value(s.optionB()));
        assertTrue(eventRepository.findById(s.eventId()).orElseThrow().isVotingClosed());
    }

    @Test
    void expiredVotingWithoutVotesClosesWithoutWinner() throws Exception {
        Setup s = setup();
        Event event = eventRepository.findById(s.eventId()).orElseThrow();
        event.setVotingDeadline(LocalDateTime.now().minusMinutes(1));
        eventRepository.saveAndFlush(event);

        votingExpiryService.expireDueVotings();

        mockMvc.perform(get("/api/events/" + s.eventId() + "/voting")
                        .header("Authorization", "Bearer " + s.ownerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"))
                .andExpect(jsonPath("$.winnerOptionId").value(nullValue()));
        Event closedEvent = eventRepository.findById(s.eventId()).orElseThrow();
        assertTrue(closedEvent.isVotingClosed());
        assertEquals(1, closedEvent.getStartTime().getDayOfMonth());
    }

    @Test
    void replacingOptionsResetsVotes() throws Exception {
        Setup s = setup();
        vote(s.friendToken(), s.eventId(), s.optionA(), 200);

        String replaced = setVoting(s.ownerToken(), s.eventId(), votingBody(OPTION_A, OPTION_B));
        assertEquals(0, ((Number) JsonPath.read(replaced, "$.options[0].votes")).intValue());
        assertEquals(0, ((Number) JsonPath.read(replaced, "$.options[1].votes")).intValue());
    }

    @Test
    void deletingEventAlsoDeletesVotingData() throws Exception {
        Setup s = setup();
        vote(s.friendToken(), s.eventId(), s.optionA(), 200);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .delete("/api/events/" + s.eventId())
                        .header("Authorization", "Bearer " + s.ownerToken()))
                .andExpect(status().isNoContent());
    }
}
