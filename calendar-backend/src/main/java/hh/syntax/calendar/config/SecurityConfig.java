package hh.syntax.calendar.config;

import hh.syntax.calendar.security.JwtAuthFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    // salasanojen hashaukseen
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider(UserDetailsService userDetailsService, PasswordEncoder passwordEncoder) {
    DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
    provider.setPasswordEncoder(passwordEncoder);
    return provider;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> {}) // otetaan CORS käyttöön, asetukset tulevat WebConfig-luokasta (CorsRegistry)
            .csrf(csrf -> csrf.disable()) // CSRF-suojaus pois päältä, koska frontend on erillinen React-sovellus
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll() // rekisteröinti ja kirjautuminen ovat julkisia
                .requestMatchers( // Swagger UI ja OpenAPI-dokumentaatio
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/v3/api-docs/**").permitAll()
                .anyRequest().authenticated() // kaikki muu (mm. /api/events) vaatii JWT-tokenin
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class); // JWT tarkistetaan ennen oletuskirjautumista

        return http.build();
    }
}