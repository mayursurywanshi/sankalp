# Sankalp Frontend

The Sankalp frontend is built with React, TypeScript, and Vite.

## Requirements

- Node.js 20.19 or newer
- The Sankalp backend running on `http://localhost:5000`

## Environment

Create a local `.env` file when you need environment overrides. Environment files are intentionally excluded from Git:

```env
VITE_API_URL=http://localhost:5000
```

## Commands

### `npm install`

Installs frontend dependencies.

### `npm start`

Starts the Vite development server at [http://localhost:3000](http://localhost:3000).

### `npm run dev`

Starts the same development server using Vite's conventional command.

### `npm test`

Runs the complete Vitest test suite once.

### `npm run build`

Runs TypeScript validation and creates the optimized production build in `dist`.

### `npm run preview`

Serves the production build locally at [http://localhost:3000](http://localhost:3000).
