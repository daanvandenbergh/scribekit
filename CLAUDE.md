# Project: Scribekit

Scribekit is a npm typescript package for setting up a blog. It offers a portable agent skill for creating and reviewing blog posts, as well as backend and frontend code for managing the blog.

## Directory Architecture

```
skills/                             # The agent skills
  scribekit-blog/                     # Writing and reviewing blog posts
  scribekit-docs/                     # Writing and verifying docs pages
  scribekit-docs-github-pages/        # Publishing a docs site to GitHub Pages
  scribekit-hero/                     # Generating hero images
rules/                              # CLAUDE.md rule snippets shipped for consumers to @-import
src/
  index.ts                          # Package root entry ("."), re-exports shared + blog + docs
  shared/                           # Framework-free primitives (dates, slugs, locales, SEO, types) - fs-free
  content-store/                    # The filesystem layer: the walk, the path guard, the read cache
  blog/                             # Server-side blog module (Blog class)
  docs/                             # Server-side docs module (Docs class + navigation)
  react/                            # React components ("./react" subpath)
```
Each top-level `src/` folder is one module. Some map to a package entry point (`blog`,
`docs`, and `shared` are re-exported from `index.ts` -> `.`; `react` -> `./react`); others
are internal (`content-store`) and are deliberately not exported. Future server modules
(e.g. `comments/`, `database/`) are new siblings under `src/`.

`content-store` is the only module that touches `node:fs` - `Blog` and `Docs` read through
it. Keep it that way: no client component may transitively reach a filesystem import, and
that rule is enforced by a test in `src/content-store/tests/`.

@node_modules/@daanvandenbergh/claudekit/rules/ts_coding_standards.md
@node_modules/@daanvandenbergh/claudekit/rules/core_principles.md
@node_modules/@daanvandenbergh/claudekit/rules/workflow.md
@node_modules/@daanvandenbergh/claudekit/rules/todo.md
@rules/docs_parity.md
@node_modules/@daanvandenbergh/claudekit/rules/ts_modular_coding.md
@node_modules/@daanvandenbergh/claudekit/skills/ts/audit-tests/claude-rules.md
@node_modules/@daanvandenbergh/claudekit/rules/active_sessions.md

## Web Testing
- After editing or developing any HTML (pages, components, markup), always inspect and
  test it in a real browser with the Claude-in-Chrome tool - never assume it renders or
  behaves correctly from reading the code alone.

## Demo Dev Server
- Never kill or start the demo dev server. First check if it is already running; if so,
  resume using it. Otherwise, ask the user to start it.

## Git
- Never create new git branches unless asked, if you really feel it is needed, ask for permission first.

## Maintained Docs
The docs pages for this project live in `docs/content/` - that is where the Docs Stay In Sync
rule applies when you change `src/` or `skills/`.