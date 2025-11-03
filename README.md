# docusaurus-plugin-glossary

A comprehensive Docusaurus plugin that provides glossary functionality with an auto-generated glossary page, searchable terms, and inline term tooltips.

> Compatibility: Fully compatible with Docusaurus v3 (MDX v3). If you were on a v2-era fork, please upgrade to the latest 1.x release of this plugin. No manual MDX pipeline wiring is required when `autoLinkTerms` is enabled (default).

## Features

- **Auto-generated Glossary Page**: Displays all terms alphabetically with letter navigation
- **Search Functionality**: Real-time search across terms and definitions
- **GlossaryTerm Component**: Inline component for linking terms with tooltip previews
- **Automatic Term Detection**: Automatically detect and link glossary terms in markdown files with tooltips
- **Responsive Design**: Mobile-friendly UI with dark mode support
- **Related Terms**: Link between related glossary terms
- **Abbreviation Support**: Display full form of abbreviated terms
- **Customizable**: Configure glossary path and route

## Quick Start

1. **Install the plugin:**

   ```bash
   npm install docusaurus-plugin-glossary
   ```

2. **Add to your `docusaurus.config.js`:**

   ```javascript
   module.exports = {
     // ... other config
     plugins: [
       [
         'docusaurus-plugin-glossary',
         {
           glossaryPath: 'glossary/glossary.json', // Path to your glossary file
           routePath: '/glossary', // URL path for glossary page
           autoLinkTerms: true, // Automatically link terms (default: true)
         },
       ],
     ],
     // ... other config
   };
   ```

   **That’s it!** On Docusaurus v3, the remark plugin is automatically configured via the plugin’s `configureMarkdown` hook — no manual `markdown.remarkPlugins` setup needed.

3. **Create your glossary file at `glossary/glossary.json`:**

   ```json
   {
     "description": "A collection of technical terms and their definitions",
     "terms": [
       {
         "term": "API",
         "abbreviation": "Application Programming Interface",
         "definition": "A set of rules and protocols that allows different software applications to communicate with each other.",
         "relatedTerms": ["REST", "GraphQL"]
       },
       {
         "term": "REST",
         "abbreviation": "Representational State Transfer",
         "definition": "An architectural style for designing networked applications.",
         "relatedTerms": ["API", "HTTP"]
       }
     ]
   }
   ```

4. **Start your dev server:**

   ```bash
   npm run start
   ```

5. **That's it!**
   - Visit `/glossary` to see your glossary page
   - Write markdown normally - terms will automatically be linked with tooltips
   - Use `<GlossaryTerm>` component in MDX for manual control

## Installation

### Install from npm (Recommended)

```bash
npm install docusaurus-plugin-glossary
```

## Usage Guide

### Step 1: Create Your Glossary File

Create a JSON file at `glossary/glossary.json` (or your configured path) in your Docusaurus site root:

```json
{
  "description": "A collection of technical terms and their definitions",
  "terms": [
    {
      "term": "API",
      "abbreviation": "Application Programming Interface",
      "definition": "A set of rules and protocols that allows different software applications to communicate with each other.",
      "relatedTerms": ["REST", "GraphQL"]
    },
    {
      "term": "REST",
      "abbreviation": "Representational State Transfer",
      "definition": "An architectural style for designing networked applications.",
      "relatedTerms": ["API", "HTTP"]
    }
  ]
}
```

**Required fields:**

- `term` (string): The glossary term name
- `definition` (string): The term's definition

**Optional fields:**

- `abbreviation` (string): The full form if the term is an abbreviation
- `relatedTerms` (string[]): Array of related term names that link to other glossary entries
- `id` (string): Custom ID for linking (auto-generated from term name if not provided)

### Step 2: Configure the Plugin

Add the plugin to your `docusaurus.config.js`:

```javascript
module.exports = {
  plugins: [
    [
      'docusaurus-plugin-glossary',
      {
        glossaryPath: 'glossary/glossary.json', // Path to your glossary file
        routePath: '/glossary', // URL path for the glossary page
        autoLinkTerms: true, // Automatically detect and link terms (default: true)
      },
    ],
  ],
};
```

**Automatic Configuration:** The remark plugin is automatically configured when `autoLinkTerms` is `true` (the default). You don't need to manually configure `markdown.remarkPlugins`!

**Advanced: Manual Remark Plugin Configuration**

