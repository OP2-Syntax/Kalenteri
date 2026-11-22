package hh.syntax.calendar.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

// Käyttäjän ääni yhdelle ajankohdalle. Yksi ääni per käyttäjä per tapahtuma.
@Entity
@Table(name = "time_votes",
        uniqueConstraints = @UniqueConstraint(columnNames = {"event_id", "user_id"}))
@Getter
@Setter
public class TimeVote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(optional = false)
    @JoinColumn(name = "option_id", nullable = false)
    private TimeOption option;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
