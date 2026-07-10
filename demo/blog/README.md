# Blog content - live website pages

This directory holds the **user-visible blog posts** rendered by scribekit's `Blog` class. Its contents
are **published web pages**, not a working or scratch area.

## How files here become web pages

- Each immediate subfolder is one post: **`<slug>/` -> `/<blog-base>/<slug>`** (the base is your
  `Blog` config's `basePath`, default `/blog`), listed newest-first on the overview.
- The post body is the file **inside** that folder named `<defaultLocale>.mdx` (e.g. `en.mdx`), the
  language-neutral `post.mdx`, or - if you configure additional `locales` - `<locale>.mdx` (e.g.
  `fr.mdx`, served at `/<locale>/<blog-base>/<slug>`). The extension is `.mdx` by default, so
  **`.md` files are ignored** unless you set the `extension` option.
- Front-matter (`title`, `date`, `description`, `categories`, `keywords`, `image`, `author`, ...) sets
  the title, sort order, cards, and SEO.
- Everything else is **ignored**: files at the root of this directory (like this `README.md` or a
  `hero.settings.js`) and any file inside a `<slug>/` folder not named `<locale><ext>` / `post<ext>`.
  They never render.

## For AI / LLM agents

**Do not use this directory as scratch space.** Anything you add as `<slug>/<locale>.mdx` here can go
**live on the public website**. Do not write notes, plans, task lists, drafts, or temporary files
here - put working files in your scratchpad or the repo's `claude/` directory instead. Editing an
existing post here is fine **only** when the task is explicitly to change the blog content.
