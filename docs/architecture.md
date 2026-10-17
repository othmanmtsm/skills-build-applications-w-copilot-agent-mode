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

- Presentation tier decision: Build the React screens to consume the backend contract, with loading, empty, and error states that match the API data shape and use accessible roles like `status` and `alert` for feedback.
- Logic tier decision: Keep Express route logic focused on request validation, resource creation, and derived behavior; let the service layer calculate points, leaderboard totals, and suggestion rankings instead of encoding that logic in the routes.
- Data tier decision: Use Mongoose schemas to enforce required fields, default values, and relationships between users, teams, activities, and workouts, while keeping the seed script idempotent and safe to run repeatedly.
- Activity tracking approach: Activities should reference an existing user and team, store the required metadata (`type`, `minutes`, `occurredAt`), and compute `points` from the submitted duration while rejecting malformed IDs with a client-safe 4xx instead of a 500 cast error.
- Team management approach: Teams require `name` and `mascot` and keep a `members` array with default empty values; creation and listing should expose member IDs without leaking unrelated records.
- Leaderboard approach: Aggregate team totals from activities, sort descending by total points, and assign a 1-based rank so the board can be rendered deterministically.
- Workout suggestions approach: Match the target user by email, inspect that user's recent activity or goal, and return workouts whose focus matches the strongest pattern, with a human-readable `reason` explaining the recommendation. Unknown email addresses should return a deliberate 4xx.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
  - Current failure meaning: schema validation is incomplete. The model layer does not yet require the required fields for `User`, `Team`, `Activity`, and `Workout`, even though the seed script and DTO data shape are expected to be present.
- API command: `npm run test:api --prefix octofit-tracker/backend`
  - Current failure meaning: the logic tier is still stubbed or incomplete. Invalid input is returning `501` instead of a 4xx, leaderboard aggregation is empty, and workout recommendations do not yet match the seeded user behavior.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
  - Current failure meaning: the presentation tier still displays the placeholder “Implementation pending” markup and never reaches the real fetching, empty-state, loading-state, or alert logic required by the app contract.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
  - Run after the data and API contracts pass to verify TypeScript compilation and route/service correctness.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
  - Run after the UI contract passes to confirm the React app compiles and bundles cleanly against the final API contract.
