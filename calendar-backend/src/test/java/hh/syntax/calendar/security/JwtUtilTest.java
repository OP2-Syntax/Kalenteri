package hh.syntax.calendar.security;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

// Yksikkötesti: ei käynnistä Springiä, joten ajautuu nopeasti
class JwtUtilTest {

    private static final String SECRET = "tamaOnHyvinPitkaJaSalainenAvainJotaEiPidaJakaaKenellekaan123456";

    private JwtUtil jwtUtil;

    private JwtUtil createJwtUtil(String secret, long expiration) {
        JwtUtil util = new JwtUtil();
        ReflectionTestUtils.setField(util, "secret", secret);
        ReflectionTestUtils.setField(util, "expiration", expiration);
        return util;
    }

    @BeforeEach
    void setUp() {
        jwtUtil = createJwtUtil(SECRET, 60_000L);
    }

    @Test
    void generatedToken_containsUsername() {
        String token = jwtUtil.generateToken("testuser");

        assertEquals("testuser", jwtUtil.extractUsername(token));
    }

    @Test
    void freshToken_isValid() {
        String token = jwtUtil.generateToken("testuser");

        assertTrue(jwtUtil.isTokenValid(token));
    }

    @Test
    void garbageToken_isNotValid() {
        assertFalse(jwtUtil.isTokenValid("tama.ei.ole.token"));
    }

    @Test
    void expiredToken_isNotValid() {
        JwtUtil expiredUtil = createJwtUtil(SECRET, -1000L); // vanhenee heti
        String token = expiredUtil.generateToken("testuser");

        assertFalse(jwtUtil.isTokenValid(token));
    }

    @Test
    void tokenSignedWithOtherSecret_isNotValid() {
        JwtUtil other = createJwtUtil("toinenAvainJokaOnTarpeeksiPitkaHmacAllekirjoitukseen0987654321", 60_000L);
        String token = other.generateToken("testuser");

        assertFalse(jwtUtil.isTokenValid(token));
    }
}