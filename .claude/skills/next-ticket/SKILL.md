---
name: next-ticket
description: Find, claim, and begin work on the next highest-priority unblocked ticket from the sprint queue
user-invocable: true
---

# Next Ticket

## Steps

### 1. Find the Next Ticket
Run the next-ticket script to identify the best candidate:
```bash
bash .claude/skills/scripts/next-ticket.sh
```
This script will:
- Check if you already have an in-progress ticket (and tell you to resume it)
- Find the highest-priority, unassigned, unblocked ticket from the Sprint Queue
- Show the ticket details and description
- Suggest a ticket from BACKLOG.md if the queue is empty

**The script is read-only — it does NOT claim the ticket.**

### 2. Claim the Ticket
Once you've identified the ticket to work on, claim it:
```bash
bash .claude/skills/scripts/claim-ticket.sh T-XXXX
```
This script will:
- Validate the ticket exists, is not already claimed, and has met dependencies
- Update `tasks/BACKLOG.md`: set `Status: in-progress`, `Assigned: claude`, add `Started: YYYY-MM-DD`
- Update `tasks/SPRINT.md`: move the ticket from Queue to Active

### 3. Plan (if Size M+)
If the ticket is Size M or larger, create a plan file at `tasks/plans/T-XXXX-plan.md` before starting implementation.

### 4. Begin Work
Start implementation based on the ticket description and refs.

### Fallback
If the scripts fail, fall back to manually reading `tasks/SPRINT.md` and `tasks/BACKLOG.md` to find and claim the next ticket following the rules in `tasks/CLAUDE.md`.
