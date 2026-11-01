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
- [Swagger Documentation](https://kalenteri-calendar-app-backend.2.rahtiapp.fi/swagger-ui/index.html)


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

Backend-testit ajetaan komentoriviltä backend-kansiossa:
```
cd calendar-backend
./mvnw test
```
Windowsissa: `.\mvnw.cmd test`

Testit käyttävät muistissa toimivaa H2-tietokantaa, joten MySQL:ää ei tarvita.

Frontendissä on automatisoituja testejä (Vitest, React Testing Library ja jsdom):
- **App.test.tsx**: kirjautumis- ja kalenterinäkymän näyttäminen, uloskirjautuminen sekä teeman vaihto
- **authApi.test.ts**: kirjautumis- ja rekisteröintipyyntöjen sisältö, virhetilanteet ja tokenin tallennus
- **LoginForm.test.tsx**: kirjautuminen ja rekisteröityminen lomakkeella sekä onnistumis- ja virhetilanteet
- **AddEventForm.test.tsx**: tapahtuman lisäys, pakolliset kentät, peruutus ja tallennusvirhe
- **Calendar.test.tsx**: tapahtumien lataus, lisäys, muokkaus ja poisto sekä kalenterinäkymän ohjaimet
- **calendarApi.test.ts**: tapahtumien API-pyynnöt, datan muunnokset, Authorization-header ja virhetilanteet

Frontend-testit ajetaan komentoriviltä frontend-kansiossa:
```
cd calendar-frontend
npm install
npm test
```

Testejä voi ajaa myös jatkuvassa watch-tilassa komennolla `npm run test:watch`. Frontend-testit käyttävät mockattuja API-kutsuja, joten backend-palvelimen ei tarvitse olla käynnissä. Lisätietoja on [frontendin README-tiedostossa](./calendar-frontend/README.md).
