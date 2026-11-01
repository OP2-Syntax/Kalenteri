package hh.syntax.calendar.dto;

// pyynnön id ja toinen osapuoli (saapuneissa lähettäjä, lähetetyissä vastaanottaja)
public record FriendRequestDto(Long id, UserDto user) {}