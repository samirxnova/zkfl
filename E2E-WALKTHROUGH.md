# ZKFL E2E Walkthrough Guide

Step-by-step guide to test the full flow: setup → draft → score → payout.

**Demo match:** Man City 3–2 Liverpool (`match_id = 2field`)
**Contest ID:** `8184218403260942832359254752265460321009866478667199204618940750116699577167field`

---

## Prerequisites

- **Node.js 18+** installed
- **Leo CLI 3.4.0** installed (`leo --version` — must be 3.4.0, not 3.5.0)
- **Aleo wallet extension** installed (Leo Wallet / Shield Wallet), switched to **Testnet**
- **Testnet credits** in your oracle wallet (~5 credits for on-chain setup)
- All 4 contracts already deployed on testnet:
  - `zkfl_match.aleo`
  - `zkfl_team_v2.aleo`
  - `zkfl_scoring_v2.aleo`
  - `zkfl_prize_v2.aleo`

> If Leo is 3.5.0, downgrade: `cargo install leo-lang --version 3.4.0 --locked`

---

## Step 0: Environment Setup

### 0.1 — Create Supabase Project

1. Go to https://supabase.com → New Project (free tier is fine)
2. Note your **Project URL** and **Service Role Key** (Settings → API)

### 0.2 — Run Database Schema

1. Go to Supabase Dashboard → **SQL Editor** → New Query
2. Paste the contents of `server/src/db/schema.sql` and click **Run**
3. This creates all tables + the `increment_contest_entries` function

### 0.3 — Set Up Environment Files

**Oracle** — create `oracle/.env`:
```
ALEO_PRIVATE_KEY=your_oracle_private_key_here
ALEO_ENDPOINT=https://api.explorer.provable.com/v1
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_KEY=YOUR_SERVICE_ROLE_KEY
BACKEND_URL=http://localhost:3001
CONTRACTS_DIR=../contracts
```

**Server** — create `server/.env`:
```
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_KEY=YOUR_SERVICE_ROLE_KEY
PORT=3001
BACKEND_URL=http://localhost:3001
```

**Frontend** — create `app/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 0.4 — Install Dependencies

```bash
cd zkfl/oracle && npm install
cd ../server   && npm install
cd ../app      && npm install --legacy-peer-deps
```

---

## Step 1: Generate Demo Data

```bash
cd zkfl/oracle
npm run seed:match2
```

**What happens:** Creates `data/fixture-match2.json` and `data/fixture-match2-fantasy.json` with Man City 3–2 Liverpool, 25 players, realistic stats, and pre-computed fantasy points.

**Top scorers preview:**
```
 14 pts  Haaland   FWD  90min (+2 bonus)
 14 pts  De Bruyne MID  90min (+3 bonus)
  9 pts  Salah     FWD  90min
  9 pts  Foden     MID  90min
  8 pts  Van Dijk  DEF  90min (+1 bonus)
