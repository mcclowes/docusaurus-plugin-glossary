import path from 'path';
import fs from 'fs-extra';
import { createRequire } from 'module';
import type { LoadContext, Plugin } from '@docusaurus/types';
import validatePeerDependencies from 'validate-peer-dependencies';
import remarkGlossaryTerms from './remark/glossary-terms.js';

// Helper function to compute __dirname lazily when needed
// This avoids webpack bundling issues by not using fileURLToPath at module load time
function getDirname(): string {
  // Check if we're in a Node.js environment
  if (typeof process === 'undefined' || !process.versions?.node) {
    return '';
  }

  // Use cached value if available
  if ((globalThis as any).__dirnameCache) {
    return (globalThis as any).__dirnameCache;
  }

  // In Jest/Babel transformed environment, __filename is available
  // @ts-ignore - __filename is available after Babel transforms ES modules to CommonJS
  if (typeof __filename !== 'undefined') {
    const computedDirname = path.dirname(__filename);
    (globalThis as any).__dirnameCache = computedDirname;
    return computedDirname;
  }

  // Check if import.meta.url is available
  // Use try-catch to handle cases where import.meta is undefined (e.g., in Jest before transform)
  let hasImportMetaUrl = false;
  try {
    hasImportMetaUrl = typeof import.meta.url !== 'undefined';
  } catch {
    // import.meta is undefined (e.g., in Jest environment before Babel transform)
    return '';
  }

  if (!hasImportMetaUrl) {
    return '';
  }

  // Try to compute __dirname using fileURLToPath via createRequire
  // This avoids webpack trying to bundle fileURLToPath at module load time
  try {
    const require = createRequire(import.meta.url);
    const urlModule = require('url');
    
    // Check if fileURLToPath is actually a function (webpack may provide a broken polyfill)
    if (urlModule && typeof urlModule.fileURLToPath === 'function') {
      const __filename = urlModule.fileURLToPath(import.meta.url);
      const computedDirname = path.dirname(__filename);
      (globalThis as any).__dirnameCache = computedDirname;
      return computedDirname;
    }
  } catch (error) {
    // If webpack provides a broken polyfill or require fails, return empty
    // __dirname will be computed when the plugin function is called (server-side only)
    return '';
  }
  return '';
}

// Initialize __dirname at module load time, but handle webpack bundling gracefully
let __dirname: string = '';
let peerDepsValidated: boolean = false;
try {
  // Only compute __dirname if we're in Node.js (not during webpack bundling)
  if (typeof process !== 'undefined' && process.versions?.node) {
    // In Jest/Babel transformed environment, __filename is available
    // @ts-ignore - __filename is available after Babel transforms ES modules to CommonJS
    if (typeof __filename !== 'undefined') {
      __dirname = path.dirname(__filename);
      validatePeerDependencies(__dirname);
      peerDepsValidated = true;
    } else {
      // Check if import.meta.url is available - use try-catch since import.meta might be undefined
      let hasImportMetaUrl = false;
      try {
        hasImportMetaUrl = typeof import.meta.url !== 'undefined';
      } catch {
        // import.meta is undefined (e.g., in Jest environment before Babel transform)
        hasImportMetaUrl = false;
      }
      
      if (hasImportMetaUrl) {
        const require = createRequire(import.meta.url);
        const urlModule = require('url');
        
        // Check if fileURLToPath is actually a function (not a webpack polyfill)
        if (urlModule && typeof urlModule.fileURLToPath === 'function') {
          const __filename = urlModule.fileURLToPath(import.meta.url);
          __dirname = path.dirname(__filename);
          validatePeerDependencies(__dirname);
          peerDepsValidated = true;
        }
      }
    }
  }
} catch {
  // If initialization fails (e.g., during webpack bundling), __dirname will be empty
  // and will be computed lazily via getDirname() when needed
}

// Validate peer dependencies lazily if not already validated
if (!peerDepsValidated && typeof process !== 'undefined' && process.versions?.node) {
  try {
    const dirname = getDirname();
    if (dirname) {
      validatePeerDependencies(dirname);
      peerDepsValidated = true;
    }
  } catch {
    // Ignore validation errors during webpack bundling
  }
}

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

    async loadContent() {
      // Load glossary terms from JSON file
      const glossaryFilePath = path.resolve(context.siteDir, glossaryPath);

      if (await fs.pathExists(glossaryFilePath)) {
        const glossaryData = (await fs.readJson(glossaryFilePath)) as GlossaryData;
        glossaryDataCache = glossaryData;
        return glossaryData;
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
      // Compute __dirname if not already set (for webpack bundling compatibility)
      const pluginDirname = __dirname || getDirname();
      addRoute({
        path: routePath,
        component: path.join(pluginDirname, 'components/GlossaryPage.js'),
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
      // Compute __dirname if not already set (for webpack bundling compatibility)
      const pluginDirname = __dirname || getDirname();
      return path.resolve(pluginDirname, './theme');
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
