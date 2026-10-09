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

The frontend contains a responsive FarmWise navbar with Dashboard, Crop Planner, Input Costs, My Crops, and Reminders links. Mobile navigation can be toggled with the menu button and closed with Escape or by selecting a link. Links are fragment placeholders for future pages; no feature pages have been implemented.
