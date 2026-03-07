# CLAUDE.md — Learn Angular Agent Operating Manual

---

## Task Workflow

Follow this loop every session:

```
1. Read SPRINT.md
2. If you have an in-progress task assigned to you → resume it
3. Otherwise, pick the highest-priority unassigned task from Queue whose deps are met
4. Claim it: set Assigned: claude, Status: in-progress, Started: YYYY-MM-DD
5. Invoke the **planner** agent to write a plan (required for ALL tasks, regardless of size)
6. Then invoke **adversarial-reviewer** and **neutral-reviewer** agents in parallel to review the plan
7. Handle review feedback (revise if needed, re-review until approved)
8. Invoke the **implementer** agent with the approved plan — it implements using TDD in a fresh context
9. Invoke the **pr-reviewer** agent to review the implementer's changes
10. Once approved, follow the `/git-commit` skill to stage, commit, complete ticket, and push
11. Add any discovered bugs/follow-ups as new tickets in BACKLOG.md (including any noted by the implementer)
12. Pick next task (go to step 3)
```

### Claiming a Task
In BACKLOG.md, update the ticket:
```diff
-- Status: todo
-- Assigned: unassigned
+- Status: in-progress
+- Assigned: claude
+- Started: 2026-03-06
```

### Completing a Task
1. Run the completion script:
```bash
bash .claude/skills/scripts/complete-ticket.sh T-2026-001 "scaffolded the Angular app"
```
2. This automatically:
   - Removes the ticket entirely from BACKLOG.md
   - Removes the ticket from SPRINT.md
   - Appends a one-liner to COMPLETED.md (the **only** surviving record)
   - Deletes `tasks/plans/T-2026-001-plan.md` if it exists
3. The one-liner in COMPLETED.md looks like:
```
[2026-03-06] T-2026-001: Initialize Angular project — scaffolded the app (claude)
```

---

## Ticket Format

```markdown
### T-2026-NNN
- Title: Short imperative description
- Status: todo | in-progress | done
- Assigned: unassigned | claude | human
- Priority: high | medium | low
- Size: S | M | L
- Milestone: P1 | P2 | P3 | P4 | P5 | P6 | P7 | P8
- Depends: T-2026-XXX, T-2026-YYY | —
- Blocked-by: — | reason or ticket ID
- Tags: comma, separated, tags
- Refs: docs/DESIGN.md, path/to/file.ts

Freeform description, acceptance criteria, implementation notes.
```

### Field Reference
| Field | Values | Notes |
|---|---|---|
| Status | `todo`, `in-progress`, `done` | Only one ticket should be `in-progress` per agent at a time |
| Assigned | `unassigned`, `claude`, `human` | Claim before starting work |
| Priority | `high`, `medium`, `low` | High = blocks other work or is critical path |
| Size | `S`, `M`, `L` | S=<100 LOC, M=100-200 LOC, L=scaffolding or large tasks that cannot be broken down |
| Milestone | `P1`–`P8` | See milestone table below |
| Depends | Ticket IDs or `—` | Must be `done` before this ticket can start |
| Blocked-by | Reason string or `—` | Updated at claim-time to surface blockers |
| Tags | Comma-separated | For `grep` filtering (e.g., `angular`, `gamification`, `ui`) |
| Refs | File paths | Key files this ticket touches |

### Ticket ID Scheme
Year-scoped sequential: `T-2026-001`, `T-2026-002`, etc.

---

## Milestones

| Milestone | Name | Scope |
|-----------|------|-------|
| P0 | Setup & Design | Design research, scaffolding, docs |
| P1 | Core Engine | Minigame framework, code editor, level system, progression, state |
| P2 | Foundations Bundle | Story missions 1-10 + minigames: Module Assembly, Wire Protocol, Flow Commander, Signal Corps |
| P3 | Navigation Bundle | Story missions 11-13 + Corridor Runner minigame |
| P4 | Forms Bundle | Story missions 14-17 + Terminal Hack minigame |
| P5 | Architecture Bundle | Story missions 18-22 + Power Grid, Data Relay minigames |
| P6 | Signals Bundle | Story missions 23-26 + Reactor Core minigame |
| P7 | Advanced Bundle | Story missions 27-34 + Deep Space Radio, System Certification, Blast Doors minigames |
| P8 | Polish & Replayability | Endless modes, daily challenges, leaderboards, speed runs, cosmetic unlocks |

*Each milestone ships story missions AND their minigames together. Minigames are the higher-effort deliverable in each bundle.*

---

## Plan Files

For **every ticket** (regardless of size), the **main agent** orchestrates planning and review. Subagents cannot spawn other subagents, so the main agent must drive the full loop:

