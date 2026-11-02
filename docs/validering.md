# Validering – 2026-11-01

`npm test` kör ursprungligt smoke-test samt sjutton regressionstester i Node med simulerad DOM/localStorage.
Samtliga passerar. Ingen paketinstallation eller extern tjänst används.

Verifierat automatiskt:

- Nollsaldo behåller produkten och påfyllnadsvarningen; miniminivå kan ändras.
- Flera partier summeras och förbrukas utan att sortimentet försvinner.
- Datumvarning vid passerat datum och 60 dagar, men inte 61 dagar.
- Import avvisar fel version, fälttyper, dubbla id:n, orimliga antal, brutna relationer och omöjliga datum.
- Fullständigt utskriftsinnehåll trots sök- och varningsfilter; filtrerad vy återställs.
- CSV innehåller slutsålda produkter, svenska tecken, citering och formelskydd.
- Backup/återställning bevarar partier, minimum och kontrolldatum.
- Ogiltig/avbruten import bevarar tidigare data; äldre backup kan migreras utan att v1-originalet raderas.

Återstår före iPhone-leverans: Safari och hemskärmsinstallation, utskriftsdialog/PDF,
CSV i Excel på iPhone, filimport/export, kamera, OCR, kalenderimport samt service-worker-uppdatering och offline.
Kalenderns årsskiften/skottår, textescaping, radvikning och lagringsfel har nu mocktestats. Verklig kalenderklient och lagringsbeteende på iPhone återstår.
Inget är publicerat. Gör privat JSON-backup före uppdatering av en använd app.

Ytterligare automatiskt verifierat:

- Sparfel återställer föregående data och behåller registreringsformulär utan framgångsmeddelande.
- Importens lager och kontrolldatum skrivs i samma localStorage-operation; misslyckad skrivning ändrar ingetdera.
- Misslyckad markering av lagerkontroll visas inte som genomförd.
- Oläsbart v2-register kan inte skrivas över med nya data.
- Äldre separat kontrolldatum följer med till den gemensamma sparningen; originalnyckeln behålls.
- Årskontroll från skottdagen blir 28 februari nästa år, text specialtecken escape:as och vikta rader är högst 75 UTF-8-oktetter.

- En giltig, bekräftad backup kan återställa ett oläsbart register och häva skrivspärren.

## Användarrapporterat iPhone-test

Användaren har i denna chatt bekräftat fungerande nollsaldo, separata partier och förbrukning,
JSON-backup/återställning, fullständig utskrift med filter, CSV i Excel samt offline med bestående saldoändring.
Kamera och namnuppslag rapporterades smidiga; själva streckkodsavläsningen rapporterades långsam.
Telefon: iPhone 14 Pro. iOS-version och exakta tider har inte uppgetts. Detta är användarrapporterade
resultat, inte agentens egen observation. OCR, kalender och uppdatering återstår.

2026-11-02: två nya mocktester verifierar produktformat, adaptiv läsruta, kamerabegränsningar,
dubbelstart, ett produktuppslag per skanning samt nekad kamera med manuell reservväg.
Nästa manuella kontroll: jämför samma tre förpackningar i samma ljus efter uppdatering till 1.2.1.
Hastighet och eventuell kamera-fokusproblematik är ännu inte verifierade på telefonen.
