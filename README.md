# School With Your Friends

Ein bewusst billiges, chaotisches Low-Poly-3D-Koop-Spiel für 1–6 Spieler: Überlebt gemeinsam einen Schultag, macht heimlich Hausübungen, schummelt, sabotiert euch gegenseitig und lasst euch bloß nicht erwischen. Wer das Tagesziel verfehlt, muss für den Rest der Ewigkeit nachsitzen.

## Spielen

`index.html` ist das komplette Spiel in einer Datei (Three.js r128 wird von cdnjs geladen). Im Browser öffnen, Namen und Klassen-Code eingeben, los.

- Online-Mehrspieler läuft über die `room`-Capability, wenn das Spiel als Claude-Artifact geöffnet wird. Alle mit dem gleichen Klassen-Code landen in derselben Klasse.
- Lokal geöffnet läuft das Spiel im Solo-Modus.

## Steuerung

| Taste | Aktion |
|---|---|
| WASD / Shift / Space | Laufen / Rennen / Springen |
| Maus (Klick) | Umsehen |
| E | Hinsetzen, benutzen (Automat, Feueralarm, Lehrerzimmer ...) |
| H | Hausübung machen |
| F / V | Abschreiben / HÜ stehlen |
| G / R | Zettel werfen / Schubsen |
| Q / X | Dumme Frage stellen / Verpetzen |
| 1–3 | Items benutzen |
| M | Ton an/aus |

## Entwicklung

Der Quellcode liegt in `src/`. `./build.sh` setzt daraus `index.html` zusammen.

| Datei | Inhalt |
|---|---|
| `src/01_head.html` | HTML, CSS, HUD, Lobby |
| `src/02_core.js` | Daten, Sounds (WebAudio), Schulgebäude, Figuren und Ragdolls |
| `src/03_net_host.js` | Stundenplan, Netzwerk, Host-Simulation (Lehrer-KI, NPCs, Zeit) |
| `src/04_client.js` | Spieler, Verdachtssystem, Aktionen, Ereignisse |
| `src/05_ui.js` | Minispiele, HUD, Zeugnis, Nachsitz-Cutscene, Hauptschleife |

## Versionen und Releases

Die aktuelle Versionsnummer steht in `VERSION`. Nach jedem Push auf `main` prüft die Action `.github/workflows/release.yml`, ob es zu dieser Nummer schon ein Release gibt, und legt sonst eins an. Das Release enthält das gebaute Spiel als Download und die Notes aus `release-notes/vX.Y.Z.md`, falls die Datei existiert, sonst automatisch erzeugte Notes. Versionen unter 1.0.0 oder mit Suffix (z. B. `0.3.0-beta`) werden als Vorabversion markiert.
