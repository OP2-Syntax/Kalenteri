package hh.syntax.calendar.dto;

import java.time.LocalDateTime;
import java.util.List;

// status: NONE (ei äänestystä), OPEN (käynnissä), CLOSED (aika vahvistettu)
public record VotingResponse(
        String status,
        boolean canVote,
        Long myVoteOptionId,
        Long winnerOptionId,
        LocalDateTime deadline,
        List<TimeOptionDto> options) {}
