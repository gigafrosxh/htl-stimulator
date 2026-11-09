# School With Your Friends

Ein bewusst billiges, chaotisches Low-Poly-3D-Koop-Spiel für 1–6 Spieler: Überlebt gemeinsam einen Schultag, macht heimlich Hausübungen, schummelt, sabotiert euch gegenseitig und lasst euch bloß nicht erwischen. Wer das Tagesziel verfehlt, muss für den Rest der Ewigkeit nachsitzen.

## Spielen

`index.html` ist das komplette Spiel in einer Datei (Three.js r128 wird von cdnjs geladen). Im Browser öffnen, Namen und Klassen-Code eingeben, los.

- Online-Mehrspieler läuft über die `room`-Capability, wenn das Spiel als Claude-Artifact geöffnet wird. Alle mit dem gleichen Klassen-Code landen in derselben Klasse.
- Lokal geöffnet läuft das Spiel im Solo-Modus.

## Desktop-App (macOS / Windows)

Fertige Apps hängen an jedem [Release](https://github.com/gigafrosxh/htl-stimulator/releases):

- **macOS (Apple Silicon):** `School-With-Your-Friends-<version>-mac-arm64.dmg`
- **Windows (x64):** `School-With-Your-Friends-<version>-win-x64.exe` (Installer)

Die Desktop-App läuft komplett offline und im **Solo-Modus** (Online-Mehrspieler gibt es bisher nur im Claude-Artifact).

Die Apps sind noch nicht signiert:

- **macOS:** Beim ersten Start meldet Gatekeeper „App ist beschädigt“ oder „nicht verifizierter Entwickler“. Lösung: App in „Programme“ ziehen, dann im Terminal `xattr -dr com.apple.quarantine "/Applications/School With Your Friends.app"` ausführen (oder Rechtsklick → Öffnen bzw. Systemeinstellungen → Datenschutz & Sicherheit → „Trotzdem öffnen“).
- **Windows:** SmartScreen warnt „Der Computer wurde durch Windows geschützt“. Auf „Weitere Informationen“ → „Trotzdem ausführen“ klicken.

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

### Desktop-App bauen

Die Desktop-App (Electron) liegt in `desktop/`. `desktop/prepare.js` nimmt das gebaute `index.html` und packt Three.js und die Schriften lokal dazu, damit die App ohne Internet läuft.

```bash
cd desktop
npm ci
npm start          # App lokal starten
npm run dist:mac   # .dmg (nur auf macOS)
npm run dist:win   # .exe (am besten auf Windows)
```

Der Workflow `.github/workflows/desktop.yml` baut beide Apps auf GitHub Actions (macOS mit Apple Silicon und Windows) und hängt sie an das Release, sobald der Release-Workflow es angelegt hat. Bei Pull Requests werden sie nur gebaut und liegen unter „Artifacts“ zum Testen bereit.
