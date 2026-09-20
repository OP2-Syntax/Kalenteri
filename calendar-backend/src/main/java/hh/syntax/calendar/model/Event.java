package hh.syntax.calendar.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "events")
@Data
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(nullable = false)
    private LocalDateTime startTime;

    private LocalDateTime endTime;

    // owner ei näy JSON-vastauksessa (piilotetaan käyttäjän tiedot, kuten salasana)
    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;
}