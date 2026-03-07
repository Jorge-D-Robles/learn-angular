---
name: backlog-analyst
description: Run the backlog analyst agent to scan design docs for gaps and generate new tickets in BACKLOG.md
user-invocable: true
---

# Backlog Analyst

Invoke the `backlog-analyst` agent (defined in `.claude/agents/backlog-analyst.md`).

## What it does

1. Reads all design docs (`docs/`), sprint (`tasks/SPRINT.md`), backlog (`tasks/BACKLOG.md`), and completed list (`tasks/COMPLETED.md`)
2. Identifies gaps between what's designed and what's ticketed
3. Generates new tickets and appends them to `tasks/BACKLOG.md`

## When to run

- When the user explicitly asks for it via `/backlog-analyst`
- Automatically after every 10th completed ticket (check `tasks/COMPLETED.md` line count)
- When starting a new milestone to ensure all work is captured

## How to invoke

Use the Task tool with `subagent_type: backlog-analyst` to launch the agent.
