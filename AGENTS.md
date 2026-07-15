# ChefCito — AGENTS.md

## Commands

```bash
npm run dev          # next dev --turbopack
npm run build        # next build
npm run lint         # next lint
npm run typecheck    # tsc --noEmit
npm test             # jest
npm run test:watch   # jest --watch
npm run test:coverage # jest --coverage
```

Run in order: `typecheck -> lint -> test`.

## Architecture

- **Next.js 16** App Router with Turbopack dev server. All routes live under `src/app/` (no `(app)` route group despite README mentioning it).
- **TypeScript strict mode**. Path alias `@/*` → `./src/*`.
- **shadcn/ui** (default style, RSC enabled, "neutral" base, lucide icons). Components in `src/components/ui/`.
- **State**: Zustand stores (`src/lib/stores/`) + Valtio + SWR for server data fetching.
- **Database**: Mongoose models (`src/models/`) and native MongoDB driver singleton (`src/lib/mongo-init.ts`). `database-service.ts` wraps Mongoose for most CRUD.
- **Docker**: `docker-compose.yml` runs MongoDB 7.0 + mongo-express. Credentials: `admin` / `password` on port 27017.
- **Auth**: JWT + Google OAuth (`NEXT_PUBLIC_GOOGLE_CLIENT_ID`). Role-based access control in `src/lib/access-control.ts` (predefined roles: Owner, Admin, Staff, Waiter, Cashier, Kitchen Staff).
- **PayPhone**: "Cajita de Pagos" integration — client-side SDK loaded in root layout, backend routes under `src/app/api/payphone/`. Env vars: `PAYPHONE_TOKEN`, `PAYPHONE_STORE_ID`.
- **i18n**: Custom store-based. Locale files in `src/locales/` (`en.json`, `es.json`). Never re-export from barrel files — already exported via `src/lib/index.ts`.
- **Fonts**: PT Sans (body), Space Grotesk (headlines). Google Fonts loaded in root layout.
- **Font size scaling**: CSS classes `.font-size-small`, `.font-size-medium`, `.font-size-large` override rem-based sizes site-wide.

## Testing

- **Jest** with `ts-jest`, `testEnvironment: 'node'`. Tests in `src/__tests__/*.test.ts`.
- Tests mock Mongoose models via `jest.mock('@/models/...')` — no real DB needed for unit tests.
- `jest.setup.ts` loads `.env.local` and sets 30s global timeout.
- Coverage collected only for `src/app/api/payphone/**/*.ts` and `src/app/api/subscriptions/**/*.ts`.
- Import route handlers directly: `import { POST } from '@/app/api/payphone/confirm/route'`.
- There's a stale file `src/__tests__/asdasdsa.js` — ignore it.

## Env

Copy `.env.local.example` → `.env.local`. Required vars:

| Var | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `MONGODB_DB` | Database name (optional if embedded in URI) |
| `PAYPHONE_TOKEN` | PayPhone API token |
| `PAYPHONE_STORE_ID` | PayPhone store ID |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `NEXT_PUBLIC_BASE_URL` | Canonical app URL (used for PayPhone redirects) |

## Notes

- Package name in `package.json` is `"nextn"` (not "chefcito").
- `tsconfig.check.json` is a stale file ("Temp files deleted").
- `src/app/api/payphone/webhook/` exists but is not covered by tests.
- `src/lib/utils.ts` is a barrel that re-exports from `constants`, `types`, and `helpers` — import directly from `@/lib` instead.
