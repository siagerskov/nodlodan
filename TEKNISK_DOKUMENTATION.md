# Nödlådan – teknisk dokumentation

**Version:** 1.2 (sortimentslista med tillåtet saldo 0)
**Datum:** 2026-11-01
**Plattform:** statisk PWA / Safari på iPhone
**Status:** källkod uppdaterad och kärnlogik testad i simulerad JavaScript-miljö; ej verifierad på fysisk iPhone.

## 1. Syfte och krav

Systemet hanterar en **normerad sortimentslista** över artiklar som bör finnas i hushållets nödlåda och registrerar den **faktiska lagerbehållningen** separat. Produkter får ha saldo 0, och varningen om underskridet minimiantal ska då kvarstå. Detta är en central invariant i version 1.1.

Grundinställningar: bäst före-varning när 60 dagar eller mindre återstår; återkommande lagerkontroll var 12:e månad; varning vid saldo under produktens miniminivå. Registret ska gå att skriva ut, inklusive slutsålda artiklar, och exportera till Excel-kompatibel CSV samt JSON-backup. Ingen fleranvändarsynkronisering krävs.

## 2. Systemarkitektur

```text
iPhone / Safari / installerad PWA (HTTPS)
  ├─ index.html: användargränssnitt och all applikationslogik
  ├─ manifest.webmanifest: webbappmetadata
  ├─ sw.js: cachning av egen statisk programkod
  ├─ localStorage: databas 'nodlada-data-v2' och granskningsdatum
  ├─ html5-qrcode (CDN): kamera och streckkodsläsning
  ├─ Open Food Facts API: uppslag av varunamn via GTIN/EAN
  ├─ Tesseract.js (CDN): OCR av fotograferade datum
  └─ klientexport: CSV, JSON, kalenderfil (.ics), utskrift
```

Servern (t.ex. GitHub Pages) distribuerar endast statiska filer och lagrar inte registret. API-förfrågan till Open Food Facts överför streckkoden, men inte produkternas lagersaldon. OCR körs i webbläsaren när biblioteket och dess resurser kunnat laddas.

## 3. Datamodell v2

Data sparas som JSON under **`nodlada-data-v2`** i webbläsarens `localStorage`. Produkten och dess partier är separata:

```json
{
  "version": 2,
  "products": [
    {
      "id": "p-unik-id",
      "name": "Vatten 1,5 l",
      "barcode": "",
      "category": "Vatten och dryck",
      "minimum": 6
    }
  ],
  "lots": [
    {
      "id": "l-unik-id",
      "productId": "p-unik-id",
      "qty": 2,
      "expiry": "2028-01-01"
    }
  ]
}
```

- **Product**: unik logisk sortimentsartikel, behålls tills användaren uttryckligen tar bort den. `minimum` är ett heltal ≥ 0. Tom streckkod är tillåten.
- **Lot**: ett fysiskt lagerparti knutet via `productId`. `qty` är ett positivt heltal. Tomt datum `expiry` är tillåtet för artiklar utan bäst före.
- **Stock(product)**: summan av `qty` i produktens lagerpartier. Om inga lagerpartier finns blir saldo **0**, inte att produkten saknas.
- **Low stock**: `Stock(product) < product.minimum`. Produkt med saldo 0 och minimiantal 6 räknas alltså som lågt lager med påfyllnadsbehov 6.
- När antal på ett parti minskar till 0 raderas **bara partiet**. Produkten och miniminivån finns kvar.
- Ett nytt parti med samma produkt och datum adderas till befintligt parti. Olika bäst före-datum hålls separata.

**Identifiering:** Vid registrering matchas en befintlig produkt i första hand på icke-tom streckkod; om ingen kod finns matchas varunamn utan skiftlägeskänslighet. Två produkter med olika streckkod kan därför vara separata trots likartat namn. Detta är avsiktligt men kräver att användaren granskar dubbletter.

## 4. Gränssnitt och användarflöden

### 4.1 Lägg upp sortiment utan befintlig vara

Fyll i namn, kategori, minimiantal och **Antal = 0**. Datum behöver då inte anges. Appen skapar en produkt men inget parti. Produkten finns med i listan, i utskrift och export, samt i varningsfiltret om minimum > 0.

### 4.2 Påfyllnad

Välj **Fyll på** vid sortimentsartikeln; formuläret förifylls. Ange antal och eventuellt datum. Vid sparning kopplas nytt parti till befintlig produkt. Produktens minimiantal återanvänds; vid ändrade metadata krävs bekräftelse.

### 4.3 Förbrukning

Välj **−1** på partiet. Efter sista enheten raderas partiet men sortimentsartikeln behålls, får saldo 0 och utlöser eventuell påfyllnadsvarning.

### 4.4 Underhåll

