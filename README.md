# Alien's Hello World PWA

A futuristic Progressive Web App featuring an Alien with a simple Hello World greeting!

## Features

✨ **PWA Features:**
- Service Worker for offline support
- Installable on mobile and desktop
- Responsive design
- Beautiful Alien SVG illustration
- Install button for quick app installation

## Project Structure

```
├── index.html          # Main HTML file
├── app.css            # Styling
├── app.js             # PWA functionality
├── manifest.json      # Web app manifest
# Rocket Moons

A small browser game: pilot a rocket through drifting moons and collect coins.

## How to play
- Click **Start** (or tap) to begin.
- Use Up/Down arrow keys, mouse, or touch to move the rocket.
- Collect yellow coins to gain points (+10 each).
- Avoid moons — collisions cost a life. Game over at 0 lives.

## Files

```
index.html      # Game canvas and UI
app.css         # Game styles
app.js          # Game logic (canvas, entities, loop)
manifest.json   # Web app metadata
service-worker.js
README.md       # This file
```

## Run locally
Serve the folder (HTTP is fine for local testing):

Python 3:
```bash
python -m http.server 8000
```

Then open `http://localhost:8000` and play.

## Notes
- The game uses simple canvas drawing (no assets) so it's easy to customize.
- Want features? Tell me to add levels, sounds, or a high-score table.
  - Name them `icon-192.png` and `icon-512.png`
