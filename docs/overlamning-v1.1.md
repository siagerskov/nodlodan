# Nödlådan – teknisk överlämning till Codex

**Överlämningsdatum:** 2026-11-01
**Överlämnad version:** 1.1, prototyp
**Målplattform:** iPhone, Safari och hemskärmsinstallerad PWA
**Leveransstatus:** källkod och dokumentation finns; inte driftsatt eller verifierad på fysisk iPhone
**Mottagare:** utvecklingsagent/Codex eller annan utvecklare

## 1. Uppdrag och mål

Vidareutveckla en enkel, tillförlitlig och så långt möjligt offlinefungerande webbapp för inventering av ett hushålls nödlåda. Användaren har **ingen Mac** och vill kunna sköta register, skanning och export från **en enda iPhone**. Lösningen ska kunna publiceras på **GitHub Pages** utan egen backend. Utvecklingen ska bygga på den bifogade v1.1-koden, inte starta ett nytt projekt utan goda skäl.

**Avgörande produktprincip:** Registret är i första hand en *sortiments-/kravlista* över vad som ska finnas. Faktiskt lager är ett separat lager av partier. En önskad artikel med saldo **0** måste förbli synlig och kunna signalera påfyllnadsbehov. Användaren ska kunna skriva ut en fullständig inventeringslista och lägga den i nödlådan.

## 2. Beslutade krav

| ID | Krav | Prioritet | Status i v1.1 |
|---|---|---|---|
| K01 | Namngiven sortimentsartikel finns kvar vid saldo 0 | Måste | Implementerat, logiktestat |
| K02 | Minimiantal per artikel och varning när saldo < minimum | Måste | Implementerat i appens UI, logiktestat |
| K03 | Flera partier med olika bäst före-datum per artikel | Måste | Implementerat, iPhone-test återstår |
| K04 | Varning vid bäst före inom 60 dagar, inklusive passerade datum | Måste | UI implementerat; notifiering via kalenderexport |
| K05 | Lagerkontroll var 12:e månad | Måste | Datum för genomförd kontroll + återkommande .ics-händelse |
| K06 | Utskriftsvänlig lista med även slutsålda artiklar | Måste | Implementerat, iPhone-test återstår |
| K07 | Excel-kompatibel export | Måste | CSV med semikolon/BOM; äkta .xlsx inte implementerat |
| K08 | Streckkod via iPhone-kamera | Bör | Implementerat med html5-qrcode; inte enhetstestat |
| K09 | Produktnamn via streckkod | Bör | Open Food Facts API; nätverksberoende |
| K10 | Bäst före från foto/OCR, med manuell verifiering | Bör | Tesseract.js; inte enhetstestat |
| K11 | Offline åtkomst till befintligt register | Måste | LocalStorage + service worker; behöver verkligt offlinetest |
| K12 | Säkerhetskopiering/återställning | Måste | JSON export/import; testdjup behöver ökas |
| K13 | iPhone-påminnelser utan manuell kalenderimport | Önskvärt | **Inte implementerat**; kräver separat designbeslut |
| K14 | Endast en användare/en iPhone; ingen synkronisering | Beslutat | Gäller |

**Fasta inställningar:** 60 dagar före bäst före; lagerkontroll var 12:e månad; varning vid lågt lager aktiverad. Dessa ska inte ändras utan uttryckligt önskemål.

## 3. Befintliga leverabler och filstruktur

Källpaket: `Nodlada-Webbapp-v1.1-med-dokumentation.zip`. Relevanta filer ligger under `Nodlada-Webbapp/`:

```text
Nodlada-Webbapp/
  index.html                 All HTML, CSS och JavaScript
  manifest.webmanifest       PWA-metadata
  sw.js                      Service worker, cache nodlada-static-v2
  README.md                  Installation och begränsningar
  TEKNISK_DOKUMENTATION.md   Befintlig teknisk dokumentation
  TEKNISK_DOKUMENTATION.pdf  Läsbar kopia
```

