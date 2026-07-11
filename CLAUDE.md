# Project: Scribekit

Scribekit is a npm typescript package for setting up a blog. It offers a portable agent skill for creating and reviewing blog posts, as well as backend and frontend code for managing the blog.

## Directory Architecture

```
skills/                             # The agent skills
  scribekit                           # The skill for writing and reviewing blogs
src/
  index.ts                          # Package root entry ("."), re-exports the blog module
  blog/                             # Server-side blog module (Blog class + shared fs-free helpers)
  react/                            # React components ("./react" subpath)
```
Each top-level `src/` folder is one module and maps to a package entry point. Future
server modules (e.g. `comments/`, `database/`) are new siblings under `src/`.

@node_modules/@daanvandenbergh/claudekit/rules/ts_coding_standards.md
@node_modules/@daanvandenbergh/claudekit/rules/core_principles.md
@node_modules/@daanvandenbergh/claudekit/rules/workflow.md
@node_modules/@daanvandenbergh/claudekit/rules/todo.md
@node_modules/@daanvandenbergh/claudekit/rules/ts_modular_coding.md
@node_modules/@daanvandenbergh/claudekit/skills/ts/audit-tests/claude-rules.md

## Web Testing
- After editing or developing any HTML (pages, components, markup), always inspect and
  test it in a real browser with the Claude-in-Chrome tool - never assume it renders or
  behaves correctly from reading the code alone.

## Demo Dev Server
- Never kill or start the demo dev server. First check if it is already running; if so,
  resume using it. Otherwise, ask the user to start it.

## Git
- Never create new git branches unless asked, if you really feel it is needed, ask for permission first.

## Maintained README.md
When making changes to the library, ensure the README.md instructions for how to use the library are still up to date.