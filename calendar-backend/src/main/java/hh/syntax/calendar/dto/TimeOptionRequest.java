package hh.syntax.calendar.dto;

import java.time.LocalDateTime;

public record TimeOptionRequest(LocalDateTime startTime, LocalDateTime endTime) {}
