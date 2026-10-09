# FarmWise implementation notes

## Working pilot

The existing React 19, TypeScript, Vite and Tailwind 4 frontend is retained. The interface uses warm neutral backgrounds, olive green, readable forms, keyboard focus indicators, and a hamburger drawer on smaller screens.

Farm records are saved to browser local storage. Example records are explicitly labelled. Settings can clear example records, export JSON backups, and restore validated backups. Photos are resized before storage. Data is scoped to the browser and origin, so localhost and 127.0.0.1 have separate storage; use the same address consistently.

The local Node service handles optional provider calls and production assets. It binds to loopback only, checks Host/Origin and a custom request header, limits request bodies and rate, and keeps API keys server-side. It is **not a public multi-user backend**. Do not expose it to the internet as-is.

## Features

| Area | Implemented behaviour |
| --- | --- |
| Planning | Add/edit fields and crop plans, validate total land, seed quantity from entered rate, planting tasks and completion |
| Financial plan | Planned and actual costs, categories, budget remainder and overspending, maintenance costs |
| Resources | Stock quantities and low-stock thresholds; fertiliser kg, whole bags and purchases after allocated stock; daily irrigation estimate |
| Soil | Camera/upload, saved manual observations, laboratory pH and test notes, optional photo observations |
| Seed check | Germination sample counts and percentage |
| Equipment | Hour/date thresholds, service history, automatic next hour threshold, linked expense |
| Buying | Saved supplier quotes including delivery, group purchase target and pledge records |
| Notifications | Due planting tasks, low stock, equipment care, saved seasonal outlooks; optional daily checks while open |
| Settings | Farm/location/season/budget, empty workspace, backup export and restore |

## Calculations and boundaries

- Fertiliser = hectares × an entered kg/ha rate. Purchased bags = ceiling(max(0, need − allocated stock) / bag size). The user chooses a formulation and adviser/lab rate; the app never prescribes one. Calculations do not reserve or deduct stock.
- Irrigation = max(0, ET₀ × crop coefficient − effective rainfall) × hectares × 10,000 / irrigation efficiency. Inputs must come from local measurements or advice. This estimate is not an irrigation controller.
- Seed estimate = hectares × the seed supplier/adviser rate.
- Budget remaining uses actual expenses; unallocated budget uses planned costs. These are not verified savings.
- Quote totals are only comparable for the same specification and quantity. Saving a group record never places an order or collects money.
- A soil photo only supports visible observations. It cannot measure pH, nutrients, contamination, or overall soil health. Lab data is manually entered; laboratory document extraction is not implemented.
- Seasonal data comes from Open-Meteo's ECMWF SEAS5 ensemble mean. Available daily samples are aggregated into one seasonal summary, never a daily forecast screen. At least 28 days of coverage are required; partial seasons are labelled. No anomaly, crop suitability, or precise planting recommendation is inferred. Notification checks require the app to be open; background push/SMS/WhatsApp are not connected.

## Providers

- [Open-Meteo seasonal documentation](https://open-meteo.com/en/docs/seasonal-forecast-api)
- [Official model/API schema](https://github.com/open-meteo/open-meteo/blob/main/openapi/seasonal.yml)
- [Anthropic vision documentation](https://platform.claude.com/docs/en/build-with-claude/vision)

For a commercial launch, review provider subscription terms and implement the appropriate commercial weather endpoint/key. Check regional forecast usefulness with an agronomist. Live provider responses were not verified in the restricted development environment; handler tests use provider fixtures. Soil analysis additionally requires a real key and supported vision model.

## Before a production pilot with farmers

Add authentication and farm ownership, an access-controlled database and photo storage, backups and migrations, audited supplier/group ordering, notification delivery with consent, deployment monitoring, and approved translations. IoT hardware ingestion/control, sensor calibration, subscriptions and payments have not been implemented. Select the actual devices and provider contracts first; no simulated sensor readings are presented as live data.

## Verification

Run `npm test` and `npm run build` from the root. Tests cover the cost/resource rules, service reminders, backup validation, request validation, provider failure paths and response aggregation. HTTP handler tests run in-process to work in environments that prohibit loopback client sockets; they do not test network transport.

Manual acceptance checklist:

1. Open the root development URL, check desktop and 390 px mobile layouts, hamburger, keyboard focus, Escape and dialog focus return.
2. Add a second field within remaining land; reject one beyond it. Reload to confirm persistence.
3. Add a planting task and complete it. Check the notification count.
4. Add a budget item and actual expense; confirm remaining budget.
5. Calculate 0.5 ha × 210 kg/ha using 50 kg bags and 20 kg allocated stock: 105 kg needed and 2 bags to buy.
6. Calculate irrigation for 0.5 ha, ET₀ 5, coefficient 1, rain 1 and 80% efficiency: 25,000 L/day.
7. Log a service at 250 h and R500 for the example tractor. Confirm next service at 500 h and a R500 expense.
8. Save a soil photo and manual note; reload and reopen it. Test AI only with a configured provider key.
9. Export a backup, restore it, and verify a malformed file is rejected without replacing records.
10. Set a real location/season and fetch an outlook; test network failure and partial coverage. Enable automatic checks and verify a single request per day while open.

Browser visual/interaction checks remain unverified in the development session because the browser connection to the local server timed out. Both dev services started, and the production build completed successfully.
