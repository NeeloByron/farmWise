# Connected FarmWise demo

Use sample or rehearsal records, not important farm data. Download a backup first. Soil images and AI were intentionally left unchanged.

## Five-minute demonstration

1. In Settings, set a R1,000 budget and an appropriate farm size. In Planning, add Field A (0.5 ha, maize). Add a task, edit its date/name, then complete it.
2. In Resources, add a fertiliser resource with 50 kg opening stock. Select Field A. Add an input requirement of 100 kg at an illustrative R12/kg and record the source of the quantity. These are demo figures, not an application recommendation.
3. Reserve 50 kg for Field A. The remaining requirement is 50 kg and its estimated purchase cost is R600. Financial Plan includes the remaining purchase estimate automatically. Avoid adding the same estimated purchase again as a manual budget item.
4. Receive 50 kg for Field A, total paid R600. It adds the stock, reserves it up to the field's shortage and records one expense. Record usage of 100 kg for Field A. Stock becomes zero, the requirement is fulfilled and actual spending remains R600.
5. Add a R200 transport expense. Home, Financial Plan and the notification bell show the 80% warning with R200 remaining. Edit it to R500: total spending becomes R1,100 and the warning shows R100 over budget. Correct it to zero: the spending warning disappears. Planned-cost warnings are separate.
6. For equipment at 245 hours with a service interval of 250 hours, log maintenance at 250 hours. The next threshold becomes 500 hours. A service cost creates one linked expense. Editing its actual amount in Financial Plan updates the service history amount too.
7. Refresh, export a backup and restore it. Verify records remain. Check seasonal information using valid coordinates and dates in the provider's forecast range. The app must show a useful error when the provider is unavailable.

## Behaviour and boundaries

- Reservations belong to a field and a stock item. They do not reduce physical stock; usage does. Other fields cannot consume reserved stock.
- Resource quantities are recorded in the resource's unit. Use kg consistently; the app does not convert bag units automatically.
- Requirement costs represent quantities still needed. Receipts record planned and actual purchase cost; usage does not charge again.
- Opening stock has no invented purchase cost. Add genuine historical expenses separately if needed.
- Editing opening quantities on an existing resource is blocked: record receipt or usage with explanatory notes. Movement history remains available when a field/resource is removed.
- Removing a field releases its reservations and removes its tasks/requirements, while retaining expense and usage history. Removing a resource also removes its active requirements/reservations.
- Calculator inputs can be saved per field. These estimates do not prescribe a rate or automatically reserve stock; the field input plan records the chosen requirement.
- Spending warnings update from current records, not a growing duplicate notification log. They remain visible on Home/Financial Plan even if marked read.
- Notifications are in-app, not SMS or background push. Records are still in the current browser, with manual backups. Accounts and cloud sync remain outside this scope.
- Vercel handlers are provided for both repository-root and frontend-root projects. A frontend-root project must include source files outside its root for the shared backend module.

## Verification

Run `npm test` and `npm run build`. CI additionally runs Chromium browser workflows using `tests/browser.cjs`, including mobile navigation and screenshots. The local restricted Windows environment could not launch a browser, so CI performs those checks instead.

Live Open-Meteo responded with 214 days of seasonal data during development. This is a regional forecast, not a guarantee or a soil recommendation. Live AI remains out of scope.
