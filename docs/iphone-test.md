# Testplan för iPhone

Status: ännu inte genomförd. Testa först med påhittade varor, inte ditt enda riktiga register.

## Förbered testversion

1. Granska och versionshantera källkod, tester och dokumentation tillsammans.
2. Kör `npm test`. Förväntat: två PASS-rader från baseline och 15 godkända regressionstester.
3. Publicera efter användarens beslut via GitHub Pages från `main` och repositoryts rot.
4. Öppna HTTPS-adressen i Safari och lägg till på hemskärmen. Ingen backend behövs.
5. Vid uppdatering av tidigare använd app: exportera först privat JSON-backup och behåll den.

## Genomför

- Lägg upp Vatten med minimum 6 och antal 0. Kontrollera Fyll på 6.
- Lägg till två partier, 2 och 3, med olika datum. Kontrollera saldo 5 och Fyll på 1.
- Förbruka alla fem; produkten ska finnas kvar på saldo 0.
- Lägg till Batterier utan datum. Filtrera på Vatten, skriv ut/spara PDF: båda varorna ska komma med.
- Exportera CSV och öppna i Excel: svenska tecken, nollsaldo och formelliknande namn ska visas som text.
- Exportera JSON, ändra testregistret och återställ. Kontrollera partier, minimum och kontrolldatum.
- Avbryt en återställning; data ska förbli oförändrade.
- Markera lagerkontroll och exportera kalender. Importera i separat testkalender och kontrollera årshändelse och alarm.
- Lägg in en vara med datum minst 60 dagar framåt. Kontrollera kalenderhändelse 60 dagar före datumet.
- Testa kamera, produktuppslag och OCR; kontrollera datum mot förpackningen och prova manuell reservväg.
- Ladda appen online, stäng den, aktivera flygplansläge och öppna hemskärmsappen. Kontrollera lokalt lager och export.
- Vid ny version: ladda om, kontrollera att ny kod används och att lagret finns kvar.

Anteckna iPhone-modell, iOS-version, Safari/hemskärmsläge och godkänt/underkänt per punkt.
Kalenderimport, notistid, verklig offlinestart och uppdatering är öppna tills detta gjorts.
