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
class CalendarGroupIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

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

    private String extract(String text, String regex) {
        Matcher matcher = Pattern.compile(regex).matcher(text);
        assertTrue(matcher.find(), "Response did not contain: " + regex);
        return matcher.group(1);
    }

    private String uniqueUser() {
        return "user" + UUID.randomUUID().toString().substring(0, 8);
    }

    private long userId(String token, String username) throws Exception {
        String response = mockMvc.perform(get("/api/users/search")
                        .param("q", username)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return Long.parseLong(extract(response, "\"id\"\\s*:\\s*(\\d+)"));
    }

    private String createGroup(String ownerToken, String name) throws Exception {
        return mockMvc.perform(post("/api/groups")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"name": "%s"}
                            """.formatted(name)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
    }

    @Test
    void onlyOwnerCanRemoveOtherGroupMembersButMemberCanLeave() throws Exception {
        String ownerToken = register(uniqueUser());
        String memberName = uniqueUser();
        String memberToken = register(memberName);
        String otherMemberName = uniqueUser();
        String otherMemberToken = register(otherMemberName);
        String group = createGroup(ownerToken, "Friends");
        long groupId = Long.parseLong(extract(group, "\"id\"\\s*:\\s*(\\d+)"));
        String inviteCode = extract(group, "\"inviteCode\"\\s*:\\s*\"([^\"]+)\"");
        long memberId = userId(ownerToken, memberName);
        long otherMemberId = userId(ownerToken, otherMemberName);

        mockMvc.perform(post("/api/groups/join")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"inviteCode": "%s"}
                            """.formatted(inviteCode)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/groups/join")
                        .header("Authorization", "Bearer " + otherMemberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"inviteCode": "%s"}
                            """.formatted(inviteCode)))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/groups/" + groupId + "/members/" + otherMemberId)
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/groups/" + groupId + "/members/" + otherMemberId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(delete("/api/groups/" + groupId + "/members/" + memberId)
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isNoContent());
    }

    @Test
    void memberJoiningLaterCanSeeAndVoteOnAnEventThatAlreadyIncludesTheirGroup() throws Exception {
        String ownerToken = register(uniqueUser());
        String newMemberName = uniqueUser();
        String newMemberToken = register(newMemberName);
        String group = createGroup(ownerToken, "Friends");
        long groupId = Long.parseLong(extract(group, "\"id\"\\s*:\\s*(\\d+)"));
        String inviteCode = extract(group, "\"inviteCode\"\\s*:\\s*\"([^\"]+)\"");

        String createdEvent = mockMvc.perform(post("/api/events/shared")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"title":"Group event","description":"",
                             "startTime":"2030-02-01T18:00:00","endTime":"2030-02-01T20:00:00",
                             "groupIds":[%d]}
                            """.formatted(groupId)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        long eventId = Long.parseLong(extract(createdEvent, "\"id\"\\s*:\\s*(\\d+)"));

        mockMvc.perform(get("/api/events/shared")
                        .header("Authorization", "Bearer " + newMemberToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        mockMvc.perform(post("/api/groups/join")
                        .header("Authorization", "Bearer " + newMemberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"inviteCode": "%s"}
                            """.formatted(inviteCode)))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/events/" + eventId + "/voting")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"options":[
                              {"startTime":"2030-02-01T18:00:00","endTime":"2030-02-01T20:00:00"},
                              {"startTime":"2030-02-02T18:00:00","endTime":"2030-02-02T20:00:00"}
                            ]}
                            """))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/events/shared")
                        .header("Authorization", "Bearer " + newMemberToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(eventId))
                .andExpect(jsonPath("$[0].participants[0].username").value(newMemberName))
                .andExpect(jsonPath("$[0].mine").value(false));

        String voting = mockMvc.perform(get("/api/events/" + eventId + "/voting")
                        .header("Authorization", "Bearer " + newMemberToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.canVote").value(true))
                .andReturn().getResponse().getContentAsString();
        long optionId = Long.parseLong(extract(voting, "\"id\"\\s*:\\s*(\\d+)"));

        mockMvc.perform(post("/api/events/" + eventId + "/voting/vote")
                        .header("Authorization", "Bearer " + newMemberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"optionId\":" + optionId + "}"))
                .andExpect(status().isOk());
    }
}
