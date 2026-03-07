# CLAUDE.md

## Project
**Learn Angular** — a web app that gamifies learning Angular through a space-station narrative ("Nexus Station") and 12 polished, deeply replayable minigames. See `docs/overview.md` for full vision.

## Tech Stack
Angular 21 · TypeScript · (remaining stack TBD after design research)

## Repo Layout
```
docs/               # Design specs (source of truth for ALL requirements)
  CLAUDE.md         #   Agent rules for working with specs
  overview.md       #   Vision, audience, core game loop
  curriculum.md     #   34-chapter learning path
  progression.md    #   XP, ranks, mastery, spaced repetition
  architecture.md   #   Tech architecture (TBD, populated during P1)
  minigames/        #   One spec file per minigame (12 total)
  ux/               #   Navigation flow, visual style guide
  research/         #   Topic analysis, gamification patterns
refs/               # External reference material (git submodules)
  angular/          #   Angular source repo (sparse checkout: adev/src/content/ only)
tasks/              # Task management (sprint-based ticket system)
  CLAUDE.md         #   Agent workflow, ticket format, commands <- READ THIS FIRST
  BACKLOG.md        #   All tickets
  SPRINT.md         #   Current sprint
  COMPLETED.md      #   Archive
  plans/            #   Ephemeral plan files
```

## Rules
1. **Read `tasks/CLAUDE.md` before doing any work.** It defines the ticket workflow, claim process, and sprint rules.
2. **Read the relevant `docs/` spec before starting a milestone.** Never guess — the spec is the source of truth.
3. **Work through tickets, not ad-hoc.** Pick up tickets via the `/next-ticket` command. Log discovered bugs as new tickets in `BACKLOG.md`.
4. **Commit messages reference ticket IDs.** Format: `T-2026-NNN: short description`
5. **Test-driven development (Red-Green-Refactor).**
   - **Red:** Write failing tests first — tests define the expected behavior/contract.
   - **Green:** Write the minimum code to make the tests pass.
   - **Refactor:** Clean up code — remove bloat, unused variables, duplication. Keep it lean.
6. **Clean, modular code.** Idiomatic TypeScript. Small files, small functions. No monoliths.
7. **Auto-update CLAUDE.md.** If you discover a pattern, convention, gotcha, or rule that should be documented, update the relevant CLAUDE.md immediately.

## Commands
Use these skills or agents when needed:
- `/sprint-status` — Current sprint summary
- `/check-backlog` — Backlog health check
- `/next-ticket` — Claim and start the next ticket
- `/close-sprint` — End sprint, archive, start new one
- `/backlog-analyst` — Run backlog analyst agent to find and ticket design gaps
- `/angular-docs` — Query Angular docs via the angular-docs-lookup agent
