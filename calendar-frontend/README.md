# Kalenteri – Frontend

Kalenterisovelluksen käyttöliittymä on toteutettu Reactilla, TypeScriptillä ja Vitellä.

## Testit

Frontendin automatisoidut testit käyttävät Vitestiä, React Testing Libraryä ja jsdomia. Ne testaavat käyttöliittymän toimintaa sekä frontendin API-apufunktioita ilman oikeaa selainta tai käynnissä olevaa backend-palvelinta. API-kutsut mockataan testeissä.

Testit kattavat:
- **App**: kirjautumis- ja kalenterinäkymän näyttämisen, uloskirjautumisen ja teeman vaihdon
- **authApi**: kirjautumis- ja rekisteröintipyyntöjen sisällön, virhetilanteet sekä tokenin tallennuksen, haun ja poiston
- **LoginForm**: kirjautumisen ja rekisteröitymisen onnistumisen sekä virheiden näyttämisen
- **AddEventForm**: tapahtuman lähettämisen, pakolliset kentät, peruutuksen ja tallennusvirheen
- **Calendar**: tapahtumien latauksen, lisäyksen, muokkauksen ja poiston sekä kalenterinäkymän ohjaimet
- **calendarApi**: tapahtumien API-pyyntöjen HTTP-metodit, osoitteet ja sisällöt, tapahtumadatan muunnokset, Authorization-headerin sekä virhetilanteet

Asenna riippuvuudet ja aja testit frontend-kansiossa:

```bash
npm install
npm test
```

Watch-tilassa testit käynnistyvät komennolla:

```bash
npm run test:watch
```
