import path from 'path';
import fs from 'fs-extra';
import { createRequire } from 'module';
import type { LoadContext, Plugin } from '@docusaurus/types';
import validatePeerDependencies from 'validate-peer-dependencies';
import remarkGlossaryTerms from './remark/glossary-terms.js';
import { validateGlossaryData, GlossaryValidationError } from './validation.js';

// Helper function to compute __dirname lazily when needed
// This avoids webpack bundling issues by not using fileURLToPath at module load time
function getDirname(): string {
  // Check if we're in a Node.js environment
  if (typeof process === 'undefined' || !process.versions?.node) {
    return '';
  }

  // Use cached value if available
  const global = globalThis as any;
  if (global.__dirnameCache) {
    return global.__dirnameCache;
  }

  // Use a lock to prevent race conditions when multiple calls happen concurrently
  // This ensures only one execution path computes and sets the cache
  if (global.__dirnameComputing) {
    // Another call is already computing __dirname, wait and retry
    // In practice, this should be rare since module initialization is typically sequential
    let retries = 0;
    while (global.__dirnameComputing && retries < 10) {
      retries++;
      // Busy wait with a small delay (not ideal but works for module init)
    }
    // Return cached value if available after waiting
    if (global.__dirnameCache) {
      return global.__dirnameCache;
    }
    // If still computing after retries, return empty to avoid deadlock
    return '';
  }

  // Set computing flag to prevent concurrent execution
  global.__dirnameComputing = true;

  try {
    // In Jest/Babel transformed environment, __filename is available
    // @ts-ignore - __filename is available after Babel transforms ES modules to CommonJS
    if (typeof __filename !== 'undefined') {
      const computedDirname = path.dirname(__filename);
      global.__dirnameCache = computedDirname;
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
        global.__dirnameCache = computedDirname;
        return computedDirname;
      }
    } catch (error) {
      // If webpack provides a broken polyfill or require fails, return empty
      // __dirname will be computed when the plugin function is called (server-side only)
      return '';
    }
    return '';
  } finally {
    // Always clear the computing flag
    global.__dirnameComputing = false;
  }
}

// Initialize __dirname at module load time, but handle webpack bundling gracefully
let __dirname: string = '';
let peerDepsValidated: boolean = false;
try {
  // Only compute __dirname if we're in Node.js (not during webpack bundling)
  if (typeof process !== 'undefined' && process.versions?.node) {
    const global = globalThis as any;

    // Set lock to prevent concurrent getDirname() calls during module init
    if (!global.__dirnameComputing) {
      global.__dirnameComputing = true;

      try {
        // In Jest/Babel transformed environment, __filename is available
        // @ts-ignore - __filename is available after Babel transforms ES modules to CommonJS
        if (typeof __filename !== 'undefined') {
          __dirname = path.dirname(__filename);
          global.__dirnameCache = __dirname;
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
              global.__dirnameCache = __dirname;
              validatePeerDependencies(__dirname);
              peerDepsValidated = true;
            }
          }
        }
      } finally {
        global.__dirnameComputing = false;
      }
    } else {
      // Another module init is already computing, use cached value if available
      if (global.__dirnameCache) {
        __dirname = global.__dirnameCache;
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
      // Compute __dirname if not already set (for webpack bundling compatibility)
      const pluginDirname = __dirname || getDirname();
      return [path.resolve(pluginDirname, './client/index.js')];
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
