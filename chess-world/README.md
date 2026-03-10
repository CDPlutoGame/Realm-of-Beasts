# ♞ Chess World

Dark-Fantasy Schach RPG — Mobile Web Game

## Live spielen

**GitHub Pages:** `https://<dein-name>.github.io/chess-world/`

---

## Ordnerstruktur

```
chess-world/
├── index.html        ← Hauptdatei
├── game.js           ← Spiellogik
├── style.css         ← Design
├── bild/
│   └── shach.jpg     ← Hintergrundbild
└── music/
    ├── 1.mp3
    ├── 2.mp3
    ├── 3.mp3
    ├── 4.mp3
    └── 5.mp3
```

---

## Setup auf GitHub Pages

1. Neues Repository erstellen: **`chess-world`**
2. Alle Dateien hochladen (Ordnerstruktur beibehalten!)
3. Repo → **Settings** → **Pages**
4. Source: **Deploy from branch** → `main` → `/ (root)`
5. Speichern → nach ~1 Minute live unter:  
   `https://<dein-name>.github.io/chess-world/`

### ⚠️ Wichtig: MP3-Dateien

GitHub hat ein **100 MB Limit pro Datei** — MP3s müssen einzeln hochgeladen werden.  
Falls die MP3s zu groß sind → im `music/`-Ordner leer lassen, Musik funktioniert dann nicht aber alles andere schon.

---

## Features

- ♟ Vollständiges Schach gegen KI (3 Schwierigkeitsgrade)
- 🎴 RPG Sammelsystem — 6 Bauer-Varianten, Dame-Elemente, Turm, Läufer, Springer, König
- ⚡ **5 Fähigkeitspunkte** pro Partie — Klick auf Figur → Fähigkeit einsetzen
- 🎁 Kistensystem (Normal/Episch/Legendär)
- 📜 Quests & Rang-System (Amateur bis Legende)
- 🎵 Musik-Player mit 5 Tracks
- 💾 3 Speicher-Slots
- 📱 Mobile-optimiert (iOS + Android)
