import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import type { LoadContext, Plugin } from '@docusaurus/types';
import validatePeerDependencies from 'validate-peer-dependencies';
import remarkGlossaryTerms from './remark/glossary-terms.js';
import { validateGlossaryData, GlossaryValidationError } from './validation.js';

// Standard ES module directory resolution
const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);

// Validate peer dependencies at module load time
validatePeerDependencies(currentDir);

export interface GlossaryPluginOptions {
  glossaryPath?: string;
  routePath?: string;
  autoLinkTerms?: boolean;
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  abbreviation?: string;
  relatedTerms?: string[];
  id?: string;
}

export interface GlossaryData {
  terms: GlossaryTerm[];
}

/**
 * Docusaurus Glossary Plugin
 *
 * A plugin that provides glossary functionality with:
 * - Glossary terms defined in a JSON file
 * - Auto-generated glossary page with term definitions
 * - GlossaryTerm component for inline definitions with interactive tooltips
 * - Automatic client-side initialization via getClientModules() (no manual imports needed)
 * - Optional automatic glossary term detection in markdown files via remark plugin
 *
 * ## Basic Usage (Manual Term Markup)
 *
 * Just install the plugin - the GlossaryTerm component is automatically available:
 * ```javascript
 * module.exports = {
 *   plugins: [
 *     ['docusaurus-plugin-glossary', {
 *       glossaryPath: 'glossary/glossary.json',
 *       routePath: '/glossary',
 *     }],
 *   ],
 * };
 * ```
 *
 * Then use `<GlossaryTerm>` in your MDX files without importing:
 * ```mdx
 * <GlossaryTerm term="API">API</GlossaryTerm>
 * ```
 *
 * ## Advanced Usage (Automatic Term Detection)
 *
 * To automatically detect and link glossary terms in markdown, add the remark plugin:
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
 * @param context - Docusaurus context
 * @param options - Plugin options
 * @param options.glossaryPath - Path to glossary JSON file (default: 'glossary/glossary.json')
 * @param options.routePath - Route path for glossary page (default: '/glossary')
 * @param options.autoLinkTerms - Legacy option, kept for compatibility but no longer used (configure remark plugin manually instead)
 * @returns Plugin object
 */
export default function glossaryPlugin(
  context: LoadContext,
  options: GlossaryPluginOptions = {}
): Plugin {
  const {
    glossaryPath = 'glossary/glossary.json',
    routePath = '/glossary',
    autoLinkTerms = true,
  } = options;

  let glossaryDataCache: GlossaryData = { terms: [] };

  return {
    name: 'docusaurus-plugin-glossary',

    getClientModules() {
      return [path.resolve(currentDir, './client/index.js')];
    },

    async loadContent() {
      // Load glossary terms from JSON file
      const glossaryFilePath = path.resolve(context.siteDir, glossaryPath);

      if (await fs.pathExists(glossaryFilePath)) {
        try {
          const rawData = await fs.readJson(glossaryFilePath);

          // Validate glossary data structure
          const validationResult = validateGlossaryData(rawData, { throwOnError: false });

          if (!validationResult.valid) {
            console.warn(
              `[glossary-plugin] Glossary file has validation errors at ${glossaryFilePath}:`
            );
            validationResult.errors.forEach(err => {
              console.warn(`  - [${err.field}] ${err.message}`);
            });
            console.warn('[glossary-plugin] Proceeding with valid terms only.');
          }

          glossaryDataCache = validationResult.data;
          return validationResult.data;
        } catch (error) {
          if (error instanceof GlossaryValidationError) {
            throw error;
          }
          // JSON parsing error
          throw new Error(
            `Failed to parse glossary file at ${glossaryFilePath}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }

      console.warn(`Glossary file not found at ${glossaryFilePath}. Using empty glossary.`);
      glossaryDataCache = { terms: [] };
      return { terms: [] };
    },

    async contentLoaded({ content, actions }) {
      const { createData, addRoute, setGlobalData } = actions;
      const glossaryContent = content as GlossaryData;

      // Create data file that can be imported by components
      const glossaryDataPath = await createData(
        'glossary-data.json',
        JSON.stringify(glossaryContent)
      );

      // Create a data file for the remark plugin to access glossary terms
      const remarkGlossaryDataPath = await createData(
        'remark-glossary-data.json',
        JSON.stringify({
          terms: glossaryContent.terms || [],
          routePath: routePath,
        })
      );

      // Add glossary page route
      addRoute({
        path: routePath,
        component: path.join(currentDir, 'components/GlossaryPage.js'),
        exact: true,
        modules: {
          glossaryData: glossaryDataPath,
        },
      });

      // Expose global data for runtime lookups (used by GlossaryTerm)
      setGlobalData({
        terms: glossaryContent.terms || [],
        routePath,
      });
    },

    getThemePath() {
      return path.resolve(currentDir, './theme');
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
export const remarkPlugin = remarkGlossaryTerms;

// Export cache clearing utility
export { clearGlossaryCache } from './remark/glossary-terms.js';

// Export validation utilities
export {
  validateGlossaryData,
  GlossaryValidationError,
  formatValidationErrors,
  type ValidationError,
  type ValidationResult,
} from './validation.js';

/**
 * Helper function to get the configured remark plugin
 * This can be used in docusaurus.config.js markdown configuration
 *
 * @param pluginOptions - Plugin options from docusaurus.config.js
 * @param context - Context with siteDir
 * @returns Configured remark plugin
 */
export function getRemarkPlugin(
  pluginOptions: GlossaryPluginOptions,
  context?: { siteDir?: string }
): [typeof remarkGlossaryTerms, { glossaryPath: string; routePath: string; siteDir?: string }] {
  const { glossaryPath = 'glossary/glossary.json', routePath = '/glossary' } = pluginOptions;

  const siteDir = context?.siteDir;

  return [
    remarkGlossaryTerms,
    {
      glossaryPath,
      routePath,
      siteDir,
    },
  ];
}
