# docs/ — Agent Instructions

## Authority

Design specs in this directory are the **source of truth** for all requirements. If a ticket in `tasks/BACKLOG.md` conflicts with a spec here, the spec wins. Update the ticket, not the spec (unless the spec itself needs revision via a design ticket).

## Rules

1. **Read before building.** Always read the relevant spec before starting implementation work.
2. **One minigame per file.** Each minigame spec lives in `docs/minigames/NN-name.md`. Do not merge them.
3. **Curriculum order = prerequisite order.** Chapter N can only reference concepts from chapters 1 through N-1.
4. **Update specs when decisions change.** If implementation reveals a design flaw, update the spec first, then update tickets.
5. **Tickets reference docs.** Every ticket should have a `Refs:` field pointing to the relevant spec file(s).
6. **Use the template.** New minigame specs must follow `docs/minigames/TEMPLATE.md`.

## File Index

| File                                  | Contents                                                   |
| ------------------------------------- | ---------------------------------------------------------- |
| `overview.md`                         | Vision, audience, success criteria, core game loop         |
| `curriculum.md`                       | 34-chapter learning path with topic dependencies           |
| `progression.md`                      | XP, ranks, mastery stars, spaced repetition, replayability |
| `architecture.md`                     | Technical architecture (populated during P1)               |
| `minigames/TEMPLATE.md`               | Spec template for new minigames                            |
| `minigames/01-*.md` through `12-*.md` | Individual minigame specs                                  |
| `ux/navigation.md`                    | Screen flow and routing structure                          |
| `ux/visual-style.md`                  | Colors, typography, styling approach                       |
| `research/angular-topic-analysis.md`  | Angular docs to topic mapping                              |
| `research/gamification-patterns.md`   | Game-based learning research                               |
