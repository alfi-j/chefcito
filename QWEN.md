# ChefCito - Project Context

## Project Overview

**ChefCito** is a modern, full-stack restaurant management system built with **Next.js 14+** (App Router). It provides a comprehensive suite of tools for restaurant operations including:

- **Point of Sale (POS)** - Intuitive order taking and payment processing interface
- **Kitchen Display System (KDS)** - Real-time order management for kitchen staff
- **Reports & Analytics** - Business insights and performance metrics with data visualization
- **Restaurant Management** - Menu, inventory, and staff management
- **User Management** - Role-based access control system
- **Payment Processing** - Cash and card payment handling (including PayPhone integration)
- **Mobile Responsive** - Works across all device sizes

### Architecture

The application follows a **monorepo-style architecture** within a single Next.js project:

- **Frontend**: React 18 with TypeScript, using Next.js App Router pattern
- **UI Layer**: Shadcn/ui component library with Tailwind CSS for styling
- **State Management**: Zustand (global state) + SWR (data fetching/caching) + Valtio (reactive state)
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based authentication with Google OAuth support
- **Internationalization**: Custom i18n implementation (English & Spanish)
- **Forms**: React Hook Form with Zod validation

## Tech Stack

### Core Framework
- **Next.js 16+** (App Router with Turbopack for development)
- **React 18.3** with TypeScript 5.9+
- **Tailwind CSS 3.4** for utility-first styling

### UI Components
- **Shadcn/ui** - Radix UI primitives with Tailwind
- **Lucide React** - Icon library
- **Recharts** - Data visualization and charts
- **Embla Carousel** - Carousel components
- **Custom fonts**: PT Sans (body), Space Grotesk (headlines)

### State & Data
- **Zustand** - Global state management
- **SWR** - Data fetching and caching
- **Valtio** - Reactive state management
- **Immer** - Immutable state updates

### Backend & Database
- **MongoDB** - Primary database
- **Mongoose 8.5** - ODM with schema validation
- **Next.js API Routes** - Serverless backend

### Authentication & Security
- **JWT (jsonwebtoken)** - Token-based auth
- **bcryptjs** - Password hashing
- **Google OAuth** - Google Identity Services integration

### Payment Processing
- **PayPhone** - Payment box integration (Cajita de Pagos)

### Form Validation
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **@hookform/resolvers** - Zod integration

## Project Structure

```
chefcito-main/
├── src/
│   ├── app/                 # Next.js 14+ app directory (file-based routing)
│   │   ├── (app)/          # Route group for authenticated pages
│   │   │   ├── kds/        # Kitchen Display System
│   │   │   ├── orders/     # Order management
│   │   │   ├── pos/        # Point of Sale interface
│   │   │   ├── profile/    # User profile settings
│   │   │   ├── reports/    # Business analytics & reports
│   │   │   └── restaurant/ # Restaurant configuration
│   │   ├── api/            # API routes (backend endpoints)
│   │   ├── login/          # Authentication page
│   │   ├── register/       # User registration
│   │   ├── thank-you/      # Payment success page
│   │   ├── error/          # Error handling page
│   │   ├── layout.tsx      # Root layout with providers
│   │   └── page.tsx        # Home (redirects to /login)
│   │
│   ├── components/         # Reusable React components
│   │   └── ui/            # Shadcn/ui base components
│   │
│   ├── lib/               # Utilities and business logic
│   │   ├── hooks/         # Custom React hooks
│   │   ├── stores/        # Zustand state stores
│   │   ├── access-control.ts     # Permission system
│   │   ├── constants.ts          # App-wide constants
│   │   ├── database-service.ts   # Database operations
│   │   ├── helpers.ts            # Utility functions
│   │   ├── mongo-init.ts         # MongoDB initialization
│   │   ├── swr-fetcher.ts        # SWR data fetcher
│   │   ├── types.ts              # TypeScript type definitions
│   │   └── utils.ts              # General utilities
│   │
│   ├── locales/           # Internationalization
│   │   ├── en.json        # English translations
│   │   └── es.json        # Spanish translations
│   │
│   └── models/            # Mongoose database models
│       ├── Category.ts     # Menu categories
│       ├── Customer.ts     # Customer data
│       ├── Inventory.ts    # Inventory tracking
│       ├── Invitation.ts   # User invitations
│       ├── MenuItem.ts     # Menu items
│       ├── Order.ts        # Order management
│       ├── Payment.ts      # Payment records
│       ├── Restaurant.ts   # Restaurant configuration
│       ├── Role.ts         # User roles & permissions
│       ├── Subscription.ts # Subscription management
│       ├── User.ts         # User accounts
│       └── Workstation.ts  # POS workstations
│
├── scripts/               # Utility scripts
├── public/                # Static assets
│
├── .env.local.example     # Environment variables template
├── docker-compose.yml     # MongoDB development setup
├── next.config.ts         # Next.js configuration
├── tailwind.config.ts     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
├── components.json        # Shadcn/ui configuration
└── package.json           # Dependencies and scripts
```

