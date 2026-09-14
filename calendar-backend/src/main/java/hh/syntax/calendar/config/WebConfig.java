package hh.syntax.calendar.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:5173")
                .allowedMethods("GET", "POST", "PUT", "DELETE")
                .allowedHeaders("*");
    }
}

/*addMapping("/api/**") — Tätä sääntöä sovelletaan vain polkuihin, jotka alkavat /api/ (kaikki REST-päätepisteemme teemme juuri sinne).

allowedOrigins("http://localhost:5173") — Sallimme pyynnöt nimenomaan tästä osoitteesta (Viten vakioportti Reactille). Jos Reactisi käynnistyy eri portissa, katso terminaalista, missä osoitteessa npm run dev pyörii, ja korjaa portti tähän.

allowedMethods — Mitkä HTTP-metodit ovat sallittuja (GET — hae tietoa, POST — luo uutta, PUT — päivitä, DELETE — poista). */