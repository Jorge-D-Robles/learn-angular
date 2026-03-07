#!/usr/bin/env bash
# task-parse.sh — Core parser library for the Learn Angular task management system.
# Source this file from other scripts: source "$(dirname "$0")/task-parse.sh"
#
# Provides shared functions for reading and mutating tasks/BACKLOG.md,
# tasks/SPRINT.md, and tasks/COMPLETED.md.

set -euo pipefail

# ---------------------------------------------------------------------------
# Path resolution
# ---------------------------------------------------------------------------

# Find the git repo root, then resolve tasks/ from there.
resolve_tasks_dir() {
  local root
  root="$(git rev-parse --show-toplevel 2>/dev/null)" || {
    echo "ERROR: not inside a git repository" >&2
    return 1
  }
  echo "${root}/tasks"
}

TASKS_DIR="$(resolve_tasks_dir)"
BACKLOG="${TASKS_DIR}/BACKLOG.md"
SPRINT="${TASKS_DIR}/SPRINT.md"
COMPLETED="${TASKS_DIR}/COMPLETED.md"
PLANS="${TASKS_DIR}/plans"

# ---------------------------------------------------------------------------
# Date helper
# ---------------------------------------------------------------------------

today() {
  date +%Y-%m-%d
}

# ---------------------------------------------------------------------------
# Field getters — read a metadata field from a ticket in BACKLOG.md
# ---------------------------------------------------------------------------

# get_field TICKET_ID FIELD_NAME
# Prints the value of a metadata field for the given ticket.
# Example: get_field T-2026-001 Status  →  "todo"
get_field() {
  local ticket_id="$1"
  local field="$2"
  awk -v tid="$ticket_id" -v fld="$field" '
    /^### / { in_ticket = ($2 == tid) }
    in_ticket && $0 ~ "^- " fld ": " {
      sub("^- " fld ": ", "")
      print
      exit
    }
  ' "$BACKLOG"
}

# get_title TICKET_ID
# Prints the Title field.
get_title() {
  get_field "$1" "Title"
}

# ---------------------------------------------------------------------------
# Field setters — update a metadata field in BACKLOG.md in-place
# ---------------------------------------------------------------------------

