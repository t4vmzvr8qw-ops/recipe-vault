# Recipe Vault

## Funktionen
- Rezepte zum Kochen und Backen, Suchfunktion, Kategorien und Favoriten
- Eigene Rezepte mit Zutaten und Schritten; Portionenrechner
- Essensplaner, automatisch aggregierte Einkaufsliste, zusätzliche Einkaufsartikel
- Text-Export der Einkaufsliste, vollständiger JSON-Backup-Import/-Export

## Rezepte aus Websites
Auf der Startseite und unter „Rezepte“ gibt es **Rezept importieren** mit drei Wegen:

- **Website-Link:** Versucht zuerst strukturierte `Recipe`-Daten (schema.org/JSON-LD) über einen öffentlichen Abrufdienst auszulesen; alternativ wird eine Textansicht angefordert. Manche Websites blockieren diese Dienste oder liefern unbrauchbare Texte.
- **Bild/Screenshot:** Texterkennung direkt im Browser mit Tesseract.js (Deutsch/Englisch), das bei der ersten Nutzung über ein CDN geladen wird. Bitte den erkannten Text kontrollieren; insbesondere Mengen und Einheiten können falsch erkannt werden.
- **Text:** Kopierten Rezepttext mit Überschriften „Zutaten“ und „Zubereitung“ einfügen.

Alle Wege öffnen danach den bestehenden Rezepteditor, in dem du vor dem Speichern kontrollieren und korrigieren kannst. **Es werden keine Rezeptdaten automatisch gespeichert.** Der Website-Link wird an externe Abrufdienste geschickt; bei Fotoimport wird das Bild lokal verarbeitet, allerdings werden Programmdateien und Sprachmodelle aus dem Internet geladen. Ohne Backend oder API-Schlüssel kann das automatische Einlesen nicht auf allen Websites garantiert werden.

## Installation über GitHub Pages

1. ZIP entpacken. **Für jede App ein eigenes GitHub-Repository** anlegen (öffentlich, wenn GitHub Pages kostenlos genutzt werden soll).
2. Den **Inhalt des entpackten App-Ordners** in das Repo-Root hochladen oder via Git pushen. Die versteckte `.github`-Struktur muss mit übernommen werden, falls vorhanden.
3. Unter **Repository → Settings → Pages** einstellen: für Market Pulse und Frankfurt Radar **Source: GitHub Actions**; bei den vier anderen **Deploy from a branch**, Branch `main`, `/(root)`.
4. Nach dem Deployment die bereitgestellte Pages-URL auf dem iPhone in Safari öffnen und unter Teilen **Zum Home-Bildschirm** wählen.
5. Falls Updates zunächst nicht sichtbar sind: Seite neu laden und ggf. den Homescreen-Link schließen und neu öffnen. Die Service-Worker-Datei nutzt bei Internetzugang eine Network-first-Strategie.

### Lokal ausprobieren

Im jeweiligen Ordner ausführen:

```sh
python3 -m http.server 8000
```

Dann `http://localhost:8000` im Browser öffnen. Für RSS-Apps muss zuvor das jeweilige `scripts/fetch_*.py` ausgeführt werden, um Online-Schlagzeilen abzurufen.

### Datenschutz

Persönliche Daten werden im lokalen Browser-Speicher gespeichert (bei Bildern IndexedDB). Es gibt keine Anmeldung und keine Synchronisierung. Der Quellcode eines öffentlichen GitHub-Repositorys ist öffentlich, **deine lokal eingegebenen Daten jedoch nicht im Repo enthalten**. Drittanbieter-Dienste für Karten, Wetter und RSS können übliche Verbindungsdaten erhalten. Import/Export von persönlichen Daten ist in den App-Einstellungen verfügbar (Bilder gesondert beachten).

### Technische Details

- Reines HTML/CSS/JavaScript, keine Build-Pipeline, keine bezahlten Dienste oder verpflichtenden API-Keys
- Responsiv für iPhone und Desktop, Hell-/Dunkelmodus, PWA-Manifest und Service Worker
- API-/Netzwerkzugriff erforderlich für aktuelle Feeds und externe Karten/Wetter
- **Prototypen:** vor produktivem Einsatz oder Veröffentlichung mit echten Daten bitte weitere Tests durchführen
