# puzzyl-kit

Shared TypeScript utility library for Puzzyl puzzle hunt event pages.

## What this is

`puzzyl-kit` is a standalone npm package containing the common JavaScript/TypeScript
functionality used across all Puzzyl puzzle hunt events — things like drag-and-drop,
builder templates, text input handling, notes, storage, and page boilerplate.

Previously this code lived as `_*.ts` files inside `GivingSafariTS`, concatenated
at build time into a single `kit25.js`. This repo replaces that approach with a
properly versioned, independently publishable package.

## Relationship to event repos

Each puzzle hunt event lives in its own repo (e.g. `giving-safari-2026`). That repo:

- Declares `@davidggarber/puzzyl-kit` as a dependency in its `package.json`
- Pins to a specific version so events are reproducible long after the hunt
- Provides its own `src/event.ts` with event-specific metadata (name, dates, puzzles)
- Builds its own `dist/` output that bundles the kit together with event code

The kit itself has no knowledge of any specific event. Event data flows in at
runtime via the kit's `registerEvent()` API.

## Including the kit in a puzzle `.xhtml` file

Event pages are `.xhtml` files that load the built bundle via a `<script>` tag.
After an event repo runs its build, the kit is bundled into the event's output.
Add this to the `<head>` of your `.xhtml`:

```html
<script src="/js/kit.js" defer></script>
```

The exact output filename and path depend on the event repo's Vite config.
The `defer` attribute ensures the script runs after the DOM is parsed.

To initialize standard puzzle page behavior, call `boilerplate()` at the bottom
of the page or in a `DOMContentLoaded` listener:

```html
<script>
  document.addEventListener('DOMContentLoaded', () => {
    boilerplate();
  });
</script>
```

## Development

```
npm install
npm run build    # produces dist/kit.es.js, dist/kit.umd.js, dist/index.d.ts
npm test         # runs Playwright unit tests
```

## Publishing

### Configure package authentication

Publishing to GitHub Packages uses a dedicated token for this project. Create a
GitHub Personal Access Token (classic) with `write:packages` access. Store it as
the Windows user environment variable `PUZZYL_KIT_NODE_AUTH_TOKEN` using the
Windows Environment Variables settings. Do not put the token in this repository
or in a command that will be saved to shell history. Reopen PowerShell or VS Code
after setting the variable so npm can read it.

The project `.npmrc` references that variable and routes this package scope to
GitHub Packages. The token value is never stored in `.npmrc`.

### Publish a release

Run the following from the project directory:

```
npm test
npm run build
npm version patch   # or minor / major
git push origin main --tags
npm publish
```

`npm version` updates `package.json`, creates a commit, and adds the matching
Git tag. `git push` uses Git's configured credentials; `PUZZYL_KIT_NODE_AUTH_TOKEN`
is for npm package access only.

### Downstream

Make sure to update other projects' `package.json` to the latest:
```
    "dependencies":  {
                         "@davidggarber/puzzyl-kit":  "0.1.[latest]"
                     },
```

Packages are published to GitHub Packages as `@davidggarber/puzzyl-kit`.
