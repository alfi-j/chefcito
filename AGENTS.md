# ChefCito — AGENTS.md

## Commands

```bash
npm run dev              # next dev --turbopack
npm run build            # next build
npm run typecheck        # tsc --noEmit
npm run lint             # next lint
npm test                 # jest
npm run test:watch       # jest --watch
npm run test:coverage    # jest --coverage
```

Run in order: `typecheck` → `lint` → `test`.

Less common: `npm run dev:debug` (cross-env DEBUG=chefcito:\*), `npm run validate-subscription`.

## Architecture

- **Next.js 16** App Router with Turbopack. All routes in `src/app/` — no `(app)` route group despite stale README.
- **TypeScript strict**, path alias `@/*` → `./src/*`.
- **shadcn/ui** (default style, RSC, neutral base, lucide icons) in `src/components/ui/`.
- **State**: Zustand stores (`src/lib/stores/`) + Valtio + SWR data fetching (`src/lib/swr-fetcher.ts`). Permissions via `src/lib/hooks/use-permissions.ts`.
- **Database**: Mongoose models (`src/models/`) + native MongoDB driver singleton (`src/lib/mongo-init.ts`). `database-service.ts` wraps Mongoose for most CRUD.
- **Docker**: `docker-compose.yml` runs MongoDB 7.0 + mongo-express. Auth: `admin` / `password`, port 27017.
- **Auth**: JWT + Google OAuth. RBAC in `src/lib/access-control.ts` (Owner, Admin, Staff, Waiter, Cashier, Kitchen Staff).
- **PayPhone**: "Cajita de Pagos" — client SDK loaded in root layout, backend under `src/app/api/payphone/`. Env vars: `PAYPHONE_TOKEN`, `PAYPHONE_STORE_ID`.
- **i18n**: `react-i18next` (i18next + `initReactI18next`). Client init in `src/lib/i18n.ts`, provider in `src/components/providers.tsx`. Locale files `src/locales/{en,es}.json`, imported directly with `@/locales/...`. Language switcher uses `changeLanguage` (persists to localStorage `language`).
- **Report exports**: client-side engine in `src/lib/export/exporter.ts` (CSV/XLSX/PDF via `xlsx`, `jspdf`, `jspdf-autotable`). `ExportButton` dropdown takes any dataset. Report classes in `src/components/reports/` backed by `/api/reports` (transactions, sellers, items, payments, z-report, kitchen + summary).
- **Tax / SAF-T**: dynamic engine in `src/lib/tax/` — `engine.ts` dispatches by country to generators in `src/lib/tax/saft/` via `registry.ts` (Ecuador implemented). UI: `TaxDeclarationPanel` under `/reports`. Config persists to localStorage `chefcito-tax-declaration-config`.
- **Fonts**: PT Sans (body), Space Grotesk (headlines) via Google Fonts in root layout.
- **Routes**: POS (`/pos`), KDS (`/kds`), orders, reports, restaurant, profile, login, register, thank-you (PayPhone success).
- **Components**: billing/, subscription/, kds/, layout/, login/, orders/, payment/, pos/, reports/, restaurant/, ui/, users/.

## Testing

- **Jest** with `ts-jest`, `testEnvironment: 'node'`. Config in `jest.config.cjs` (`.cjs` required because `package.json` has `"type": "module"`).
- Tests in `src/__tests__/*.test.ts`.
- Mongoose models mocked via `jest.mock('@/models/...')` — no real DB needed.
- `jest.setup.ts` loads `.env.local`, mocks `debug`, sets 30s timeout.
- Coverage collected for `src/app/api/payphone/**/*.ts` and `src/app/api/subscriptions/**/*.ts`.
- Import handlers directly: `import { POST } from '@/app/api/payphone/confirm/route'`.
- Stale file `src/__tests__/asdasdsa.js` — ignore.

## Env

Copy `.env.local.example` → `.env.local`.

| Var | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `MONGODB_DB` | DB name (optional if in URI) |
| `PAYPHONE_TOKEN` | PayPhone API token |
| `PAYPHONE_STORE_ID` | PayPhone store ID |
| `RECONCILE_ADMIN_KEY` | Admin key for the subscription reconciliation job (`x-admin-key` header) |
| `NEXT_PUBLIC_BASE_URL` | Canonical app URL (PayPhone redirects) |

## Notes

- `package.json` name is `"nextn"`, not "chefcito".
- `tsconfig.check.json` is stale (content: `// Temp files deleted`).
- `scripts/` is gitignored (local dev utilities only).
- Subscription activation flow: `/api/payphone/init` (owner-only, creates pending sub + returns widget config) → PayPhone widget → `/thank-you` server resolver + `/api/payphone/confirm` (public, idempotent) → `/api/subscriptions/status` polling. Recovery job `/api/subscriptions/reconcile` (needs `x-admin-key`). PayPhone has NO webhooks.
- `src/lib/utils.ts` is a barrel re-exporting constants, types, helpers — import from `@/lib` directly.
