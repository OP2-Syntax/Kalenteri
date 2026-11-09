package hh.syntax.calendar.dto;

import java.time.LocalDateTime;
import java.util.List;

public record EventRequest(
        String title,
        String description,
        LocalDateTime startTime,
        LocalDateTime endTime,
        List<Long> participantIds) {}
