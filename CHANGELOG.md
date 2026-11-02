# Ändringslogg

## Ej versionssatt – 2026-11-02

- Formulärfält får krympbara kolumner och begränsad bredd för att undvika överlappning.
- En kolumn på mobil upp till 480 px; etiketter med flera rader ger linjerade fält på större skärmar.
- Service worker får v5-cache så att layoutändringen kan hämtas efter uppdatering.
- Befintliga mocktester godkända. Visuell webbläsarverifiering kunde inte köras i miljön; fysisk iPhone återstår.


## 1.2.1 – 2026-11-02

- Skannern begränsas till EAN-13, EAN-8, UPC-A, UPC-E och Code 128.
- Anpassad bred läsruta, 15 avläsningsförsök/s och önskad kameraupplösning 1280×720. Spegelvänd andra avläsningspass avstängt för bakkamera. Telefonen väljer faktisk upplösning och kamera.
- Hjälptext om avstånd, hela kodens bredd och reflexer; skydd mot dubbelstart och dubbla produktuppslag.
- Service worker använder v4-cachen uttryckligen så att äldre cacher inte vinner efter uppdatering.
- Skannerflöden testade med mockad kamera. Hastighetsförbättring ännu inte verifierad på iPhone 14 Pro.


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
