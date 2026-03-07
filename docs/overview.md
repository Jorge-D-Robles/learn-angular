# Overview — Learn Angular

## Vision
A web app that **gamifies learning Angular** through a space-station narrative and polished, deeply replayable minigames. Players rebuild the **Nexus Space Station** after meteor damage, learning Angular concepts as they restore each system.

## Audience
- Developers new to Angular (but comfortable with HTML/CSS/JS basics)
- Developers migrating from other frameworks (React, Vue, Svelte)
- Self-taught developers who learn best by doing, not reading

## Design Philosophy: Minigames-First
Minigames are the stars of this app. The main project curriculum ("Nexus Station") is a lighter narrative thread that ties topics together and provides context, but the minigames are where players spend most of their time, build muscle memory, and have the most fun.

- **Story missions** introduce concepts and provide the "why" and "when"
- **Minigames** handle the "how" through repetition and mastery
- Each story mission unlocks its corresponding minigame
- Minigames are independently satisfying, polished, and replayable

## Theme: Nexus Space Station
The learner is a **Systems Engineer** rebuilding the Nexus Space Station after meteor damage. Angular concepts map naturally to station systems:

| Angular Concept | Station Metaphor |
|----------------|------------------|
| Components | Station modules (self-contained, composable) |
| Services / DI | Power grid (shared systems injected into modules) |
| Routing | Corridor system connecting modules |
| Signals | Reactive sensor network |
| Pipes | Data transformation relays |
| Forms | Crew input terminals |
| HTTP | Deep-space radio to Mission Control |

## Core Game Loop
```
Story Mission (unlock) --> Minigame (master) --> Next Story Mission
```

1. **Play a story mission** — short narrative sequence introducing an Angular concept in context (50 XP)
2. **Unlock the minigame** — the corresponding minigame becomes available
3. **Master the minigame** — play through 15-21 levels across difficulty tiers (15-30 XP per level)
4. **Beat the boss** — complete the boss challenge to prove mastery (150 XP)
5. **Advance** — next story mission unlocks; repeat

## Success Criteria
- Players can learn Angular fundamentals (all 34 topics) entirely within the app
- Each minigame is fun enough to replay independently of progression
- Spaced repetition keeps knowledge fresh without feeling punitive
- A new player can reach "Lieutenant" rank (Phase 1 + 2 complete) in ~10 hours of play
- Content accuracy: all Angular concepts align with official Angular docs

## Content Scope
- **34 story missions** across 6 phases (see `curriculum.md`)
- **12 minigames** covering all major Angular topics (see `minigames/`)
- **8 ranks** from Cadet to Fleet Admiral (see `progression.md`)
- **Mastery system** with 0-5 stars per topic
- **Spaced repetition** with degradation and refresher challenges
- **Replayability** via endless mode, speed runs, and daily challenges
