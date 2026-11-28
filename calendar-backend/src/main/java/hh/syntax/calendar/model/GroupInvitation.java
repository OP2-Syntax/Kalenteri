package hh.syntax.calendar.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "group_invitations",
    uniqueConstraints = @UniqueConstraint(columnNames = {"group_id", "receiver_id"})
)
@Getter
@Setter
public class GroupInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "group_id")
    private CalendarGroup group;

    @ManyToOne(optional = false)
    @JoinColumn(name = "sender_id")
    private User sender;

    @ManyToOne(optional = false)
    @JoinColumn(name = "receiver_id")
    private User receiver;

    private LocalDateTime createdAt = LocalDateTime.now();
}
