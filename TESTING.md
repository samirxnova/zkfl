# ZKFL — Judge's End-to-End Testing Guide

This guide walks through every layer of the system: smart contracts on Aleo testnet, the backend API, and the frontend. Each step includes expected output and on-chain verification commands so you can independently confirm every claim.

---

## What You Are Testing

ZKFL is a privacy-preserving fantasy football platform on Aleo. The core claims to verify:

| Claim | How to verify |
|---|---|
| Team lineups are **private** | Inspect the `draft_team` transaction on explorer — only a hash is visible |
| Scores are **proven by ZK** | The `compute_score` tx generates a ZK proof against the committed team |
| Prizes are paid in **real Aleo credits** | Check winner's wallet balance before and after distribution |
| No trust in the operator | All scoring logic is on-chain; anyone can verify the proof |

**Demo match:** Man City 3–2 Liverpool (`match_id = 2field`)

**Deployed contracts (Aleo testnet):**
- `zkfl_match.aleo`
- `zkfl_team_v2.aleo`
- `zkfl_scoring_v2.aleo`
- `zkfl_prize_v2.aleo`

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 18+ | `node --version` |
| Leo CLI | 3.4.0 | `leo --version` |
| Aleo wallet extension | latest | Leo Wallet or Shield Wallet |
| Testnet credits | ~3 per user | [faucet.aleo.org](https://faucet.aleo.org) |
| Supabase project | free tier | Already set up by the team |

> Get testnet credits at https://faucet.aleo.org — enter your wallet address and request tokens. Allow 1–2 minutes to confirm.

---

## Part 1 — Verify Contracts On-Chain

Before running anything locally, confirm all four contracts are deployed on Aleo testnet.

```bash
# zkfl_match.aleo
curl -s "https://api.explorer.provable.com/v1/testnet/program/zkfl_match.aleo" | head -5

# zkfl_team_v2.aleo
curl -s "https://api.explorer.provable.com/v1/testnet/program/zkfl_team_v2.aleo" | head -5

# zkfl_scoring_v2.aleo
curl -s "https://api.explorer.provable.com/v1/testnet/program/zkfl_scoring_v2.aleo" | head -5

# zkfl_prize_v2.aleo
curl -s "https://api.explorer.provable.com/v1/testnet/program/zkfl_prize_v2.aleo" | head -5
```

**Expected:** Each returns program bytecode starting with `program zkfl_...`.

---

### Verify Match 2 is Registered On-Chain

```bash
curl -s "https://api.explorer.provable.com/v1/testnet/program/zkfl_match.aleo/mapping/matches/2field"
```

**Expected:**
```json
{
  "home_club": "3u32",
  "away_club": "4u32",
  "kickoff_block": "2000000u32",
  "is_active": "true"
}
```

### Verify the Contest Exists On-Chain

```bash
curl -s "https://api.explorer.provable.com/v1/testnet/program/zkfl_match.aleo/mapping/contests/8184218403260942832359254752265460321009866478667199204618940750116699577167field"
```

**Expected:**
```json
{
  "match_id": "2field",
  "entry_fee": "1000000u128",
  "max_entries": "100u32",
  "is_open": "true"
}
```

---

## Part 2 — Local Setup

### Clone & Install

```bash
git clone <repo-url>
cd zkfl

cd oracle && npm install && cd ..
cd server && npm install && cd ..
cd app    && npm install --legacy-peer-deps && cd ..
```

### Configure Environment Files

**`oracle/.env`**
```
ALEO_PRIVATE_KEY=<oracle_private_key>
ALEO_ENDPOINT=https://api.explorer.provable.com/v1
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_KEY=<service_role_key>
BACKEND_URL=http://localhost:3001
CONTRACTS_DIR=../contracts
```

**`server/.env`**
```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_KEY=<service_role_key>
PORT=3001
BACKEND_URL=http://localhost:3001
```

**`app/.env.local`**
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Start Services

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd app && npm run dev
```

### Verify Backend is Running

```bash
curl -s http://localhost:3001/api/matches | python3 -m json.tool
```

**Expected:** JSON array containing the Man City vs Liverpool match with `on_chain_match_id: "2field"`.

```bash
curl -s http://localhost:3001/api/contests | python3 -m json.tool
```

**Expected:** JSON array containing the contest with `on_chain_id: "8184218403260942832359254752265460321009866478667199204618940750116699577167field"` and `status: "open"`.

---

## Part 3 — User Flow (Frontend Testing)

Open http://localhost:3000

### Step 3.1 — Connect Wallet

1. Click **Connect Wallet** in the navbar
2. Select **Leo Wallet** or **Shield Wallet**
3. Switch wallet network to **Testnet** (in wallet settings)
4. Approve the connection request
5. Your truncated address should appear in the navbar

**Verify:** `GET http://localhost:3001/api/auth/user/<your_address>` returns your user profile (auto-created on first connect).

---

### Step 3.2 — Browse to the Contest

1. Homepage shows **Man City vs Liverpool** match card
2. Click the match → match detail page
3. Click **Classic Contest** → contest detail page
4. You see: entry fee `1.00 credit`, prize split `60/25/15`, `100 max entries`

---

### Step 3.3 — Build Your Team

On the contest page, click **Draft Team**:

1. **Pick a formation** — e.g. `4-3-3` or `3-5-2`
2. **Select 13 players** (1 GK + 10 starters + 2 bench) from the player panel
   - Budget: **100.00 credits** total salary cap
   - Must pick **min 3 from each club** (Man City + Liverpool)
   - Suggested strong picks for demo:
     - Haaland (14.0cr) — 2 goals, best FWD
     - De Bruyne (10.0cr) — 2 assists, best MID
     - Salah (13.0cr) — 1 goal, top LIV pick
3. **Set Captain** (click C on a player) — Haaland recommended
4. **Set Vice-Captain** (click V on a player) — De Bruyne or Salah
5. Salary bar must be green (within budget)

---

### Step 3.4 — Submit Team (Two On-Chain Transactions)

Click **ZK Draft Team**. Two wallet transactions fire in sequence:

**Transaction 1 — `enter_contest` (zkfl_prize_v2.aleo)**
- Transfers 1 credit (1,000,000 microcredits) from your public wallet balance to the program escrow
- Approve in wallet → wait for confirmation (~30 sec)

**Transaction 2 — `draft_team` (zkfl_team_v2.aleo)**
- Commits your team lineup as a private ZK record
- Only the `team_hash` (commitment) is stored publicly on-chain
- Your full lineup is encrypted in the wallet
- Approve in wallet → wait for confirmation (~30 sec)

After both confirm, you are redirected to the leaderboard tab showing your entry (score: pending).

---

### Step 3.5 — Verify Team Privacy (Key ZK Claim)

Copy the `draft_team` transaction ID from the confirmation screen.

Open https://explorer.provable.com and search for the transaction.

**What you should see:**
- Transaction type: `Execute`
- Program: `zkfl_team_v2.aleo`
- Function: `draft_team`
- Inputs: **all encrypted** (`ciphertext1...`)
- The only public on-chain data: the `team_hash` stored in `team_commitments` mapping

```bash
# Verify the commitment is stored on-chain
# Replace CONTEST_ID and YOUR_ADDRESS with actual values
curl -s "https://api.explorer.provable.com/v1/testnet/program/zkfl_team_v2.aleo/mapping/team_commitments/<commitment_key_hash>"
```

**This proves:** Nobody — not even the platform operator — can see your lineup before scoring.

---

### Step 3.6 — Repeat with Multiple Wallets

For a realistic leaderboard with at least 3 entries:
1. Open a different browser/profile or disable the first wallet
2. Connect a second wallet (with testnet credits)
3. Draft a different team on the same contest
4. Repeat for a third wallet

Each wallet gets its own private `TeamRecord`, each paying 1 credit to the prize pool.

---

## Part 4 — Oracle: Submit Stats & Resolve Match

After all testers have drafted teams, run the oracle script to simulate match completion:

```bash
cd oracle
npm run submit:match2
```

This runs two operations:
1. Calls `submit_player_stats` on `zkfl_scoring_v2.aleo` for all 25 players + dummy player 0 (27 total transactions, ~10 seconds apart, ~5 minutes total)
2. Calls `resolve_match(2field)` on `zkfl_scoring_v2.aleo` — locks the match
3. PATCHes the backend: `{ status: "FT", is_resolved: true, home_score: 3, away_score: 2 }`

**Expected terminal output:**
```
Loaded 25 players from data/fixture-match2.json
Match: Manchester City 3-2 Liverpool

Top 10 fantasy scorers:
  14pts — Haaland    (FWD, 90min, bonus: 2)
  14pts — De Bruyne  (MID, 90min, bonus: 3)
  ...

Submitted 25/25 player stats
Match resolved! tx: at1...
Backend updated: FT  is_resolved: true
```

### Verify Match is Resolved On-Chain

```bash
curl -s "https://api.explorer.provable.com/v1/testnet/program/zkfl_scoring_v2.aleo/mapping/match_resolved/2field"
```

**Expected:** `"true"`

### Verify a Player's Stats On-Chain

Haaland's stats (player_id 310, match_id 2field):

```bash
# First compute the stats key hash (BHP256 of {match_id: 2field, player_id: 310u32})
# Then query:
curl -s "https://api.explorer.provable.com/v1/testnet/program/zkfl_scoring_v2.aleo/mapping/player_points/<stats_key>"
```

**Expected:** `"14i64"` (Haaland: 2 goals × 4pts + 2pts minutes + 3 bonus = 14pts)

---

## Part 5 — ZK Score Computation

This is the core ZK proof step. Each user proves their score without revealing their full lineup.

### Step 5.1 — Trigger Compute Score

1. Refresh the contest page in your browser
2. The **Draft** tab is replaced by a banner: **"Match Resolved — Compute Your Score"**
3. Click **Compute Score**
4. The app automatically retrieves your private `TeamRecord` from the wallet (no manual input needed)
5. A `compute_score` transaction is submitted to `zkfl_scoring_v2.aleo`
6. Approve in wallet

**What happens on-chain:**
- ZK proof verifies `team_hash` matches the on-chain commitment in `team_commitments`
- Reads all 16 players' stats from `player_points` and `player_minutes` mappings
- Applies captain 2× bonus, vice-captain 1.5× bonus, and auto-substitution logic
- Writes final score to the public `leaderboard` mapping
- All without revealing which players are in your team

### Step 5.2 — Verify Score is On-Chain

```bash
# The leaderboard mapping key is BHP256({contest_id, player_address})
# Query:
curl -s "https://api.explorer.provable.com/v1/testnet/program/zkfl_scoring_v2.aleo/mapping/leaderboard/<leaderboard_key>"
```

**Expected:** A `u64` value representing your total fantasy score.

### Step 5.3 — View Leaderboard

After all wallets compute their scores:
```bash
curl -s "http://localhost:3001/api/contests/<CONTEST_UUID>/leaderboard" | python3 -m json.tool
```

**Expected:** Ranked entries with scores. The user with Haaland as captain (2× = 28pts from him alone) should be near the top.

### Step 5.4 — Repeat for Each Wallet

Each wallet that drafted a team must submit `compute_score` from their own wallet. Scores appear on the leaderboard as they come in.

---

## Part 6 — Prize Distribution

Once all scores are submitted, distribute real Aleo credits to winners.

### Step 6.1 — Get the Contest UUID

```bash
curl -s "http://localhost:3001/api/contests" | python3 -m json.tool | grep '"id"'
```

Copy the UUID (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`) for the Man City vs Liverpool contest.

Alternatively, go to your Supabase dashboard → Table Editor → `contests` table → copy the `id` column value.

### Step 6.2 — Check Wallet Balance Before (Optional)

Note the winning wallet's credit balance in the wallet extension before running distribution.

### Step 6.3 — Run Distribution

```bash
cd oracle
npx tsx src/distribute-prizes.ts <CONTEST_UUID>
```

**Expected terminal output:**
```
=== Prize Distribution ===
Contest UUID: xxxxxxxx-...

Entry fee: 1000000 microcredits (1.00 credits)
Entries: 3
Prize split: {"1":60,"2":25,"3":15}
Match is resolved.

Leaderboard (3 scored entries):
  aleo1abc...  → 87 pts
  aleo1def...  → 64 pts
  aleo1ghi...  → 51 pts

Total pool: 3000000 microcredits (3.00 credits)
Rake (10%): 300000 microcredits
Distributable: 2700000 microcredits

Prize distribution:
  #1: aleo1abc... → 1620000 microcredits (1.62 credits)
  #2: aleo1def... → 675000 microcredits (0.68 credits)
  #3: aleo1ghi... → 405000 microcredits (0.41 credits)

Paying #1...
  → zkfl_prize_v2/pay_winner(...)  tx: at1...
Paying #2...
  → zkfl_prize_v2/pay_winner(...)  tx: at1...
Paying #3...
  → zkfl_prize_v2/pay_winner(...)  tx: at1...

Contest marked as settled in backend.
=== Distribution Complete ===
```

### Step 6.4 — Verify Payout On-Chain

Search the `pay_winner` transaction IDs on https://explorer.provable.com.

Each transaction should show:
- Program: `zkfl_prize_v2.aleo`
- Function: `pay_winner`
- A credit transfer to the winner's address

```bash
# Verify the prize pool was drained
curl -s "https://api.explorer.provable.com/v1/testnet/program/zkfl_prize_v2.aleo/mapping/prize_pools/8184218403260942832359254752265460321009866478667199204618940750116699577167field"
```

### Step 6.5 — Verify Winner's Wallet Balance

Open the winning wallet — the credit balance should have increased by the prize amount.

---

## Part 7 — Privacy Verification (ZK Proof Audit)

This section verifies the core ZK property: **lineups are private until after scoring**.

### Check any `draft_team` transaction

1. Go to https://explorer.provable.com
2. Search for any `draft_team` transaction from this contest
3. Inspect the inputs:

```
Inputs:
  contest_id:  [public field]
  match_id:    [public field]
  team:        ciphertext1qgq...  ← ENCRYPTED
  formation:   ciphertext1qyq...  ← ENCRYPTED
```

The `TeamData` struct (16 player IDs, captain, vice-captain) is fully encrypted. The ciphertext is only decryptable by the wallet that submitted it.

### What IS public on-chain

```bash
# The commitment hash — proves a team was submitted but reveals nothing
curl -s "https://api.explorer.provable.com/v1/testnet/program/zkfl_team_v2.aleo/mapping/team_commitments/<key>"
# Returns a field hash — not player IDs
```

### What is proven but never revealed

During `compute_score`, the ZK proof attests:

1. *"I possess a `TeamRecord` record"* (private, in wallet)
2. *"Its `team_hash` matches the commitment stored on-chain"* (proves no tampering)
3. *"The score is the correct sum of my players' stats"* (verified against oracle data)

The player IDs are **never published** to compute this proof.

---

## Part 8 — API Verification Reference

All API endpoints for independent verification:

```bash
BASE="http://localhost:3001/api"

# All matches
curl -s "$BASE/matches"

# Man City vs Liverpool match detail
curl -s "$BASE/matches/2"

# Players for match 2 (with prices)
curl -s "$BASE/matches/2/players"

# All contests
curl -s "$BASE/contests"

# Contest detail by on_chain_id
curl -s "$BASE/contests/8184218403260942832359254752265460321009866478667199204618940750116699577167field"

# Leaderboard (replace UUID)
curl -s "$BASE/contests/<UUID>/leaderboard"

# Player stats post-match
curl -s "$BASE/matches/2/stats"
```

---

## Part 9 — On-Chain State Summary

After a complete E2E run, this is the expected on-chain state:

| Contract | Mapping | Key | Expected Value |
|---|---|---|---|
| `zkfl_match` | `matches` | `2field` | `{ home_club: 3, away_club: 4, is_active: true }` |
| `zkfl_match` | `contests` | `8184...field` | `{ entry_fee: 1000000, is_open: true }` |
| `zkfl_team_v2` | `team_commitments` | hash(contest, user) | non-zero field hash |
| `zkfl_scoring_v2` | `match_resolved` | `2field` | `true` |
| `zkfl_scoring_v2` | `leaderboard` | hash(contest, user) | score as u64 |
| `zkfl_prize_v2` | `prize_pools` | `8184...field` | microcredits collected |
| `zkfl_prize_v2` | `claims` | hash(contest, winner) | `true` (after payout) |

---

## Troubleshooting

| Issue | Fix |
|---|---|
| "Wallet not connected" | Install Leo Wallet extension, set network to Testnet, refresh |
| Transaction rejected | Insufficient testnet credits — visit faucet.aleo.org |
| "Match not resolved" banner not showing | Run `npm run submit:match2` in oracle directory |
| "No team record found" | Must draft a team before computing score |
| Leaderboard shows no scores | Each wallet must run `compute_score` individually |
| `distribute-prizes.ts` fails | Ensure all users have computed scores first; check backend is running |
| `curl` returns empty | Mapping key may not match — double-check the hash key format |
| Backend returns 500 | Check `server/.env` for correct Supabase credentials |

---

## Quick Command Reference

```bash
# ── Oracle ──
cd oracle
npx tsx src/seed-match2.ts                          # generate fixture data
npm run setup:match2                                # register match2 on-chain (one-time)
npm run submit:match2                               # submit stats + resolve match
npx tsx src/distribute-prizes.ts <CONTEST_UUID>     # pay winners

# ── Server ──
cd server
npm run dev                                         # start API (port 3001)
npm run seed:match2                                 # seed DB with match2 data

# ── App ──
cd app
npm run dev                                         # start frontend (port 3000)

# ── On-chain verification ──
EXPLORER="https://api.explorer.provable.com/v1/testnet"
curl -s "$EXPLORER/program/zkfl_match.aleo/mapping/matches/2field"
curl -s "$EXPLORER/program/zkfl_scoring_v2.aleo/mapping/match_resolved/2field"
curl -s "$EXPLORER/transaction/<TX_ID>"
```

---

## Summary of ZK Properties Demonstrated

| Property | Mechanism | Verified By |
|---|---|---|
| **Private drafts** | `TeamData` encrypted in `draft_team` transition | Explorer shows ciphertext inputs |
| **Tamper-proof commitment** | `team_hash = BHP256(TeamData)` stored on-chain | Mapping query confirms hash exists |
| **Trustless scoring** | `compute_score` generates ZK proof | Transaction proof visible on explorer |
| **Real money prizes** | `credits.aleo` native transfer in `pay_winner` | Winner's wallet balance increases |
| **No double entry** | `entries` mapping checked before insertion | On-chain assertion in `finalize_enter` |
| **No double payout** | `claims` mapping prevents re-payment | On-chain assertion in `finalize_pay` |