1. Invoke the **planner** agent to research the ticket, design docs, and existing code, and write a plan at `tasks/plans/T-XXXX-plan.md`
2. Once the planner returns, invoke the **adversarial-reviewer** and **neutral-reviewer** agents **in parallel** (both as separate Task calls in a single message) to review the plan
   - **Adversarial reviewer** (principal engineer) — focuses on robustness, completeness, and test coverage
   - **Neutral reviewer** (senior engineer) — focuses on scope alignment, project fit, and clarity
3. Handle the review loop based on average score:
   - **1–2 (REJECT):** Revise the plan (main agent or planner), resubmit to **both** reviewers
   - **3 (REVISE):** Revise the plan, resubmit to **neutral reviewer** only
   - **4 (APPROVED WITH COMMENTS):** Incorporate feedback into the plan, proceed to implementation
   - **5 (APPROVED):** Proceed to implementation
4. After approval, invoke the **implementer** agent with the ticket ID and plan file path. The implementer:
   - Reads the plan and ticket in a fresh context (no context rot from planning/review)
   - Implements using **TDD (Red-Green-Refactor)**: failing tests → minimum code → clean up
   - Runs build, tests, and lint to verify
   - Returns a summary of changes, test results, and any discovered issues
   - **Does NOT commit or modify task files** — the main agent handles that

Plan format:

```markdown
# Plan: T-2026-NNN — Task Title

## Task
<description from BACKLOG.md>

## Architecture
<module boundaries, data flow, key decisions>

## Files to Create/Modify
| File | Action | Purpose |
|------|--------|---------|
| src/app/features/example/example.component.ts | create | New component |

## Test Plan
<what tests to write, how to verify>

## Implementation Order
1. ...
2. ...

## Verification
<how to confirm the implementation is correct>
```

Plans live at `tasks/plans/T-2026-NNN-plan.md`. Delete after the ticket is completed — they are ephemeral working documents.

---

## Sprint Management Rules

1. Only pull tasks into Sprint Queue when their `Depends` are all completed (check COMPLETED.md)
2. Respect priority order: `high` → `medium` → `low`
3. `Done This Sprint` holds one-liner summaries for the retrospective (cleared at sprint close)
4. At sprint close:
   - Record velocity in the sprint header: `Velocity: X tickets completed, Y added mid-sprint, Z rolled over`
   - Archive any remaining Done items to COMPLETED.md
   - Roll over incomplete items back to the BACKLOG
   - Start a new sprint header in SPRINT.md
5. **BACKLOG.md only contains open work.** Completed tickets are removed entirely. COMPLETED.md is the archive.

---

## Commands

These are commands you can run when asked, or self-invoke to stay organized:

### `/sprint-status`
Print a summary of the current sprint:
- Sprint name and goal
- Active tasks (in-progress)
- Queue length
- Done count this sprint
- Any blocked tickets and why

### `/check-backlog`
Scan BACKLOG.md and report:
- Total open tickets by priority (high/medium/low)
- Oldest unassigned high-priority ticket
- Tickets with unmet dependencies
- Tickets with `Blocked-by` set

### `/next-ticket`
Find and claim the next highest-priority, unblocked, unassigned ticket. Print its ID and title before starting.

### `/close-sprint`
End the current sprint:
1. Record velocity in sprint header
2. Move Done items to COMPLETED.md
3. Roll over incomplete items
4. Create new sprint header

### `/backlog-analyst`
Invoke the backlog analyst agent. It will:
1. Read all design docs, sprint, backlog, and completed list
2. Identify gaps between what's designed and what's ticketed
3. Generate new tickets and append them to BACKLOG.md

> **Auto-trigger:** The backlog analyst MUST be run every 10 completed tickets. Check `tasks/COMPLETED.md` line count to determine when the threshold is hit.

---

## Conventions

- **Small, self-contained tickets.** Each ticket should represent a single, measurable change. Target **<200 lines of code** per ticket. If a ticket feels larger, **split it immediately** before starting work. The only exception is bootstrapping/scaffolding work.
- **Break down large tasks.** Size L tickets should be decomposed into multiple smaller sub-tasks (S or M) that together accomplish the original goal. Each sub-task must be self-contained and independently buildable/testable.
- **Small commits.** Each commit should aim to be **<200 LOC** to stay reviewable. One ticket = one commit ideally.
- **One ticket per concern.** Don't bundle unrelated work.
- **Commits reference ticket IDs.** Example: `T-2026-005: implement lesson progress service`
- **Read the design docs.** Before starting a milestone, re-read the relevant doc in `docs/`.
- **Log discovered work.** If you find a bug or missing feature during implementation, add a new ticket to BACKLOG.md immediately.
- **Completed tickets vanish.** Once done, a ticket is removed from BACKLOG.md and SPRINT.md. The **only** record is the one-liner in COMPLETED.md.
- **Run backlog analyst every 10 tickets.** After every 10th completed ticket, invoke the `backlog-analyst` agent to scan for gaps.
- **Auto-update CLAUDE.md.** If you discover a pattern, convention, gotcha, or rule that belongs in a CLAUDE.md file, update it immediately.
