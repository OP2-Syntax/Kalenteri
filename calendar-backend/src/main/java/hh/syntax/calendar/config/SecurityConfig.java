package hh.syntax.calendar.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> {}) // otetaan CORS käyttöön, asetukset tulevat WebConfig-luokasta (CorsRegistry)
            .csrf(csrf -> csrf.disable()) // CSRF-suojaus pois päältä, koska frontend on erillinen React-sovellus
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/**").permitAll() // /api/-polut sallitaan ilman kirjautumista
                .anyRequest().authenticated() // kaikki muu vaatii kirjautumisen
            );

        return http.build();
    }
}