#!/usr/bin/env bash
# next-ticket.sh — Find the next eligible ticket from the sprint queue.
# This is READ-ONLY — it does not claim the ticket. Use claim-ticket.sh for that.
# Usage: bash .claude/skills/scripts/next-ticket.sh

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/task-parse.sh"

# --- Check for already in-progress ticket ---
in_progress="$(list_tickets_by_status "in-progress")"
while IFS= read -r tid; do
  [ -z "$tid" ] && continue
  assigned="$(get_field "$tid" "Assigned")"
  if [ "$assigned" = "claude" ]; then
    title="$(get_title "$tid")"
    priority="$(get_field "$tid" "Priority")"
    size="$(get_field "$tid" "Size")"
    milestone="$(get_field "$tid" "Milestone")"
    echo "## Already In-Progress"
    echo "You already have a ticket claimed:"
    echo ""
    echo "- **Ticket:** ${tid}"
    echo "- **Title:** ${title}"
    echo "- **Priority:** ${priority} | **Size:** ${size}"
    echo "- **Milestone:** ${milestone}"
    echo ""
    echo "Resume this ticket before claiming a new one."
    exit 0
  fi
done <<< "$in_progress"

# --- Scan sprint queue for eligible tickets ---
queue_lines="$(get_sprint_section "Queue")"

if [ -z "$queue_lines" ] || echo "$queue_lines" | grep -q '^\*'; then
  echo "## Sprint Queue Empty"
  echo "No tickets in the sprint queue. Consider pulling eligible tickets from BACKLOG.md."

  # Suggest the next eligible backlog ticket
  echo ""
  echo "### Suggested from Backlog"
  for priority in high medium low; do
    while IFS= read -r tid; do
      [ -z "$tid" ] && continue
      assigned="$(get_field "$tid" "Assigned")"
      [ "$assigned" != "unassigned" ] && continue
      if ! is_blocked "$tid" >/dev/null 2>&1; then
        if deps_met "$tid" >/dev/null 2>&1; then
          title="$(get_title "$tid")"
          size="$(get_field "$tid" "Size")"
          milestone="$(get_field "$tid" "Milestone")"
          echo "- ${tid}: ${title} (Priority: ${priority}, Size: ${size}, Milestone: ${milestone})"
          exit 0
        fi
      fi
    done <<< "$(list_tickets_by_priority "$priority" "todo")"
  done
  echo "- No eligible tickets found in backlog"
  exit 0
fi

# --- Find best candidate from queue ---
found=false
while IFS= read -r line; do
  tid="$(extract_ticket_id "$line")"
  [ -z "$tid" ] && continue

  assigned="$(get_field "$tid" "Assigned")"
  [ "$assigned" != "unassigned" ] && continue

  # Check blockers
  if is_blocked "$tid" >/dev/null 2>&1; then
    continue
  fi

  # Check dependencies
  if ! deps_met "$tid" >/dev/null 2>&1; then
    continue
  fi

  # Found an eligible ticket
  title="$(get_title "$tid")"
  priority="$(get_field "$tid" "Priority")"
  size="$(get_field "$tid" "Size")"
  milestone="$(get_field "$tid" "Milestone")"
  refs="$(get_field "$tid" "Refs")"
  tags="$(get_field "$tid" "Tags")"

  # Get the description (lines after metadata until next ### or ---)
  description=$(awk -v tid="$tid" '
    /^### / { in_ticket = ($2 == tid); in_desc = 0; next }
    in_ticket && /^$/ && !in_desc { in_desc = 1; next }
    in_ticket && in_desc && /^(###|---)/ { exit }
    in_ticket && in_desc { print }
  ' "$BACKLOG")

  echo "## Next Ticket: ${tid}"
  echo "- **Title:** ${title}"
  echo "- **Priority:** ${priority} | **Size:** ${size}"
  echo "- **Milestone:** ${milestone}"
  echo "- **Tags:** ${tags}"
  echo "- **Refs:** ${refs}"
  echo ""
  if [ -n "$description" ]; then
    echo "### Description"
    echo "$description"
    echo ""
  fi
  if [ "$size" = "M" ] || [ "$size" = "L" ] || [ "$size" = "XL" ]; then
    echo "> **Note:** This ticket is size ${size}. Create a plan at \`tasks/plans/${tid}-plan.md\` before starting."
  fi
  echo ""
  echo "To claim: \`bash .claude/skills/scripts/claim-ticket.sh ${tid}\`"
  found=true
  break
done <<< "$queue_lines"

if [ "$found" = false ]; then
  echo "## No Eligible Tickets"
  echo "All tickets in the sprint queue are either assigned, blocked, or have unmet dependencies."
fi
