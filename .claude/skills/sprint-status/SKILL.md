---
name: sprint-status
description: Print a summary of the current sprint status including active tasks, queue, done count, and blockers
user-invocable: true
---

# Sprint Status

## Steps

1. Run the sprint status script from the repo root:
   ```bash
   bash .claude/skills/scripts/sprint-status.sh
   ```
2. Present the output to the user as-is — the script produces the formatted report.
3. If the script fails, fall back to reading `tasks/SPRINT.md` and `tasks/BACKLOG.md` manually and producing the report below.

### Output Format (reference)

```
## Sprint Status: [Sprint Name]
- **Milestone:** [milestone]
- **Goal:** [goal]
- **Started:** [date]

### Active (In-Progress)
- [list each in-progress ticket with ID, title, and assignee]
- (or "None" if empty)

### Queue
- [count] tickets waiting
- Next up: [highest priority unblocked ticket ID and title]

### Done This Sprint
- [count] tickets completed

### Blocked
- [list any tickets where Blocked-by is not "—", with the reason]
- (or "None" if no blockers)
```

4. If there are tickets in the Queue whose `Depends` reference incomplete tickets, flag them as **not yet pullable**.
5. Keep the output concise — this is a status check, not a full report.
