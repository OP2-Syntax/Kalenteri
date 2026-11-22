package hh.syntax.calendar.dto;

import java.time.LocalDateTime;
import java.util.List;

public record TimeOptionDto(
        Long id,
        LocalDateTime startTime,
        LocalDateTime endTime,
        int votes,
        List<UserDto> voters) {}
