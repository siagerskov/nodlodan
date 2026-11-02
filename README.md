# Nödlådan – webbapp för iPhone, version 1.2.1

**Ingen Mac behövs.** Publicera `index.html`, `manifest.webmanifest` och `sw.js` i roten av ett publikt GitHub-repository, aktivera Settings → Pages → Deploy from a branch → main / (root), öppna HTTPS-adressen i Safari på iPhone och välj Dela → Lägg till på hemskärmen.

## Utveckling

Källkoden ligger nu direkt i repositoryts rot. Original-ZIP finns kvar som historisk baseline.
Node.js 22 eller senare och Python 3 krävs; inga paket behöver installeras.

```sh
npm test
npm start
```

Testerna kör appens JavaScript med simulerad DOM/localStorage. De verifierar lagerflöden,
datumgränser, import/export och utskriftsinnehåll. De ersätter inte Safari- eller iPhone-test.
Startkommandot serverar repositoryts rot lokalt på port 8000.

## Nytt i 1.2

- Utskrift tar med hela sortimentet trots aktiva filter; vyn återgår efter utskrift.
- CSV-prefix med apostrof skyddar formelliknande textceller. JSON-backup bevarar originaltexten.
- Sparfel visas tydligt och lämnar föregående lager kvar. Lager och kontrolldatum sparas tillsammans.
- Kalenderexport hanterar skottår och långa svenska texter.
- Import avvisar okända versioner, felaktiga fälttyper, dubbla id:n och omöjliga datum innan registret ersätts.
- Okända extra JSON-fält ignoreras av användarflödet; framtida formatversioner avvisas.

## Tidigare i 1.1: fast sortimentslista, även vid saldo 0

- Registrera en önskad produkt med **antal 0** och ange minimiantal. Produkten syns då alltid i listan och får varning **Fyll på**.
- Varje produkt finns i en **sortimentslista** med namn, streckkod, kategori och miniminivå. Faktiska förpackningar finns separat som **lagerpartier** med antal och bäst före.
- Knappen **−1** tar bort ett tomt lagerparti men **behåller produkten i sortimentslistan**.
- **Fyll på** förifyller produktuppgifterna så att du kan lägga till ett nytt lagerparti.
- **Ändra mål** justerar minimiantalet även om saldot är 0.
- **Ta bort vara** är det enda sättet att radera produkten ur sortimentslistan; det kräver bekräftelse och tar också bort dess eventuella lagerpartier.
- Varor med saldo 0 finns med i utskriften, CSV-exporten, JSON-säkerhetskopian och under varningar.
- Bäst före är valfritt, till exempel för utrustning utan hållbarhetsdatum. Sådana lagerpartier markeras **Datum saknas**.

## Publicering och uppdatering

1. Skapa ett repository `nodlada` på GitHub och välj Public (GitHub Pages på gratisplanen).
2. Ladda upp `index.html`, `manifest.webmanifest`, `sw.js` till repositoryts rot, inte som en undermapp. Du kan även ladda upp dokumentationen.
3. Under Settings → Pages välj Deploy from a branch, `main`, `/(root)` och spara.
4. Öppna `https://DITT-NAMN.github.io/nodlada/` i Safari och välj Dela → Lägg till på hemskärmen.
5. Vid uppdatering av en redan publicerad v1-app: ersätt filerna på GitHub, ladda om sidan i Safari och kontrollera att uppdateringen nått hemskärmsappen. Service worker har nytt cache-namn `nodlada-static-v4`.

## Drift och begränsningar

- Alla lagerdata lagras lokalt i `localStorage`, nyckel `nodlada-data-v2`. Version 1-data läses vid första start och **kopieras** till v2; originalnyckeln `nodlada-items-v1` lämnas oförändrad. Gör gärna en JSON-backup **innan** uppdatering.
- CSV är Excel-kompatibel, men **inte `.xlsx`**. PDF fås via iPhones utskriftsfunktion.
- Extern produktidentifiering sker via Open Food Facts. Streckkod skickas till tjänsten; lokala lagerdata skickas inte dit.
- Kameraskanning och OCR laddar tredjepartsbibliotek och kräver första gången nätverk; dessa funktioner är inte garanterat tillgängliga offline.
- **Lågt lager ger endast varning i appen**, inte iPhone-push. Datum- och årspåminnelser kräver manuell import av `.ics` till kalender. Ändrat lager uppdaterar inte redan importerade kalenderhändelser.
- Ingen automatisk synkronisering eller serverbackup. Exportera JSON-backup regelbundet och förvara exempelvis i Filer/iCloud Drive.
- Källkodens logik har testats automatiskt för saldo 0, minusknapp, minimiantal och v1-konvertering. Kameraskanning, kalenderimport och webbapp på fysisk iPhone är **ännu inte verifierade**.

Se `TEKNISK_DOKUMENTATION.md` för fullständig arkitektur, datamodell, migration, testplan och ändringslogg.

Se [CHANGELOG.md](CHANGELOG.md) och [testprotokollet](docs/validering.md) för ändringar och återstående kontroller.

Nästa manuella steg: följ [iPhone-testplanen](docs/iphone-test.md).

## Streckkod på iPhone

Skannern läser EAN-13, EAN-8, UPC-A, UPC-E och Code 128. QR och andra kodtyper ingår inte.
Håll hela koden i rutan, börja cirka 20–30 cm från förpackningen, håll stilla och undvik reflexer.
Manuell inmatning finns kvar. Kameran begär 1280×720, men Safari väljer tillgänglig kamera och upplösning.
