-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Lobbys
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

-- Spieler
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

-- Nacht-Aktionen
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

-- Votes (Bürgermeisterwahl + Tagesvote + Tiebreaker)
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

-- Hexe-Tränke
CREATE TABLE witch_status (
  player_id       UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  heal_used       BOOLEAN DEFAULT false,
  poison_used     BOOLEAN DEFAULT false
);

-- Spiel-Ereignisse
CREATE TABLE game_events (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lobby_code      TEXT REFERENCES lobbies(code) ON DELETE CASCADE,
  round           INT NOT NULL,
  phase           TEXT NOT NULL,
  event_type      TEXT NOT NULL,
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Realtime aktivieren
ALTER TABLE lobbies REPLICA IDENTITY FULL;
ALTER TABLE players REPLICA IDENTITY FULL;
ALTER TABLE votes REPLICA IDENTITY FULL;
ALTER TABLE game_events REPLICA IDENTITY FULL;

-- Row Level Security (für Produktion anpassen)
ALTER TABLE lobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE night_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE witch_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;

-- Einfache Policies: alle lesen, nur Service-Role schreibt
CREATE POLICY "Public read lobbies" ON lobbies FOR SELECT USING (true);
CREATE POLICY "Public read players" ON players FOR SELECT USING (true);
CREATE POLICY "Public read votes" ON votes FOR SELECT USING (true);
CREATE POLICY "Public read events" ON game_events FOR SELECT USING (true);