## Building and Running

### Prerequisites
- **Node.js 18+**
- **MongoDB** (local via Docker or MongoDB Atlas)

### Environment Setup

1. Copy the environment template:
```bash
cp .env.local.example .env.local
```

2. Configure `.env.local` with your settings:
```env
# MongoDB (local)
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=chefcito

# OR MongoDB Atlas
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chefcito

# PayPhone Payment Integration
PAYPHONE_TOKEN=your_api_token_here
PAYPHONE_STORE_ID=your_store_id_here

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Development

Start the development server with Turbopack:
```bash
npm run dev
```

Start with debug logging:
```bash
npm run dev:debug
```

### Production

Build the application:
```bash
npm run build
```

Start production server:
```bash
npm start
```

### Code Quality

Run ESLint:
```bash
npm run lint
```

Run TypeScript type checking:
```bash
npm run typecheck
```

### Database (Docker)

Start MongoDB and Mongo Express for local development:
```bash
docker-compose up -d
```

- MongoDB: `localhost:27017`
- Mongo Express UI: `http://localhost:8081`
  - Username: `admin`
  - Password: `password`

## Key Conventions

### TypeScript
- **Strict mode enabled** - All TypeScript strict checks enforced
- **Path aliases** - Use `@/*` to reference `src/*` (e.g., `@/components`, `@/lib`)
- **No emit** - TypeScript used for type-checking only; Next.js handles compilation

### Component Architecture
- **Server Components by default** - Use `'use client'` directive only when needed
- **Shadcn/ui patterns** - Components use Radix UI primitives with Tailwind CSS
- **Compound components** - Flexible, composable component APIs
- **Accessibility** - All components follow WAI-ARIA guidelines

### State Management
- **Zustand** - Global app state (cart, user settings, UI state)
- **SWR** - Server state and data fetching with automatic caching
- **Valtio** - Reactive state for complex nested objects
- **Local state** - useState/useReducer for component-specific state

### Data Fetching
- **SWR pattern** - All API data fetched via SWR with custom fetcher
- **Optimistic updates** - UI updates immediately, rolls back on error
- **Revalidation** - Automatic revalidation on focus/reconnect

### Database Models
- **Mongoose schemas** - All models defined in `src/models/`
- **Centralized exports** - `src/models/index.ts` exports all models
- **Validation** - Built-in Mongoose validation + custom validators

### API Routes
- **Route handlers** - Next.js App Router API routes (`app/api/**/route.ts`)
- **Error handling** - Consistent error responses with status codes
- **Authentication middleware** - Protected routes require valid JWT

### Internationalization
- **JSON-based** - Translation files in `src/locales/`
- **Supported languages**: English (en), Spanish (es)
- **Custom i18n** - Lightweight implementation without heavy libraries

### Styling
- **Tailwind CSS** - Utility-first approach
- **CSS Variables** - Design tokens via CSS custom properties
- **Shadcn theming** - Semantic color names (primary, secondary, muted, etc.)
- **Responsive** - Mobile-first with custom breakpoints (includes 3xl: 1920px)

## Testing

The project includes Jest and React Testing Library for testing:

```bash
# Run tests (when test files exist)
npm test
```

Test files typically colocated with source code or in `__tests__` directories.

## Important Files

| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root layout with auth provider, font loading, PayPhone script |
| `src/lib/stores/` | Zustand stores for global state |
| `src/lib/database-service.ts` | Centralized database operations |
| `src/lib/access-control.ts` | Role-based permission system |
| `src/models/index.ts` | Centralized Mongoose model exports |
| `components.json` | Shadcn/ui component registry configuration |

## Development Notes

### Path Aliases
Use the `@/*` alias for all internal imports:
```typescript
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/use-auth';
import type { Order } from '@/models/Order';
```

### Environment Variables
- **Server-only**: `MONGODB_URI`, `PAYPHONE_TOKEN`, `PAYPHONE_STORE_ID` (never prefix with `NEXT_PUBLIC_`)
- **Client-accessible**: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_BASE_URL`

### Database Connections
MongoDB connection is initialized in `src/lib/mongo-init.ts` and cached to prevent connection pool exhaustion in development.

### Payment Flow
PayPhone integration uses the "Cajita de Pagos" widget. The script is loaded asynchronously in the root layout. Redirect URLs are derived from `NEXT_PUBLIC_BASE_URL`.

### Debug Mode
Enable debug logging with:
```bash
npm run dev:debug
```

Uses the `debug` package with `chefcito:*` namespace for structured logging.

## Common Tasks

### Adding a New API Route
Create `src/app/api/your-route/route.ts`:
```typescript
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  return NextResponse.json({ data: [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ created: body }, { status: 201 });
}
```

### Adding a New Database Model
Create `src/models/YourModel.ts`:
```typescript
import mongoose from 'mongoose';

const yourModelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  // ... fields
}, { timestamps: true });

export const YourModel = mongoose.models.YourModel || 
  mongoose.model('YourModel', yourModelSchema);
```

Then export it from `src/models/index.ts`.

### Adding UI Components
Use Shadcn CLI to add components:
```bash
npx shadcn@latest add component-name
```

Components are added to `src/components/ui/` and can be customized.

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running (`docker-compose ps`)
- Check `MONGODB_URI` in `.env.local`
- For local: `mongodb://localhost:27017`
- For Atlas: Full connection string with credentials

### Build Errors
- Run `npm run typecheck` to identify TypeScript errors
- Run `npm run lint` to identify ESLint errors
- Ensure all imports use correct paths with `@/*` alias

### PayPhone Integration
- Script loads asynchronously from CDN
- Verify `PAYPHONE_TOKEN` and `PAYPHONE_STORE_ID` are set
- Check browser console for script load confirmation

## License

MIT License - see LICENSE file for details.

## Support

- Email: support@chefcito.com
- Join Slack community for developer support

---

## PayPhone Payment Integration - Analysis & Fixes Applied

### Terminal Log Analysis (Session: April 10, 2026)

#### Problems Identified from Production Logs

```
PROBLEM 1: DUPLICATE SUBSCRIPTIONS
chefcito:payphone:init [Init] Creating pending subscription clientTransactionId: SUB-1775861284190
chefcito:payphone:init [Init] Creating pending subscription clientTransactionId: SUB-1775861284195 (+5ms)
→ Two pending subscriptions created 5ms apart (React StrictMode + double-click)

PROBLEM 2: PAYPHONE CONFIRM API RETURNS 500
chefcito:payphone:thankyou [ResolvePayment] Confirm API failed with status: 500 +947ms
chefcito:payphone:thankyou [ResolvePayment] Resolved code: '' (empty)
→ PayPhone Confirm API rejected request (likely due to "id": 0 parameter)

PROBLEM 3: WEBHOOK NEVER CALLED
→ NO logs of `chefcito:payphone:webhook` in entire session
→ Webhook URL not configured in PayPhone dashboard

PROBLEM 4: EXCESSIVE POLLING (20 calls, all returning "pending")
GET /api/subscriptions/status?clientTransactionId=SUB-xxx (x20 in 60s)
→ Polling worked but subscription never activated (no webhook + Confirm API failed)
```

#### Fixes Applied