Det finns även en separat Node-baserad smoke-testfil `test_nodlada.cjs` från utvecklingsmiljön. **Den ingick inte i originalpaketets webbappskatalog** och bifogas särskilt i det nya överlämningspaketet. Förvalta den som startpunkt, men ersätt/komplettera med en riktig automatiserad testsvit. Denna överlämning och testerna kan med fördel placeras i repositoryts `docs/` respektive `tests/`.

Tidigare SwiftUI-utkast för native iOS ska **inte** utgöra huvudspår: ingen Mac/Xcode finns tillgänglig hos beställaren.

## 4. Befintlig arkitektur

```text
iPhone Safari / PWA på HTTPS
  ├── index.html: vyer, formulär, datahantering och exporter
  ├── localStorage: nodlada-data-v2 (produkter + partier)
  ├── localStorage: nodlada-review-v1 (senaste kontroll)
  ├── service worker: cache av appens egna statiska filer
  ├── html5-qrcode 2.3.8, via unpkg (streckkodskamera)
  ├── Open Food Facts v2 (produktnamn via EAN/GTIN)
  ├── Tesseract.js 5, via jsDelivr (datum-OCR)
  └── export i klienten: CSV, JSON, .ics och webbläsarutskrift
```

Publicering av statiska filer kan göras med GitHub Pages. Inga lagerdata skickas till GitHub Pages; enbart programkoden publiceras. Vid produktuppslag skickas streckkoden till Open Food Facts. Första laddning av skannings-/OCR-bibliotek kräver nätverk, och deras fullständiga offlineförmåga är inte säkrad.

## 5. Datakontrakt och invariants

`localStorage['nodlada-data-v2']` innehåller:

```json
{
  "version": 2,
  "products": [
    {"id":"p1","name":"Vatten 1,5 l","barcode":"","category":"Vatten och dryck","minimum":6}
  ],
  "lots": [
    {"id":"l1","productId":"p1","qty":2,"expiry":"2028-01-01"}
  ]
}
```

- Artikel (`product`) består oberoende av lagerpartier. Tom lista över partier innebär **saldo 0**.
- Saldo = summan av `qty` över artikelns partier. `qty` på sparade partier är ett **positivt heltal**; artikelns saldo kan vara 0.
- Varning om `saldo < minimum`. Vid saldo 0 och minimum 6 ska påfyllnadsbehovet vara 6.
- En artikel får bara raderas genom uttrycklig funktion **Ta bort vara** och bekräftelse; `−1` eller borttagning av ett parti får aldrig radera artikeln.
- Partier med olika bäst före-datum ska hållas isär. Bäst före är valfritt för utrustning m.m.
- Artikelidentifiering: icke-tom streckkod i första hand; annars normaliserat namn när båda saknar streckkod. Kontrollera dubblettbeteendet.
- Versionsmigrering: om v2 saknas läses `nodlada-items-v1`, och äldre data omvandlas till produkt/parti. V1-nyckeln ska inte raderas.
- Backupformat v2 innehåller `version`, `products`, `lots`, `review`. Import ersätter registret först efter bekräftelse.

**Viktig begränsning:** Varor som helt försvunnit ur v1 när saldot blev 0 kan inte magiskt rekonstrueras vid migrering; dessa måste registreras igen.

## 6. Vad som faktiskt är verifierat

**Automatiskt:** befintligt smoke-test kördes på nytt 2026-11-01 via `node test_nodlada.cjs` och gav PASS för: produkt med saldo 0 kvar i listan, lågt saldo, ökning/minskning, ändring av minimimål och v1-migrering. Testet använder simulerad DOM/localStorage.

**Inte verifierat:** Safari på verklig iPhone, hemskärmsinstallation, kameraåtkomst, OCR på svenska förpackningar, produktuppslagsfrekvens, verkligt offlinebeteende, iOS-filnedladdningar, kalenderimport/notisvisning, PDF-utskrift och uppdatering med verkliga lagervärden. Inga påståenden om produktionsmognad får göras innan dessa acceptanstester är genomförda.

