# Final audit - follow-up (sent verbatim to the SAME auditor that produced the previous round)

The text you audited has changed. Its files are the same paths as before; their bytes are not.
Re-read every file in full and run `shasum -a 256` on each again.

Then, in ONE JSON object written to `<<AUDIT_OUT>>` with the Write tool (and printed as your
reply), in exactly the shape you used before:

1. For each finding in your previous answer, keep it in `findings` if it still stands (same
   severity, same claim, updated line), or move it to `resolved` with one line saying what
   changed. A finding you now consider over-graded is moved to `resolved` with the reason - you
   may lower your own grade; nobody else may.
2. Report anything NEW you consider CRITICAL or MODERATE under the SAME threshold you applied in
   your first pass - not a stricter one. This is a re-read for regressions and for the fixes'
   own new claims, not a fresh hunt: a sentence you passed last time and that has not changed
   does not become a finding now unless a fix made it wrong.
3. `sha256` for every file as read now; `verdict` PASS only if `findings` holds no CRITICAL or
   MODERATE.