| Fix | File | Description |
|-----|------|-------------|
| **Idempotency Check** | `src/app/api/payphone/init/route.ts` | Before creating new subscription, checks if a pending one exists within 2 minutes. Returns existing if found. |
| **Double-Click Protection** | `src/components/subscription/payphone-payment-box.tsx` | Added `isInitializing` state that disables button during API call. Prevents rapid double-clicks. |
| **Confirm API Timeout** | `src/app/thank-you/page.tsx` | Added AbortController with 5s timeout. Prevents hanging fetches. |
| **Confirm API Retry** | `src/app/thank-you/page.tsx` | Retry logic: 2 attempts with 1s delay. Handles transient network errors. |
| **Error Body Logging** | `src/app/thank-you/page.tsx` | Now logs full response body on Confirm API failure (not just status code). |
| **Polling Improvements** | `src/components/payment/payment-status-poll.tsx` | Added attempt logging, status display in UI, early exit for `cancelled` state. |
| **Webhook Reminder** | `src/app/api/payphone/init/route.ts` | Logs webhook URL reminder after 30s of server start. |

#### Current Payment Flow (After Fixes)

```
1. User clicks "Subscribe" → isInitializing = true (prevents double-click)
   ↓
2. POST /api/payphone/init
   → Checks for recent pending subscription (idempotency)
   → If found: returns existing clientTransactionId
   → If not: creates new pending subscription
   ↓
3. PayPhone widget processes payment
   ↓
4a. [PRIMARY] PayPhone → POST /api/payphone/webhook
    → Activates subscription if statusCode = "3"
    → Idempotent: safe to receive multiple times
    ↓
4b. [FALLBACK] Browser → /thank-you?clientTransactionId=SUB-xxx
    → Server: Calls PayPhone Confirm API (with 5s timeout + 2 retries)
    → If Confirm API succeeds: activates subscription
    → If Confirm API fails: uses URL params as fallback
    → Client: PaymentStatusPoll polls every 3s for 60s
    ↓
5. Redirect to /profile?payment=success&txId=SUB-xxx
   → Profile: Triple-refresh (subscription + user + store) with 500ms delay
   ↓
6. [SAFETY NET] GET /api/subscriptions/reconcile
   → Finds pending > 10 min → queries PayPhone → activates if approved
```

#### CRITICAL: Action Required for Production

**The webhook URL MUST be configured in the PayPhone dashboard:**

```
Webhook URL: https://TU-DOMINIO.com/api/payphone/webhook
```

Without this configuration:
- PayPhone will NOT send server-to-server notifications
- Subscription activation depends entirely on browser redirect to /thank-you
- If user closes browser before redirect completes, subscription stays `pending` forever
- The Confirm API may return 500 if `id: 0` is not accepted by PayPhone

**To verify webhook is working:**
1. Complete a test payment in production
2. Check server logs for `chefcito:payphone:webhook`
3. If no webhook logs appear, the URL is not configured in PayPhone's dashboard

#### Known Limitations

1. **PayPhone Confirm API returns 500**: The API may reject requests with `"id": 0` when `transactionId` is not available in URL params. This is a PayPhone-side issue. The workaround is the webhook endpoint (primary activation path).

2. **Polling may not help if webhook is not configured**: If PayPhone never sends the webhook AND the Confirm API fails, polling will just keep checking a `pending` subscription until timeout.

3. **No real-time webhook monitoring**: The current webhook reminder is time-based (30s after server start). In production, you'd want to track actual webhook call counts.

#### Debugging Commands

```bash
# Enable all PayPhone debug logs
DEBUG=chefcito:payphone:* npm run dev

# Check for webhook calls
DEBUG=chefcito:payphone:webhook npm run dev

# Check payment initialization
DEBUG=chefcito:payphone:init npm run dev

# Run reconciliation manually (while server is running)
curl http://localhost:3000/api/subscriptions/reconcile
```

#### Testing Checklist

- [ ] Configure webhook URL in PayPhone dashboard
- [ ] Complete a test payment with real credentials
- [ ] Verify webhook logs appear in server console
- [ ] Verify subscription status changes to `active` in database
- [ ] Verify user membership changes to `pro` in database
- [ ] Verify profile page shows Pro status without manual refresh
- [ ] Test double-click protection (should not create duplicate subscriptions)
- [ ] Test reconciliation endpoint with manually created pending subscription
