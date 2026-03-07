#!/usr/bin/env bash
# sprint-status.sh — Print a summary of the current sprint.
# Usage: bash .claude/skills/scripts/sprint-status.sh

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/task-parse.sh"

# --- Header ---
sprint_name="$(get_sprint_field "Sprint")"
milestone="$(get_sprint_field "Milestone")"
goal="$(get_sprint_field "Goal")"
started="$(get_sprint_field "Started")"

echo "## Sprint Status: ${sprint_name}"
echo "- **Milestone:** ${milestone}"
echo "- **Goal:** ${goal}"
echo "- **Started:** ${started}"
echo ""

# --- Active (In-Progress) ---
echo "### Active (In-Progress)"
active_lines="$(get_sprint_section "Active")"
if [ -z "$active_lines" ] || echo "$active_lines" | grep -q '^\*(none'; then
  echo "- None"
else
  echo "$active_lines" | while IFS= read -r line; do
    tid="$(extract_ticket_id "$line")"
    if [ -n "$tid" ]; then
      title="$(get_title "$tid")"
      assigned="$(get_field "$tid" "Assigned")"
      echo "- ${tid}: ${title} (${assigned})"
    fi
  done
fi
echo ""

# --- Queue ---
echo "### Queue"
queue_count="$(count_sprint_section "Queue")"
echo "- ${queue_count} tickets waiting"

# Find highest priority unblocked ticket in queue
queue_lines="$(get_sprint_section "Queue")"
if [ -n "$queue_lines" ] && ! echo "$queue_lines" | grep -q '^\*'; then
  next_tid=""
  while IFS= read -r line; do
    tid="$(extract_ticket_id "$line")"
    [ -z "$tid" ] && continue
    assigned="$(get_field "$tid" "Assigned")"
    [ "$assigned" != "unassigned" ] && continue
    blocker="$(is_blocked "$tid" 2>/dev/null || true)"
    if ! is_blocked "$tid" >/dev/null 2>&1; then
      if deps_met "$tid" >/dev/null 2>&1; then
        next_tid="$tid"
        break
      fi
    fi
  done <<< "$queue_lines"
  if [ -n "$next_tid" ]; then
    echo "- Next up: ${next_tid}: $(get_title "$next_tid")"
  fi
fi
echo ""

# --- Done This Sprint ---
echo "### Done This Sprint"
done_count="$(count_sprint_section "Done This Sprint")"
echo "- ${done_count} tickets completed"
echo ""

# --- Blocked ---
echo "### Blocked"
found_blocked=false
# Check all tickets referenced in sprint
for section in "Active" "Queue"; do
  section_lines="$(get_sprint_section "$section")"
  [ -z "$section_lines" ] && continue
  while IFS= read -r line; do
    tid="$(extract_ticket_id "$line")"
    [ -z "$tid" ] && continue
    reason=""
    if reason="$(is_blocked "$tid" 2>/dev/null)"; then
      echo "- ${tid}: $(get_title "$tid") — Blocked by: ${reason}"
      found_blocked=true
    fi
  done <<< "$section_lines"
done

if [ "$found_blocked" = false ]; then
  echo "- None"
fi
