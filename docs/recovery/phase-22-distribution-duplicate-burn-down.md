# Phase 22: Distribution Duplicate Burn-Down

## Outcome

Phase 22 safely removed one more real duplicate pair from the distribution domain:

- `src/backend/distribution/contentScheduler.js`

This reduced duplicate risk without widening scope into agents, revenue, platform cleanup, or frontend changes.

## Duplicate audit findings

The remaining Phase 21 duplicate targets were:

- `communityPublisher.js` / `communityPublisher.ts`
- `contentScheduler.js` / `contentScheduler.ts`
- `socialPublisher.js` / `socialPublisher.ts`

### What the audit showed

Direct runtime-facing imports still reference the `.js` specifier:

- `backend-server/worker.ts`
- `backend-server/events/subscribers.ts`

Both import:

- `../src/backend/distribution/contentScheduler.js`
  or
- `../../src/backend/distribution/contentScheduler.js`

Inside the distribution domain:

- `contentScheduler.ts` imports:
  - `./socialPublisher.js`
  - `./communityPublisher.js`

That means the important question was not "does the specifier say `.js`", but "does the repo still require the source `.js` file to exist at runtime".

## Duplicate removal decision

Removed:

- `src/backend/distribution/contentScheduler.js`

Why this one was selected:

- it is directly exercised by real backend runtime entry points (`worker.ts`, event subscribers)
- deleting it is a strong proof case: if source `.js` were still required, build/runtime checks would fail immediately

Why it was safe:

- `check:backend-boundaries` remained `PASS`
- `npx tsc -b` remained `PASS`
- `npm --prefix backend-server run build` remained `PASS`
- required frontend build and backend expo route/controller tests remained green outside sandbox
- direct import references to `contentScheduler.js` still exist, which proves the `.ts` implementation is now the authoritative source behind those specifiers

## Remaining duplicates

Still present in distribution:

- `src/backend/distribution/communityPublisher.js` / `.ts`
- `src/backend/distribution/socialPublisher.js` / `.ts`

They were not removed in this phase because:

- they are still referenced from `contentScheduler.ts`
- removing them would be a second runtime-affecting step in the same cycle without an additional narrower proof loop
- the safer move was to burn down one duplicate pair with clean proof, then document the remaining two

## Boundary checks

`check:backend-boundaries` still passes and now reports one fewer duplicate warning than before.

That means:

- the duplicate burn-down happened without boundary regression
- expo/platform protections stayed intact
