const path = require('path');
const fs = require('fs-extra');

/**
 * Docusaurus Glossary Plugin
 *
 * A plugin that provides glossary functionality with:
 * - Glossary terms defined in a JSON file
 * - Auto-generated glossary page
 * - GlossaryTerm component for inline definitions
 * - Tooltips on hover
 * - Automatic glossary term detection in markdown files (requires manual remark plugin configuration)
 *
 * IMPORTANT: To enable auto-linking of glossary terms, you must manually add the remark plugin
 * to your docusaurus.config.js using the getRemarkPlugin helper:
 *
 * Example:
 * ```javascript
 * const glossaryPlugin = require('docusaurus-plugin-glossary');
 *
 * module.exports = {
 *   presets: [
 *     ['@docusaurus/preset-classic', {
 *       docs: {
 *         remarkPlugins: [
 *           glossaryPlugin.getRemarkPlugin({
 *             glossaryPath: 'glossary/glossary.json',
 *             routePath: '/glossary',
 *           }, { siteDir: __dirname }),
 *         ],
 *       },
 *       pages: {
 *         remarkPlugins: [
 *           glossaryPlugin.getRemarkPlugin({
 *             glossaryPath: 'glossary/glossary.json',
 *             routePath: '/glossary',
 *           }, { siteDir: __dirname }),
 *         ],
 *       },
 *     }],
 *   ],
 *   plugins: [
 *     ['docusaurus-plugin-glossary', {
 *       glossaryPath: 'glossary/glossary.json',
 *       routePath: '/glossary',
 *     }],
 *   ],
 * };
 * ```
 *
 * @param {object} context - Docusaurus context
 * @param {object} options - Plugin options
 * @param {string} options.glossaryPath - Path to glossary JSON file (default: 'glossary/glossary.json')
 * @param {string} options.routePath - Route path for glossary page (default: '/glossary')
 * @param {boolean} options.autoLinkTerms - Legacy option, kept for compatibility but no longer used (configure remark plugin manually instead)
 * @returns {object} Plugin object
 */
function glossaryPlugin(context, options = {}) {
  const {
    glossaryPath = 'glossary/glossary.json',
    routePath = '/glossary',
    autoLinkTerms = true,
  } = options;

  let glossaryDataCache = { terms: [] };

  return {
    name: 'docusaurus-plugin-glossary',

    async loadContent() {
      // Load glossary terms from JSON file
      const glossaryFilePath = path.resolve(context.siteDir, glossaryPath);

      if (await fs.pathExists(glossaryFilePath)) {
        const glossaryData = await fs.readJson(glossaryFilePath);
        glossaryDataCache = glossaryData;
        return glossaryData;
      }

      console.warn(`Glossary file not found at ${glossaryFilePath}. Using empty glossary.`);
      glossaryDataCache = { terms: [] };
      return { terms: [] };
    },

    async contentLoaded({ content, actions }) {
      const { createData, addRoute, setGlobalData } = actions;

      // Create data file that can be imported by components
      const glossaryDataPath = await createData('glossary-data.json', JSON.stringify(content));

      // Create a data file for the remark plugin to access glossary terms
      const remarkGlossaryDataPath = await createData(
        'remark-glossary-data.json',
        JSON.stringify({
          terms: content.terms || [],
          routePath: routePath,
        })
      );

      // Add glossary page route
      addRoute({
        path: routePath,
        component: path.join(__dirname, 'components/GlossaryPage.js'),
        exact: true,
        modules: {
          glossaryData: glossaryDataPath,
        },
      });

      // Expose global data for runtime lookups (used by GlossaryTerm)
      setGlobalData({
        terms: content.terms || [],
        routePath,
      });
    },

    getThemePath() {
      return path.resolve(__dirname, './theme');
    },

    getPathsToWatch() {
      return [path.resolve(context.siteDir, glossaryPath)];
    },

    async postBuild({ outDir }) {
      // You can add any post-build steps here if needed
      console.log('Glossary plugin: Build completed');
    },
  };
}

// Export remark plugin factory for use in markdown configuration
glossaryPlugin.remarkPlugin = require('./remark/glossary-terms');

/**
 * Helper function to get the configured remark plugin
 * This can be used in docusaurus.config.js markdown configuration
 *
 * @param {object} pluginOptions - Plugin options from docusaurus.config.js
 * @param {object} context - Docusaurus context
 * @returns {function} Configured remark plugin
 */
glossaryPlugin.getRemarkPlugin = function (pluginOptions, context) {
  const {
    glossaryPath = 'glossary/glossary.json',
    routePath = '/glossary',
    siteDir = context.siteDir,
  } = pluginOptions;

  return [
    require('./remark/glossary-terms'),
    {
      glossaryPath,
      routePath,
      siteDir,
    },
  ];
};

module.exports = glossaryPlugin;
