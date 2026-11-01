package hh.syntax.calendar.controller;

import hh.syntax.calendar.dto.*;
import hh.syntax.calendar.model.User;
import hh.syntax.calendar.repository.UserRepository;
import hh.syntax.calendar.security.JwtUtil;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final String googleClientId;

    public AuthController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtUtil jwtUtil,
            @Value("${google.client-id:}") String googleClientId) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.googleClientId = googleClientId;
    }

    // POST /api/auth/register — luo uuden käyttäjän
    @PostMapping("/register")
    public AuthResponse register(@RequestBody RegisterRequest request) {
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getUsername());
        return new AuthResponse(token);
    }

    // POST /api/auth/login — kirjautuminen
    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(), request.getPassword())
        );

        String token = jwtUtil.generateToken(request.getUsername());
        return new AuthResponse(token);
    }

    // POST /api/auth/google — Google-kirjautuminen
    @PostMapping("/google")
    public AuthResponse googleLogin(@RequestBody GoogleLoginRequest request) {
        if (googleClientId == null || googleClientId.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Google sign-in is not configured on the server");
        }

        if (request == null || request.getCredential() == null
                || request.getCredential().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Missing Google credential");
        }

        final GoogleIdToken.Payload payload;

        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(request.getCredential());

            if (idToken == null) {
                throw new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Invalid Google credential");
            }

            payload = idToken.getPayload();

        } catch (GeneralSecurityException | IOException e) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Google credential verification failed");
        }

        String email = payload.getEmail();

        if (email == null || email.isBlank()
                || !Boolean.TRUE.equals(payload.getEmailVerified())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Google email is not verified");
        }

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setUsername(generateUniqueUsername(email));
            newUser.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            return userRepository.save(newUser);
        });

        String token = jwtUtil.generateToken(user.getUsername());
        return new AuthResponse(token);
    }

    private String generateUniqueUsername(String email) {
        String localPart = email.substring(0, email.indexOf('@'));
        String base = localPart.replaceAll("[^A-Za-z0-9_.-]", "");

        if (base.isBlank()) {
            base = "googleuser";
        }

        String username = base;
        int suffix = 1;

        while (userRepository.findByUsername(username).isPresent()) {
            username = base + suffix;
            suffix++;
        }

        return username;
    }

    public static class GoogleLoginRequest {
        private String credential;

        public String getCredential() {
            return credential;
        }

        public void setCredential(String credential) {
            this.credential = credential;
        }
    }
}