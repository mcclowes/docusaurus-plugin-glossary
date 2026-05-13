# Claude Code Instructions

## Project Overview

This is `docusaurus-plugin-glossary` - a Docusaurus v3 plugin providing glossary functionality with auto-generated pages, searchable terms, and inline tooltips.

## Key Architecture

- **TypeScript entry point**: `src/index.ts` compiles to `dist/index.js`
- **JavaScript components**: `src/components/`, `src/theme/`, `src/remark/` copied to `dist/`
- **Build command**: `npm run build` (TypeScript + file copying)
- **Watch mode**: `npm run watch` for development

## Important Patterns

### Preset vs Plugin

The **preset** (`docusaurus-plugin-glossary/preset`) auto-configures the remark plugin for auto-linking. The **plugin** alone only provides the glossary page and GlossaryTerm component.

### Client Modules

Uses `getClientModules()` for automatic DOM enhancement - no manual imports needed in MDX files.

### Remark Plugin

Located at `src/remark/glossary-terms.js`. Transforms markdown text into `<GlossaryTerm>` components at build time.

## Development Workflow

```bash
npm run build        # Build plugin
npm run watch        # Watch mode
npm test            # Run Jest tests
npm run example:start   # Start example Docusaurus site
npm run example:build   # Build example site
```

## Testing

- Unit tests: `npm test`
- E2E tests: `npm run test:e2e`
- Always test changes against the example site in `examples/docusaurus-v3/`

## Code Style

- TypeScript for main entry point
- JavaScript for React components and remark plugin
- Prettier for formatting (`npm run format`)
- ESLint for linting (`npm run lint`)

## Important Files

- `src/index.ts` - Main plugin with lifecycle hooks
- `src/preset.ts` - Preset that wraps classic + adds remark plugin
- `src/remark/glossary-terms.js` - Auto-linking remark plugin
- `src/theme/GlossaryTerm/` - Inline term component with tooltip
- `src/components/GlossaryPage.js` - Glossary page component

## Skills Available

See `AGENTS.md` for Claude Code skills specific to this project:

- `docusaurus-glossary` - Plugin configuration and usage
- `docusaurus-plugin-dev` - Plugin development patterns
- `docusaurus-plugins` - Remark/rehype plugin creation
- `docusaurus-config` - Docusaurus configuration
- `docusaurus-themes` - Theme component swizzling

## Shared docs site

User-facing changes in this repo should also be reflected in the shared documentation site at `~/Development/docusaurus/docusaurus-plugins-docs/` (separate repo; documents and dogfoods every plugin in this family).

After a change that a consumer can observe — new option, changed default, renamed export, new/removed hook, changed behavior — update both:

- `README.md` here (canonical API reference)
- `docs/glossary/` in `docusaurus-plugins-docs`, at minimum `configuration.md`; also `overview.md` / `getting-started.md` / `component.md` / the relevant `advanced/*.md` (auto-linking, manual configuration, customization) when the change reaches those topics

Internal refactors, test-only changes, and build tweaks don't need docs-site updates.
