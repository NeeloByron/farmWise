# FarmWise dependency setup

Prerequisites: Node.js 22+ and npm.

## Frontend (React, TypeScript, Tailwind CSS v4)
```bash
cd frontend
npm install
npm run dev
```

## Backend (Node.js, Express, TypeScript)
```bash
cd backend
npm install
cp .env.example .env
```

Backend dependencies are configured, but the server is intentionally not implemented yet. `npm run dev` in backend will work after `src/server.ts` is added.

The frontend contains a minimal Tailwind smoke-test page only. No FarmWise features have been implemented.
