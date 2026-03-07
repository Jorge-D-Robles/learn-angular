---
name: check-backlog
description: Scan the backlog and report ticket statistics by priority, flag blockers, and identify the oldest unassigned high-priority ticket
user-invocable: true
---

# Check Backlog

## Steps

1. Run the backlog health check script from the repo root:
   ```bash
   bash .claude/skills/scripts/check-backlog.sh
   ```
2. Present the output to the user as-is — the script produces the formatted report.
3. If the script fails, fall back to reading `tasks/BACKLOG.md` and `tasks/SPRINT.md` manually and producing the report below.

### Output Format (reference)

```
## Backlog Health Check

### Open Tickets by Priority
- High: [count]
- Medium: [count]
- Low: [count]
- Total open: [count]

### Oldest Unassigned High-Priority
- [ticket ID]: [title] (Milestone: [milestone])

### Blocked Tickets
- [ticket ID]: [title] — Blocked by: [reason]
- (or "None")

### Unmet Dependencies
- [ticket ID]: waiting on [dependency IDs still not done]
- (or "All dependencies met for pullable tickets")

### Tickets by Milestone
- P1: [count open] / [count total]
- P2: [count open] / [count total]
- ...
```

4. Keep it scannable — this is a health check, not a detailed review.
