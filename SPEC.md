# Werwolf Web-Spiel – Vollständige Spezifikation

## Übersicht

Web-basiertes Werwolf-Spiel, gehostet auf **Vercel**. Spieler öffnen dieselbe URL, einer erstellt eine Lobby (erhält einen Code), die anderen treten bei. Das Spiel läuft vollständig im Browser, mit optionalem Google-Login. Nach dem Spiel wird lokal eine Datei mit allen Rollen und Spielinfos erstellt. Gespielt wird gemeinsam im selben Raum – kein integrierter Chat.

---

## Design-Grundsatz

**Mobile-first.** Alle Layouts werden zuerst für Smartphone-Hochformat (360–430 px) gebaut. Größere Bildschirme bekommen ein zentriertes, maximal 480 px breites Layout. Keine Sound-Effekte.

---

## Tech-Stack

| Bereich | Technologie | Begründung |
|---|---|---|
| Framework | **Next.js 14 (App Router)** | Vercel-nativ, SSR + API Routes |
| Styling | **Tailwind CSS** | Utility-first, mobile-first Breakpoints |
| Realtime | **Supabase Realtime** | WebSocket-Channels, kostenlos, kein eigener WS-Server |
| Datenbank | **Supabase (PostgreSQL)** | Lobby-State, Spielzustand, Votes |
| Auth | **Supabase Auth (Google OAuth)** | Google-Login + anonymer Gast-Login |
| State (Client) | **Zustand** | Einfacher globaler Store ohne Boilerplate |
| Animationen | **Framer Motion** | Rollenaufdeckung, Phasen-Übergänge |
| Icons | **Lucide React** | Konsistentes Icon-Set |
| Lokale Datei | **Browser Blob Download** | Rollenexport als `.txt` und `.json` |

---

## Projektstruktur

```
werwolf/
├── app/
│   ├── page.tsx                    # Startseite (Login / Name / Lobby)
│   ├── lobby/[code]/page.tsx       # Lobby-Warteraum
│   ├── game/[code]/page.tsx        # Hauptspiel-View
│   └── api/
│       ├── lobby/route.ts          # Lobby erstellen, beitreten
│       ├── game/start/route.ts     # Spiel starten, Rollen verteilen
│       ├── game/action/route.ts    # Nacht-/Tagesaktionen verarbeiten
│       ├── game/mayor/route.ts     # Bürgermeisterwahl + Nachfolge
│       └── vote/route.ts           # Abstimmungs-Logik
├── components/
│   ├── RoleCard.tsx                # Rollenanzeige (nur für Besitzer sichtbar)
│   ├── PlayerList.tsx              # Spielerliste mit Status + Bürgermeister-Badge
│   ├── NightPhase.tsx              # Nacht-UI (rollenabhängige Ansicht)
│   ├── DayPhase.tsx                # Tag-UI (Diskussion + Abstimmungs-Button für Admin)
│   ├── VotePanel.tsx               # Voting-Komponente (offen oder verdeckt)
│   ├── MayorElection.tsx           # Bürgermeisterwahl-UI
│   ├── TieBreaker.tsx              # Gleichstand → Bürgermeister entscheidet
│   ├── HunterShot.tsx              # Jäger-Pop-up nach Tod
│   ├── GameLog.tsx                 # Ereignis-Log
│   └── AdminPanel.tsx              # Rollen- + Spieleinstellungen für Admin
├── lib/
│   ├── supabase.ts                 # Supabase-Client
│   ├── gameLogic.ts                # Kern-Spiellogik (pure functions)
│   ├── roleAssignment.ts           # Rollen-Verteilungsalgorithmus (Fisher-Yates)
│   ├── autoConfig.ts               # Auto-Konfiguration nach Spielerzahl
│   └── exportGame.ts               # Lokale Datei-Export-Funktion
├── store/
│   └── gameStore.ts                # Zustand globaler Client-Store
├── types/
│   └── game.ts                     # TypeScript-Typen
└── supabase/
    └── schema.sql                  # Datenbank-Schema
```

