# ZKFL — Zero-Knowledge Fantasy League

A privacy-preserving fantasy football platform built on the [Aleo](https://aleo.org) blockchain. Users draft private teams, compete in on-chain contests, and have scores verified through zero-knowledge proofs — without ever revealing their lineup until after the match resolves.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Smart Contracts](#smart-contracts)
- [Backend API](#backend-api)
- [Oracle Service](#oracle-service)
- [Frontend App](#frontend-app)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [End-to-End Flow](#end-to-end-flow)
- [Privacy Model](#privacy-model)
- [Fantasy Scoring Formula](#fantasy-scoring-formula)
- [Deployment](#deployment)

---

## Overview

ZKFL enables fantasy football leagues where:

- **Lineups are private** — your team is committed on-chain as a hash; nobody sees your picks until scoring
- **Scores are provable** — computation is verified by ZK proof; no trust in the operator
- **Prizes are real** — entry fees and payouts use native Aleo credits (no external tokens)
- **No custody risk** — user keys never leave the wallet; the platform never holds private keys

The system consists of four Aleo smart contracts, a Node.js/Express backend, a Next.js frontend, and an off-chain oracle service that feeds match statistics to the chain.

---

## Architecture

```
User (Browser + Aleo Wallet)
  │
  ▼
┌─────────────────────────────────────────┐
│  Next.js Frontend  (port 3000)          │
│  Wallet: Leo / Shield / Fox / Puzzle    │
│  Routes: /, /match/[id], /contest/[id] │
└────────────────┬────────────────────────┘
                 │ REST
  ▼
┌─────────────────────────────────────────┐
│  Express Backend  (port 3001)           │
│  Auth · Matches · Contests · Entries   │
└────────────────┬────────────────────────┘
                 │ HTTPS
  ▼
┌─────────────────────────────────────────┐
│  Supabase  (PostgreSQL)                 │
│  clubs · players · matches · contests  │
│  entries · users · player_match_stats  │
└─────────────────────────────────────────┘

Oracle Service  (scripts)
  ├── seed-match.ts        generate demo fixture
  ├── setup-match-onchain  register match + prices on-chain
  ├── submit-to-chain      push stats → resolve match
  └── distribute-prizes    pay winners from escrow

Aleo Testnet  (smart contracts)
  ├── zkfl_match.aleo       match registry + contest creation
  ├── zkfl_team_v2.aleo     private team drafting + commitment
  ├── zkfl_scoring_v2.aleo  oracle stat submission + ZK scoring
  └── zkfl_prize_v2.aleo    entry fee escrow + prize payouts
       └── credits.aleo     native Aleo credits
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | [Leo](https://developer.aleo.org/leo/) (Aleo ZK programs) |
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Wallet Integration | `@provablehq/aleo-wallet-adaptor-react` |
| Backend | Express 5, TypeScript, Node.js |
| Database | Supabase (PostgreSQL) |
| Oracle | Node.js, TypeScript, `tsx`, Leo CLI subprocess |
| HTTP Client | `axios` (oracle), native `fetch` (frontend) |

---

## Project Structure

```
zkfl/
├── contracts/
│   ├── zkfl_match/          Leo: match registry & contest creation
│   ├── zkfl_team/           Leo: private team drafting (use v2)
│   ├── zkfl_scoring/        Leo: oracle stats + ZK scoring (use v2)
│   └── zkfl_prize/          Leo: entry fees + prize payouts (use v2)
├── app/                     Next.js frontend
│   ├── app/
│   │   ├── page.tsx                 Homepage — match listing
│   │   ├── match/[id]/page.tsx      Match detail + contests
│   │   ├── match/[id]/create/       Create private contest
│   │   ├── contest/[id]/page.tsx    Contest + team builder + leaderboard
│   │   ├── my/page.tsx              User profile & entries
│   │   ├── components/              Navbar, TeamBuilder, PitchView, Providers
│   │   ├── hooks/useAleoTransaction.ts
│   │   ├── lib/aleo.ts              Input formatters, PROGRAMS constant
│   │   ├── lib/api.ts               Typed REST client
│   │   └── types.ts                 All TypeScript interfaces
│   └── package.json
├── server/
│   ├── src/
│   │   ├── index.ts                 Express app entry
│   │   ├── routes/auth.ts
│   │   ├── routes/matches.ts
│   │   ├── routes/contests.ts
│   │   ├── routes/players.ts
│   │   ├── db/schema.sql            Supabase schema
│   │   ├── db/seed.ts               Demo data population
│   │   └── lib/aleo-verify.ts       Tx verification helper
│   └── package.json
├── oracle/
│   ├── src/
│   │   ├── seed-match.ts            Generate demo fixture JSON
│   │   ├── compute-fantasy.ts       FPL scoring formula
│   │   ├── setup-match-onchain.ts   Admin on-chain setup
│   │   ├── submit-to-chain.ts       Push stats + resolve
│   │   └── distribute-prizes.ts     Prize payout script
│   ├── data/                        Generated fixture data
│   └── package.json
├── E2E-WALKTHROUGH.md
└── plan.md
```

---

## Smart Contracts

### Contract Dependency Graph

```
credits.aleo (native)
  └── zkfl_prize_v2.aleo    entry fee escrow + payouts
zkfl_match.aleo             match registry
  └── zkfl_team_v2.aleo     team drafting + commitment
        └── zkfl_scoring_v2.aleo   scoring + leaderboard
```

---

### `zkfl_match.aleo` — Match Registry

Manages the on-chain registry of matches and contests.

**Key Structs**

| Struct | Fields |
|---|---|
| `MatchInfo` | `home_club: u32`, `away_club: u32`, `kickoff_block: u32`, `is_active: bool` |
| `ContestInfo` | `match_id: field`, `entry_fee: u128`, `max_entries: u32`, `prize_split: u32`, `contest_type: u8`, `deadline_block: u32`, `creator: address`, `is_open: bool` |

**Mappings**: `matches`, `contests`, `contest_entry_count`, `invite_codes`

**Admin Transitions**

| Function | Description |
|---|---|
| `register_match(match_id, home, away, kickoff_block)` | Register a match |
| `create_contest(match_id, fee, max, split, type, deadline, nonce)` | Create a public contest; returns deterministic `contest_id` hash |
| `create_user_contest(...)` | Create invite-only private contest (2–10 players) |
| `close_contest(contest_id)` | Disable new entries |

> Contest IDs are deterministic: `BHP256(ContestSeed { match_id, creator, fee, nonce })`, enabling off-chain lookup without querying the chain.

---

### `zkfl_team_v2.aleo` — Private Team Drafting

Handles private team submission with ZK commitment.

**Key Structs**

| Struct | Fields |
|---|---|
| `TeamData` | 16 player slots: `gk`, `def_0`–`def_4`, `mid_0`–`mid_4`, `fwd_0`–`fwd_2`, `bench_1`, `bench_2`, `captain_id`, `vice_captain_id` |
| `TeamRecord` | Private record owned by user's wallet; contains full `TeamData` + `team_hash` |

**Mappings**: `team_commitments`, `salary_caps`, `player_prices`, `player_clubs`, `match_clubs`

**Admin Transitions**

| Function | Description |
|---|---|
| `set_player_price(match_id, player_id, price)` | Set player salary for a match |
| `set_player_club(player_id, club_id)` | Assign player to club |
| `set_match_clubs(match_id, home_id, away_id)` | Register home/away clubs for a match |
| `set_salary_cap(contest_id, cap)` | Set total budget per team |

**User Transition**

```
draft_team(contest_id, match_id, team: TeamData, formation) → TeamRecord
```

Validates:
- Sum of 16 player prices ≤ salary cap
- Home players: 3–10 (min 3 from each club)
- Stores `team_hash` commitment on-chain
- Returns encrypted `TeamRecord` to wallet — your lineup is private

---

### `zkfl_scoring_v2.aleo` — Oracle Stats + ZK Scoring

Receives stats from the oracle and lets users prove their score.

**Mappings**: `player_points`, `player_minutes`, `leaderboard`, `match_resolved`

**Oracle Transitions**

| Function | Description |
|---|---|
| `submit_player_stats(match_id, player_id, points: i64, minutes: u32)` | Store pre-computed fantasy points |
| `resolve_match(match_id)` | Lock the match; enables score computation |

**User Transition**

```
compute_score(team_record: TeamRecord) → (score: u64, Future)
```

Execution:
1. Verifies match is resolved
2. Verifies `team_hash` matches on-chain commitment (ZK proof)
3. Reads all 16 players' stats via `.get_or_use()` (handles dummy player 0)
4. Computes final score with captain/vc bonuses and auto-substitution
5. Stores score on public leaderboard

---

### `zkfl_prize_v2.aleo` — Entry Fees & Prize Payouts

Real credit escrow using `credits.aleo`.

**Mappings**: `prize_pools`, `entry_count`, `entries`, `claims`

**User Transitions**

| Function | Description |
|---|---|
| `enter_contest(contest_id, amount: u64)` | Pay entry fee; credits move to program escrow |
| `enter_free_contest(contest_id)` | Enter contests with `entry_fee = 0` |

**Admin Transitions**

| Function | Description |
|---|---|
| `pay_winner(contest_id, winner: address, amount: u64)` | Transfer prize from escrow to winner |
| `refund(contest_id, player: address, amount: u64)` | Refund entry fee to player |

> 1 credit = 1,000,000 microcredits. All amounts in microcredits on-chain.

---

## Backend API

**Base URL**: `http://localhost:3001/api`

### Auth

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/login` | `{ address }` → create or fetch user |
| `GET` | `/auth/user/:address` | Fetch user profile |
| `PATCH` | `/auth/user/:address` | Update `username` / `avatar_url` |
| `GET` | `/auth/user/:address/stats` | Contest/win/earnings stats |

### Matches

| Method | Path | Description |
|---|---|---|
| `GET` | `/matches` | List all matches with clubs |
| `GET` | `/matches/:id` | Single match detail |
| `GET` | `/matches/:id/players` | Players from both clubs with prices |
| `GET` | `/matches/:id/stats` | Post-match fantasy stats |
| `PATCH` | `/matches/:id` | Update status / scores (oracle callback) |

### Contests

| Method | Path | Description |
|---|---|---|
| `GET` | `/contests?match_id=&status=` | List contests |
| `GET` | `/contests/:id` | Single contest (UUID or on-chain ID) |
| `GET` | `/contests/:id/leaderboard` | Entries ranked by score |
| `POST` | `/contests` | Create contest (admin) |
| `POST` | `/contests/:id/enter` | `{ user_address, team_hash }` — record entry |
| `GET` | `/contests/user/:address` | User's entries |
| `GET` | `/contests/:id/sync-from-chain` | Sync scores from on-chain leaderboard |

---

## Oracle Service

Standalone TypeScript scripts that bridge real-world match data to the Aleo chain.

### Scripts

| Script | Command | Description |
|---|---|---|
| `seed-match.ts` | `npx tsx src/seed-match.ts` | Generate `data/fixture-demo-fantasy.json` |
| `setup-match-onchain.ts` | `npx tsx src/setup-match-onchain.ts` | 6-step on-chain setup (15–20 min, ~5 credits) |
| `submit-to-chain.ts` | `npx tsx src/submit-to-chain.ts data/fixture-demo-fantasy.json 1field` | Submit 27 player stats + resolve match |
| `distribute-prizes.ts` | `npx tsx src/distribute-prizes.ts <CONTEST_UUID>` | Calculate & pay prizes to winners |

### On-Chain Setup Flow (`setup-match-onchain.ts`)

```
Step 1: register_match(1field, 1u32, 2u32, 1000000u32)         → zkfl_match
Step 2: set_match_clubs(1field, 1u32, 2u32)                    → zkfl_team_v2
Step 3: set_player_price(1field, player_id, price) × 27        → zkfl_team_v2
Step 4: set_player_club(player_id, club_id) × 27               → zkfl_team_v2
Step 5: set_salary_cap(contest_id, 100_000_000u128)            → zkfl_team_v2
Step 6: create_contest(1field, 1_000_000u128, ...)             → zkfl_match
        → outputs contest_id hash (store in DB as on_chain_id)
```

> Supports `--step N` for re-running individual steps and `--only player_id_list` for targeted price updates.

---

## Frontend App

Built with Next.js 14 App Router.

### Pages

| Route | Description |
|---|---|
| `/` | Match hub — upcoming & live matches |
| `/match/[id]` | Match detail + available contests |
| `/match/[id]/create` | Create a private contest |
| `/contest/[id]` | Contest detail, team builder, leaderboard |
| `/my` | User profile, entries, earnings |

### Key Components

**`TeamBuilder.tsx`** — Full drafting UI:
- Formation selector (8 options: 3-5-2 through 5-2-3)
- Real-time salary cap tracker
- Home/away club balance counter
- Player search + position filter
- Captain / vice-captain selection
- Two-transaction submit flow:
  1. `enter_contest` — pay entry fee
  2. `draft_team` — commit private team on-chain

**`PitchView.tsx`** — 2D SVG pitch visualization showing selected players.

**`useAleoTransaction.ts`** — Hook for submitting wallet transactions and polling confirmation.

**`lib/aleo.ts`** — Input formatters (`toU32`, `toU128`, `toField`, `toI64`) and `buildDraftTeamInputs()` for constructing `TeamData` struct inputs.

### Supported Wallets

Leo · Shield · Fox · Puzzle · Soter (via `@provablehq/aleo-wallet-adaptor-react`)

---

## Database Schema

Hosted on Supabase (PostgreSQL). Run `server/src/db/schema.sql` to initialize.

| Table | Key Columns |
|---|---|
| `clubs` | `id`, `on_chain_id`, `name`, `short_name`, `crest_url` |
| `players` | `id`, `on_chain_id`, `name`, `position (GK\|DEF\|MID\|FWD)`, `club_id` |
| `matches` | `id`, `on_chain_match_id`, `home_club_id`, `away_club_id`, `kickoff`, `status`, `is_resolved` |
| `match_player_prices` | `match_id`, `player_id`, `price_credits` |
| `player_match_stats` | `player_id`, `match_id`, `minutes_played`, `goals`, `assists`, `fantasy_points`, … |
| `contests` | `id (UUID)`, `on_chain_id`, `match_id`, `entry_fee_credits`, `prize_split (JSONB)`, `status` |
| `entries` | `user_address`, `contest_id`, `team_hash`, `score`, `rank`, `prize_won_credits` |
| `users` | `address (PK)`, `username`, `total_contests`, `total_wins`, `total_earnings_credits` |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Aleo wallet browser extension with testnet credits
- Supabase account (free tier)
- Leo CLI (`curl -sSf https://raw.githubusercontent.com/AleoHQ/leo/mainline/install.sh | sh`)
- ~20 testnet credits (contract deployment + setup + test runs)

### 1. Clone & Install

```bash
git clone <repo>
cd zkfl

# Install all dependencies
(cd oracle && npm install)
(cd server && npm install)
(cd app && npm install --legacy-peer-deps)
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Open SQL Editor → paste contents of `server/src/db/schema.sql` → Run
3. Save your **Project URL** and **Service Role Key**

### 3. Configure Environment Variables

**`oracle/.env`**
```env
ALEO_PRIVATE_KEY=your_oracle_wallet_private_key
ALEO_ENDPOINT=https://api.explorer.provable.com/v1
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
BACKEND_URL=http://localhost:3001
CONTRACTS_DIR=../contracts
```

**`server/.env`**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
PORT=3001
BACKEND_URL=http://localhost:3001
```

**`app/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 4. Generate Demo Data & Seed DB

```bash
# Generate fixture JSON
cd oracle && npx tsx src/seed-match.ts

# Seed database
cd ../server && npx tsx src/db/seed.ts
```

### 5. Deploy Contracts (One-time, ~15 credits)

```bash
# Deploy v2 contracts to testnet
cd contracts/zkfl_team   && leo build && leo deploy --network testnet
cd ../zkfl_scoring       && leo build && leo deploy --network testnet
cd ../zkfl_prize         && leo build && leo deploy --network testnet

# Register match & set up contest on-chain (~5 credits, ~20 min)
cd ../../oracle && npx tsx src/setup-match-onchain.ts
# Note the contest_id hash printed at the end — update DB if needed
```

### 6. Start Services

```bash
# Terminal 1 — Backend
cd server && npm run dev        # http://localhost:3001

# Terminal 2 — Frontend
cd app && npm run dev           # http://localhost:3000
```

### 7. Run a Contest

```bash
# After all users have drafted their teams, submit stats and resolve the match:
cd oracle && npx tsx src/submit-to-chain.ts data/fixture-demo-fantasy.json 1field
# ~5-10 minutes (27 on-chain calls)

# Distribute prizes to top finishers:
npx tsx src/distribute-prizes.ts <CONTEST_UUID>
```

---

## Environment Variables

| Service | Variable | Description |
|---|---|---|
| Frontend | `NEXT_PUBLIC_API_URL` | Backend API base URL |
| Backend | `SUPABASE_URL` | Supabase project URL |
| Backend | `SUPABASE_SERVICE_KEY` | Supabase service role key |
| Backend | `PORT` | Server port (default: 3001) |
| Oracle | `ALEO_PRIVATE_KEY` | Oracle admin wallet private key |
| Oracle | `ALEO_ENDPOINT` | Aleo RPC endpoint |
| Oracle | `SUPABASE_URL` | Supabase project URL |
| Oracle | `SUPABASE_SERVICE_KEY` | Supabase service role key |
| Oracle | `BACKEND_URL` | Backend URL for callbacks |
| Oracle | `CONTRACTS_DIR` | Path to contracts directory |

---

## End-to-End Flow

```
Admin Setup
  oracle/seed-match.ts          → data/fixture-demo-fantasy.json
  server/db/seed.ts             → Supabase: clubs, players, matches, contests
  oracle/setup-match-onchain.ts → Aleo: register match, set prices, create contest

User Flow
  1. Connect Wallet              → auth/login → create user record
  2. Browse Matches              → GET /api/matches
  3. Enter Contest
       TX1: enter_contest        → zkfl_prize_v2  (transfer entry fee to escrow)
       TX2: draft_team           → zkfl_team_v2   (encrypt team, store hash)
       API: POST /contests/:id/enter               (record team_hash in DB)

Oracle Resolution
  submit-to-chain.ts
       27 × submit_player_stats  → zkfl_scoring_v2 (store points + minutes)
       resolve_match             → zkfl_scoring_v2 (lock match)
  PATCH /api/matches/:id         → set status="FT", is_resolved=true

User Scoring (ZK Proof)
  TX3: compute_score(TeamRecord)
       → zkfl_scoring_v2
       → verifies team_hash == commitment
       → computes score (base + captain bonus + auto-subs)
       → writes to public leaderboard mapping

Prize Distribution
  oracle/distribute-prizes.ts
       → fetch leaderboard
       → pay_winner(contest_id, address, amount) × N winners
       → update DB entries with prize amounts
       → set contest.status = "settled"
```

---

## Privacy Model

| Phase | What's Public | What's Private |
|---|---|---|
| Drafting | `team_hash` commitment | Full lineup (16 players, formation, captain) |
| After resolve | Player stats, match result | Still: your team picks |
| After scoring | Score, rank, prize amount | Still: your team picks |
| Proof | ZK proof validity | Underlying team data |

The `TeamRecord` is a private Aleo record owned exclusively by your wallet. The on-chain commitment (`team_hash`) proves you haven't changed your team post-draft without revealing who you picked. The `compute_score` transition generates a ZK proof verifying: *"I have a valid `TeamRecord` whose hash matches the on-chain commitment, and this score is the correct output."*

---

## Fantasy Scoring Formula

Points are pre-computed off-chain by `oracle/compute-fantasy.ts` using the standard FPL model, then submitted on-chain per player.

| Event | GK | DEF | MID | FWD |
|---|---|---|---|---|
| Goal scored | +6 | +6 | +5 | +4 |
| Assist | +3 | +3 | +3 | +3 |
| Clean sheet (90 min) | +4 | +4 | +1 | — |
| Every 3 saves | +1 | — | — | — |
| Yellow card | -1 | -1 | -1 | -1 |
| Red card | -3 | -3 | -3 | -3 |
| Own goal | -2 | -2 | -2 | -2 |
| BPS bonus (top 3) | +3/+2/+1 | +3/+2/+1 | +3/+2/+1 | +3/+2/+1 |

**Captain**: 2× score for the match. **Vice-captain**: 1.5× (or 2× if captain played 0 minutes).

**Auto-substitution**: Bench players replace starting players who played 0 minutes (by bench order).

---

## Deployment

### Testnet (Current)

Contracts are deployed to Aleo testnet. The frontend can be run locally against testnet with real wallet extensions.

### Production Checklist

- [ ] Deploy contracts to Aleo mainnet
- [ ] Update `PROGRAMS` in `app/lib/aleo.ts` to mainnet program IDs
- [ ] Host frontend on Vercel or Netlify
- [ ] Host backend on Railway / Heroku / AWS
- [ ] Use production Supabase project
- [ ] Update all `NEXT_PUBLIC_API_URL` and `BACKEND_URL` values
- [ ] Set up real API-Football integration in `oracle/fetch-stats.ts`
- [ ] Configure automated oracle runs (cron or cloud function)
- [ ] Enable `DB` sync endpoint: `GET /contests/:id/sync-from-chain`

---

## Known Issues & Workarounds

See `plan.md` for the full issue tracker. Key fixes included in v2 contracts:

| Issue | Fix |
|---|---|
| Club balance constraint required exactly 8 home + 8 away | Relaxed to min 3 from each team in `zkfl_team_v2` |
| Dummy player 0 caused `compute_score` panic | Changed `.get()` to `.get_or_use()` in `zkfl_scoring_v2` |
| Prize contract used non-existent USDCx token | Rewrote `zkfl_prize_v2` to use native `credits.aleo` |
| No entry fee payment in frontend flow | Wired `enter_contest` before `draft_team` in `TeamBuilder` |

---

## License

MIT
