# Usage Guide

## Automatic Term Detection

With `autoLinkTerms: true` (default), terms are automatically detected and linked in markdown:

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
- Matching is case-insensitive

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
