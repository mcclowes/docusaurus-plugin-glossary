import path from 'path';
import { fileURLToPath } from 'url';
import { getRemarkPlugin } from '../../dist/index.js';

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
      // Use the glossary preset which automatically configures everything
      path.resolve(__dirname, '../../dist/preset.js'),
      /** @type {import('docusaurus-plugin-glossary/preset').GlossaryPresetOptions} */ ({
        // Glossary configuration
        glossary: {
          glossaryPath: 'glossary/glossary.json',
          routePath: '/glossary',
        },
        // Classic preset configuration
        docs: {
          sidebarPath: path.resolve(__dirname, './sidebars.js'),
        },
        blog: false,
        pages: {},
        theme: {
          customCss: path.resolve(__dirname, './src/css/custom.css'),
        },
      }),
    ],
  ],

  plugins: [
    [
      path.resolve(__dirname, '../../dist/index.js'),
      {
        id: 'module',
        glossaryPath: 'glossary/module.json',
        routePath: '/module/glossary',
        generatePage: false,
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'module',
        path: 'module-docs',
        routeBasePath: 'module',
        sidebarPath: path.resolve(__dirname, './module-sidebars.js'),
        remarkPlugins: [
          getRemarkPlugin(
            {
              glossaryPath: 'glossary/module.json',
              routePath: '/module/glossary',
              linkOnlyFirstOccurrence: true,
            },
            { siteDir: __dirname }
          ),
        ],
      },
    ],
    // Plugin to configure webpack to ignore Node.js modules
    function () {
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
