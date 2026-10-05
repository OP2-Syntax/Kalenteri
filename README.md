[![CI](https://github.com/OP2-Syntax/Kalenteri/actions/workflows/ci.yml/badge.svg)](https://github.com/OP2-Syntax/Kalenteri/actions/workflows/ci.yml)
# Syntax

# Jäsenet:
- Joel Regner [JoelRegner](https://github.com/JoelRegner)
- Markus Ovaska [Markus-Ovaska](https://github.com/Markus-Ovaska)
- Andrey Khoroshev [AndreyKhoroshev](https://github.com/AndreyKhoroshev)
- Teemu Romppanen [teemarom](https://github.com/teemarom)
- Anton Mattila [antonmattila](https://github.com/antonmattila)


# Kalenteri sovellus.
Projektin tarkoituksena on helpottaa omien menojen suunnittelua ja ratkaisemaan aikataulutus ongelmia. Projekti on tarkoitettu henkilöille, jotka haluavat parantaa omaa aikatauluttamista. 

# Linkit
- [Frontend](https://kalenteri-calendar-app-frontend.2.rahtiapp.fi/)
- [Backend](https://kalenteri-calendar-app-backend.2.rahtiapp.fi/)


 # Projektin toiminnallisuudet.
- Lisätä, Poistaa ja Muokata tapahtumia.
- Mahdollisuus laittaa ToDo lista, joka sitten lisätään automaattisesti kalenteriin.
- Henkilökohtaisten tunnuksien tekeminen.
- Voi kutsua muita käyttäjiä omiin tapahtumiin tai järjestää tapahtuman, joka näkyy kaikille ja näyttää kaikki osallistujat.

# Käytetyt teknologiat
- Springboot
- React
- mySQL
- Joku pilvi sovellus kuten render

# Backlog
[Link to Backlog](https://github.com/orgs/OP2-Syntax/projects/1)


# Testit
Backendissä on automatisoituja testejä (JUnit 5, Spring Boot Test, MockMvc, H2-testitietokanta):
- **JwtUtilTest**: JWT-tokenin luonnin ja validoinnin yksikkötestit
- **ApiIntegrationTest**: rekisteröitymisen, kirjautumisen ja tapahtumien REST-endpointtien integraatiotestit
- **CalendarApplicationTests**: tarkistaa, että sovelluksen konteksti käynnistyy

Testit ajetaan komentoriviltä backend-kansiossa:
```
cd calendar-backend
./mvnw test
```
Windowsissa: `.\mvnw.cmd test`

Testit käyttävät muistissa toimivaa H2-tietokantaa, joten MySQL:ää ei tarvita.