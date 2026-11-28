package hh.syntax.calendar.dto;

import java.util.List;

public record CalendarGroupDto(
        Long id,
        String name,
        String inviteCode,
        Long ownerId,
        String ownerUsername,
        List<UserDto> members) {}