```

**Verify:** Check that both files exist in `oracle/data/`.

---

## Step 2: Seed the Database

```bash
cd zkfl/server
npm run seed:match2
```

**What happens:** Populates Supabase with:
- 2 clubs (Man City `on_chain_id=3`, Liverpool `on_chain_id=4`)
- 25 players with prices
- 1 match (Man City vs Liverpool, `on_chain_match_id = "2field"`, status SCHEDULED)
- Player stats for key scorers
- 1 demo contest (classic, 1 credit entry fee, 100 max entries)

**Verify:** Go to Supabase → Table Editor → check `clubs`, `players`, `matches`, `contests` tables have data.

---

## Step 3: Set Up Match On-Chain

> **Note:** This step takes ~20 minutes and costs ~3–5 credits. Skip if already done for this match.

```bash
cd zkfl/oracle
npm run setup:match2
```

**What happens (in order):**
1. `register_match` — Registers Man City vs Liverpool as match `2field`
2. `set_match_clubs` — Links match to club IDs (home=3, away=4)
3. `set_player_price` × 25 — Sets price for each player + dummy player 0
4. `set_player_club` × 25 — Maps each player to their club
5. `set_salary_cap` — Sets salary cap (100,000,000 microcredits = 100 credits)
6. `create_contest` — Creates the contest on-chain; **prints the contest_id hash**

**If step 6 already ran** and you have the hash, update `server/src/db/seed-match2.ts` with it, then re-run step 5 only:
```bash
npm run setup:match2 -- --step 5
```

**Re-run a specific step if it failed:**
```bash
npm run setup:match2 -- --step 3           # re-run all player prices
npm run setup:match2 -- --step 3 --only 310,409  # retry specific players
```

**Verify:**
```bash
curl -s "https://api.explorer.provable.com/v1/testnet/program/zkfl_match.aleo/mapping/matches/2field"
# Should return: home_club: 3u32, away_club: 4u32, is_active: true
```

---

## Step 4: Start the Backend Server

```bash
cd zkfl/server
npm run dev
```

**Verify:** Open http://localhost:3001/api/matches — should return the Man City vs Liverpool match.

Leave this terminal running.

---

## Step 5: Start the Frontend

Open a **new terminal**:

```bash
cd zkfl/app
npm run dev
```

**Verify:** Open http://localhost:3000 — should see the Match Hub with Man City vs Liverpool.

Leave this terminal running.

---

## Step 6: Connect Wallet & Browse

1. Open http://localhost:3000
2. Click **"Connect Wallet"** in the navbar
3. Select your Aleo wallet (Leo Wallet or Shield Wallet)
4. Make sure wallet is on **Testnet** mode
5. Approve the connection
6. You should see your truncated address in the navbar

---

## Step 7: Enter a Contest & Draft Team

1. Click on **Man City vs Liverpool** match card
2. Click the contest to open the contest page
3. You'll be in the **Draft Team** tab
4. **Pick a formation** (e.g., 4-3-3)
5. **Click each position slot** on the pitch → select a player from the panel
6. Fill all 13 slots (11 starting + 2 bench) within the **100.00 credit** salary cap
7. Suggested picks for the demo:
   - GK: Ederson (5.0cr) or Alisson (5.5cr)
   - Captain: Haaland (14.0cr) — 2 goals = highest scorer
   - Vice-Captain: De Bruyne (10.0cr) — 2 assists
   - Premium FWD: Salah (13.0cr) — 1 goal
8. **Set Captain** (hover → click C) and **Vice-Captain** (hover → click V)
9. Check the **salary bar** is green (within budget)
10. Click **"ZK Draft Team"**
11. Two wallet transactions fire in sequence:
    - **TX 1** — `enter_contest` on `zkfl_prize_v2.aleo`: pays 1 credit entry fee to on-chain escrow
    - **TX 2** — `draft_team` on `zkfl_team_v2.aleo`: commits private team on-chain
12. Approve both transactions in your wallet
13. Wait for confirmation — you'll see the real on-chain transaction IDs

**What happens on-chain:** Your team lineup is encrypted. Only a `team_hash` commitment is stored publicly. Nobody can see your picks.

> **Tip:** Test with 2–3 wallets for a realistic leaderboard. Each wallet needs ~3 testnet credits.

---

## Step 8: Submit Player Stats (Oracle)

After all testers have drafted their teams, submit the player stats on-chain:

```bash
cd zkfl/oracle
npm run submit:match2
```

**What happens:**
- Calls `submit_player_stats` on `zkfl_scoring_v2.aleo` for each of the 25 players + dummy player 0 (27 calls total)
- Each call submits `(match_id, player_id, points, minutes)`
- Then calls `resolve_match(2field)` to mark the match resolved
- PATCHes the backend to update match status to `FT` and `is_resolved: true`
- Takes ~5–10 minutes

**Verify:**
```bash
curl -s "https://api.explorer.provable.com/v1/testnet/program/zkfl_scoring_v2.aleo/mapping/match_resolved/2field"
# Should return: "true"
```

---

## Step 9: Compute Your ZK Score

1. Refresh the contest page in your browser
2. The Draft tab is replaced by a banner: **"Match Resolved! Compute your ZK score proof"**
3. Click **"Compute Score"**
4. The app fetches your private `TeamRecord` from your wallet automatically
5. It submits a `compute_score` transaction to `zkfl_scoring_v2.aleo`
6. Approve the transaction in your wallet
7. Wait for on-chain confirmation
8. The frontend sends the confirmed tx ID to the backend (`POST /submit-score`)
9. The backend extracts your team from the transaction, computes your score from DB stats, and updates the leaderboard
10. Your score and rank appear on the leaderboard

**What the ZK proof guarantees:**
- Your `team_hash` matches the commitment stored on-chain (proves you didn't change your team)
- The score was correctly computed from the oracle's player stats
- Your actual player lineup is **never published** — only the score is public

> **Important:** Each user with a drafted team must compute their score from their own wallet.

---

## Step 10: Distribute Prizes

Once all (or enough) users have computed their scores:

```bash
cd zkfl/oracle
npx tsx src/distribute-prizes.ts bf4a732c-64ee-43ec-8525-bb14ae372448
```

> Replace the UUID with the contest `id` from your Supabase `contests` table if different.

**What happens:**
- Fetches leaderboard from backend (sorted by score)
- Calculates prizes: total pool − 10% rake, then split 60% / 25% / 15%
- Calls `zkfl_prize_v2.aleo/pay_winner` on-chain for each top-ranked entry
- Updates entry records with prize amounts
- Sets contest status to "settled"

**Example output (3 players, 3 credit pool):**
```
Total pool: 3000000 microcredits (3.00 credits)
Rake (10%): 300000 microcredits
Distributable: 2700000 microcredits

