# Puzzles site

Static site, deployed by GitHub Pages from `main`. Each puzzle lives at
`puzzles/<slug>/index.html`; the gallery is `index.html` at the root.

## The index is generated — never hand-edit the tiles

The tile list in `index.html` (between the `tiles:generated` markers) is built
by `scripts/build_index.py`. Each puzzle page is the single source of truth
for its own tile:

| tile piece | comes from |
|---|---|
| title      | the page's `<h1>` (fallback: `<title>`) |
| subheading | `<p class="rule">` (fallback: `<meta name="puzzle:rule">`) |
| tags       | `<meta name="puzzle:tags" content="a · b">` |
| emblem     | `<template class="tile-emblem">` holding the tile SVG |

Tile order is `puzzles/order.txt`. To add a puzzle to the index: give its page
the meta tag and emblem template above, then add its slug to `order.txt`.

A pre-commit hook rebuilds the index automatically on every commit
(`.git/hooks/pre-commit`, a symlink to the versioned `scripts/hooks/pre-commit`).
So: edit titles/rules/tags/emblems in the puzzle pages only — the index follows
at commit time. Run `python3 scripts/build_index.py` by hand to preview sooner.
If the hook is missing (fresh clone), reinstall it:
`ln -s ../../scripts/hooks/pre-commit .git/hooks/pre-commit`

## Working conventions

- Several Claude sessions often share this working tree in parallel: make
  surgical edits, don't switch branches, don't reset or discard other files'
  uncommitted changes, and commit only the files your task touched.
- Local preview: `python -m http.server` via `.claude/launch.json` (port 8931,
  autoPort). Production is GitHub Pages, so every push to `main` publishes.
