import path from 'path';
import { fileURLToPath } from 'url';
import glossaryPlugin from '../../dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('@docusaurus/types').Config} */
export default {
  title: 'Glossary Plugin Example',
  url: 'https://example.com',
  baseUrl: '/',
  favicon: 'img/favicon.ico',
  organizationName: 'example',
  projectName: 'glossary-example-site',
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  i18n: { defaultLocale: 'en', locales: ['en'] },

  presets: [
    [
      '@docusaurus/preset-classic',
      /** @type {import('@docusaurus/preset-classic').Options} */ ({
        docs: {
          sidebarPath: path.resolve(__dirname, './sidebars.js'),
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
        blog: false,
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
        theme: {
          customCss: path.resolve(__dirname, './src/css/custom.css'),
        },
      }),
    ],
  ],

  plugins: [
    [
      // Use the local plugin from the repo root
      path.resolve(__dirname, '../../lib'),
      {
        glossaryPath: 'glossary/glossary.json',
        routePath: '/glossary',
      },
    ],
    // Plugin to configure webpack to ignore Node.js modules
    function() {
      return {
        name: 'webpack-node-modules-config',
        configureWebpack(config, isServer) {
          return {
            resolve: {
              fallback: {
                path: false,
                url: false,
                fs: false,
                'fs-extra': false,
                'graceful-fs': false,
                jsonfile: false,
                util: false,
                assert: false,
                stream: false,
                constants: false,
              },
            },
          };
        },
      };
    },
  ],

  // remarkPlugins configured via preset (docs/pages)

  themeConfig: {
    navbar: {
      title: 'Glossary Example',
      items: [
        { to: '/docs/intro', label: 'Docs', position: 'left' },
        { to: '/glossary', label: 'Glossary', position: 'left' },
      ],
    },
  },
};