#1: aleo1... → 1620000 microcredits (1.62 credits)
#2: aleo1... → 675000  microcredits (0.68 credits)
#3: aleo1... → 405000  microcredits (0.41 credits)
```

**Verify:** Refresh the leaderboard — prize amounts appear next to winners. Check winner's wallet balance increased.

---

## Step 11: Verify Privacy

The key ZK property — **nobody can see your lineup**:

1. Go to https://explorer.provable.com
2. Search for any `draft_team` transaction from this contest
3. Inspect the inputs — `TeamData` struct is **fully encrypted** (`ciphertext1q...`)
4. Only the `team_hash` commitment is visible on-chain
5. Player IDs, formation, captain choices remain private until (optionally) revealed by the user

---

## Quick Reference

| What | Command |
|---|---|
| Generate demo data | `cd oracle && npm run seed:match2` |
| Seed database | `cd server && npm run seed:match2` |
| Setup on-chain | `cd oracle && npm run setup:match2` |
| Re-run single step | `npm run setup:match2 -- --step <N>` |
| Start backend | `cd server && npm run dev` |
| Start frontend | `cd app && npm run dev` |
| Submit stats + resolve | `cd oracle && npm run submit:match2` |
| Distribute prizes | `cd oracle && npx tsx src/distribute-prizes.ts <CONTEST_UUID>` |
| Reset DB (SQL Editor) | Drop all tables, re-paste `schema.sql`, re-run `seed:match2` |

---

## Database Reset (Fresh Start)

If you need to start over:

1. Go to Supabase → SQL Editor and run:
```sql
DROP TABLE IF EXISTS entries, player_match_stats, match_player_prices, contests, users, matches, players, clubs CASCADE;
DROP FUNCTION IF EXISTS increment_contest_entries;
```

2. Re-paste and run `server/src/db/schema.sql`

3. Re-seed:
```bash
cd zkfl/server
npm run seed:match2
```

---

## Troubleshooting

| Issue | Fix |
|---|---|
| "Wallet not connected" | Install Leo/Shield Wallet extension, set to Testnet, refresh page |
| Transaction fails | Check testnet credits balance (need ~1 credit per tx) — visit faucet.aleo.org |
| Leo version error (`async constructor`) | Downgrade: `cargo install leo-lang --version 3.4.0 --locked` |
| API returns 500 | Check `server/.env` has correct Supabase credentials |
| Players not showing | Run `npm run seed:match2` first, verify Supabase has data |
| `undefinedu32` in setup | Re-run `npm run seed:match2` in oracle to regenerate fixture JSON |
| "Match not resolved" banner missing | Run `npm run submit:match2` in oracle — resolves at the end |
| "No team record found" | Must draft a team before computing score |
| Scores are 0 | Ensure `player_match_stats` has data for match 2 players (on_chain_id 301–412) |
| Contest ID mismatch | The `on_chain_id` in Supabase must match the hash output from `create_contest` step 6 |
| `distribute-prizes` fails | Ensure all users have computed scores; backend must be running |

---

## New Contest on Same Match

To create a second contest without redeploying:

1. Change `NONCE` in `oracle/src/setup-match2-onchain.ts` (e.g., `"51field"`)
2. Run only steps 5 + 6:
   ```bash
   cd oracle
   npm run setup:match2 -- --step 6
   # note the new contest_id hash
   npm run setup:match2 -- --step 5
   ```
3. Update `CONTEST_ON_CHAIN_ID` in `server/src/db/seed-match2.ts` with the new hash
4. Reset DB and re-seed (see Database Reset above)
