# Progression System

The progression system is weighted heavily toward minigames. Story missions provide context and unlock minigames, but the bulk of XP and mastery comes from minigame play.

## Core Loop
```
Story Mission (unlock) --> Minigame (master) --> Next Story Mission
```

## XP Sources

| Source | XP | Notes |
|--------|-----|-------|
| Story mission completion | 50 | Context and motivation |
| Minigame level completion | 15-30 | Bulk of XP; scales with difficulty tier |
| Minigame boss level | 150 | Major milestone per topic |
| Perfect score on any level | 2x multiplier | Rewards precision |
| Daily challenge completion | 50 bonus | Encourages daily play |
| Streak bonus | +10% per consecutive day | Caps at +50% (5 days) |

### XP Math Example
A single minigame with 18 levels (6 basic + 6 intermediate + 5 advanced + 1 boss):
- Basic: 6 x 15 XP = 90 XP
- Intermediate: 6 x 20 XP = 120 XP
- Advanced: 5 x 30 XP = 150 XP
- Boss: 1 x 150 XP = 150 XP
- **Total per minigame: ~510 XP** (plus 50 XP for the story mission that unlocked it)
- Perfect scores can double individual level XP

## Station Ranks

| Rank | XP Required | Approx. Milestone |
|------|------------|-------------------|
| Cadet | 0 | Starting rank |
| Ensign | 500 | Mid Phase 1 |
| Lieutenant | 1,500 | Phase 1 complete |
| Commander | 3,500 | Phase 2-3 complete |
| Captain | 6,500 | Phase 4-5 complete |
| Admiral | 10,000 | Phase 6 midpoint |
| Station Commander | 15,000 | All content complete |
| Fleet Admiral | 25,000 | Mastery + replayability |

## Mastery Stars (0-5 per topic)

Each Angular topic has a mastery rating displayed on the station dashboard. Modules glow brighter with higher mastery.

| Stars | How to Earn |
|-------|-------------|
| 0 | Topic not yet started |
| 1 | Story mission completed |
| 2 | Basic minigame levels completed |
| 3 | Advanced minigame levels completed |
| 4 | Boss level completed |
| 5 | All levels perfected (perfect score on every level) |

### Visual Feedback
- 0 stars: Module is dark/damaged
- 1 star: Module has emergency lighting
- 2 stars: Module is partially operational (dim glow)
- 3 stars: Module is fully operational (steady glow)
- 4 stars: Module is optimized (bright glow)
- 5 stars: Module is perfected (golden glow with particle effects)

## Spaced Repetition

Knowledge degrades over time without practice. This encourages players to revisit topics and builds long-term retention.

### Degradation Rules
- Topics begin degrading **7 days** after last practice
- Full degradation occurs at **14 days** (mastery drops by 1 star)
- Maximum degradation: 2 stars lost (a 5-star topic bottoms at 3 stars)
- Degradation is displayed as a visual "power drain" on the station dashboard

### Refresher Challenges
- **Quick refreshers**: 3-5 questions, restore 1 star of lost mastery
- **Format**: Mix of minigame micro-levels and multiple-choice questions
- **Daily challenge mode**: Automatically rotates through degrading topics
- **No penalty for skipping**: Degradation is a nudge, not a punishment

## Replayability

Each minigame supports multiple replay modes beyond the main level progression:

### Endless Mode
- Procedurally generated levels of increasing difficulty
- No end — play until you fail
- High score tracked per minigame

### Speed Runs
- Timed mode: complete levels as fast as possible
- Par times set per level
- Leaderboards (local initially, online later)

### Daily Challenges
- Curated levels refreshed daily
- Mix of topics to encourage breadth
- Bonus XP for completion
- 7-day streak rewards

### Cosmetic Unlocks (Future)
- Station module skins
- UI themes
- Achievement badges
- Unlocked at rank milestones and mastery milestones