**Ändra mål** uppdaterar produktens miniminivå. **Ta bort parti** raderar endast ett parti. **Ta bort vara** raderar efter bekräftelse både produkt och alla partier. Detta är den avsedda skillnaden mellan förbrukning och permanent sortimentsändring.

## 5. Regler för datum, varningar och kalender

Datumvarning visas för aktiva partier med ett angivet bäst före som är högst 60 dagar bort, inklusive passerat datum. Parti utan datum får status **Datum saknas**, inte ett fiktivt utgångsdatum.

Låglagervarning beräknas på **produkter**, inte antal partier, och innefattar varor med saldo 0. Den finns i appens översikt och vid varje produkt, men skickar **inte** en separat pushnotis till iPhone.

Kalenderexport genererar iCalendar `.ics` för aktiva partier med giltigt datum, 60 dagar före bäst före, samt en årligen återkommande lagerkontroll räknat från senast manuellt markerad kontroll (eller dagens datum om ingen finns). Händelserna måste importeras manuellt; det finns ingen löpande kalenderkoppling. Om en förpackning förbrukas efter export måste en ny kalenderexport göras och tidigare importerade händelser kan behöva städas.

## 6. Import, export och utskrift

- **CSV:** UTF-8 med BOM, semikolonseparerad och citerade celler. Kolumner: Produkt, Streckkod, Kategori, Saldo, Minimiantal, Behöver fyllas på, Bäst före, Antal i parti, Dagar kvar. Produkter med inga partier ger en rad med **saldo 0**.
- **Utskrift:** `window.print()` och särskild utskrifts-CSS. Sortimentslistan innehåller även produkter utan partier. För att skapa PDF används iPhones utskrifts-/delningsflöde.
- **Backup:** JSON `version=2`, `products`, `lots` samt datum för senaste lagerkontroll. JSON är auktoritativ återställningskopia; ingen kryptering tillämpas.
- **Import:** validerar relationer mellan produkter och partier, heltalsantal och obligatoriska fält. Bekräftelse krävs innan hela registret ersätts. Äldre säkerhetskopior med `items` migreras vid import.

## 7. Migration från version 1

Vid uppstart försöker appen läsa `nodlada-data-v2`. Om v2 saknas och `nodlada-items-v1` innehåller tidigare poster omvandlas dessa enligt följande:

1. Varje äldre rad kopplas till en sortimentsprodukt baserat på streckkod, annars normaliserat namn.
2. Produktens miniminivå blir högsta tidigare minimiantal bland matchande poster.
3. Varje äldre rad med positivt saldo blir ett lagerparti med sitt ursprungliga bäst före-datum.
4. Äldre originaldata i `nodlada-items-v1` **raderas inte**. V2 skrivs under den nya nyckeln.
5. Datum för senaste lagerkontroll ligger fortsatt separat i `nodlada-review-v1`.

**Viktig åtgärd vid uppgradering:** Gör JSON-backup från gamla appen först; ladda därefter upp de nya filerna och kontrollera totalsaldo, miniminivåer och datum. Håll kvar gammal backup tills kontrollen är klar. Om redan förbrukade produkter hade raderats i v1 kan de **inte återskapas automatiskt** utan måste registreras på nytt med antal 0.

## 8. Säkerhet, integritet och driftsäkerhet

- Webbappens källkod kan ligga i öppet GitHub-repository. Registret lagras lokalt och är inte inbakat i publicerade filer.
- **localStorage är inte en robust backupdatabas.** Radering av webbplatsdata, webbläsarbyte och vissa iOS-lagringshändelser kan innebära dataförlust. Säkerhetskopiera efter inventering och påfyllning.
- JSON-export kan innehålla information om hushållets förråd; behandla backupfilerna som privata.
- Tredjeparts-CDN används för streckkod/OCR. Offline kan registrering, lagerstatus och export fungera för cachad app, men kamera/OCR/produktuppslag är inte pålitliga utan internet.
- CSV-exporten prefixar textceller som börjar med =, +, - eller @ (även efter inledande blank-/kontrolltecken) med apostrof. Detta skyddar mot vanliga kalkylbladsformler; JSON-backup bevarar originalvärden.
- Applikationen har ingen autentisering eller serverbaserad åtkomstkontroll; skyddet av lagret bygger på telefonens skydd.

## 9. Distribution via GitHub Pages

Publicera `index.html`, `manifest.webmanifest` och `sw.js` **direkt i repositoryts rot**. Under Settings → Pages välj `Deploy from a branch`, branch `main`, katalog `/(root)`. Öppna den publicerade HTTPS-adressen i Safari och välj Dela → Lägg till på hemskärmen. Service worker har cache-identifieraren **`nodlada-static-v3`**, för att webbläsaren ska kunna hämta ändrad programkod i stället för tidigare v1-cache. Webbappens lokala data ska inte raderas vid uppdatering. Observera att uppdaterade service workers kan behöva en omladdning innan nya gränssnittet aktiveras.

