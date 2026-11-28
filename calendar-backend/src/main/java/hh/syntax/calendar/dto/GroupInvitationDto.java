package hh.syntax.calendar.dto;

public record GroupInvitationDto(
        Long id,
        CalendarGroupDto group,
        UserDto sender,
        UserDto receiver) {}