If you need more control or want to disable automatic detection, you can manually configure the remark plugin:

```javascript
const glossaryPlugin = require('docusaurus-plugin-glossary');

module.exports = {
  plugins: [
    [
      'docusaurus-plugin-glossary',
      {
        glossaryPath: 'glossary/glossary.json',
        routePath: '/glossary',
        autoLinkTerms: false, // Disable automatic configuration
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

## Docusaurus v3 Notes and Troubleshooting

- **MDX imports**: The plugin injects `import GlossaryTerm from '@theme/GlossaryTerm';` automatically when it auto-links a term. If you’re writing MDX manually, you can also import and use it yourself:

  ```mdx
  import GlossaryTerm from '@theme/GlossaryTerm';

  Our <GlossaryTerm term="API" /> uses <GlossaryTerm term="REST">RESTful</GlossaryTerm> principles.
  ```

- **No tooltips or no auto-linking?**
  - Confirm you’re on `@docusaurus/core@^3` and `react@^18`.
  - Ensure the plugin is listed in `plugins` and `autoLinkTerms` is not disabled.
  - Visit `/glossary`. If the page or route fails to render, verify your `glossaryPath` file exists and contains a `terms` array.
  - If you previously used a local patch for `1.0.0`, remove it when using `1.0.2+`; the plugin bundles the v3-compatible theme and remark integration.

- **Opting out of auto-linking**: set `autoLinkTerms: false` and add the remark plugin manually (see above), or only use the `<GlossaryTerm />` component where you want explicit control.

### Step 3: Use Glossary Terms in Your Content

#### Option A: Automatic Detection (Recommended)

With the remark plugin configured, glossary terms are **automatically detected and linked** in all your markdown files. Simply write your content normally:

```markdown
Our API uses REST principles to provide a simple interface.

This project supports webhooks for real-time notifications.
```

Terms like "API", "REST", and "webhooks" will automatically be:

- Detected if they're defined in your glossary
- Styled with a dotted underline
- Display a tooltip with the definition on hover
- Link to the full glossary page entry

**Limitations:**

- Only whole words are matched (respects word boundaries)
- Terms inside code blocks, links, or existing MDX components are **not** processed
- Matching is case-insensitive

#### Option B: Manual Component Usage

For more control or when automatic detection isn't sufficient, use the `GlossaryTerm` component in MDX files:

```jsx
import GlossaryTerm from '@theme/GlossaryTerm';

This website uses an <GlossaryTerm term="API">API</GlossaryTerm> to fetch data.

// Or with explicit definition (overrides glossary entry):
We use <GlossaryTerm term="REST" definition="Representational State Transfer" /> for our services.

// Or with children content:
Our <GlossaryTerm term="API" definition="Application Programming Interface">RESTful API</GlossaryTerm> is available.
```

**Component props:**

- `term` (required): The term name (used to look up definition from glossary)
- `definition` (optional): Override the definition from the glossary file
- `children` (optional): Custom text to display (defaults to term name)

### Step 4: Access the Glossary Page

The glossary page is automatically available at `/glossary` (or your configured `routePath`).

**Features:**

- Alphabetical grouping with letter navigation
- Real-time search across terms and definitions
- Clickable related terms
- Responsive design
- Dark mode support

**Add to navigation:**

To add the glossary to your navbar, update your `docusaurus.config.js`:

```javascript
module.exports = {
  themeConfig: {
    navbar: {
      items: [
        { to: '/glossary', label: 'Glossary', position: 'left' },
        // ... other items
      ],
    },
  },
};
```

## Configuration Options

| Option          | Type    | Default                    | Description                                                                        |
| --------------- | ------- | -------------------------- | ---------------------------------------------------------------------------------- |
| `glossaryPath`  | string  | `'glossary/glossary.json'` | Path to glossary JSON file relative to site directory                              |
| `routePath`     | string  | `'/glossary'`              | URL path for glossary page                                                         |
| `autoLinkTerms` | boolean | `true`                     | Enable automatic term detection in markdown (requires remark plugin configuration) |

## Customization

### Styling

The plugin uses CSS modules for styling. You can override styles by:

1. Creating custom CSS in your site's `src/css/custom.css`:

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

2. For advanced customization, you can swizzle the components:

```bash
npm run swizzle docusaurus-plugin-glossary GlossaryPage -- --wrap
npm run swizzle docusaurus-plugin-glossary GlossaryTerm -- --wrap
```

### Adding to Navbar

To add the glossary to your navbar, update your `docusaurus.config.js`:

```javascript
themeConfig: {
  navbar: {
    items: [
      {to: '/glossary', label: 'Glossary', position: 'left'},
      // ... other items
    ],
  },
}
```

## Examples

See the [Usage Guide](#usage-guide) section above for complete examples. Here are additional examples:

### Complete Glossary Example

```json
{
  "description": "Technical terms used in our documentation",
  "terms": [
    {
      "term": "API",
      "abbreviation": "Application Programming Interface",
      "definition": "A set of rules and protocols that allows different software applications to communicate with each other.",
      "relatedTerms": ["REST", "GraphQL", "Webhook"]
    },
    {
      "term": "REST",
      "abbreviation": "Representational State Transfer",
      "definition": "An architectural style for designing networked applications.",
      "relatedTerms": ["API", "HTTP"]
    },
    {
      "term": "Webhook",
      "definition": "An HTTP callback that occurs when something happens; a simple event-notification via HTTP POST.",
      "relatedTerms": ["API", "HTTP"]
    }
  ]
}
```

### Writing Content with Automatic Detection

```markdown
---
title: API Documentation
---