## 10. Testprotokoll

### Automatiskt genomförda kontroller (2026-11-01)

Kärnlogik exekverad i Node.js med mockad DOM och `localStorage`:

| Test | Förväntat | Resultat |
|---|---|---|
| Skapa produkt med antal 0, minimum 6 | Produkt kvar, inget parti, låglagervarning | Godkänt |
| Fyll på 2 st | Saldo 2, samma produkt | Godkänt |
| Tryck −1 två gånger | Parti bort, produkt kvar med saldo 0 och varning | Godkänt |
| Ändra minimiantal på tom produkt | Produktmål uppdateras | Godkänt |
| Konvertera v1-post | Produkt och parti med bibehållet minimum | Godkänt |
| JavaScript-syntax | Giltig JavaScript | Godkänt |

### Tester som återstår på fysisk iPhone

1. Publicera på GitHub Pages, verifiera visning i Safari och som hemskärmsapp.
2. Registrera produkt med saldo 0, ändra minimum, skriv ut och kontrollera att posten följer med.
3. Lägg till två partier med olika datum, förbruka båda till 0 och kontrollera att produkten finns kvar.
4. Exportera CSV och verifiera saldo 0, filens teckenkodning samt visning i Excel.
5. Ta JSON-backup, återställ, kontrollera antal, minimum och datum.
6. Testa streckkodskamera och OCR på svenska förpackningar, inklusive felavläsningar.
7. Importera kalenderfil på iPhone, kontrollera 60-dagarsnotis och årshändelse.
8. Testa offline efter första laddning, samt uppdatering från v1 till v1.1 med verkliga lagersaldon.

## 11. Kända begränsningar och vidareutveckling

Nuvarande lager använder webbläsarens `localStorage`; ingen automatisk synkning, databas på server eller automatisk iPhone-push finns. CSV ersätter inte `.xlsx`-format. För pålitligare notiser krävs en separat notifieringstjänst, annan appintegration eller native-app. För framtida robusthet kan IndexedDB, transaktionssäker validering, automatisk backup och särskild testning på iOS införas. Systemet skiljer mellan sortimentskrav och innehåll, men beräknar ännu inte kalori-/vattenbehov per person.

## 12. Versionshistorik

- **1.0 – 2026-11-01:** första prototypen med lagerpartier. Tomma partier raderades och miniminivåer försvann när sista posten togs bort.
- **1.1 – 2026-11-01:** separerat sortiment (`products`) och partier (`lots`), stöd för saldo 0, lägre-lager-varning även vid 0, separat permanent borttagning, påfyllnad av befintlig produkt, miniminivåredigering, inkluderar saldo 0 i CSV och utskrift, ny backupmodell och datamigration från v1, service worker-cache v2. Kärnlogik verifierad i mockmiljö.

**Dokumentationsprincip:** Vid varje kommande ändring uppdateras kod, versionshistorik, kravspårbarhet och testresultat tillsammans. Dokumentationen avser faktisk implementation och märker sådant som inte testats separat.

## Stabilisering 1.2

Utskrift renderar hela sortimentet via utskriftshändelser och återställer filtrerad vy efteråt.
Import kräver version 2 (eller äldre items-format utan version/med version 1), unika icke-tomma id:n,
giltiga relationer, strängfält och säkra heltalsantal. Datum valideras genom kalender-roundtrip;
även kontrolldatum kontrolleras före bekräftelse. Okända extra fält tillåts, okända versioner avvisas.
Registrering och OCR avvisar omöjliga datum. Cache-namnet är v3; lagringsformatet är fortsatt v2.

Se docs/validering.md för aktuella testresultat. Kalenderfilens semantik och verklig iPhone-utskrift
är ännu inte verifierade. Lager och kontrolldatum skrivs nu tillsammans i ett v2-objekt med valfritt fält review.
Den äldre kontrollnyckeln läses bara som fallback och lämnas orörd. localStorage.setItem är en
sammanhängande skrivning; vid fel återställs minnesmodell och vy till senast sparade version.
Ett oläsbart v2-register spärrar vanliga skrivningar. En giltig och bekräftad backup kan återställa registret och häva spärren.
Detta ersätter inte privata JSON-backuper eller skyddar mot rensning av webbplatsdata.

Kalendertext använder iCalendar-escaping och radvikning vid högst 75 UTF-8-oktetter.
DTSTAMP är verklig UTC-tid. Datumförskjutningen 60 dagar räknas i UTC-kalenderdagar.
Årskontroll 29 februari normaliseras till 28 februari följande år och återkommer den dagen.
Heldagshändelser har alarm PT9H (nio timmar efter start); klientens tidszon/notishantering
måste verifieras på iPhone. Redan passerade 60-dagarspåminnelser hoppas fortsatt över;
förfallen årskontroll behålls för att inte skjuta fram en missad kontroll tyst.
