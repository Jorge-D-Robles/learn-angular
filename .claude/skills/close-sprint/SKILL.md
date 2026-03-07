---
name: close-sprint
description: Close the current sprint by recording velocity, archiving done tickets, rolling over incomplete work, and starting a new sprint
user-invocable: true
---

# Close Sprint

## Steps

### 1. Review Current Sprint
First, check what's in the current sprint:
```bash
bash .claude/skills/scripts/sprint-status.sh
```

### 2. Close the Sprint
Run the close-sprint script with the new sprint parameters:
```bash
bash .claude/skills/scripts/close-sprint.sh NEW_SPRINT_ID "goal" MILESTONE
```

**Arguments:**
- `NEW_SPRINT_ID`: e.g., `S02-auth` (format: `S[NN]-[short-name]`)
- `"goal"`: one sentence sprint goal, quoted
- `MILESTONE`: e.g., `P2` — the milestone this sprint targets

**Example:**
```bash
bash .claude/skills/scripts/close-sprint.sh S02-engine "Build the learning engine core" P2
```

The script will:
1. Count velocity (completed, rolled over)
2. Archive Done items to `tasks/COMPLETED.md`
3. Reset rolled-over tickets in `tasks/BACKLOG.md` (status -> todo, assigned -> unassigned)
4. Replace `tasks/SPRINT.md` with a fresh sprint template

### 3. Populate the New Sprint Queue
After the script runs, the Queue will be empty. Pull eligible tickets from BACKLOG.md:
```bash
bash .claude/skills/scripts/check-backlog.sh
```
Manually add tickets to the Queue section in `tasks/SPRINT.md`, ordered by priority. Aim for 4-8 tickets depending on Size.

### 4. Report
Print the sprint retrospective summary from the script output.

### Completing Individual Tickets
To complete a ticket during the sprint (not at close), use:
```bash
bash .claude/skills/scripts/complete-ticket.sh T-XXXX "summary of what was done"
```

### Fallback
If scripts fail, follow the manual process in `tasks/CLAUDE.md` Sprint Management Rules.
