#!/usr/bin/env bash
# claim-ticket.sh — Claim a ticket by ID.
# Mutates: BACKLOG.md (status, assigned, started) and SPRINT.md (Queue -> Active).
# Usage: bash .claude/skills/scripts/claim-ticket.sh T-2026-001

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/task-parse.sh"

if [ $# -lt 1 ]; then
  echo "Usage: claim-ticket.sh TICKET_ID" >&2
  exit 1
fi

TICKET_ID="$1"
AGENT="${2:-claude}"

# --- Validate ticket exists ---
title="$(get_title "$TICKET_ID")"
if [ -z "$title" ]; then
  echo "ERROR: Ticket ${TICKET_ID} not found in BACKLOG.md" >&2
  exit 1
fi

# --- Check current status ---
status="$(get_field "$TICKET_ID" "Status")"
if [ "$status" = "in-progress" ]; then
  echo "ERROR: Ticket ${TICKET_ID} is already in-progress" >&2
  exit 1
fi
if [ "$status" = "done" ]; then
  echo "ERROR: Ticket ${TICKET_ID} is already done" >&2
  exit 1
fi

# --- Check dependencies ---
if ! unmet="$(deps_met "$TICKET_ID" 2>/dev/null)"; then
  echo "ERROR: Ticket ${TICKET_ID} has unmet dependencies: ${unmet}" >&2
  exit 1
fi

# --- Check blockers ---
if blocker="$(is_blocked "$TICKET_ID" 2>/dev/null)"; then
  echo "ERROR: Ticket ${TICKET_ID} is blocked: ${blocker}" >&2
  exit 1
fi

# --- Update BACKLOG.md ---
set_field "$TICKET_ID" "Status" "in-progress"
set_field "$TICKET_ID" "Assigned" "$AGENT"
add_field "$TICKET_ID" "Started" "$(today)"

echo "BACKLOG.md updated:"
echo "   - Status: in-progress"
echo "   - Assigned: ${AGENT}"
echo "   - Started: $(today)"

# --- Update SPRINT.md: move from Queue to Active ---
# Find the line in Queue that references this ticket
queue_line=$(grep -n "${TICKET_ID}" "$SPRINT" | head -1)
if [ -n "$queue_line" ]; then
  line_num=$(echo "$queue_line" | cut -d: -f1)

  # Remove the line from its current position
  sed -i '' "${line_num}d" "$SPRINT"

  # Build the Active entry
  active_entry="- **${TICKET_ID}**: ${title} (Assigned: ${AGENT}, Status: in-progress)"

  # Find the Active section header
  active_line=$(grep -n "^## Active" "$SPRINT" | head -1 | cut -d: -f1)
  if [ -n "$active_line" ]; then
    # Remove any placeholder in the Active section (between ## Active and ---)
    sed -i '' '/^\*(none.*Queue)/d' "$SPRINT"

    # Re-find the Active header (line numbers may have shifted)
    active_line=$(grep -n "^## Active" "$SPRINT" | head -1 | cut -d: -f1)
    insert_line=$((active_line + 1))

    # Insert after a blank line following ## Active
    sed -i '' "${active_line}a\\
\\
${active_entry}
" "$SPRINT"
  fi
  echo "SPRINT.md updated: moved ${TICKET_ID} from Queue to Active"
else
  echo "WARNING: ${TICKET_ID} not found in SPRINT.md Queue — BACKLOG.md was still updated"
fi

echo ""
echo "## Claimed: ${TICKET_ID}"
echo "- **Title:** ${title}"
priority="$(get_field "$TICKET_ID" "Priority")"
size="$(get_field "$TICKET_ID" "Size")"
milestone="$(get_field "$TICKET_ID" "Milestone")"
echo "- **Priority:** ${priority} | **Size:** ${size}"
echo "- **Milestone:** ${milestone}"
