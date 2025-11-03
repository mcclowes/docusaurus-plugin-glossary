# Configuration Guide

## Plugin Options

| Option          | Type    | Default                    | Description                                           |
| --------------- | ------- | -------------------------- | ----------------------------------------------------- |
| `glossaryPath`  | string  | `'glossary/glossary.json'` | Path to glossary JSON file relative to site directory |
| `routePath`     | string  | `'/glossary'`              | URL path for glossary page                            |
| `autoLinkTerms` | boolean | `true`                     | Enable automatic term detection in markdown           |

## Glossary JSON Format

```json
{
  "description": "Optional description of your glossary",
  "terms": [
    {
      "term": "API",
      "abbreviation": "Application Programming Interface",
      "definition": "A set of rules and protocols for communication.",
      "relatedTerms": ["REST", "GraphQL"],
      "id": "custom-id"
    }
  ]
}
```

### Term Fields

- **term** (required): The glossary term name
- **definition** (required): The term's definition
- **abbreviation** (optional): The full form if term is an abbreviation
- **relatedTerms** (optional): Array of related term names
- **id** (optional): Custom ID for linking (auto-generated from term name if not provided)

## Manual Remark Plugin Configuration

If you need more control, disable automatic configuration:

```javascript
const glossaryPlugin = require('docusaurus-plugin-glossary');

module.exports = {
  plugins: [
    [
      'docusaurus-plugin-glossary',
      {
        glossaryPath: 'glossary/glossary.json',
        routePath: '/glossary',
        autoLinkTerms: false,
      },
    ],
  ],
  markdown: {
    remarkPlugins: [
      [
        glossaryPlugin.remarkPlugin,
        {
          glossaryPath: 'glossary/glossary.json',
          routePath: '/glossary',
          siteDir: process.cwd(),
        },
      ],
    ],
  },
};
```

## Adding to Navbar

```javascript
module.exports = {
  themeConfig: {
    navbar: {
      items: [{ to: '/glossary', label: 'Glossary', position: 'left' }],
    },
  },
};
```
