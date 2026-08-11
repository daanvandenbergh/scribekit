# Lessons

## Content conventions: group a post's files, and confirm the layout early

**2026-07-08 - content layout.** The layout evolved twice. A filename-suffix idea
(`blog/<slug>.<lang>.mdx`) was first corrected to a language **subfolder**
(`blog/<lang>/<slug>.mdx`). It then moved again to **one folder per post**:
`blog/<slug>/post.mdx` (default language), `blog/<slug>/<lang>.mdx` (translations, e.g. `fr.mdx`),
and `blog/<slug>/hero.js` (the hero generator) - so everything a post owns lives together and
adding a translation or a hero is just dropping a file into the folder. The slug is now the
**directory** name; the URL structure is unchanged (`/blog/<slug>`, `/<lang>/blog/<slug>`), and the
on-disk walk (`Blog.entries`) got simpler in the move.

**Pattern:** a content-file convention is worth revisiting as a post grows more parts (body,
translations, hero). Grouping by post (a folder) scales better than scattering a post's pieces
across sibling files and language subfolders. When a task hands you a layout in passing (a TODO's
example, an earlier decision), treat it as a suggestion, not a spec: surface the choice to the user
before building on it.
