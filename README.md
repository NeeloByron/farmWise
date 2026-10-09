# FarmWise

A farm planning workspace focused on making input costs easier to understand and manage. Olive green, warm neutrals, responsive desktop navigation and a mobile hamburger menu.

## Run locally

Use Node.js 22 or newer. From the **repository root**:

```sh
git switch codex/responsive-navbar
npm install
npm run dev
```

Open **http://127.0.0.1:5173**. The root command starts Vite and the local API together. It fixes the previous `Missing script: "dev"` error when running from the repository root. Keep ports 5173 and 4001 free. Stop with Ctrl+C.

If you already have a clone, fetch and pull this branch before installing. Running `npm run dev` inside `frontend` starts only the frontend; use the root command for seasonal and photo services.

## What you can use

- Field and seasonal crop plans, seed estimates, and planting schedules.
- Budgets, actual expenses, and equipment maintenance costs.
- Resource stock, fertiliser bag/kg calculations, and irrigation estimates.
- Soil photos, manual observations, lab test notes, and seed germination records.
- Equipment service reminders and maintenance history.
- Supplier quote comparisons and private group-buying coordination records.
- Seasonal outlook notifications, with optional automatic checks while the app is open.
- Farm settings and validated JSON backup export/restore.

Start with the labelled example farm, then use **Farm settings → Start an empty farm**. Records remain in your current browser; export backups regularly. There is no cloud account or shared farmer database yet.

## Optional photo analysis

Copy `backend/.env.example` to `backend/.env`, then set `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` to a vision-capable model available to your account. Restart the app. Never put these values in frontend code or a `VITE_` variable.

The photo is sent to Anthropic only when the farmer requests observations. No soil nutrient, pH, or overall health result is claimed from a photograph. Manual observations work without any key.

Seasonal checks use Open-Meteo. Set your coordinates and season dates in Settings, then choose **Notifications → Check my season**. Automatic checks are opt-in. This is a regional model outlook, not a daily weather page or a guarantee of conditions at a field.

## Build and test

```sh
npm test
npm run build
npm start
```

`npm start` serves the built app and local API at **http://127.0.0.1:4001**. Development and built-app ports have separate browser storage; use backup export/restore to move records.

This is a functional local pilot. Hosted accounts, live IoT devices, shared ordering/payments, background notifications, and reviewed translations need a production integration phase. See [implementation and validation notes](docs/IMPLEMENTATION.md) for boundaries and the acceptance checklist.
