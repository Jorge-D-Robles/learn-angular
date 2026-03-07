#!/usr/bin/env bash
# complete-ticket.sh — Complete a ticket by ID with a summary.
# Removes ticket from BACKLOG.md and SPRINT.md entirely.
# Only artifact is a one-liner in COMPLETED.md.
# Usage: bash .claude/skills/scripts/complete-ticket.sh T-2026-001 "scaffolded the app"

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/task-parse.sh"

if [ $# -lt 2 ]; then
  echo "Usage: complete-ticket.sh TICKET_ID \"summary\"" >&2
  exit 1
fi

TICKET_ID="$1"
SUMMARY="$2"

# --- Validate ticket exists ---
title="$(get_title "$TICKET_ID")"
if [ -z "$title" ]; then
  echo "ERROR: Ticket ${TICKET_ID} not found in BACKLOG.md" >&2
  exit 1
fi

assigned="$(get_field "$TICKET_ID" "Assigned")"

# --- Append to COMPLETED.md (do this FIRST, before removing from BACKLOG) ---
completed_entry="[$(today)] ${TICKET_ID}: ${title} — ${SUMMARY} (${assigned})"

# Remove the placeholder if it exists
if grep -q '^\*(no tickets completed yet)\*' "$COMPLETED"; then
  sed -i '' '/^\*(no tickets completed yet)\*/d' "$COMPLETED"
fi

echo "$completed_entry" >> "$COMPLETED"
echo "COMPLETED.md: archived one-liner"

# --- Remove from SPRINT.md ---
ticket_line=$(grep -n "${TICKET_ID}" "$SPRINT" | head -1)
if [ -n "$ticket_line" ]; then
  line_num=$(echo "$ticket_line" | cut -d: -f1)
  sed -i '' "${line_num}d" "$SPRINT"
  echo "SPRINT.md: removed ${TICKET_ID}"
fi

# --- Remove entire ticket block from BACKLOG.md ---
remove_ticket "$TICKET_ID"
echo "BACKLOG.md: removed ${TICKET_ID}"

# --- Delete plan file if exists ---
plan_file="${PLANS}/${TICKET_ID}-plan.md"
if [ -f "$plan_file" ]; then
  rm "$plan_file"
  echo "Deleted plan file: ${plan_file}"
fi

echo ""
echo "## Completed: ${TICKET_ID}"
echo "- **Title:** ${title}"
echo "- **Summary:** ${SUMMARY}"
echo "- **Agent:** ${assigned}"