---

## Datenbank-Schema (Supabase)

```sql
-- Lobbys
CREATE TABLE lobbies (
  code            TEXT PRIMARY KEY,
  admin_id        UUID NOT NULL,
  status          TEXT DEFAULT 'waiting',    -- waiting | mayor_election | night | day_discussion | day_vote | ended
  phase           TEXT,                      -- amor | wolf | witch | seer | priest | hunter | tiebreaker
  round           INT DEFAULT 0,
  config          JSONB,                     -- { wolf:2, witch:1, seer:1, hunter:1, amor:0, mayor:1, fool:1, girl:1, priest:1, villager:2 }
  auto_config     BOOLEAN DEFAULT false,
  votes_visible   BOOLEAN DEFAULT true,      -- Admin stellt ein: Votes offen oder verdeckt
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
  is_mayor        BOOLEAN DEFAULT false,     -- Bürgermeister-Titel (öffentlich sichtbar)
  can_vote        BOOLEAN DEFAULT true,      -- false wenn Dorfdepp aufgedeckt wurde
  lover_id        UUID REFERENCES players(id), -- Amor-Verlinkung
  priest_blessed  BOOLEAN DEFAULT false,     -- für aktuelle Nacht gesegnet
  joined_at       TIMESTAMPTZ DEFAULT now()
);

-- Nacht-Aktionen
CREATE TABLE night_actions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lobby_code      TEXT REFERENCES lobbies(code) ON DELETE CASCADE,
  round           INT NOT NULL,
  phase           TEXT NOT NULL,             -- amor | wolf | witch_heal | witch_poison | seer | priest | girl_peek
  actor_id        UUID REFERENCES players(id),
  target_id       UUID REFERENCES players(id),
  action          TEXT NOT NULL,             -- kill | heal | poison | reveal | bless | peek | link | skip
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Tages-Votes (auch für Bürgermeisterwahl)
CREATE TABLE votes (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lobby_code      TEXT REFERENCES lobbies(code) ON DELETE CASCADE,
  round           INT NOT NULL,
  vote_type       TEXT NOT NULL,             -- mayor_election | day_elimination | tiebreaker
  voter_id        UUID REFERENCES players(id),
  target_id       UUID REFERENCES players(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(lobby_code, round, vote_type, voter_id)
);

-- Hexe-Tränke (persistenter Status)
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
  event_type      TEXT NOT NULL,             -- death | heal | poison | vote | bless | peek_caught | win | mayor_elected | mayor_passed
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

---

## Authentifizierung & Namen

- **Google-Login** via Supabase Auth → Anzeigename aus Google-Profil
- **Gast-Login** → zufälliger Name (Adjektiv + Tier, z.B. „Mutiger Fuchs")
- Name kann vor dem Beitreten manuell geändert werden
- Gewählter Name wird in `localStorage` gecacht

---

## Lobby-System

### Erstellen
1. Spieler klickt „Lobby erstellen"
2. Server generiert **6-stelligen alphanumerischen Code** (z.B. `WR7X2K`)
3. Ersteller wird als **Admin** markiert
4. Lobby-Status: `waiting`

### Beitreten
1. Spieler gibt Code ein → Server prüft Status `waiting`
2. Spieler wird in `players` eingetragen
3. Alle sehen neuen Spieler via Supabase Realtime

### Admin-Panel (nur für Ersteller)
- Rollen-Konfiguration mit `+` / `-` pro Rolle
- Toggle: **Auto-Modus** (Rollen nach Spielerzahl)
- **Einstellung: Votes sichtbar / verdeckt** (einmal festgelegt, gilt für gesamtes Spiel)
- Button: **Spiel starten** (aktiv ab Mindest-Spielerzahl)
- Anzeige: zugewiesene Rollen vs. Spielerzahl

---

## Spieleinstellungen (Admin legt vor Start fest)

| Einstellung | Optionen | Standard |
|---|---|---|
| Votes sichtbar | Offen (alle sehen wer wie votet) / Verdeckt (nur Ergebnis) | Offen |
| Auto-Rollen | Ein / Aus | Aus |
| Bürgermeister-Modus | Ein / Aus | Ein |

---

## Automatische Rollen-Konfiguration (`autoConfig.ts`)

| Spieler | Wölfe | Hexe | Seher | Jäger | Priester | Dorfdepp | Mädchen | Dorfbewohner |
|---------|-------|------|-------|-------|----------|---------|---------|--------------|
| 5–6     | 1     | 1    | 1     | 0     | 0        | 0       | 0       | Rest         |
| 7–9     | 2     | 1    | 1     | 1     | 0        | 0       | 0       | Rest         |
| 10–12   | 3     | 1    | 1     | 1     | 1        | 1       | 0       | Rest         |
| 13–15   | 4     | 1    | 1     | 1     | 1        | 1       | 1       | Rest         |
| 16+     | 5     | 1    | 1     | 1     | 1        | 1       | 1       | Rest         |

Bürgermeister ist kein eigener Slot – die Wahl findet unter allen Spielern statt. Amor ab 8+ Spielern empfohlen.

---

## Rollen – Vollständige Beschreibung

### Dorfbewohner (Villager)
- **Ziel**: Alle Werwölfe eliminieren
- **Nacht**: Keine Aktion, wartet
- **Tag**: Stimmt ab

### Werwolf (Werewolf)
- **Ziel**: Wölfe ≥ lebende Dorfseite erreichen
- **Nacht**: Sieht alle lebenden Spieler → wählt Opfer. Alle Wölfe sehen dieselbe Auswahl. Erster Vote legt Ziel fest, andere können bis Phasenende überschreiben. Phase endet wenn alle Wölfe bestätigt haben.
- **Tag**: Tarnt sich, stimmt ab

### Hexe (Witch)
- **Ziel**: Mit Dorf gewinnen
- **Nacht – Heiltrank** (1× pro Spiel): Sieht Wolfs-Opfer → kann heilen (auch sich selbst)
- **Nacht – Gifttrank** (1× pro Spiel): Kann beliebigen lebenden Spieler töten (auch in selber Nacht wie Heiltrank)
- Hat sie beide Tränke verbraucht, wird ihre Phase übersprungen

### Seher (Seer)
- **Ziel**: Mit Dorf gewinnen
- **Nacht**: Wählt lebenden Spieler → sieht dessen genaue Rolle (nur für ihn)
- **Tag**: Nutzt diese Info in der Diskussion

### Jäger (Hunter)
- **Ziel**: Mit Dorf gewinnen
- **Bei Tod** (durch Wölfe, Hexe, oder Abstimmung): Unmittelbar danach erscheint Pop-up → muss einen lebenden Spieler erschießen → stirbt mit ihm
- Kann nicht auf das Erschießen verzichten

### Amor (Cupid)
- **Nacht – Runde 1 (einmalig)**: Wählt 2 Spieler → sie sind verliebte. Stirbt einer, stirbt der andere sofort
- Amor selbst ist danach normaler Dorfbewohner
- Liebespaar gewinnt nur wenn sie als letztes Paar übrig sind (schlägt Dorf- und Wolf-Sieg)

### Bürgermeister (Mayor) – kein Rollen-Slot, Titel durch Wahl
- **Wahl**: Vor der ersten Nacht stimmen alle Spieler offen ab (jeder 1 Stimme). Meiste Stimmen = Bürgermeister. Bei Gleichstand in der Wahl entscheidet der Admin.
- **Titel ist öffentlich** sichtbar (Badge/Krone in der Spielerliste)
- **Funktion**: Bei Gleichstand in der Tages-Abstimmung entscheidet der Bürgermeister wer eliminiert wird (Tiebreaker-Phase)
- **Bei Tod des Bürgermeisters**: Bevor sein Tod bekanntgegeben wird, wählt er heimlich seinen Nachfolger (Pop-up nur für ihn)

### Dorfdepp (Village Fool)
- **Ziel**: Mit Dorf gewinnen
- **Nacht**: Keine Aktion
- **Besonderheit**: Wird er von der Dorfgemeinschaft zur Eliminierung abgestimmt, wird seine Rolle als „Dorfdepp" aufgedeckt – er **überlebt**, verliert aber dauerhaft sein **Stimmrecht**
- Stirbt er durch Wölfe oder Hexe: normaler Tod, Rolle bleibt geheim

### Mädchen (Little Girl)
- **Ziel**: Mit Dorf gewinnen
- **Nacht – Wolf-Phase**: Kann **einmalig pro Nacht** heimlich spähen (Button „Kurz hinschauen")
  - Erfolgreich: Sieht die **Namen aller Werwölfe** für diese Nacht
  - Risiko: 40 % Chance, dass die Wölfe sie bemerken → können ihr Opfer auf das Mädchen ändern (Wölfe erhalten eine Benachrichtigung „Jemand schaut zu – wollt ihr das Ziel wechseln?")
- Das Mädchen erfährt nicht ob sie entdeckt wurde

### Priester (Priest)
- **Ziel**: Mit Dorf gewinnen
- **Nacht** (1× pro Spiel): Wählt einen lebenden Spieler → dieser ist für **diese eine Nacht immun** gegen Wölfe (Wolf-Angriff prallt ab, Hexen-Gift wirkt trotzdem)
- Der gesegnete Spieler erfährt, dass er gesegnet wurde (aber nicht vom wem)
- Hat der Priester seinen Segen verbraucht, wird seine Phase übersprungen

---

## Game Loop

```
START
  │
  ▼
