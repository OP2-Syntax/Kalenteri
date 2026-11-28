package hh.syntax.calendar.dto;

import java.util.List;

public record VotingRequest(List<TimeOptionRequest> options, Integer durationHours) {}
