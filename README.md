# 2026-OSSInt Global Perception

Global Perception is an interactive open-source intelligence dashboard that maps how world events are framed across countries using live news and geospatial overlays.

## What it does

- Tracks global coverage by keyword/topic.
- Visualizes country-level framing on an interactive map.
- Layers strategic choke points, major events, and weather context.
- Provides an AI side panel for rapid article synthesis.

## Project structure

```text
.
├── src
│   ├── components
│   │   ├── AIPanel.tsx
│   │   ├── Header.tsx
│   │   ├── SearchAuditModal.tsx
│   │   ├── WeatherWidget.tsx
│   │   └── WorldMap.tsx
│   ├── data
│   │   ├── countryCoords.ts
│   │   └── publisherCoords.ts
│   ├── services
│   │   ├── gdeltService.ts
│   │   ├── llmService.ts
│   │   ├── weatherNextService.ts
│   │   └── worldMonitorService.ts
│   ├── types
│   │   └── index.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── package.json
└── vite.config.ts
```

## Getting started

### Requirements

- Node.js 18+
- npm

### Install and run

```bash
npm install
npm run dev
```

The app will start on the local Vite development server.

## Available scripts

- `npm run dev` – start development server
- `npm run build` – build for production
- `npm run preview` – preview production build
- `npm run lint` – run ESLint
- `npm run typecheck` – run TypeScript type checks
