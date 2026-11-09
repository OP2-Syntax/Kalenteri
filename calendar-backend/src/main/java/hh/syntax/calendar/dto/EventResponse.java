package hh.syntax.calendar.dto;

import java.time.LocalDateTime;
import java.util.List;

public record EventResponse(
        Long id,
        String title,
        String description,
        LocalDateTime startTime,
        LocalDateTime endTime,
        String ownerUsername,
        boolean mine,
        List<UserDto> participants) {}