# Getting Started with Our API

Our API uses RESTful principles to provide a simple and consistent interface.
Webhooks are supported for real-time event notifications.
```

The terms "API", "RESTful", and "Webhooks" will automatically be detected and linked if they're defined in your glossary.

### Using the Component in MDX

```mdx
---
title: API Documentation
---

import GlossaryTerm from '@theme/GlossaryTerm';

# Getting Started with Our API

Our <GlossaryTerm term="API" />
uses <GlossaryTerm term="REST">RESTful</GlossaryTerm>
principles to provide a simple and consistent interface.
```

## Development

### File Structure

```
docusaurus-plugin-glossary/
├── index.js                    # Main plugin file
├── components/
│   ├── GlossaryPage.js        # Glossary page component
│   └── GlossaryPage.module.css # Glossary page styles
├── remark/
│   └── glossary-terms.js      # Remark plugin for automatic term detection
├── theme/
│   └── GlossaryTerm/
│       ├── index.js           # Term component
│       └── styles.module.css  # Term styles
└── README.md
```

### Plugin Lifecycle

1. **loadContent**: Reads glossary JSON file
2. **contentLoaded**: Creates data file and adds route
3. **getThemePath**: Exposes theme components
4. **getPathsToWatch**: Watches glossary file for changes

### Remark Plugin

The remark plugin (`remark/glossary-terms.js`) automatically detects glossary terms in markdown files and replaces them with `GlossaryTerm` components. It:

- Scans text nodes for glossary terms (case-insensitive, whole word matching)
- Replaces matching terms with MDX components that show tooltips
- Skips terms inside code blocks, links, or existing MDX components
- Respects word boundaries to avoid partial matches

## Troubleshooting

### Glossary page returns 404

- Ensure the plugin is properly configured in `docusaurus.config.js`
- Check that the `routePath` doesn't conflict with existing routes
- Run `npm run clear` to clear Docusaurus cache

### Glossary terms not showing

- Verify `glossary/glossary.json` exists at the correct path
- Check JSON syntax is valid
- Ensure `terms` array is properly formatted

### GlossaryTerm component not found

- Make sure you're importing from `@theme/GlossaryTerm`
- Try clearing cache with `npm run clear`
- Restart dev server

### Automatic term detection not working

- Ensure `autoLinkTerms` is `true` (the default) in your plugin configuration
- The remark plugin is automatically configured, so you don't need to manually add it to `markdown.remarkPlugins`
- Verify your glossary file exists at the configured `glossaryPath` and contains terms
- Check that terms in your content match the terms in your glossary (matching is case-insensitive but respects word boundaries)
- Try clearing cache with `npm run clear` and restarting the dev server
- Note that terms inside code blocks, links, or MDX components are not processed
- If you've manually configured the remark plugin, ensure `siteDir` points to the correct Docusaurus site directory

### Styles not applying

- Check for CSS conflicts in your custom CSS
- Ensure CSS modules are loading correctly
- Try clearing cache and rebuilding

## License

MIT

## Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to get started.

## Credits

Built for Docusaurus v3.x
