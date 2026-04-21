# Usage Guide

## Automatic Term Detection

When using the preset (`docusaurus-plugin-glossary/preset`), terms are automatically detected and linked in markdown:

```markdown
Our API uses REST principles to provide a simple interface.
```

Terms like "API" and "REST" will automatically be:

- Detected if defined in your glossary
- Styled with a dotted underline
- Display tooltip with definition on hover
- Link to full glossary page entry

### Limitations

- Only whole words are matched (respects word boundaries)
- Terms inside code blocks, links, or existing MDX components are NOT processed
- Terms inside headings (`h1`–`h6`) are NOT auto-linked
- Matching is case-insensitive by default; set `"caseSensitive": true` on a term to match only its exact casing (useful for acronyms like `REST` that collide with common words)

### Matching multiple word forms

Use the `aliases` field to link multiple forms of a term to a single glossary entry:

```json
{
  "term": "deploy",
  "definition": "Push a change to a running environment.",
  "aliases": ["deployment", "deploying", "deployed", "redeploy"]
}
```

The rendered link and tooltip always use the canonical `term`, but the reader sees the original word they wrote. Simple plural forms (`s`, `es`) are already matched automatically; use `aliases` for irregular inflections or synonyms.

### Opting a term out of auto-linking

Set `"autoLink": false` on a term to keep it in the glossary page but skip auto-detection in markdown. Useful for terms that produce too many false positives. You can still reference the term manually with `<GlossaryTerm term="..." />`.

### Case-sensitive matching

Set `"caseSensitive": true` on a term to match only its exact casing. Useful for acronyms that share spelling with common words — e.g. a case-sensitive `REST` entry matches `REST` and `RESTful` but ignores `rest` ("take a rest"). Applies to the term and all its aliases.

## Manual Component Usage

Use the `GlossaryTerm` component for more control:

```jsx
import GlossaryTerm from '@theme/GlossaryTerm';

This website uses an <GlossaryTerm term="API">API</GlossaryTerm> to fetch data.

// Override definition from glossary:
We use <GlossaryTerm term="REST" definition="Representational State Transfer" /> for services.

// Custom display text:
Our <GlossaryTerm term="API">RESTful API</GlossaryTerm> is available.
```

### Component Props

- `term` (required): Term name (used to look up definition)
- `definition` (optional): Override definition from glossary file
- `children` (optional): Custom text to display (defaults to term name)

## Glossary Page Features

Available at `/glossary` (or configured `routePath`):

- Alphabetical grouping with letter navigation
- Real-time search across terms and definitions
- Clickable related terms
- Responsive design
- Dark mode support

## Customization

### Custom Styles

Override in `src/css/custom.css`:

```css
/* Override glossary term styles */
.glossaryTermWrapper .glossaryTerm {
  border-bottom-color: #your-color;
}

/* Override tooltip styles */
.glossaryTermWrapper .tooltip {
  background: #your-background;
}
```

### Swizzle Components

For advanced customization:

```bash
npm run swizzle docusaurus-plugin-glossary GlossaryPage -- --wrap
npm run swizzle docusaurus-plugin-glossary GlossaryTerm -- --wrap
```