[Admin startet Spiel]
  │  Rollen werden zufällig verteilt (Fisher-Yates-Shuffle)
  │  Jeder Spieler sieht NUR seine eigene Rolle (RoleCard)
  │  Datei-Download wird vorbereitet (Rollen für Spielleiter)
  │
  ▼
[Bürgermeisterwahl] ← einmalig vor Runde 1 (wenn Bürgermeister-Modus an)
  │  Alle stimmen offen ab
  │  Meiste Stimmen = Bürgermeister (bei Gleichstand: Admin entscheidet)
  │  Bürgermeister-Badge erscheint in der Spielerliste für alle
  │
  ▼
[Nacht-Phase beginnt] ←────────────────────────────────────────────┐
  │                                                                  │
  ├── Phase: AMOR (nur Runde 1, wenn Amor im Spiel)                 │
  │     Amor wählt 2 Spieler → verliebte                           │
  │                                                                  │
  ├── Phase: PRIESTER (wenn Priester noch Segen hat)                │
  │     Priester segnet einen Spieler → immun gegen Wolf diese Nacht│
  │                                                                  │
  ├── Phase: WOLF                                                    │
  │     Wölfe sehen lebende Spieler → wählen Opfer                  │
  │     Mädchen kann „kurz hinschauen" (mit Risiko)                 │
  │     Phase endet wenn alle Wölfe bestätigt haben                 │
  │     → Priester-Check: ist Ziel gesegnet? Angriff prallt ab      │
  │                                                                  │
  ├── Phase: HEXE                                                    │
  │     Hexe sieht Wolfs-Opfer (oder „niemand" bei Priester-Schutz) │
  │     Entscheidet: heilen / vergiften / beides / nichts           │
  │     Beide Tränke verbraucht → Phase übersprungen                │
  │                                                                  │
  ├── Phase: SEHER                                                   │
  │     Wählt Spieler → sieht dessen Rolle                          │
  │                                                                  │
  └── Nacht endet
        Tote werden bekannt gegeben (inkl. Priester-Schutz-Meldung)
        Jäger gestorben? → JÄGER-POP-UP: muss jemanden erschießen
        Liebespaar-Check: stirbt einer → anderer stirbt nach
        Bürgermeister gestorben? → Nachfolge-Pop-up (nur für ihn)
        │
        ▼
[Tag-Phase – Diskussion]
  │  Alle sehen wer gestorben ist + Rollen der Toten
  │  Spieler diskutieren (physisch im selben Raum)
  │  Admin-Button: [Abstimmung starten] ← erst nach der Nacht verfügbar
  │
  ▼
[Tag-Phase – Abstimmung]
  │  Jeder stimmberechtigte lebende Spieler votet (1 Stimme)
  │  Votes: offen (alle sehen live) oder verdeckt (nur Endergebnis) – Admin-Einstellung
  │  Phase endet erst wenn ALLE stimmberechtigten Spieler gevotet haben
  │
  ├── Eindeutiger Gewinner → Eliminiert
  │     Rolle aufgedeckt
  │     Dorfdepp? → überlebt, verliert Stimmrecht, Rolle sichtbar
  │     Jäger? → Erschießungs-Pop-up
  │     Liebespaar? → Partner stirbt nach
  │     Bürgermeister? → Nachfolge-Pop-up
  │
  ├── Gleichstand → TIEBREAKER-PHASE
  │     Bürgermeister wählt wer eliminiert wird (nur für ihn sichtbarer Button)
  │     Kein Bürgermeister mehr im Spiel → niemand wird eliminiert
  │
  └── Gewinnbedingung prüfen
        Dorf gewinnt: alle Wölfe tot
        Wölfe gewinnen: Wölfe ≥ lebende Dorfseite
        Liebespaar gewinnt: sind die letzten beiden Überlebenden
        Kein Gewinner → zurück zu Nacht-Phase ──────────────────────┘

ENDE
  │  Gewinner-Screen
  │  Alle Rollen für alle aufgedeckt
  └── Export-Button (lokale Datei herunterladen)
```

---

## Realtime-Kommunikation (Supabase Channels)

Öffentlicher Channel pro Lobby: `lobby:{code}`

| Event | Empfänger | Beschreibung |
|---|---|---|
| `player_joined` | Alle | Neuer Spieler |
| `player_left` | Alle | Spieler weg |
| `game_started` | Alle | Spiel startet |
| `phase_changed` | Alle | Neue Phase |
| `night_result` | Alle | Ergebnis der Nacht |
| `vote_update` | Alle | Live-Vote-Stand (nur wenn Votes offen) |
| `vote_cast` | Alle | Anzahl bereits abgegebener Votes (immer sichtbar) |
| `player_eliminated` | Alle | Spieler eliminiert + Rolle |
| `fool_revealed` | Alle | Dorfdepp überlebt, verliert Stimmrecht |
| `mayor_elected` | Alle | Bürgermeister gewählt + Name |
| `mayor_passed` | Alle | Bürgermeister-Nachfolge |
| `tiebreaker` | Alle | Gleichstand → Bürgermeister entscheidet |
| `game_over` | Alle | Gewinner |

Private Channels (nur für Rollenspieler):
- `private:wolf:{code}` → Wolf-Aktionen + Mädchen-Warnung
- `private:witch:{code}` → Hexen-Aktionen
- `private:seer:{code}` → Seher-Ergebnis
- `private:priest:{code}` → Priester-Aktion
- `private:girl:{code}` → Späh-Ergebnis
- `private:hunter:{code}` → Erschießungs-Pop-up
- `private:mayor:{code}` → Tiebreaker + Nachfolge
- `private:lover:{code}` → Liebes-Info + Sterbenachricht

---

## Lokale Datei – Export (`exportGame.ts`)

Download beim Spielstart (nur Rollen, für Spielleiter) und am Spielende (vollständiger Log).

**`werwolf_DATUM_CODE.txt`**:
```
WERWOLF SPIEL - Lobby: WR7X2K
Datum: 10.06.2026 | Spieler: 8
Votes: Offen | Bürgermeister: Aktiv

=== ROLLEN ===
1. MutigerFuchs    → WERWOLF
2. SchlauasReh     → HEXE
3. Max Mustermann  → SEHER
4. Anna K.         → WERWOLF
5. TapfererBär     → DORFBEWOHNER
6. KlugeEnte       → DORFDEPP
7. WilderLuchs     → JÄGER
8. SanfteLamm      → MÄDCHEN

=== BÜRGERMEISTER ===
Gewählt: Max Mustermann (Runde 0)

=== SPIEL-LOG ===
[Runde 1 – Nacht]  Wolf tötet: TapfererBär (Priester-Schutz: NEIN)
[Runde 1 – Nacht]  Hexe heilt: TapfererBär
[Runde 1 – Tag]    Dorf votet: KlugeEnte (DORFDEPP – überlebt, kein Stimmrecht mehr)
[Runde 2 – Nacht]  Wolf tötet: SanfteLamm
[Runde 2 – Tag]    Gleichstand: Max Mustermann (Bürgermeister) eliminiert Anna K.
...

=== ERGEBNIS ===
Gewinner: DORF nach 4 Runden
```

---

## UI/UX – Mobile-First Mockups

### Startseite (360 px)
```
┌──────────────────────────┐
│  🐺 WERWOLF              │
│                          │
│  [Mit Google anmelden]   │
│  ──────── oder ────────  │
│  Name:                   │
│  [____________________]  │
│                          │
│  [Lobby erstellen]       │
│                          │
│  Code eingeben:          │
│  [______]  [Beitreten →] │
└──────────────────────────┘
```

### Lobby – Admin-Sicht
```
┌──────────────────────────┐
│  WR7X2K  [Kopieren]      │
│  Spieler: 4              │
│  ● MutigerFuchs (Du) 👑  │
│  ● SchlauasReh           │
│  ● Max Mustermann        │
│  ● Anna K.               │
│                          │
│  ── Einstellungen ──     │
│  Votes: [Offen ▾]        │
│  Bürgermeister: [An ▾]   │
│  [☑] Auto-Rollen         │
│                          │
│  ── Rollen ──            │
│  🐺 Wölfe:   [-] 1 [+]   │
│  🧙 Hexe:    [-] 1 [+]   │
│  👁 Seher:   [-] 1 [+]   │
│  🔫 Jäger:   [-] 0 [+]   │
│  💘 Amor:    [-] 0 [+]   │
│  🃏 Dorfdepp:[-] 0 [+]   │
│  👧 Mädchen: [-] 0 [+]   │
│  ✝ Priester: [-] 0 [+]   │
│  🏠 Dorfb.:  (auto: 1)   │
│                          │
│  [▶ Spiel starten]       │
└──────────────────────────┘
```

### Nacht – Werwolf-Sicht
```
┌──────────────────────────┐
│  🌙 Nacht – Runde 1      │
│  Du bist: WERWOLF        │
│                          │
│  Wähle dein Opfer:       │
│  ○ Max Mustermann        │
│  ○ SchlauasReh           │
│  ○ TapfererBär           │
│  ● WilderLuchs ✓         │
│                          │
│  Anna K.: WilderLuchs ✓  │
│                          │
│  [Bestätigen]            │
└──────────────────────────┘
```

### Nacht – Mädchen-Sicht (während Wolf-Phase)
```
┌──────────────────────────┐
│  🌙 Nacht – Runde 1      │
│  Du bist: MÄDCHEN        │
│  Alle schlafen...        │
│                          │
│  ┌────────────────────┐  │
│  │ Riskant! 40% Chance│  │
│  │ dass du entdeckt   │  │
│  │ wirst.             │  │
│  └────────────────────┘  │
│                          │
│  [👁 Kurz hinschauen]    │
│                          │
│  (Noch nicht gespäht)    │
└──────────────────────────┘
```

### Tag – Diskussions-Phase (Admin-Sicht)
```
┌──────────────────────────┐
│  ☀️ Tag – Runde 1        │
│  Letzte Nacht:           │
│  💀 TapfererBär          │
│                          │
│  Diskutiert...           │
│                          │
│  [▶ Abstimmung starten]  │
│  ← nur Admin sieht das   │
└──────────────────────────┘
```

### Tag – Abstimmung (offen)
```
┌──────────────────────────┐
│  ☀️ Abstimmung – R.1     │
│                          │
│  Max Mustermann  ███ 3   │
│  SchlauasReh     █   1   │
│  Anna K.             0   │
│                          │
│  Dein Vote: Max M. ✓     │
│  Noch ausstehend: 2      │
│  (warten auf alle...)    │
└──────────────────────────┘
```

### Tiebreaker
```
┌──────────────────────────┐
│  ⚖️ Gleichstand!         │
│  Max M. = Anna K. = 2    │
│                          │
│  Bürgermeister           │
│  entscheidet...          │
│                          │
│  [nur für Bürgermeister] │
│  Wen eliminierst du?     │
│  ○ Max Mustermann        │
│  ○ Anna K.               │
│  [Entscheiden]           │
└──────────────────────────┘
```

---

## Gewinnbedingungen

| Gewinner | Bedingung |
|---|---|
| **Dorf** | Alle Werwölfe sind tot |
| **Werwölfe** | Wölfe ≥ lebende Dorfseite (Gleichstand reicht) |
| **Liebespaar** | Die beiden Verliebten sind die einzigen Überlebenden (schlägt alle anderen) |

---

## Phasen-Reihenfolge (pro Runde)

```
Runde 0:  [Bürgermeisterwahl]  ← einmalig
Runde 1+: Amor (nur R.1) → Priester → Wolf (+Mädchen) → Hexe → Seher
          → Nacht-Auflösung (Tote, Jäger, Liebespaar, Bürgermeister-Nachfolge)
          → Tag-Diskussion → [Admin: Abstimmung starten] → Votes
          → Eliminierung (Dorfdepp, Jäger, Liebespaar, Bürgermeister-Nachfolge)
          → Tiebreaker (falls Gleichstand)
          → Gewinncheck
```

---

## Umgebungsvariablen (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=https://deine-domain.vercel.app
```

---

## Vercel Deployment

1. Repository auf GitHub pushen
2. Vercel-Projekt anlegen, GitHub-Repo verbinden
3. Umgebungsvariablen in Vercel Dashboard eintragen
4. Supabase-Projekt anlegen → `supabase/schema.sql` ausführen
5. Google OAuth in Supabase aktivieren (Client-ID/Secret aus Google Cloud Console)
6. `NEXT_PUBLIC_SITE_URL` auf Vercel-Domain setzen (für OAuth-Redirect)

---

## Entschiedene Designfragen

| Frage | Entscheidung |
|---|---|
| Abstimmungs-Start | Admin drückt Button (nach Ende der Nacht verfügbar) |
| Votes sichtbar | Admin stellt vor Spielstart ein (offen oder verdeckt) |
| Gleichstand | Bürgermeister entscheidet; kein Bürgermeister mehr → niemand stirbt |
| Eliminierte Spieler | Warten still (kein Spectator-Modus) |
| Chat | Kein Chat – Spiel wird zusammen im selben Raum gespielt |
| Design | Mobile-first (360–430 px Primärzielbreite) |
| Sound | Keine Sound-Effekte |
| Zusatz-Rollen | Dorfdepp, Mädchen, Priester, Bürgermeister (Wahl) |
