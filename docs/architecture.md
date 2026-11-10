# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep route-specific React components focused on rendering and user interaction. Use the shared API client for relative `/api` requests, and provide accessible loading, empty, and error states for each capability. Do not access MongoDB or implement business rules in the frontend.
- Logic tier decision: Keep Express routes thin and delegate capability behavior to `octofitService.ts`. Validate request data and references before persistence, and return deliberate 4xx responses for invalid input or missing records rather than leaking cast or validation failures as 500 responses.
- Data tier decision: Use Mongoose schemas as the source of truth for required fields, defaults, and references. Keep seed data representative and idempotent; seeding must preserve unrelated records and existing valid relationships.
- Activity tracking approach: Accept `userId`, `teamId`, `type`, and positive `minutes`; validate both IDs and confirm the referenced user and team exist. Store references, derive points from minutes using one documented rule (`points = minutes`), and set `occurredAt` on the server.
- Team management approach: Require a non-empty name and mascot, default members to an empty array, and persist the supplied member references without changing the submitted team name or mascot.
- Leaderboard approach: Sum activity points by team, sort from highest total to lowest, and add 1-based ranks to the returned entries.
- Workout suggestions approach: Find the user by email, then choose suggestions using the user's fitness goal and recent activity. Return a reason that names the matching goal or activity; return a deliberate 4xx when no user matches.

## Test plan

Run the focused contract test after changing its tier, then run both build checks before considering the implementation complete. A failed contract test identifies a behavior or boundary violation; a failed build identifies a TypeScript or bundling problem not necessarily covered by the contracts.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`: verifies model requirements, defaults, references, and idempotent seed behavior. Failures point to schema or seed-data issues.
- API command: `npm run test:api --prefix octofit-tracker/backend`: verifies request validation, persistence, response shapes, leaderboard ordering, and workout recommendations. Failures point to route/service behavior or its API contract.
- Frontend command: `npm test --prefix octofit-tracker/frontend`: verifies API-backed rendering, request paths, and accessible loading, empty, and error states. Failures point to presentation behavior or API-client integration.
- Backend build command: `npm run build --prefix octofit-tracker/backend`: verifies backend TypeScript types; failures point to compile-time issues.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`: verifies frontend TypeScript and Vite production bundling; failures point to compile-time or asset/bundling issues.
