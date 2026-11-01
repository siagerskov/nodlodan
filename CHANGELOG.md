# Ändringslogg

## 1.2.0 – 2026-11-01

- Källkod och dokumentation tillgängliga direkt i repositoryt; originalpaketet bevarat.
- Utskrift inkluderar hela sortimentet även med aktiva sök- och varningsfilter.
- CSV skyddar textceller som kan tolkas som kalkylbladsformler.
- Backupimport kontrollerar version, fälttyper, unika produkt-/parti-id:n, relationer, säkra heltal och riktiga kalenderdatum inklusive kontrolldatum.
- Datum från registrering och OCR kontrolleras mot kalendern.
- Femton regressionstester samt ursprungligt logiktest. Service worker får nytt cache-namn för ändrad appkod.
- Ej publicerat eller verifierat på fysisk iPhone.

- Lager och kontrolldatum sparas atomiskt under v2-nyckeln; äldre separat kontrolldatum läses som fallback utan att originalet raderas.
- Misslyckad sparning återställer föregående data i appen, behåller registreringsformuläret och visar fel i stället för bekräftelse.
- Oläsbart befintligt v2-register skyddas från överskrivning tills felet har hanterats och appen laddats om.
- Kalenderexport escape:ar text, viker långa rader enligt UTF-8-gränsen 75 oktetter och använder verklig UTC-tidsstämpel.
- Årskontroll från 29 februari läggs nästa gång 28 februari och återkommer därefter årligen den dagen.

- Giltig bekräftad backup tillåts återställa ett oläsbart register; vanlig registrering är fortsatt spärrad.
