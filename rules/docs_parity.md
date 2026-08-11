## Docs Stay In Sync

Docs are part of the change, not a follow-up. A change that alters behaviour and leaves the
docs describing the old behaviour is **unfinished** - stale docs are worse than no docs,
because they are believed.

**In the same change, update everything that documents what you touched:** the docs pages,
`README.md` (install, usage, examples), and any other user-facing text that names the thing
you changed - CLI `--help`, error messages, comments that state behaviour.

**What counts as a docs-affecting change:** a new or removed option, flag, export, endpoint,
or command; a changed default, signature, return shape, or path; a renamed file, config key,
or convention; any behaviour a user could notice. Internal refactors that change nothing
observable need no docs edit.

**How.** Grep the docs and README for the old name/value before you finish - never rely on
memory of where it is mentioned. Fix every hit. Every code sample you touch must still be
correct against the code as it now is; if it is a command, it must still run.

Never defer this. "Update the docs" is not a `TODO.md` item - it is the rest of the change
you are already making.
