#!/usr/bin/env bash
# check-backlog.sh — Scan the backlog and report ticket health.
# Usage: bash .claude/skills/scripts/check-backlog.sh

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/task-parse.sh"

# --- Count tickets by field/status using awk (grep -c is unreliable with pipefail) ---
count_by() {
  local field="$1"
  local value="$2"
  local status="${3:-}"
  if [ -z "$status" ]; then
    awk -v fld="$field" -v val="$value" '
      $0 == "- " fld ": " val { count++ }
      END { print count+0 }
    ' "$BACKLOG"
  else
    awk -v fld="$field" -v val="$value" -v st="$status" '
      /^### T-[0-9]/ { has_field=0; has_status=0 }
      $0 == "- " fld ": " val { has_field=1 }
      $0 == "- Status: " st { has_status=1 }
      has_field && has_status { count++; has_field=0; has_status=0 }
      END { print count+0 }
    ' "$BACKLOG"
  fi
}

todo_count="$(count_by "Status" "todo")"
inprogress_count="$(count_by "Status" "in-progress")"
done_count="$(count_by "Status" "done")"

high_open="$(count_by "Priority" "high" "todo")"
medium_open="$(count_by "Priority" "medium" "todo")"
low_open="$(count_by "Priority" "low" "todo")"
total_open=$((todo_count + inprogress_count))

echo "## Backlog Health Check"
echo ""
echo "### Open Tickets by Priority"
echo "- High: ${high_open}"
echo "- Medium: ${medium_open}"
echo "- Low: ${low_open}"
echo "- Total open: ${total_open} (${inprogress_count} in-progress, ${todo_count} todo)"
echo ""

# --- Oldest unassigned high-priority ticket ---
echo "### Oldest Unassigned High-Priority"
oldest=""
oldest=$(awk '
  /^### T-[0-9]/ { tid=$2; has_high=0; has_unassigned=0; has_todo=0 }
  /^- Priority: high/ { has_high=1 }
  /^- Assigned: unassigned/ { has_unassigned=1 }
  /^- Status: todo/ { has_todo=1 }
  has_high && has_unassigned && has_todo {
    print tid
    exit
  }
' "$BACKLOG")

if [ -n "$oldest" ]; then
  title="$(get_title "$oldest")"
  milestone="$(get_field "$oldest" "Milestone")"
  echo "- ${oldest}: ${title} (Milestone: ${milestone})"
else
  echo "- None — all high-priority tickets are assigned or done"
fi
echo ""

# --- Blocked tickets ---
echo "### Blocked Tickets"
found_blocked=false
while IFS= read -r tid; do
  [ -z "$tid" ] && continue
  reason=""
  if reason="$(is_blocked "$tid" 2>/dev/null)"; then
    title="$(get_title "$tid")"
    echo "- ${tid}: ${title} — Blocked by: ${reason}"
    found_blocked=true
  fi
done <<< "$(list_tickets_by_status "todo")"

if [ "$found_blocked" = false ]; then
  echo "- None"
fi
echo ""

# --- Unmet dependencies ---
echo "### Unmet Dependencies"
found_unmet=false
while IFS= read -r tid; do
  [ -z "$tid" ] && continue
  unmet=""
  if ! unmet_deps="$(deps_met "$tid" 2>/dev/null)"; then
    title="$(get_title "$tid")"
    echo "- ${tid}: ${title} — waiting on: ${unmet_deps}"
    found_unmet=true
  fi
done <<< "$(list_tickets_by_status "todo")"

if [ "$found_unmet" = false ]; then
  echo "- All dependencies met for pullable tickets"
fi
echo ""

# --- Tickets by milestone ---
echo "### Tickets by Milestone"
for ms in P1 P2 P3 P4 P5 P6 P7 P8; do
  # Single awk pass to count total and done for this milestone
  read -r total done_ms <<< "$(awk -v ms="$ms" '
    /^### T-[0-9]/ { tid=$2; has_ms=0; is_done=0 }
    $0 == "- Milestone: " ms { has_ms=1; total++ }
    /^- Status: done/ { is_done=1 }
    has_ms && is_done { done_count++ }
    END { print total+0, done_count+0 }
  ' "$BACKLOG")"
  open_ms=$((total - done_ms))
  [ "$total" -gt 0 ] && echo "- ${ms}: ${open_ms} open / ${total} total"
done
