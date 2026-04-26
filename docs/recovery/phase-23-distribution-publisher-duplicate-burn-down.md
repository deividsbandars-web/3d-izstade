# Phase 23: Distribution Publisher Duplicate Burn-Down

## Outcome

Phase 23 safely removed the next publisher duplicate from the distribution domain:

- `src/backend/distribution/socialPublisher.js`

This continued the controlled duplicate burn-down started in Phase 21/22 without widening scope into platform, agents, revenue, or frontend work.

## Duplicate audit findings

Audited:

- `src/backend/distribution/socialPublisher.*`
- `src/backend/distribution/communityPublisher.*`
- `src/backend/distribution/contentScheduler.ts`
- `backend-server/worker.ts`
- `backend-server/events/subscribers.ts`
- backend package scripts

What the audit showed:

- real backend runtime entry points still import:
  - `contentScheduler.js`
- `contentScheduler.ts` still imports:
  - `./socialPublisher.js`
  - `./communityPublisher.js`
- there were no extra dynamic imports or script-level special cases for `socialPublisher.js`
- `socialPublisher.ts` is the maintained, typed implementation

That made `socialPublisher.js` the best next removal candidate.

## Duplicate removal decision

Removed:

- `src/backend/distribution/socialPublisher.js`

Why this was safe:

- `contentScheduler.ts` kept the existing `.js` specifier
- the backend still built successfully after removal
- root TypeScript build still passed
- frontend build and required backend expo tests still passed outside sandbox
- duplicate warnings dropped exactly by one item, with `communityPublisher.js` still reported

This proves the `.ts` implementation is authoritative and the `.js` file was a legacy duplicate.

## Remaining duplicate

Still present in distribution:

- `src/backend/distribution/communityPublisher.js` / `.ts`

It was left in place because this phase only needed one safe publisher removal, and the cleaner proof target was `socialPublisher.js`.
