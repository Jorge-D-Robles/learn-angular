---
name: git-commit
description: Stage, commit, and push changes after PR reviewer approval
user-invocable: true
---

# Git Commit Workflow

**Prerequisite:** This skill MUST only be invoked after the `pr-reviewer` agent has issued an APPROVED verdict.

## Steps

### 1. Verify Approval

Confirm that the PR reviewer approved the changes. If no approval exists, **stop and run the pr-reviewer first**.

### 2. Identify the Ticket

Find the active ticket ID from `tasks/SPRINT.md` (look in the Active section) or from the plan file that was just implemented.

### 3. Stage Changes

Stage only the files related to this ticket:

```bash
git add <files>
```

**Important:**
- Review `git status` before staging
- Do NOT stage unrelated files
- Do NOT stage `.env`, secrets, or IDE config files
- If `tasks/plans/T-XXXX-plan.md` exists, do NOT stage it (plans are ephemeral)

If all modified files are relevant to the ticket, you may use:
```bash
git add -A
```

But always run `git status` first and verify.

### 4. Commit

Commit with a message that references the ticket ID:

```bash
git commit -m "T-2026-NNN: short description of what was implemented"
```

**Commit message rules:**
- Start with the ticket ID: `T-2026-NNN: `
- Use imperative mood: "implement", "add", "fix" — not "implemented", "added", "fixed"
- Keep the first line under 72 characters
- If more detail is needed, add a blank line then a body paragraph

**Example:**
```bash
git commit -m "T-2026-009: implement Room entities and TypeConverters

Add Quest, HeroStat, ActivityEntry, SyncMeta, and FitnessSnapshot
entities with all TypeConverters for enums and date types."
```

### 5. Complete the Ticket

Run the completion script to archive the ticket:

```bash
bash .claude/skills/scripts/complete-ticket.sh T-2026-NNN "short summary of work done"
```

This removes the ticket from BACKLOG.md and SPRINT.md, and archives a one-liner to COMPLETED.md.

### 6. Stage and Commit Task File Updates

The completion script modifies task files. Stage and commit those too:

```bash
git add tasks/BACKLOG.md tasks/SPRINT.md tasks/COMPLETED.md
git commit -m "T-2026-NNN: archive completed ticket"
```

### 7. Push

Push to the remote:

```bash
git push
```

If the branch doesn't have an upstream yet:
```bash
git push -u origin $(git branch --show-current)
```

### 8. Clean Up

Delete the plan file if it exists:

```bash
rm -f tasks/plans/T-2026-NNN-plan.md
```

## Output

After completing all steps, print:

```
## Committed & Pushed: T-2026-NNN
- **Branch:** <branch name>
- **Commit:** <short hash> — <commit message>
- **Files changed:** N files (+X, -Y lines)
- **Ticket archived:** yes
```

### 9. Check Backlog Analyst Trigger

Count the completed tickets in `tasks/COMPLETED.md`:

```bash
grep -cE '^\[' tasks/COMPLETED.md
```

If the count is a **multiple of 10** (10, 20, 30, ...), invoke the `backlog-analyst` agent to scan for gaps and add new tickets. This keeps the backlog healthy as the project grows.

## Rules

- **Never push without PR reviewer approval.** This is the gate.
- **Never force push.** Use `git push`, never `git push --force`.
- **Never commit secrets.** Double-check for API keys, tokens, passwords.
- **One ticket per commit.** Don't bundle work from multiple tickets.
- **Keep task files in a separate commit.** The task management changes should be a clean follow-up commit.
