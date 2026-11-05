# Deera Instructions

These Markdown files define the behavior of Deera, the Bulusan Zoo visitor AI assistant.

## Files

- `deera/instruction.md` — Main Deera identity and core behavior
- `deera/factuality.md` — Factuality, source priority, and no-guessing rules
- `deera/security.md` — Privacy, staff/admin, internal-system, and sensitive-data rules
- `deera/formatting.md` — Response layout and readability rules
- `deera/website-help.md` — Website, reservation, event, payment, and troubleshooting guidance
- `deera/animals.md` — Animal and conservation question rules

The backend should load these files as static instructions. Current database data and the authenticated user's own reservation data should be supplied separately as dynamic context.

Do not place passwords, API keys, tokens, database credentials, staff records, admin records, or other secrets in these files.
