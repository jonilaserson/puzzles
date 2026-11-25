# Puzzles site

Static site, deployed by GitHub Pages from `main`. Each puzzle lives at
`puzzles/<slug>/index.html`; the gallery is `index.html` at the root.

## The index is generated — never hand-edit the tiles

The tile list in `index.html` (between the `tiles:generated` markers) is built
by `scripts/build_index.py`. Each puzzle page is the single source of truth
for its own tile:

| tile piece | comes from |
|---|---|
| title      | the page's `<h1>` (fallbacks: `<meta name="puzzle:title">`, then `<title>`) |
| subheading | `<p class="rule">` (fallback: `<meta name="puzzle:rule">`) |

JS-rendered pages (emptying-poles) keep title/rule in those metas and render
the header *from* them, so the metas stay the single source. Meta content may
carry entity-escaped markup (`&lt;em&gt;…`); the build script unescapes it.
| tags       | `<meta name="puzzle:tags" content="a · b">` |
| emblem     | `<template class="tile-emblem">` holding the tile SVG |

Tile order is `puzzles/order.txt`. To add a puzzle to the index: give its page
the meta tag and emblem template above, then add its slug to `order.txt`.

Proofs that are the author's own carry `<meta name="puzzle:original" content="...">`
in their page head (the content is the tile badge's tooltip). The tile shows a
◆ "original proof" badge and the index explains it in one line. Add the meta
only where the page already credits the author's own argument; the credit line
also goes inside the proof, above section 01, so it sits behind the curtain.

A pre-commit hook rebuilds the index automatically on every commit
(`.git/hooks/pre-commit`, a symlink to the versioned `scripts/hooks/pre-commit`).
So: edit titles/rules/tags/emblems in the puzzle pages only — the index follows
at commit time. Run `python3 scripts/build_index.py` by hand to preview sooner.
If the hook is missing (fresh clone), reinstall it:
`ln -s ../../scripts/hooks/pre-commit .git/hooks/pre-commit`

## Share tags are generated too

`scripts/build_index.py` also writes a block between `share:generated` markers
in every puzzle page's `<head>`: description, canonical URL, Open Graph and a
Twitter summary card. It is built from the page's own title and rule, so edit
those, never the block. The index's own tags are static, in `index.html`. The
pre-commit hook re-stages a puzzle page's block only if you had staged the page.
There is no `og:image` yet; link previews are text-only cards.

## Working conventions

- Several Claude sessions often share this working tree in parallel: make
  surgical edits, don't switch branches, don't reset or discard other files'
  uncommitted changes, and commit only the files your task touched.
- Local preview: `python -m http.server` via `.claude/launch.json` (port 8931,
  autoPort). Production is GitHub Pages, so every push to `main` publishes.
