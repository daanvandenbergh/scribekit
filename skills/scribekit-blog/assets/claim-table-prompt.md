# Claim table - the ONE prompt (sent verbatim; the placeholders are the only variables)

You are extracting every checkable claim from a blog post, cold. You have been given the post
and NOTHING else on purpose: no sources ledger, no earlier verdicts, no notes. Do not open any
other file, do not search the web, and do not spawn any subagent or use the Agent tool.

## Input

The post, every locale, and its hero file:
<<FILES>>

## What counts as a claim

Every sentence a sharp reader could ask "says who?" about: statistics, dates, prices and price
bands, versions, named facts, comparatives ("most", "twice as", "cheaper than"), universals
("every", "only", "one", "no other"), causal claims, quotations, what a law / regulator /
standard / authority requires and OF WHOM and WHERE, instructions that promise an outcome, any
claim about the site's own product, and any "nothing in X" absence claim. Sweep EVERYWHERE a
claim can sit: `title`, `description`, the hero title and subtitle, body prose, table cells, the
pull-quote, image alt text. `title` and `description` are the FIRST rows.

## Output

Write ONE JSON object to `<<TABLE_OUT>>` with the Write tool (and print it as your reply):

```json
{
  "extractedAt": "<output of: date -u +%FT%TZ - run it>",
  "sha256": {"<file>": "<output of shasum -a 256 <file>>"},
  "rows": [
    {"id": "t1", "where": "title (en)", "sentence": "<the post's own sentence, verbatim>", "claim": "<the checkable fact in one line>", "claimsSource": "<the source the post names for it, or none>", "verdict": "unverified"}
  ]
}
```

Ids: `t1`, `t2`, ... for title/description/hero rows, then `r1`, `r2`, ... for the rest, in
reading order. Every `verdict` is the literal string `unverified` - you judge nothing.