## 7. Kända risker och teknisk skuld

1. **Lagring:** `localStorage` kan försvinna när webbplatsdata rensas. Inga automatiska serverbackuper; JSON-backup måste vara enkel och dokumenterad. Utred IndexedDB om det förbättrar robustheten, men migrera utan dataförlust.
2. **Notifieringar:** v1.1 skickar **inte** automatiska iPhone-pushnotiser. Den exporterar kalenderfiler manuellt. Lågt lager visas bara i appen. Undvik att kalla detta bakgrundsnotiser.
3. **Kalendersemantik:** granska `.ics`-formatet, `VALARM`-trigger, datum och årlig upprepning på iOS. Redan importerade poster ändras inte automatiskt när lagret ändras. Utgångna 60-dagarsdatum hoppas över i exporten.
4. **Offline:** service worker cachar bara appens egna filer; extern OCR/skanningskod och Open Food Facts kan saknas offline. Testa både första körning och efter cachefyllning.
5. **CSV-säkerhet:** cellinnehåll CSV-citeras men skydd mot kalkylbladsformler (`=`, `+`, `-`, `@`) behöver ses över.
6. **Datumvalidering:** granska ogiltiga kalenderdatum, OCR:s regexp-tolkning och lokala tidszoner. Undvik att acceptera exempelvis omöjliga datum via lös JavaScript-parsning.
7. **Importintegritet:** utöka validering för unika parti-id, versionsnummer, datum, kategorier, datatyper, okända fält och konsekvent felhantering.
8. **PWA-kvalitet:** manifest saknar appikoner och bör kompletteras. Kontrollera cacheuppdatering/stale versions och korrekt visning från Pages under sökvägen `/nodlada/`.
9. **Struktur:** all applikationskod ligger i en enda HTML-fil. Bryt upp i moduler och inför testsystem endast om det ger verifierbar nytta utan att försvåra enkel statisk distribution.
10. **Externa tjänster:** produktdatabasen har ojämn täckning, och en vanlig EAN-kod ger normalt inte hållbarhetsdatum. Manuella korrigeringar måste alltid vara möjliga.

## 8. Prioriterad arbetsordning för Codex

### Fas A – stabilisering (första uppdraget)

1. Importera befintligt projekt i Git-repository. Behåll v1.1 som baseline och gör en avgränsad ändring per commit/PR.
2. Kör smoke-test och etablera automatiska tester för datamodell, saldo 0, partier, datum, export, backup/import och migrering. Dokumentera hur testerna körs på en vanlig dator eller i CI.
3. Granska och åtgärda identifierade dataintegritets- och kalenderproblem, utan att byta produktens grundfunktion.
4. Härda CSV-export och importvalidering. Säkerställ att nollsaldo alltid är med i CSV, utskrift och backup.
5. Lägg till begriplig felhantering för nekad kameraåtkomst, API-fel, offline och OCR-fel.

### Fas B – iPhone-klar PWA

6. Lägg till korrekta PWA-ikoner, stabil service-worker-uppdatering och dokumenterat installflöde i Safari.
7. Testa i iPhone Safari och hemskärmsläge, gärna med verkliga svenska livsmedel och utrustningsartiklar.
8. Kontrollera säkerhetskopiering, återställning och export i iOS Filer/Excel/Kalender. Validera kalendernotiser på fysisk enhet.
9. Ge tydlig återkoppling om vilka funktioner som kräver nätverk och vilken data som finns tillgänglig offline.

### Fas C – efter särskilt beslut

10. Utvärdera äkta `.xlsx` som tillägg till CSV, automatiserade påminnelser (iOS-begränsningar och eventuell backend), förbättrad OCR och import av fördefinierad rekommenderad nödlådelista. **Implementera inte externa tjänster eller konton utan nytt godkännande.**

## 9. Acceptanskriterier för nästa leverans

