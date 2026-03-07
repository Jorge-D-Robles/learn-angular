# Gamification Patterns Research

Research on game-based learning patterns applied to the Learn Angular project.

## Key Principles

### 1. Active Recall over Passive Reading

Players learn by doing, not reading. Each concept is practiced through minigame mechanics that require active application of knowledge. Story missions provide context but keep passive content to a minimum.

**Application:** Minigames are the primary learning vehicle. Story missions are short (5-10 minutes) and always end with a "now go practice" transition to the minigame.

### 2. Spaced Repetition

Knowledge retention improves dramatically when practice is spaced over time rather than crammed. The Ebbinghaus forgetting curve shows ~50% knowledge loss within 24 hours without review.

**Application:**

- Topic mastery degrades after 7-14 days without practice
- Daily challenges rotate through degrading topics
- Refresher challenges are quick (3-5 questions, <2 minutes)
- No punitive mechanics — degradation is a visual nudge, not a blocker

### 3. Desirable Difficulty

Learning is most effective when challenges are slightly beyond current ability. Too easy = boredom. Too hard = frustration. The "zone of proximal development" is the sweet spot.

**Application:**

- 3 difficulty tiers per minigame (basic, intermediate, advanced) + boss
- Players can replay easier levels for XP but get diminishing returns
- Boss levels are designed to stretch — players may fail 2-3 times before succeeding
- Hints available but cost points (self-regulating difficulty)

### 4. Immediate Feedback

Learners need to know immediately whether their action was correct. Delayed feedback weakens the learning association.

**Application:**

- All minigames provide instant visual/audio feedback on correct/incorrect actions
- Code editors show live preview where possible
- Test runners execute in real-time
- Score updates immediately
- No "submit and wait" patterns

### 5. Mastery-Based Progression

Players advance when they demonstrate mastery, not when they've spent enough time. This prevents advancing without understanding.

**Application:**

- Story missions unlock minigames, but minigame mastery unlocks next story missions
- Can't skip to advanced levels without completing basic
- Boss level requires demonstrating all sub-concepts
- 5-star mastery system makes mastery visible and aspirational

### 6. Intrinsic vs Extrinsic Motivation

Extrinsic rewards (XP, ranks) bootstrap engagement, but intrinsic motivation (curiosity, competence, autonomy) sustains it.

**Application:**

- XP and ranks provide extrinsic motivation for early engagement
- Minigames designed to be intrinsically fun (satisfying mechanics, not just "answer questions")
- Player chooses when to replay, which minigames to focus on (autonomy)
- Narrative provides curiosity hooks ("what happens when I rebuild this module?")
- Mastery stars and station visualization provide competence feedback

## Minigame Mechanic Patterns

### Pattern: Assembly/Construction

- **Used in:** Module Assembly (#1)
- **Why it works:** Physical manipulation of parts builds mental model of structure
- **Research:** Constructionist learning theory (Papert) — learning by building

### Pattern: Connection/Wiring

- **Used in:** Wire Protocol (#2), Power Grid (#7)
- **Why it works:** Mapping relationships between concepts through spatial connection
- **Research:** Concept mapping improves retention of relational knowledge

### Pattern: Traffic Control/Sorting

- **Used in:** Flow Commander (#3)
- **Why it works:** Externalizes decision logic; makes abstract control flow tangible
- **Research:** Visualization of abstract concepts aids comprehension

### Pattern: Tower Defense

- **Used in:** Signal Corps (#4)
- **Why it works:** Strategic placement + real-time consequences = engaged learning
- **Research:** Game pressure improves attention and recall (moderate stress is beneficial)

### Pattern: Maze/Navigation

- **Used in:** Corridor Runner (#5)
- **Why it works:** Spatial navigation maps naturally to URL routing concepts
- **Research:** Spatial metaphors improve understanding of hierarchical structures

### Pattern: Timed Reconstruction

- **Used in:** Terminal Hack (#6)
- **Why it works:** Time pressure simulates real-world coding under deadlines; rebuild = deep understanding
- **Research:** Generation effect — actively reconstructing knowledge > passively reviewing

### Pattern: Stream/Pipeline Processing

- **Used in:** Data Relay (#8), Deep Space Radio (#10)
- **Why it works:** Visual pipeline maps directly to data transformation chains
- **Research:** Process tracing improves understanding of sequential transformations

### Pattern: Graph/Node Editor

- **Used in:** Reactor Core (#9)
- **Why it works:** Signal graphs ARE reactive graphs — the metaphor is literal
- **Research:** Node-based visual programming is effective for learning reactive patterns

### Pattern: Test Writing

- **Used in:** System Certification (#11)
- **Why it works:** Writing tests = articulating expected behavior = deep understanding
- **Research:** Explaining to test (teaching effect) improves own comprehension

### Pattern: State Machine Programming

- **Used in:** Blast Doors (#12)
- **Why it works:** Lifecycle = state machine; programming behavior = understanding lifecycle
- **Research:** State-based thinking aids understanding of component lifecycle

## Engagement Mechanics

### Streaks

- **Daily login streak** with increasing bonus (caps at +50% after 5 days)
- **Reset behavior:** Missing a day resets the multiplier, not the streak count
- **Psychology:** Loss aversion makes maintaining streaks compelling

### Leaderboards

- **Scope:** Per-minigame, not global (reduces discouragement)
- **Display:** Show player's rank relative to nearby ranks (not just top 10)
- **Modes:** Speed run leaderboards are competitive; mastery is personal

### Achievement Badges

- **Types:** Discovery (try things), mastery (perfect things), commitment (streaks)
- **Visibility:** Displayed on profile, not intrusive during gameplay
- **Surprise:** Some achievements are hidden until earned (exploration reward)

### Daily Challenges

- **Format:** Curated minigame level, refreshed daily
- **Social:** Same challenge for all players (shared experience)
- **Reward:** Fixed 50 XP bonus + streak contribution

## Anti-Patterns to Avoid

1. **Pay-to-skip:** Never let players skip learning with real money
2. **Artificial wait timers:** No "energy" systems or cooldowns — play as much as you want
3. **Punishment for failure:** Failures cost attempts in a level, not global progress
4. **Content gating by time:** Gate by mastery, not by calendar
5. **Overwhelming UI:** Progressive disclosure — don't show everything at once
6. **Fake difficulty:** Difficulty comes from concept complexity, not from unclear instructions or time pressure alone
