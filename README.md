# skribbl-bot

A full-autopilot automation tool for [skribbl.io](https://skribbl.io), the online
drawing-and-guessing party game. It plays the game on your behalf:

- **Auto word-guessing** — watches the chat/hint state during guessing rounds and submits
  guesses drawn from a bundled word-frequency list, narrowing the candidate list as more
  letters are revealed.
- **Auto image drawing** — on your drawing turn, fetches reference images for the current
  word (via a self-hosted SearXNG instance), lets you pick one, converts it to skribbl's
  fixed color palette, and reproduces it on the canvas as pen strokes.

A sidebar panel docked beside the live game shows what the bot is doing and lets you pause,
resume, or override it (manual guess, manual image pick, cancel a draw in progress).

Built for a small trusted friend group running it locally — not a public release.

## How it works

skribbl-bot is an Electron desktop app with two views side by side in one window:

- **Game view** — loads `https://skribbl.io` directly, undecorated, no visible automation
  chrome.
- **Sidebar view** — a Vite + React 19 + TypeScript control panel (shadcn/ui-derived
  components, Tailwind CSS v4), styled to echo skribbl.io's own colors and shapes.

The Electron **main process** (`src/electron/`) owns automation logic and network calls
(fetching images, reading the word list, talking to SearXNG). A **preload script**
(`src/electron/preload/`) is injected into the live skribbl.io view and drives the actual
DOM automation:

- [`skribbl-util/wordGuesser.ts`](src/electron/preload/skribbl-util/wordGuesser.ts) —
  builds and narrows a candidate word list against the revealed hint, and submits guesses
  through the chat form on an interval.
- [`skribbl-util/imageDrawer.ts`](src/electron/preload/skribbl-util/imageDrawer.ts) —
  quantizes a fetched image down to skribbl's color palette, converts it into horizontal
  pen strokes, and replays them on the canvas via synthesized pointer events.

Main process and sidebar communicate over Electron IPC (`src/electron/preload/ipc.ts`);
main process and the skribbl.io preload communicate the same way.

## Requirements

- Node.js and npm
- Docker (for the self-hosted [SearXNG](src/searxng/) image search instance used by
  auto-drawing — see `src/searxng/docker-compose.yml`)

## Development

```bash
npm install
npm run dev
```

This runs the Vite dev server for the sidebar and launches the Electron app in parallel.

Other scripts:

```bash
npm run build          # type-check and build the sidebar for production
npm run lint            # run oxlint
npm run dist:mac        # package a macOS build (also dist:win, dist:linux)
```
