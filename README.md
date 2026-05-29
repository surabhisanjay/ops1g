# Gharpayy Ops — Arena Infrastructure

CRM and operations console for leads, tours, follow-ups, inventory pressure, and revenue. Built with React 19, TanStack Router, Zustand, Radix UI, and Tailwind CSS.

## Quick start

```bash
npm install
npm run dev
```

Open the URL Vite prints (often `http://localhost:5173`). Use the **role selector** in the sidebar to switch between Flow Ops, TCM, HR, and Owner views.

Other scripts:

| Command | Purpose |
|---------|---------|
| `npm run build` | Production build |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |

## Roles & navigation

| Role | Sidebar highlights |
|------|-------------------|
| **Flow Ops** | Today, Leads, Calendar, **Heatmap**, Supply Hub, … |
| **TCM** | Today, My Tours, Follow-ups, Calendar, … |
| **HR / Leadership** | War Room, Revenue, **Heatmap**, Funnel, Zones, … |
| **Owner** | Owner Home, Rooms, Tours, Insights, … |

**Heatmap** (`/heatmap`) — demand vs supply by area (leads, live tours, conversion, vacancy). Available in the sidebar for **Flow Ops** and **HR**.

You can also open Heatmap via **⌘K / Ctrl+K** → “Demand heatmap”, or the keyboard chord **`g` then `m`**.

## Recent features

### Lead score explainer

- **Where:** Lead drawer header (`LeadControlPanel`) — **?** next to the confidence bar  
- **What:** Popover shows base score → live score, intent band (hot/warm/cold), and factor deltas (silence, follow-ups, move-in, tours, etc.)  
- **Logic:** `liveConfidenceBreakdown()` in `src/lib/engine.ts`, aligned with `liveConfidence()`

### Live tour status

- **Where:** `/calendar`, `/heatmap` — **Live tour status** bar at the top of each page  
- **What:** Counts for Live now, Upcoming, Late / confirm, Post-tour pending; calendar tour events include live labels in the title  
- **Heatmap:** Per-area **Live tours** and **Post-tour** stats on each area card  
- **Logic:** `tourLiveStatus()` + `LiveTourStatusBar` component

### MRR pipeline funnel

- **Where:** Dashboard `/` — section below “Do this next”  
- **What:** Funnel by lead stage (`new` → `booked`) with lead count and pipeline MRR (sum of monthly budgets per stage)  
- **Logic:** `mrrPipelineFunnel()` in `src/lib/engine.ts` (pipeline exposure, not closed revenue — see **Revenue** for bookings)

### Bulk overdue follow-ups

- **Lead drawer → Control tab:** Banner when team follow-ups are overdue; chips to open leads; **Bump all overdue to tomorrow** (10:00, high priority)  
- **Add lead → Bulk paste tab** (`/leads/add`): Table of overdue items with select-all and **Bump selected to tomorrow**  
- Original bulk paste import (parse spreadsheet / WhatsApp dumps) unchanged below the overdue block

## Other entry points

| Feature | Route / access |
|---------|----------------|
| Dashboard | `/` |
| Leads | `/leads` |
| Add lead (Quick Add, single, bulk paste) | `/leads/add` |
| Calendar | `/calendar` |
| Tours | `/tours` |
| Follow-ups | `/follow-ups` |
| Revenue (closed MRR) | `/revenue` |
| Command palette | ⌘K / Ctrl+K |

## Keyboard shortcuts

Chord: press **`g`**, then within 1.5s:

| Key | Destination |
|-----|-------------|
| `d` | Dashboard |
| `l` | Leads |
| `m` | Heatmap |
| `t` | Today |
| `v` | Revenue |
| `o` | Tours |
| `f` | Follow-ups |
| … | See `src/components/KeyboardShortcuts.tsx` |

With a lead selected in the drawer: **`c`** log call, **`w`** WhatsApp, **`n`** new follow-up.

## Tech stack

- React 19 + TypeScript  
- TanStack React Router  
- Zustand (`src/lib/store.ts`, CRM 10x store)  
- Radix UI + Tailwind CSS  
- Vite 7  

## Deployment

Cloudflare Workers deploy uses `wrangler.jsonc` and `dist/client` static assets. See `SUBMISSION_PACKAGE.md` for deployment notes.

## Branch

Feature work for score explainer, live tours, MRR funnel, bulk overdue, and sidebar Heatmap: `cursor/lead-score-tours-mrr-bulk-features`.
