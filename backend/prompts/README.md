# Jiji Instructions

These Markdown files define the behavior of Jiji, the Bulusan Zoo visitor AI assistant.

## Files

- `jiji/instruction.md` — Main Jiji identity and core behavior
- `jiji/factuality.md` — Factuality, source priority, and no-guessing rules
- `jiji/security.md` — Privacy, staff/admin, internal-system, and sensitive-data rules
- `jiji/formatting.md` — Response layout and readability rules
- `jiji/website-help.md` — Website, reservation, event, payment, and troubleshooting guidance
- `jiji/animals.md` — Animal and conservation question rules

The backend should load these files as static instructions. Current database data and the authenticated user's own reservation data should be supplied separately as dynamic context.

Do not place passwords, API keys, tokens, database credentials, staff records, admin records, or other secrets in these files.
