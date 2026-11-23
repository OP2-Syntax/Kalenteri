package hh.syntax.calendar.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

// Yksi ehdotettu ajankohta tapahtumalle, josta kaverit äänestävät
@Entity
@Table(name = "time_options")
@Getter
@Setter
public class TimeOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(nullable = false)
    private LocalDateTime startTime;

    @Column(nullable = false)
    private LocalDateTime endTime;

    // äänet poistuvat automaattisesti, kun vaihtoehto poistetaan
    @OneToMany(mappedBy = "option", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<TimeVote> votes = new HashSet<>();
}
