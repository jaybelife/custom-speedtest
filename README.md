**Custom Speedtest**

Ein leichtgewichtiges, lokales Speedtest-Frontend in reinem HTML, CSS und JavaScript. Dieses Projekt bietet eine visuell ansprechende Oberfläche (Catppuccin-inspirierte Farbpalette) zur Messung von Ping, Jitter, Download- und Upload-Durchsatz in sequenziellen 10‑Sekunden-Phasen.

**Features:**
- Sequenzielle Tests: Ping → Jitter → Download → Upload (jeweils ~10s)
- Live-Anzeige der Werte im Status‑Ring und auf separaten Metrik‑Karten
- Start/Stop-Schalter mit Reset-Verhalten
- Responsive Layout für Desktop und mobile Ansichten
- Kein Backend erforderlich — verwendet lokale Pfade für Testdaten

**Schnellstart**

- Einfachste Variante: Öffne die Datei `index.html` im Browser.

  Oder starte einen lokalen Webserver (empfohlen):

  ```bash
  # Python 3
  python3 -m http.server 8000

  # oder mit Node (falls installiert):
  npx http-server -c-1 . 8000
  ```

  Dann im Browser öffnen: `http://localhost:8000` und auf "Start" klicken.

**Dateistruktur**
- `index.html` — Hauptseite und Markup
- `assets/css/style.css` — Styling, Farbvariablen (Catppuccin‑Palette)
- `assets/js/script.js` — Testlogik, UI‑State und Messungen
- `downloading/` und `upload` müssen in meinem Discord bezogen werden -> https://jaybelife.de/community da sie für GitHub zu groß sind.

**Entwicklung & Tests**

- JavaScript‑Syntax prüfen (lokal):

  ```bash
  node --check assets/js/script.js
  ```

- Änderungen am UI‑Styling: `assets/css/style.css`
- Änderungen an der Logik: `assets/js/script.js`

**Erläuterungen zur Messung**
- Ping/Jitter: mehrere kurze Requests werden über ~10 Sekunden gemessen und aggregiert.
- Durchsatz (Download/Upload): gemessene Bytes / verstrichene Zeit → Mbps.

Hinweis: Für reproduzierbare Messungen betreibe das Projekt auf einem lokalen HTTP‑Server; das Öffnen der Datei per `file://` kann zu CORS- oder Timing‑Abweichungen führen.

**Mitwirken**
- Fehler, Feature‑Wünsche oder Design‑Änderungen bitte als Issues oder PRs im Repository einreichen.

**Lizenz**
- MIT — siehe `LICENSE`.

**Credits**
- Farbpalette / Stil von Catppuccin-inspirierten Farben übernommen und angepasst.

Viel Erfolg — sag Bescheid, wenn ich noch ein kurzes Beispiel zur Einbindung in ein statisches Hosting oder ein Docker‑Setup hinzufügen soll.
