---
name: docusaurus-glossary
# IMPORTANT: Keep description on ONE line for Claude Code compatibility
# prettier-ignore
description: Use when working with docusaurus-plugin-glossary to configure, manage glossary terms, troubleshoot issues, and explain features
---

# Docusaurus Glossary

## Quick Start

Configure the plugin in `docusaurus.config.js` and create a glossary JSON file:

```javascript
// docusaurus.config.js - Using the preset (recommended)
module.exports = {
  presets: [
    [
      'docusaurus-plugin-glossary/preset',
      {
        glossary: {
          glossaryPath: 'glossary/glossary.json',
          routePath: '/glossary',
        },
        docs: {
          /* your docs config */
        },
      },
    ],
  ],
};
```

## Core Principles

- **Auto-linking**: Terms in markdown are automatically detected and linked with tooltips (via preset)
- **Glossary JSON**: Single source of truth at `glossary/glossary.json` with terms array
- **Component-based**: Use `<GlossaryTerm term="API" />` for manual control in MDX
- **Preset approach**: Use the preset to auto-configure the remark plugin for docs, blog, and pages

## Common Patterns

### Adding Glossary Terms

Create/update `glossary/glossary.json` with term objects containing `term`, `definition`, and optional `abbreviation`, `relatedTerms`

### Troubleshooting Auto-linking

If terms aren't linking: verify glossaryPath exists, ensure using the preset (not just plugin), clear cache with `npm run clear`, restart dev server

## Reference Files

For detailed documentation, see:

- [configuration.md](references/configuration.md) - Plugin options and setup
- [usage.md](references/usage.md) - Using terms and components
- [troubleshooting.md](references/troubleshooting.md) - Common issues and fixes

## Notes

- Requires Docusaurus v3 and React 18
- Terms inside code blocks, links, or MDX components are not auto-linked
- Matching is case-insensitive but respects word boundaries
- Plugin includes GlossaryPage component and GlossaryTerm theme component

<!--
PROGRESSIVE DISCLOSURE GUIDELINES:
- Keep this file ~50 lines total (max ~150 lines)
- Use 1-2 code blocks only (recommend 1)
- Keep description <200 chars for Level 1 efficiency
- Move detailed docs to references/ for Level 3 loading
- This is Level 2 - quick reference ONLY, not a manual

LLM WORKFLOW (when editing this file):
1. Write/edit SKILL.md
2. Format (if formatter available)
3. Run: claude-skills-cli validate <path>
4. If multi-line description warning: run claude-skills-cli doctor <path>
5. Validate again to confirm
-->
