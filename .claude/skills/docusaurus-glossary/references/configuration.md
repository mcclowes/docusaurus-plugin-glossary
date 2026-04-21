# Configuration Guide

## Plugin Options

| Option         | Type   | Default                    | Description                                           |
| -------------- | ------ | -------------------------- | ----------------------------------------------------- |
| `glossaryPath` | string | `'glossary/glossary.json'` | Path to glossary JSON file relative to site directory |
| `routePath`    | string | `'/glossary'`              | URL path for glossary page                            |

## Using the Preset (Recommended)

The preset automatically configures the remark plugin for auto-linking in docs, blog, and pages:

```javascript
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
          sidebarPath: './sidebars.js',
        },
        blog: {
          showReadingTime: true,
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      },
    ],
  ],
};
```

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

## Manual Configuration (Advanced)

If you need more control or want to use the plugin alongside preset-classic:

```javascript
const glossaryPlugin = require('docusaurus-plugin-glossary');

module.exports = {
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          remarkPlugins: [
            glossaryPlugin.getRemarkPlugin(
              {
                glossaryPath: 'glossary/glossary.json',
                routePath: '/glossary',
              },
              { siteDir: __dirname }
            ),
          ],
        },
        pages: {
          remarkPlugins: [
            glossaryPlugin.getRemarkPlugin(
              {
                glossaryPath: 'glossary/glossary.json',
                routePath: '/glossary',
              },
              { siteDir: __dirname }
            ),
          ],
        },
      },
    ],
  ],
  plugins: [
    [
      'docusaurus-plugin-glossary',
      {
        glossaryPath: 'glossary/glossary.json',
        routePath: '/glossary',
      },
    ],
  ],
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