- [ ] Skapa artikel A med `minimum=6`, `saldo=0`; artikel A syns i lagerlistan, utskriften och CSV och visar **Fyll på 6**.
- [ ] Fyll på två partier av artikel A (2 + 3, olika bäst före); total saldo 5, två separata datum, **Fyll på 1**.
- [ ] Minska och avlägsna alla partier; artikel A finns kvar med saldo 0 och sitt minimiantal.
- [ ] Artikel utan hållbarhetsdatum kan ha ett positivt saldo och synas korrekt.
- [ ] Produkter med datum inom 60 dagar och utgångna datum markeras korrekt (testa datumgränser och årsskiften).
- [ ] Årlig lagerkontroll följer senaste registrerade kontroll och exporterar en giltig återkommande kalenderhändelse.
- [ ] JSON-backup och återläsning bevarar sortiment, saldo, partier, minimiantal och senaste kontroll.
- [ ] Äldre v1-register migrerar utan att radera originaldata.
- [ ] CSV kan öppnas i Excel med svenska tecken och utan exekvering av oönskade kalkylbladsformler.
- [ ] Utskrift tar med **alla** sortimentsartiklar även om ett filter är aktivt; verifiera uttryckligen denna punkt.
- [ ] Fungerar i iPhone Safari och som hemskärmsapp på HTTPS; kamera/OCR ger antingen korrekt resultat eller tydlig manuell reservväg.
- [ ] Körbar testinstruktion, ändringslogg och uppdaterad teknisk dokumentation ingår i varje leverans.

## 10. GitHub och driftsättning

Repositoryförslag: `nodlada` (publikt endast om källkoden inte innehåller privata registerdata). Publicera `index.html`, `manifest.webmanifest`, `sw.js` i root, och sätt GitHub Pages till `main` / `(root)`. Slutadressen blir normalt `https://<användarnamn>.github.io/nodlada/`. Öppna i Safari och välj **Dela → Lägg till på hemskärmen**.

**Säkerhet:** checka aldrig in JSON-backup, verkliga lagervärden, API-hemligheter eller privata uppgifter i publikt repo. Före ändring av redan installerad app: exportera JSON-backup, verifiera filen och gör sedan uppdatering.

## 11. Instruktion att klistra in i Codex

> Fortsätt utvecklingen av Nödlådan från bifogat v1.1-projekt. Läs först `README.md`, `TEKNISK_DOKUMENTATION.md` och detta överlämningsdokument. Bevara beslutad kravbild: en iPhone, ingen Mac, lokal lagerdata, fast sortimentslista där saldo 0 är tillåtet, minimiantal per vara, 60 dagars hållbarhetsvarning och årlig lagerkontroll. Börja med kodgranskning, reproducera befintliga tester och skriv nya tester för datamodell och exporter. Åtgärda faktiska brister, särskilt datavalidering, kalendersemantik, CSV-säkerhet och utskrift med aktiva filter. Behåll kompatibilitet med existerande `nodlada-data-v2` och v1-migrering. Gör inga otestade påståenden om iPhone-notiser: v1.1 använder manuell ICS-import, inte push. Leverera källkod, tydlig ändringslogg, testresultat och uppdaterad teknisk dokumentation. Ändra inte övergripande arkitektur eller inför backend utan att motivera och flagga beslutet.

## 12. Överlämningsdefinition och ägarskap

**Beställaren beslutar** om produktkrav och accepterar lösningen efter test på sin iPhone. **Codex/utvecklaren ansvarar** för dokumenterade kodändringar, tester, regressionskontroll och saklig statusrapport. V1.1 är en utvecklingsbaseline, **inte** en verifierat produktionsklar app. De fasta kraven – inklusive saldo 0 – är inte öppna designfrågor.

**Källor vid överlämningen:** direkt inspektion av `index.html`, `sw.js`, `manifest.webmanifest`, `README.md`, `TEKNISK_DOKUMENTATION.md` och genomfört Node-smoke-test 2026-11-01.
