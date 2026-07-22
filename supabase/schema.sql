-- Enable UUID generation for server-owned records.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Lobbies
CREATE TABLE lobbies (
  code            TEXT PRIMARY KEY,
  admin_id        UUID NOT NULL,
  status          TEXT DEFAULT 'waiting',
  phase           TEXT,
  round           INT DEFAULT 0,
  config          JSONB DEFAULT '{}',
  votes_visible   BOOLEAN DEFAULT true,
  mayor_enabled   BOOLEAN DEFAULT true,
  auto_config     BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Players
CREATE TABLE players (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lobby_code      TEXT REFERENCES lobbies(code) ON DELETE CASCADE,
  user_id         UUID,
  display_name    TEXT NOT NULL,
  role            TEXT,
  is_alive        BOOLEAN DEFAULT true,
  is_admin        BOOLEAN DEFAULT false,
  is_mayor        BOOLEAN DEFAULT false,
  can_vote        BOOLEAN DEFAULT true,
  lover_id        UUID REFERENCES players(id),
  priest_blessed  BOOLEAN DEFAULT false,
  joined_at       TIMESTAMPTZ DEFAULT now()
);

-- Night actions
CREATE TABLE night_actions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lobby_code      TEXT REFERENCES lobbies(code) ON DELETE CASCADE,
  round           INT NOT NULL,
  phase           TEXT NOT NULL,
  actor_id        UUID REFERENCES players(id),
  target_id       UUID REFERENCES players(id),
  action          TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Votes for elections, eliminations, and tie breakers
CREATE TABLE votes (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lobby_code      TEXT REFERENCES lobbies(code) ON DELETE CASCADE,
  round           INT NOT NULL,
  vote_type       TEXT NOT NULL,
  voter_id        UUID REFERENCES players(id),
  target_id       UUID REFERENCES players(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(lobby_code, round, vote_type, voter_id)
);

-- Persistent witch resources
CREATE TABLE witch_status (
  player_id       UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  heal_used       BOOLEAN DEFAULT false,
  poison_used     BOOLEAN DEFAULT false
);

-- Public game events
CREATE TABLE game_events (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lobby_code      TEXT REFERENCES lobbies(code) ON DELETE CASCADE,
  round           INT NOT NULL,
  phase           TEXT NOT NULL,
  event_type      TEXT NOT NULL,
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Publish safe row changes only after server-side projections are in place.
ALTER TABLE lobbies REPLICA IDENTITY FULL;
ALTER TABLE players REPLICA IDENTITY FULL;
ALTER TABLE votes REPLICA IDENTITY FULL;
ALTER TABLE game_events REPLICA IDENTITY FULL;

-- RLS is deny-by-default. Never expose role-bearing rows directly to clients.
ALTER TABLE lobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE night_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE witch_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;

-- The browser app uses Realtime Broadcast, not direct table access. Keep these
-- tables locked until server routes or RPCs expose player-specific projections.
REVOKE ALL ON lobbies, players, night_actions, votes, witch_status, game_events FROM anon, authenticated;
