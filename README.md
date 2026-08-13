<p align="center">
  <img src="assets/chessvibe.jpeg" alt="ChessVibe logo — a colorful knight chess piece emblem with the CHESSVIBE wordmark" width="220" />
  <h1 align="center">ChessVibe ♔</h1>
  <p align="center"><strong>The board awaits.</strong> A polished, zero-dependency-install chess web app with real-time peer-to-peer multiplayer, a 14-level Stockfish bot, gauntlet challenges, and a full game replay engine.</p>
  <p align="center">
    <a href="https://vincenzo-afk.github.io/Chessvibe/"><strong>🌐 Play Live Demo</strong></a> ·
    <a href="#features">Features</a> ·
    <a href="#getting-started">Getting Started</a> ·
    <a href="#roadmap">Roadmap</a> ·
    <a href="#contributing">Contributing</a>
  </p>
  <p align="center">
    <a href="https://github.com/vincenzo-afk/Chessvibe/blob/main/LICENSE"><img src="https://img.shields.io/github/license/vincenzo-afk/Chessvibe?color=blue" alt="License: MIT" /></a>
    <a href="https://github.com/vincenzo-afk/Chessvibe"><img src="https://img.shields.io/badge/version-1.0-orange" alt="Version 1.0" /></a>
    <a href="https://github.com/vincenzo-afk/Chessvibe/issues"><img src="https://img.shields.io/badge/bugs-report-green" alt="Report a bug" /></a>
    <a href="https://vincenzo-afk.github.io/Chessvibe/"><img src="https://img.shields.io/badge/platform-Web%20%7C%20Mobile%20%7C%20Desktop-lightgrey" alt="Platform: any browser" /></a>
    <a href="https://github.com/vincenzo-afk/Chessvibe/stargazers"><img src="https://img.shields.io/badge/stars-⭐%20welcome-yellow" alt="Stars welcome" /></a>
  </p>
</p>

---

## Table of Contents

