-- ═══════════════════════════════════════════════════════════
-- ZKFL Database Schema (Supabase / PostgreSQL)
-- ═══════════════════════════════════════════════════════════

-- Run this in Supabase SQL Editor to create all tables

CREATE TABLE IF NOT EXISTS clubs (
    id SERIAL PRIMARY KEY,
    on_chain_id INT UNIQUE NOT NULL,
    name VARCHAR(64) NOT NULL,
    short_name VARCHAR(4),
    api_football_team_id INT,
    crest_url TEXT
);

CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    on_chain_id INT UNIQUE NOT NULL,
    api_football_id INT,
    name VARCHAR(64) NOT NULL,
    web_name VARCHAR(32) NOT NULL,
    club_id INT REFERENCES clubs(id),
    position VARCHAR(3) CHECK (position IN ('GK','DEF','MID','FWD')),
    photo_url TEXT
);

CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    api_football_fixture_id INT UNIQUE,
    on_chain_match_id VARCHAR(128) UNIQUE,
    home_club_id INT REFERENCES clubs(id),
    away_club_id INT REFERENCES clubs(id),
    kickoff TIMESTAMPTZ NOT NULL,
    status VARCHAR(16) DEFAULT 'SCHEDULED',
    home_score INT,
    away_score INT,
    is_resolved BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS match_player_prices (
    match_id INT REFERENCES matches(id),
    player_id INT REFERENCES players(id),
    price_credits BIGINT NOT NULL,
    PRIMARY KEY (match_id, player_id)
);

CREATE TABLE IF NOT EXISTS player_match_stats (
    player_id INT REFERENCES players(id),
    match_id INT REFERENCES matches(id),
    minutes_played INT DEFAULT 0,
    goals INT DEFAULT 0,
    assists INT DEFAULT 0,
    clean_sheet BOOLEAN DEFAULT FALSE,
    saves INT DEFAULT 0,
    penalty_saves INT DEFAULT 0,
    penalty_misses INT DEFAULT 0,
    goals_conceded INT DEFAULT 0,
    yellow_cards INT DEFAULT 0,
    red_card BOOLEAN DEFAULT FALSE,
    own_goals INT DEFAULT 0,
    fantasy_points INT DEFAULT 0,
    bps_score INT DEFAULT 0,
    bonus INT DEFAULT 0,
    PRIMARY KEY (player_id, match_id)
);

CREATE TABLE IF NOT EXISTS contests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    on_chain_id VARCHAR(128) UNIQUE,
    match_id INT REFERENCES matches(id),
    is_admin_created BOOLEAN DEFAULT FALSE,
    contest_type VARCHAR(16) CHECK (contest_type IN ('free','classic','user','h2h')),
    entry_fee_credits BIGINT DEFAULT 0,
    max_entries INT,
    prize_split JSONB,
    invite_code VARCHAR(8),
    deadline TIMESTAMPTZ,
    status VARCHAR(16) DEFAULT 'open',
    total_entries INT DEFAULT 0,
    total_pool_credits BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS users (
    address VARCHAR(63) PRIMARY KEY,
    username VARCHAR(32) UNIQUE,
    avatar_url TEXT,
    total_contests INT DEFAULT 0,
    total_wins INT DEFAULT 0,
    total_earnings_credits BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entries (
    user_address VARCHAR(63) NOT NULL REFERENCES users(address),
    contest_id UUID REFERENCES contests(id),
    team_hash VARCHAR(128) NOT NULL,
    score INT,
    rank INT,
    prize_won_credits BIGINT DEFAULT 0,
    PRIMARY KEY (user_address, contest_id)
);

-- RPC function to increment contest entry count
CREATE OR REPLACE FUNCTION increment_contest_entries(contest_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE contests
  SET total_entries = total_entries + 1,
      total_pool_credits = total_pool_credits + entry_fee_credits
  WHERE id = contest_uuid;
END;
$$ LANGUAGE plpgsql;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_players_club ON players(club_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_contests_match ON contests(match_id);
CREATE INDEX IF NOT EXISTS idx_contests_status ON contests(status);
CREATE INDEX IF NOT EXISTS idx_entries_contest ON entries(contest_id);
CREATE INDEX IF NOT EXISTS idx_entries_user ON entries(user_address);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
