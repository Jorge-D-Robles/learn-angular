# Navigation & Screen Flow

## Primary Screens

### 1. Station Dashboard (Home)
The main hub. A visual representation of the Nexus Space Station showing all modules.

- **URL:** `/`
- **Purpose:** Overview of progress, quick access to all content
- **Elements:**
  - Station visualization with module glow states (0-5 star mastery)
  - Current rank and XP bar
  - Active story mission prompt
  - Quick-play minigame shortcuts
  - Daily challenge notification
  - Spaced repetition alerts (degrading topics)

### 2. Story Mission View
Linear story mission experience for a single chapter.

- **URL:** `/mission/:chapterId`
- **Purpose:** Introduce an Angular concept through narrative
- **Elements:**
  - Narrative text with station context
  - Interactive code examples (read-only, with highlights)
  - Concept explanation panels
  - "Launch Minigame" button (unlocks after mission completion)
  - Progress indicator (mission steps)

### 3. Minigame Hub
Browse and launch available minigames.

- **URL:** `/minigames`
- **Purpose:** Central access to all minigames
- **Elements:**
  - Grid of minigame cards with mastery stars
  - Locked/unlocked state per game
  - Quick stats (levels completed, best scores)
  - Filter by topic, mastery level

### 4. Minigame Play
The active minigame experience.

- **URL:** `/minigames/:gameId/level/:levelId`
- **Purpose:** Core gameplay
- **Elements:**
  - Game-specific UI (varies per minigame)
  - Score display
  - Timer (if applicable)
  - Pause menu
  - Level completion overlay

### 5. Minigame Level Select
Choose a level within a minigame.

- **URL:** `/minigames/:gameId`
- **Purpose:** Browse levels, see progress, access replay modes
- **Elements:**
  - Level list grouped by tier (basic, intermediate, advanced, boss)
  - Star rating per level
  - Best score / best time
  - Replay mode tabs (Story, Endless, Speed Run, Daily)

### 6. Profile / Progress
Player stats and achievement tracking.

- **URL:** `/profile`
- **Purpose:** Detailed progress view
- **Elements:**
  - Rank and XP breakdown
  - Mastery stars per topic (table view)
  - Achievement badges
  - Play time stats
  - Streak counter

### 7. Settings
App configuration.

- **URL:** `/settings`
- **Purpose:** User preferences
- **Elements:**
  - Sound on/off
  - Animation speed
  - Theme (light/dark/station)
  - Reset progress (with confirmation)

## Navigation Structure

```
/                           Station Dashboard
/mission/:chapterId         Story Mission
/minigames                  Minigame Hub
/minigames/:gameId          Level Select
/minigames/:gameId/level/:levelId   Minigame Play
/minigames/:gameId/endless  Endless Mode
/minigames/:gameId/speedrun Speed Run Mode
/minigames/:gameId/daily    Daily Challenge
/profile                    Profile / Progress
/settings                   Settings
```

## Navigation Components

### Top Bar
- Station logo / home link
- Current rank badge
- XP bar (compact)
- Settings gear icon

### Side Navigation (Desktop)
- Dashboard
- Current Mission
- Minigames
- Profile

### Bottom Navigation (Mobile)
- Dashboard
- Mission
- Games
- Profile

## Responsive Breakpoints
- **Mobile:** < 768px — bottom nav, stacked layouts
- **Tablet:** 768px - 1024px — side nav collapses, game UI adapts
- **Desktop:** > 1024px — full side nav, optimal game UI
