package hh.syntax.calendar.controller;

import hh.syntax.calendar.dto.CalendarGroupDto;
import hh.syntax.calendar.dto.CreateCalendarGroupRequest;
import hh.syntax.calendar.dto.JoinCalendarGroupRequest;
import hh.syntax.calendar.dto.GroupInvitationDto;
import hh.syntax.calendar.dto.UserDto;
import hh.syntax.calendar.model.CalendarGroup;
import hh.syntax.calendar.model.GroupInvitation;
import hh.syntax.calendar.model.User;
import hh.syntax.calendar.repository.CalendarGroupRepository;
import hh.syntax.calendar.repository.GroupInvitationRepository;
import hh.syntax.calendar.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/groups")
public class CalendarGroupController {

    private static final char[] CODE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();
    private final CalendarGroupRepository groupRepository;
    private final UserRepository userRepository;
    private final GroupInvitationRepository invitationRepository;
    private final SecureRandom random = new SecureRandom();

    public CalendarGroupController(CalendarGroupRepository groupRepository,
                                   UserRepository userRepository,
                                   GroupInvitationRepository invitationRepository) {
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.invitationRepository = invitationRepository;
    }

    private User getCurrentUser(Authentication authentication) {
        return userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private CalendarGroupDto toDto(CalendarGroup group) {
        List<UserDto> members = group.getMembers().stream()
                .map(user -> new UserDto(user.getId(), user.getUsername()))
                .sorted(Comparator.comparing(UserDto::username, String.CASE_INSENSITIVE_ORDER))
                .toList();
        return new CalendarGroupDto(
                group.getId(),
                group.getName(),
                group.getInviteCode(),
                group.getOwner().getId(),
                group.getOwner().getUsername(),
                members);
    }

    private String createInviteCode() {
        while (true) {
            StringBuilder code = new StringBuilder();
            for (int i = 0; i < 8; i++) {
                code.append(CODE_CHARACTERS[random.nextInt(CODE_CHARACTERS.length)]);
            }
            String value = code.toString();
            if (groupRepository.findByInviteCodeIgnoreCase(value).isEmpty()) {
                return value;
            }
        }
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<CalendarGroupDto> getGroups(Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        return groupRepository.findByMembers_IdOrderByNameAsc(currentUser.getId()).stream()
                .map(this::toDto)
                .toList();
    }

    @PostMapping
    @Transactional
    public ResponseEntity<CalendarGroupDto> createGroup(@RequestBody CreateCalendarGroupRequest request,
                                                        Authentication authentication) {
        String name = request.name() == null ? "" : request.name().trim();
        if (name.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        User currentUser = getCurrentUser(authentication);
        CalendarGroup group = new CalendarGroup();
        group.setName(name);
        group.setInviteCode(createInviteCode());
        group.setOwner(currentUser);
        group.getMembers().add(currentUser);
        return ResponseEntity.ok(toDto(groupRepository.save(group)));
    }

    @PostMapping("/join")
    @Transactional
    public ResponseEntity<CalendarGroupDto> joinGroup(@RequestBody JoinCalendarGroupRequest request,
                                                       Authentication authentication) {
        String code = request.inviteCode() == null ? "" : request.inviteCode().trim();
        if (code.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        CalendarGroup group = groupRepository.findByInviteCodeIgnoreCase(code).orElse(null);
        if (group == null) {
            return ResponseEntity.notFound().build();
        }
        User currentUser = getCurrentUser(authentication);
        group.getMembers().add(currentUser);
        return ResponseEntity.ok(toDto(groupRepository.save(group)));
    }

    @PostMapping("/{groupId}/invite/{friendId}")
    @Transactional
    public ResponseEntity<GroupInvitationDto> inviteFriend(@PathVariable Long groupId,
                                                           @PathVariable Long friendId,
                                                           Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        CalendarGroup group = groupRepository.findById(groupId).orElse(null);
        if (group == null || !group.getMembers().contains(currentUser)) {
            return ResponseEntity.notFound().build();
        }
        if (!group.getOwner().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).build();
        }
        User friend = userRepository.findById(friendId).orElse(null);
        if (friend == null || !currentUser.getFriends().contains(friend)) {
            return ResponseEntity.badRequest().build();
        }
        if (group.getMembers().contains(friend)) {
            return ResponseEntity.status(409).build();
        }
        if (invitationRepository.existsByGroupAndReceiver(group, friend)) {
            return ResponseEntity.status(409).build();
        }

        GroupInvitation invitation = new GroupInvitation();
        invitation.setGroup(group);
        invitation.setSender(currentUser);
        invitation.setReceiver(friend);
        invitation = invitationRepository.save(invitation);
        return ResponseEntity.ok(new GroupInvitationDto(
                invitation.getId(),
                toDto(group),
                new UserDto(currentUser.getId(), currentUser.getUsername()),
                new UserDto(friend.getId(), friend.getUsername())));
    }

    @GetMapping("/invitations/incoming")
    @Transactional(readOnly = true)
    public List<GroupInvitationDto> getIncomingInvitations(Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        return invitationRepository.findByReceiver(currentUser).stream()
                .map(invitation -> new GroupInvitationDto(
                        invitation.getId(),
                        toDto(invitation.getGroup()),
                        new UserDto(invitation.getSender().getId(), invitation.getSender().getUsername()),
                        new UserDto(invitation.getReceiver().getId(), invitation.getReceiver().getUsername())))
                .toList();
    }

    @PostMapping("/invitations/{invitationId}/accept")
    @Transactional
    public ResponseEntity<CalendarGroupDto> acceptInvitation(@PathVariable Long invitationId,
                                                             Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        GroupInvitation invitation = invitationRepository.findById(invitationId).orElse(null);
        if (invitation == null
                || !invitation.getReceiver().getId().equals(currentUser.getId())) {
            return ResponseEntity.notFound().build();
        }
        invitation.getGroup().getMembers().add(currentUser);
        invitationRepository.delete(invitation);
        return ResponseEntity.ok(toDto(groupRepository.save(invitation.getGroup())));
    }

    @DeleteMapping("/invitations/{invitationId}")
    @Transactional
    public ResponseEntity<Void> declineInvitation(@PathVariable Long invitationId,
                                                  Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        GroupInvitation invitation = invitationRepository.findById(invitationId).orElse(null);
        if (invitation == null
                || !invitation.getReceiver().getId().equals(currentUser.getId())) {
            return ResponseEntity.notFound().build();
        }
        invitationRepository.delete(invitation);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{groupId}/members/{memberId}")
    @Transactional
    public ResponseEntity<Void> removeMember(@PathVariable Long groupId,
                                             @PathVariable Long memberId,
                                             Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        CalendarGroup group = groupRepository.findById(groupId).orElse(null);
        if (group == null || !group.getMembers().contains(currentUser)) {
            return ResponseEntity.notFound().build();
        }

        boolean owner = group.getOwner().getId().equals(currentUser.getId());
        boolean selfRemoval = currentUser.getId().equals(memberId);
        if (!owner && !selfRemoval) {
            return ResponseEntity.status(403).build();
        }
        if (group.getOwner().getId().equals(memberId)) {
            return ResponseEntity.badRequest().build();
        }

        User member = userRepository.findById(memberId).orElse(null);
        if (member == null || !group.getMembers().contains(member)) {
            return ResponseEntity.notFound().build();
        }
        group.getMembers().remove(member);
        groupRepository.save(group);
        return ResponseEntity.noContent().build();
    }
}
