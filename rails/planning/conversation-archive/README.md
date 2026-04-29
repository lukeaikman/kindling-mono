# Claude Code conversation archive

Snapshots of working Claude Code sessions, copied here so they can travel with the repo (e.g. resume on another machine).

## Files

| File | When | Covers |
|---|---|---|
| `session-2026-04-28-ed2dceb6.jsonl` | 2026-04-28 | Earlier work — family-step UX expansion (Wave 1 + Wave 2 commits 1–2 + first part of 3a). Referenced from the conversation summary at the top of the next session. |
| `session-2026-04-29-6ecc41b0.jsonl` | 2026-04-29 (in progress) | Wave 2 commits 3a–4 + the lplan skill data-model audit + the Mobile::BaseController orphan-cookie fix + the User#destroy cascade fix. Mid-Commit-5 at the time of capture. |

## Resume on another machine

```bash
# Pull the repo on the new machine.
git pull

# Find your Claude Code project directory. The folder name is derived
# from the working directory, with slashes replaced by hyphens:
#   /Users/<you>/Documents/Sites/kindling-parent/kindling-monorepo
# becomes
#   -Users-<you>-Documents-Sites-kindling-parent-kindling-monorepo
ls ~/.claude/projects/

# Copy the session jsonl into that project directory. Keep the original
# UUID-style filename (the bit after `session-DATE-`) so Claude Code can
# index it cleanly.
cp rails/planning/conversation-archive/session-2026-04-29-6ecc41b0.jsonl \
   ~/.claude/projects/<project-folder>/6ecc41b0-4079-4897-8236-d7583c083ba5.jsonl

# Open Claude Code and pick the session from the resume list, or run:
claude --resume 6ecc41b0-4079-4897-8236-d7583c083ba5
```

If you also want the prior session (referenced in the current session's summary), copy it the same way using the original UUID `ed2dceb6-6e0a-4da8-a6da-5cde2d9464aa`.

## Refreshing the archive

When you pause a session you want to carry forward, refresh the file:

```bash
# Find the most recent session for this project:
ls -lt ~/.claude/projects/-Users-lukeaikman-Documents-Sites-kindling-parent-kindling-monorepo/*.jsonl | head -1

# Copy with a date-prefixed name into this folder:
cp ~/.claude/projects/.../<uuid>.jsonl rails/planning/conversation-archive/session-YYYY-MM-DD-<short-uuid>.jsonl

# Commit + push.
```

## Why these aren't gitignored

Session jsonls are usually private working state — not normally checked in. We're checking these in deliberately as a portability mechanism. If anything sensitive lands in a session (credentials etc.), redact before committing.