1. [About the Project](#about-the-project)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Getting Started](#getting-started)
5. [Usage](#usage)
6. [Online Multiplayer Protocol](#online-multiplayer-protocol)
7. [Project Structure](#project-structure)
8. [Features & Roadmap](#roadmap)
9. [Testing](#testing)
10. [Deployment](#deployment)
11. [SEO](#seo)
12. [Contributing](#contributing)
13. [Security](#security)
14. [License](#license)
15. [Acknowledgments](#acknowledgments)

---

## About the Project

ChessVibe is a modern, fully client-side chess platform that runs entirely in the browser — there is no backend server, no database, and no sign-up flow. Players create a chess room and invite friends with a single copyable invite URL; the two browsers then connect directly using **WebRTC peer-to-peer** channels (via [PeerJS](https://peerjs.com)), so game data never passes through a central game server.

The project solves a common problem with online chess: most platforms require accounts, load heavy assets, and monetize the experience. ChessVibe is a lightweight, shareable, single-tab chess experience that works on desktop and mobile with full touch support, animated piece dragging, chess clocks with increment, and a complete annotation/replay workflow for post-game analysis.

### Architecture Overview

```
┌─────────────┐        WebRTC P2P         ┌─────────────┐
│  Host (W)   │ ───── chess moves ───────▶ │  Joiner (B) │
│  PeerJS     │ ◀──── sync / draw  ─────── │  PeerJS     │
└──────┬──────┘        spectators          └─────────────┘
       │  ▲
  PeerJS signaling      ┌──────────────┐
  (signaling only)      │ Spectator(s) │
                        │ (read-only)  │
                        └──────────────┘

Local move validation: chess.js 0.12.1   Bot engine: Stockfish REST API
Analytics hints:    stockfish.online      Theme/Piece sets: CSS + Unicode
```

---

## Features

- ♟ **Real-time Online Multiplayer** — create a room, share an invite link, and play head-to-head over WebRTC with no server-side game logic.
- 👁 **Spectator Mode** — unlimited read-only viewers can join a live game.
- 🤖 **Stockfish Bot** — 14 difficulty levels (depth 1–14), with a fallback local engine when the remote API is unreachable.
- ⚔️ **Bot Gauntlet** — defeat five bot levels in a row to reach Expert.
- 🕐 **Chess Clocks** — bullet/blitz/rapid presets with Fischer increment.
- 🖱 **Drag & Drop + Touch** — full mouse and touch piece dragging with legal-move highlighting, plus click-to-move.
- ♕ **Move Annotations** — click moves to replay, right-click to annotate (`!`, `!!`, `?`, `??`, `?!`).
- 📊 **Game Report** — end-of-game accuracy bars and average think time per side.
- 🔄 **Full Replay Engine** — step through, jump to, and rewatch any move.
- 🖼 **6 Board Themes + 3 Piece Sets** — classic, forest, ocean, candy, midnight, blue; Unicode, letters, filled.
- ☀ **Light / Dark Mode** — full theme toggle.
- 🔔 **Draw / Takeback / Rematch / Resign** — complete in-game protocol synced between both players.
- 💬 **In-game Chat** — live text chat during online games.
- 📈 **Evaluation Bar** — live position evaluation from Stockfish.
- 💡 **Move Hints** — request the engine's best move for the current position.
- 📋 **Share a Game** — encode a game as a URL-friendly PGN and share it; anyone opening the link sees the same position and can replay it.
- 🕶 **Blindfold Mode** — hide piece artwork for training.
- 🔊 **Sound Effects** — move, capture, check, and promotion sounds.
- 📱 **Fully Responsive** — designed mobile-first with a responsive board and UI.
- 🔍 **SEO Optimized** — Open Graph, Twitter cards, JSON-LD structured data, sitemap, and search-engine-friendly metadata.

---

## Tech Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Markup / Styling | HTML5 + CSS3 (custom properties) | Single-page UI, responsive layout, themes |
| Game Logic | [chess.js 0.12.1](https://github.com/jhlywa/chess.js) | Full FIDE move validation, check/checkmate detection, FEN/PGN |
| Online Multiplayer | [PeerJS 1.5.2](https://peerjs.com) | WebRTC data channels + signaling for P2P rooms |
| Bot Engine | Stockfish online REST API (`stockfish.online`) | Engine best-move queries for hints and evaluation |
| Evaluation Bar | stockfish.online evaluation endpoint | Live position scoring |
| Fonts | Inter + JetBrains Mono (Google Fonts) | UI and chess notation typography |
| Hosting | GitHub Pages | Zero-cost static hosting |

There is **no backend framework, no database, and no build step** — the app is three static files served as-is, which is also why it deploys to any static host in seconds.

---

## Getting Started

### Prerequisites

- Any modern browser with JavaScript enabled (Chrome, Firefox, Safari, Edge).
- For **online multiplayer**, WebRTC support (supported by all major browsers) and an internet connection to the PeerJS signaling servers.
- Nothing needs to be installed to *play*; to *develop* you only need a text editor.

### Local Development

```bash
git clone https://github.com/vincenzo-afk/Chessvibe.git
cd Chessvibe
```

Because the project uses ES-module-safe plain scripts, any static server works. Python is the fastest option:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Alternatively, with Node.js:

```bash
npx http-server -c-1
```

Or simply open `index.html` directly in a browser for local play modes (online P2P works best when served over `http`/`https`, as WebRTC signaling behaves inconsistently from `file://`).

### Production Deployment

Push to any static host and point the document root at the repository:

| Host | Notes |
| --- | --- |
| [GitHub Pages](https://pages.github.com/) | Default setup; app is already configured for it |
| Netlify / Vercel | Drag-and-drop the repo; no configuration required |
| Cloudflare Pages | Same, zero-config |
| Any web server | Serve the repo root with a generic static MIME configuration |

---

## Usage

### Playing a Local Game

1. Open the app and click **Local 2 Player**.
2. Pick a time control (or play untimed) and press **Start Game**.
3. Drag pieces (or tap a piece, then tap the destination square). Legal destinations are highlighted.

### Playing Online

1. Click **Online 1v1** and open the **Create Room** tab.
2. Press **Create Room** — a 4-character room code and a full invite URL appear.
3. Copy the invite URL and send it to your friend (works on any device).
4. Your friend opens the link (or pastes the code under **Join Room**) and the game starts automatically.
5. The creator always plays **White**; the joiner plays **Black** and the board is flipped accordingly.

### Spectating a Game

Open the **Spectate** tab in the online modal, enter the room code, and watch the game live in read-only mode. Spectators see move highlights and the chat but cannot interact with the board.

### Analyzing a Game

After a game ends, use the **Replay** controls (first / previous / next / last / click a move in the history) to walk through the game. Right-click any move to attach annotations. The end-of-game **Game Report** shows both players' accuracy and average think time.

---

## Online Multiplayer Protocol

All game communication happens over a PeerJS `DataConnection` between the two players, with additional read-only connections for spectators. The protocol is intentionally small and deterministic:

| Message | Direction | Meaning |
| --- | --- | --- |
| `join` | Joiner → Host | Marks the first incoming connection as the opponent |
| `handshake` | Host → Joiner | Assigns `color: "b"`; both clients start the game |
| `spectate` / `spectator-welcome` | Spectator ↔ Host | Adds a spectator; full rooms become spectators |
| `move {from,to,promotion,seq}` | Both → each other | Played move with an authoritative sequence number |
| `sync-request` | Any client | Asks the host for a full position re-sync |
| `sync-state {pgn,moveCounter}` | Host → requester | Restores an identical board via PGN |
| `draw-offer` / `draw-accept` / `draw-decline` | Both | Draw negotiation (shown in the shared draw modal) |
| `takeback-request` / `takeback-accept` / `takeback-decline` | Both | Two-move takeback negotiation |
| `resign {color}` | Resigner → opponent | Announces resignation so the opponent shows the result |
| `rematch-request` / `rematch-accept` / `rematch-decline` | Both | Starts a new game in the same room |
| `chat {name,text}` | Both | In-game chat message |
| `spectator-count {count}` | Host → spectators | Keeps the spectator badge in sync |

Design decisions that keep games consistent: the **host is authoritative** for sequence numbers and re-syncs; each move carries a `seq` counter so a client that drifts (e.g., it moved locally before the opponent finished starting) detects the mismatch, sends `sync-request`, and restores the host's PGN. Connection roles are settled on the **first `join` message** only, so a third peer always becomes a spectator.

---

## Project Structure

```
Chessvibe/
├── index.html          # Single-page layout: loader, navbar, mode screens, game UI, modals + SEO head
├── app.js              # Complete game logic: rules, drag/touch, online P2P protocol, bot, UI wiring
├── style.css           # Full theme system: dark/light, 6 board themes, responsive breakpoints
├── assets/
│   ├── chessvibe.jpeg  # Official logo (1024×1024)
│   ├── chessvibe-icon-*.png   # Favicon sizes (16–512 px)
│   ├── apple-touch-icon.png   # iOS home-screen icon
│   └── favicon.ico     # Multi-size ICO for legacy browsers
├── robots.txt          # Crawler instructions
├── sitemap.xml         # XML sitemap for search engines
└── LICENSE             # MIT license
```

`app.js` is organized into clearly commented sections (game state, board rendering, move validation, drag & drop, bot, timers, online protocol, replay engine, modals, and initialization) so contributors can locate any subsystem quickly.

---

## Roadmap

### Completed ✅

- [x] Local 2-player mode with full legal move validation
- [x] Stockfish bot (14 levels) with difficulty slider and color pick
- [x] Bot Gauntlet (5 escalating stages)
- [x] Real-time P2P online multiplayer with room codes and invite URLs
- [x] Spectator mode with live count badge
- [x] Chess clocks with Fischer increment
- [x] Drag & drop + click-to-move + full touch support
- [x] Promotion dialog, blindfold mode, sound, flip board
- [x] Move annotations, full replay engine, breadcrumb navigation
- [x] Game Report (accuracy + think time)
- [x] Draw / Takeback / Rematch / Resign protocol for online games
- [x] Share-a-game via PGN-encoded URL parameter
- [x] 6 board themes, 3 piece sets, light/dark mode
- [x] SEO package: meta description, Open Graph, Twitter cards, JSON-LD, sitemap, robots.txt, favicons
- [x] GitHub repository button integrated into the UI

### Planned 🔜

- [ ] Persistent game history with a per-player ELO-style rating
- [ ] Lobby / room listing for finding random opponents
- [ ] Optional self-hosted PeerJS signaling server for full privacy
- [ ] PWA manifest + offline play
- [ ] Import/export FEN and PGN
- [ ] Board arrow drawing tool for teaching
- [ ] 15/10 and custom clock presets in the online modal

### Known Limitations

- Online games require both players to reach the PeerJS public signaling servers; enterprise firewalls with strict WebRTC blocking may fail (players can fall back to local 2-player mode).
- The evaluation bar and hints depend on the free `stockfish.online` API, which can be intermittently slow; a local engine fallback covers move hints when the API is unreachable.
- The Stockfish REST API caps depth; the bot's 14 levels are depth-scaled from that API.

---

## Testing

The project is a static site, so manual and automated checks are both lightweight:

```bash
# 1. Serve the app
python3 -m http.server 8000 &

# 2. Open http://localhost:8000 and verify:
#    - Mode screen loads with 4 mode cards
#    - Local game starts and pieces move legally (incl. castling, en passant, promotion)
#    - Touch drag moves a piece (DevTools → device emulation → touch)
#    - Bot responds with legal moves at all 14 levels
#    - Online room creation shows a 4-char code and invite URL
#    - All modals (draw, resign, promotion, gauntlet) open and close correctly
```

For CI, a headless browser suite (Playwright or Puppeteer) can drive the same scenarios — click-tests for every piece's movement rules, clock decrement, and the online handshake sequence are the highest-value additions. There is currently no automated test suite; contributions adding one are very welcome (see [Contributing](#contributing)).

---

## Deployment

Deploying to **GitHub Pages** (the current setup):

1. Push to the `main` branch.
2. Settings → Pages → Source: `main` branch → `/ (root)`.
3. The site is live at `https://vincenzo-afk.github.io/Chessvibe/`.

For **Netlify / Vercel / Cloudflare Pages**: connect the GitHub repository and leave the build command empty — the root is served as-is. No environment variables or build configuration are required.

---

## SEO

ChessVibe ships with a complete search-engine optimization package so the site can be discovered and shared effectively:

- A descriptive `<title>` and `<meta name="description">` targeting queries such as *online chess*, *free chess*, and *multiplayer chess*.
- **Open Graph** and **Twitter Card** tags with the official logo as the share image, producing rich previews in Discord, Facebook, X, and iMessage.
- **JSON-LD structured data** (`WebApplication` schema) describing the app, its creator, license, and repository — this is what helps Google show the app in rich results.
- `robots.txt` and `sitemap.xml` for crawler discovery.
- Proper `canonical` URL, `lang="en"`, semantic markup, and descriptive `alt` attributes.
- Multi-size favicons including an `apple-touch-icon` for home-screen installs.

To accelerate indexing, submit `https://vincenzo-afk.github.io/Chessvibe/` in [Google Search Console](https://search.google.com/search-console) after the site is live.

---

## Contributing

Contributions are welcome and appreciated!

1. **Fork** the repository and create a branch from `main` (`feature/your-feature`, `fix/your-bug`).
2. **Develop** — keep `app.js` section comments intact and add new code to the matching section, or create a clearly commented new section.
3. **Test** in a real browser (desktop + mobile emulation) before opening a PR.
4. **Commit** with conventional messages, e.g. `fix: knight touch-drag moves apply correctly`.
5. **Open a Pull Request** describing what changed and why.

Code style: plain ES6, no frameworks, comments in English, and no minification of source files (the live site can be minified separately). Please avoid introducing any build step unless discussed first — the zero-build philosophy is a core design goal.

---

## Security

ChessVibe is deliberately low-risk: it contains no authentication, no user accounts, and no server-side code. Online games use end-to-end WebRTC data channels, so moves are exchanged directly between browsers; the PeerJS cloud only handles the initial signaling handshake. A few notes for players:

- Only join rooms from invite links you trust — a malicious host can send arbitrary board states (though chess.js validates every received move locally, so illegal boards are rejected).
- Chat messages are echoed as plain text; no message persistence exists, so nothing is stored.
- Dependencies are loaded from well-known CDNs (cdnjs, jsdelivr); for maximum trust, self-host the `chess.min.js` and `peerjs.min.js` copies (PRs welcome).

Report vulnerabilities by opening an issue or contacting the maintainer directly.

---

## License

This project is licensed under the [MIT License](LICENSE) — feel free to use, modify, and distribute it.

---

## Acknowledgments

- [chess.js](https://github.com/jhlywa/chess.js) by Jeff Hlywa — bulletproof move generation and validation.
- [PeerJS](https://peerjs.com) — dead-simple WebRTC wrapper that makes P2P chess rooms possible without a server.
- [Stockfish](https://stockfishchess.org/) via [stockfish.online](https://stockfish.online) — the strongest open-source chess engine, powering the bot, hints, and evaluation bar.
- [Google Fonts](https://fonts.google.com) — Inter and JetBrains Mono.
- The open-source chess community, whose countless implementations inspired the UI and feature set.

Built with ❤️ by [vincenzo-afk](https://github.com/vincenzo-afk).

---

<p align="right"><a href="#chessvibe-">Back to top ↑</a></p>
