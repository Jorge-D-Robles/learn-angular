#!/usr/bin/env bash
# close-sprint.sh — Close the current sprint and open a new one.
# Done tickets should already have been removed from BACKLOG.md via complete-ticket.sh.
# This script: archives any unarchived done lines, rolls over incomplete tickets, creates new sprint.
# Usage: bash .claude/skills/scripts/close-sprint.sh S02-content "Build content system" P2

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/task-parse.sh"

if [ $# -lt 3 ]; then
  echo "Usage: close-sprint.sh NEW_SPRINT_ID \"goal\" MILESTONE" >&2
  echo "Example: close-sprint.sh S02-content \"Build the Angular content and lesson system\" P2" >&2
  exit 1
fi

NEW_SPRINT="$1"
NEW_GOAL="$2"
NEW_MILESTONE="$3"

# --- Read old sprint info ---
old_sprint="$(get_sprint_field "Sprint")"

echo "## Closing Sprint: ${old_sprint}"
echo ""

# --- Count velocity ---
done_lines="$(get_sprint_section "Done This Sprint")"
done_count=0
if [ -n "$done_lines" ] && ! echo "$done_lines" | grep -q '^\*(none'; then
  done_count=$(echo "$done_lines" | awk '/T-[0-9]{4}-[0-9]{3}/ { count++ } END { print count+0 }')
fi

active_lines="$(get_sprint_section "Active")"
active_count=0
if [ -n "$active_lines" ] && ! echo "$active_lines" | grep -q '^\*(none'; then
  active_count=$(echo "$active_lines" | awk '/T-[0-9]{4}-[0-9]{3}/ { count++ } END { print count+0 }')
fi

queue_lines="$(get_sprint_section "Queue")"
queue_count=0
if [ -n "$queue_lines" ] && ! echo "$queue_lines" | grep -q '^\*'; then
  queue_count=$(echo "$queue_lines" | awk '/T-[0-9]{4}-[0-9]{3}/ { count++ } END { print count+0 }')
fi

rollover_count=$((active_count + queue_count))

echo "### Velocity"
echo "- Completed: ${done_count}"
echo "- Rolled over: ${rollover_count}"
echo ""

# --- Archive done items to COMPLETED.md (safety net for any not yet archived) ---
if [ "$done_count" -gt 0 ]; then
  if grep -q '^\*(no tickets completed yet)\*' "$COMPLETED"; then
    sed -i '' '/^\*(no tickets completed yet)\*/d' "$COMPLETED"
  fi

  echo "$done_lines" | while IFS= read -r line; do
    tid="$(extract_ticket_id "$line")"
    [ -z "$tid" ] && continue
    if ! grep -q "$tid" "$COMPLETED"; then
      echo "$line" | sed "s/^- /[$(today)] /" >> "$COMPLETED"
    fi
  done
  echo "Archived ${done_count} tickets to COMPLETED.md"
fi

# --- Roll over incomplete tickets ---
if [ "$rollover_count" -gt 0 ]; then
  if [ -n "$active_lines" ] && ! echo "$active_lines" | grep -q '^\*(none'; then
    echo "$active_lines" | while IFS= read -r line; do
      tid="$(extract_ticket_id "$line")"
      [ -z "$tid" ] && continue
      set_field "$tid" "Status" "todo"
      set_field "$tid" "Assigned" "unassigned"
      remove_field "$tid" "Started"
    done
  fi
  echo "Reset ${rollover_count} rolled-over tickets in BACKLOG.md"
fi

# --- Write new SPRINT.md ---
cat > "$SPRINT" << SPRINT_EOF
# Current Sprint

Sprint: ${NEW_SPRINT}
Milestone: ${NEW_MILESTONE}
Goal: ${NEW_GOAL}
Started: $(today)

<!-- Velocity: (recorded at sprint close) -->

---

## Active

*(none — pick from Queue)*

---

## Queue

*(populate from BACKLOG.md — pull eligible tickets for ${NEW_MILESTONE})*

---

## Done This Sprint

*(none yet)*
SPRINT_EOF

echo "Created new sprint: ${NEW_SPRINT}"
echo ""
echo "## Sprint Opened: ${NEW_SPRINT}"
echo "- **Milestone:** ${NEW_MILESTONE}"
echo "- **Goal:** ${NEW_GOAL}"
echo ""
echo "> **Next step:** Pull eligible tickets from BACKLOG.md into the Queue."
echo "> Run \`bash .claude/skills/scripts/check-backlog.sh\` to see what's available."