# set_field TICKET_ID FIELD_NAME VALUE
# Updates an existing field. Uses sed in-place (macOS compatible).
set_field() {
  local ticket_id="$1"
  local field="$2"
  local value="$3"

  # We need to find the line within the correct ticket block.
  # Strategy: use awk to find the line number, then sed to replace.
  local line_num
  line_num=$(awk -v tid="$ticket_id" -v fld="$field" '
    /^### / { in_ticket = ($2 == tid) }
    in_ticket && $0 ~ "^- " fld ": " { print NR; exit }
  ' "$BACKLOG")

  if [ -z "$line_num" ]; then
    echo "ERROR: field '${field}' not found in ticket ${ticket_id}" >&2
    return 1
  fi

  sed -i '' "${line_num}s/^- ${field}: .*$/- ${field}: ${value}/" "$BACKLOG"
}

# add_field TICKET_ID FIELD_NAME VALUE
# Adds a new field line after the last metadata field of the ticket.
# Used for adding Started: or Completed: dates.
add_field() {
  local ticket_id="$1"
  local field="$2"
  local value="$3"

  # Find the last metadata line (starts with "- ") in this ticket block.
  local last_meta_line
  last_meta_line=$(awk -v tid="$ticket_id" '
    /^### / {
      if (in_ticket && last) { print last; printed=1; exit }
      in_ticket = ($2 == tid); last = ""
    }
    in_ticket && /^- / { last = NR }
    END { if (!printed && in_ticket && last) print last }
  ' "$BACKLOG")

  if [ -z "$last_meta_line" ]; then
    echo "ERROR: could not find metadata block for ticket ${ticket_id}" >&2
    return 1
  fi

  sed -i '' "${last_meta_line}a\\
- ${field}: ${value}
" "$BACKLOG"
}

# remove_field TICKET_ID FIELD_NAME
# Removes a field line from a ticket.
remove_field() {
  local ticket_id="$1"
  local field="$2"

  local line_num
  line_num=$(awk -v tid="$ticket_id" -v fld="$field" '
    /^### / { in_ticket = ($2 == tid) }
    in_ticket && $0 ~ "^- " fld ": " { print NR; exit }
  ' "$BACKLOG")

  if [ -n "$line_num" ]; then
    sed -i '' "${line_num}d" "$BACKLOG"
  fi
}

# remove_ticket TICKET_ID
# Removes an entire ticket block (header, metadata, description) from BACKLOG.md.
# The block spans from "### T-XXXX" to just before the next "### " or "---" or "## ".
remove_ticket() {
  local ticket_id="$1"

  # Find the start and end line numbers of the ticket block
  local range
  range=$(awk -v tid="$ticket_id" '
    /^### / && $2 == tid { start = NR; in_ticket = 1; next }
    in_ticket && (/^### / || /^---/ || /^## /) { print start "," NR-1; found=1; exit }
    END { if (in_ticket && !found) print start "," NR }
  ' "$BACKLOG")

  if [ -z "$range" ]; then
    echo "ERROR: ticket ${ticket_id} not found in BACKLOG.md" >&2
    return 1
  fi

  # Also remove any trailing blank lines after the block
  sed -i '' "${range}d" "$BACKLOG"
}

# ---------------------------------------------------------------------------
# Ticket listing
# ---------------------------------------------------------------------------

# list_tickets_by_status STATUS
# Prints all ticket IDs with the given status.
list_tickets_by_status() {
  local status="$1"
  awk -v st="$status" '
    /^### T-[0-9]/ { tid = $2 }
    tid && $0 == "- Status: " st { print tid; tid = "" }
  ' "$BACKLOG"
}

# list_tickets_by_priority PRIORITY [STATUS]
# Prints ticket IDs with the given priority, optionally filtered by status.
list_tickets_by_priority() {
  local priority="$1"
  local status="${2:-}"

  if [ -z "$status" ]; then
    awk -v pr="$priority" '
      /^### T-[0-9]/ { tid = $2 }
      tid && $0 == "- Priority: " pr { print tid; tid = "" }
    ' "$BACKLOG"
  else
    awk -v pr="$priority" -v st="$status" '
      /^### T-[0-9]/ { tid = $2; has_pri = 0; has_st = 0 }
      tid && $0 == "- Priority: " pr { has_pri = 1 }
      tid && $0 == "- Status: " st { has_st = 1 }
      tid && has_pri && has_st { print tid; tid = "" }
    ' "$BACKLOG"
  fi
}

# list_tickets_by_milestone MILESTONE
# Prints ticket IDs belonging to a given milestone.
list_tickets_by_milestone() {
  local milestone="$1"
  awk -v ms="$milestone" '
    /^### T-[0-9]/ { tid = $2 }
    tid && $0 == "- Milestone: " ms { print tid; tid = "" }
  ' "$BACKLOG"
}

# ---------------------------------------------------------------------------
# Dependency & blocker checks
# ---------------------------------------------------------------------------

# deps_met TICKET_ID
# Returns 0 if all Depends are completed (or Depends is —), 1 otherwise.
# A dependency is "met" if it appears in COMPLETED.md OR is not found in BACKLOG.md
# (since completed tickets are removed from BACKLOG).
# Prints unmet dependency IDs to stdout if any.
deps_met() {
  local ticket_id="$1"
  local depends
  depends="$(get_field "$ticket_id" "Depends")"

  if [ "$depends" = "—" ] || [ -z "$depends" ]; then
    return 0
  fi

  local unmet=""
  local dep
  # Split comma-separated deps
  while IFS=', ' read -r dep; do
    [ -z "$dep" ] && continue
    # Check if dependency is in COMPLETED.md (the archive of finished work)
    if grep -q "$dep" "$COMPLETED" 2>/dev/null; then
      continue  # dependency is completed
    fi
    # If it's still in BACKLOG.md, it's not done yet
    if grep -q "^### ${dep}$" "$BACKLOG" 2>/dev/null; then
      unmet="${unmet}${dep} "
    fi
    # If it's in neither, it was completed and archived — consider it met
  done <<< "$(echo "$depends" | tr ',' '\n' | sed 's/^ *//;s/ *$//')"

  if [ -n "$unmet" ]; then
    echo "$unmet"
    return 1
  fi
  return 0
}

# is_blocked TICKET_ID
# Returns 0 if Blocked-by is not —, 1 otherwise.
# Prints the blocker reason to stdout if blocked.
is_blocked() {
  local ticket_id="$1"
  local blocked
  blocked="$(get_field "$ticket_id" "Blocked-by")"

  if [ "$blocked" = "—" ] || [ -z "$blocked" ]; then
    return 1  # NOT blocked
  fi
  echo "$blocked"
  return 0  # IS blocked
}

# ---------------------------------------------------------------------------
# Sprint helpers
# ---------------------------------------------------------------------------

# get_sprint_field FIELD_NAME
# Reads a header field from SPRINT.md (e.g., Sprint, Milestone, Goal, Started).
get_sprint_field() {
  local field="$1"
  grep "^${field}: " "$SPRINT" | head -1 | sed "s/^${field}: //"
}

# get_sprint_section SECTION_NAME
# Prints all lines in a section of SPRINT.md (e.g., "Active", "Queue", "Done This Sprint").
# Stops at the next --- or EOF.
get_sprint_section() {
  local section="$1"
  awk -v sec="$section" '
    /^## / { in_sec = ($0 == "## " sec); next }
    /^---/ { if (in_sec) exit }
    in_sec && /[^ \t]/ { print }
  ' "$SPRINT"
}

# extract_ticket_id LINE
# Extracts the FIRST T-XXXX from a sprint line like "- **T-2026-001**: ..."
# Uses head -1 to avoid returning dependency IDs that appear later in the line.
extract_ticket_id() {
  echo "$1" | grep -oE 'T-[0-9]{4}-[0-9]{3}' | head -1
}

# count_sprint_section SECTION_NAME
# Counts non-empty, non-placeholder lines in a sprint section.
count_sprint_section() {
  local section="$1"
  get_sprint_section "$section" | awk '/T-[0-9]{4}-[0-9]{3}/ { count++ } END { print count+0 }'
}

echo "task-parse.sh loaded — TASKS_DIR=${TASKS_DIR}" >&2
