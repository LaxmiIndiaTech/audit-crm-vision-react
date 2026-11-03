<div align="center">

# CRM Vision (Audit / Branch Operations Dashboard)

Lightweight React + TypeScript admin panel for managing branches, master data, cash & cheque norms, scorecards and operational scoring rules.

</div>

## Key Features

- Phone + OTP (mock) authentication (no Google OAuth, roles: `admin`, `employee`).
- Role‑based protected routes & sidebar navigation.
- Master Data: Branches, States, Cities (create/update, pagination, soft restrictions — states/cities no delete as per current scope).
- Employees management with inline edit dialog & pagination.
- Cash & Cheque Norms module (list + CSV upload + detail view placeholder).
- Scorecard module (branch + month wise; visitor comment & immediate action editing via dialog; per month/branch storage in memory).
- Scoring Master (admin) to define dynamic rules (day difference ranges → score via slider) for cheque processing (received vs deposited dates).
- Branch Inspection Report Card section on Admin Dashboard.
- Global UI components (shadcn-ui/Radix based) and Tailwind CSS design system.
- Client-side pagination (consistent page size 10) across major listing pages.

## Directory Overview

```
src/
	components/       Reusable UI + layout (Sidebar, Topbar, dialogs, form controls)
	contexts/         Auth context (OTP flow, user + role state)
	pages/            Feature pages (Branches, Employees, Scorecard, ScoringMaster, etc.)
	types/            Shared TypeScript interfaces (branch, master data, scoring rules)
	lib/              Utilities (cn, helpers)
```

## Auth & Roles

| Role | Access |
|------|--------|
| admin | Full access: all master data, employees, cash norms, scoring, scorecard |
| employee | Limited: dashboard, branches (read), basic operational views |

OTP is simulated (no backend). Replace the mock methods in `AuthContext` when integrating a real API.

## Scoring Logic (Concept)

Scoring rules (Scoring Master) define inclusive day ranges between cheque `received_date` and `deposited_date`, each mapped to a score (0–10). Example matching logic:

```ts
interface CashChequeScoringRule { minDays: number; maxDays: number; score: number }
const rule = rules.find(r => diffDays >= r.minDays && diffDays <= r.maxDays) || { score: 0 };
record.score = rule.score;
```

## Getting Started

Requirements: Node 18+ (or Bun), pnpm/npm (project uses Bun lockfile currently).

```bash
git clone <repo-url>
cd crm-vision-react
npm install   # or bun install
npm run dev   # or bun dev
```

App runs on: http://localhost:5173

## Scripts

| Script | Purpose |
|--------|---------|
| `dev` | Start Vite dev server |
| `build` | Production build |
| `preview` | Preview production build |

## Technology Stack

- React + TypeScript + Vite
- shadcn-ui (Radix primitives) + Tailwind CSS
- lucide-react icons
- In‑memory state (no backend yet) with modular context

## Current Limitations / TODO

- All data is ephemeral (page refresh resets). Introduce persistence (API or localStorage) for: branches, scorecard month data, scoring rules.
- Cash & Cheque Norms: scoring not yet auto-applied; integrate rules to compute a per-record score.
- Access control is front-end only; harden once backend exists.
- Remove legacy unused ticket/customer types when backend contracts stabilize.
- Add export (CSV / Excel) for lists & scorecard.
- Add tests (unit + component) and CI pipeline.

## Suggested Next Integrations

1. API Layer: Introduce a thin data service (REST or GraphQL) + react-query for caching.
2. Persistence for Scoring Master + Scorecard.
3. Automatic score calculation in Cash Norms list (display derived metric & color scale).
4. Audit logging pipeline (persist actions currently mocked on dashboard).
5. Role management UI (change user roles, deactivate users).

## Contributing

1. Create a feature branch: `git checkout -b feature/your-change`  
2. Commit with conventional messages: `feat(scorecard): add export button`  
3. Push & open PR.

## Licensing

Internal project (no explicit OSS license yet). Add a LICENSE file if external sharing is planned.

---
Maintained by the team – update this README whenever a new module or architectural change ships.
