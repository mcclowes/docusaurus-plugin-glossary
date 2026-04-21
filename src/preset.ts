import type { Preset, LoadContext } from '@docusaurus/types';
import glossaryPlugin, { getRemarkPlugin } from './index.js';
import type { GlossaryPluginOptions } from './index.js';

/**
 * Configuration for @docusaurus/plugin-content-docs
 * Using Record<string, unknown> to allow any valid docs options without coupling to specific version
 */
type DocsConfig = Record<string, unknown> & {
  remarkPlugins?: unknown[];
};

/**
 * Configuration for @docusaurus/plugin-content-blog
 * Can be false to disable, or configuration object
 */
type BlogConfig =
  | false
  | (Record<string, unknown> & {
      remarkPlugins?: unknown[];
    });

/**
 * Configuration for @docusaurus/plugin-content-pages
 */
type PagesConfig = Record<string, unknown> & {
  remarkPlugins?: unknown[];
};

/**
 * Configuration for @docusaurus/theme-classic
 */
type ThemeConfig = Record<string, unknown>;

/**
 * Configuration for analytics plugins
 */
type AnalyticsConfig = Record<string, unknown>;

/**
 * Configuration for @docusaurus/plugin-sitemap
 * Can be false to disable, or configuration object
 */
type SitemapConfig = false | Record<string, unknown>;

/**
 * Classic preset options (simplified to avoid direct dependency on @docusaurus/preset-classic)
 * These mirror the options available in the classic preset
 */
export interface ClassicPresetOptions {
  docs?: DocsConfig;
  blog?: BlogConfig;
  pages?: PagesConfig;
  theme?: ThemeConfig;
  gtag?: AnalyticsConfig;
  googleAnalytics?: AnalyticsConfig;
  googleTagManager?: AnalyticsConfig;
  sitemap?: SitemapConfig;
  debug?: boolean;
}

export interface GlossaryPresetOptions extends ClassicPresetOptions {
  glossary?: GlossaryPluginOptions;
  /** Internal: Docusaurus adds this, we need to exclude it from classic options */
  id?: string;
}

/**
 * Docusaurus Glossary Preset
 *
 * A preset that extends @docusaurus/preset-classic with automatic glossary functionality.
 * This preset automatically configures the remark plugin for docs and pages, so you don't
 * need to manually add it to remarkPlugins.
 *
 * @example
 * ```javascript
 * export default {
 *   presets: [
 *     [
 *       'docusaurus-plugin-glossary/preset',
 *       {
 *         // Glossary options
 *         glossary: {
 *           glossaryPath: 'glossary/glossary.json',
 *           routePath: '/glossary',
 *         },
 *         // Classic preset options
 *         docs: {
 *           sidebarPath: './sidebars.js',
 *         },
 *         blog: {
 *           showReadingTime: true,
 *         },
 *         theme: {
 *           customCss: './src/css/custom.css',
 *         },
 *       },
 *     ],
 *   ],
 * };
 * ```
 *
 * @param context - Docusaurus context
 * @param options - Preset options including glossary and classic preset options
 * @returns Preset configuration
 */
export default function preset(context: LoadContext, options: GlossaryPresetOptions = {}): Preset {
  // Explicitly extract glossary and any Docusaurus-added properties that shouldn't go to classic preset
  const { glossary = {}, id: _id, ...restOptions } = options;

  // Extract only valid classic preset options
  // Explicitly type blog and sitemap to preserve union types (can be false)
  const { docs, pages, theme, gtag, googleAnalytics, googleTagManager, debug } = restOptions;
  const blog: BlogConfig | undefined = restOptions.blog;
  const sitemap: SitemapConfig | undefined = restOptions.sitemap;

  // Build classic options object with only defined properties
  const classicOptions: ClassicPresetOptions = {};
  if (docs !== undefined) classicOptions.docs = docs;
  if (blog !== undefined) classicOptions.blog = blog;
  if (pages !== undefined) classicOptions.pages = pages;
  if (theme !== undefined) classicOptions.theme = theme;
  if (gtag !== undefined) classicOptions.gtag = gtag;
  if (googleAnalytics !== undefined) classicOptions.googleAnalytics = googleAnalytics;
  if (googleTagManager !== undefined) classicOptions.googleTagManager = googleTagManager;
  if (sitemap !== undefined) classicOptions.sitemap = sitemap;
  if (debug !== undefined) classicOptions.debug = debug;

  const { glossaryPath = 'glossary/glossary.json', routePath = '/glossary' } = glossary;

  // Get the remark plugin configuration
  const remarkPlugin = getRemarkPlugin({ glossaryPath, routePath }, { siteDir: context.siteDir });

  // Extend docs configuration with glossary remark plugin
  const docsConfig = classicOptions.docs || {};
  const docsRemarkPlugins = docsConfig.remarkPlugins || [];
  const extendedDocsConfig = {
    ...docsConfig,
    remarkPlugins: [...docsRemarkPlugins, remarkPlugin],
  };

  // Extend pages configuration with glossary remark plugin
  const pagesConfig = classicOptions.pages || {};
  const pagesRemarkPlugins = pagesConfig.remarkPlugins || [];
  const extendedPagesConfig = {
    ...pagesConfig,
    remarkPlugins: [...pagesRemarkPlugins, remarkPlugin],
  };

  // Extend blog configuration with glossary remark plugin (optional)
  // Use typeof check for proper type narrowing (blog can be false, object, or undefined)
  let extendedBlogConfig: BlogConfig | undefined = blog;
  if (typeof blog === 'object' && blog !== null) {
    const blogRemarkPlugins = blog.remarkPlugins || [];
    extendedBlogConfig = {
      ...blog,
      remarkPlugins: [...blogRemarkPlugins, remarkPlugin],
    };
  }

  // Build the final classic preset options
  const finalClassicOptions: ClassicPresetOptions = {};
  if (extendedDocsConfig !== undefined) finalClassicOptions.docs = extendedDocsConfig;
  if (extendedBlogConfig !== undefined) finalClassicOptions.blog = extendedBlogConfig;
  if (extendedPagesConfig !== undefined) finalClassicOptions.pages = extendedPagesConfig;
  if (theme !== undefined) finalClassicOptions.theme = theme;
  if (gtag !== undefined) finalClassicOptions.gtag = gtag;
  if (googleAnalytics !== undefined) finalClassicOptions.googleAnalytics = googleAnalytics;
  if (googleTagManager !== undefined) finalClassicOptions.googleTagManager = googleTagManager;
  if (sitemap !== undefined) finalClassicOptions.sitemap = sitemap;
  if (debug !== undefined) finalClassicOptions.debug = debug;

  // Plugin tuple type: [plugin-name, options] or plugin function
  type PluginEntry =
    | [string, Record<string, unknown>]
    | ((ctx: LoadContext) => ReturnType<typeof glossaryPlugin>);

  const plugins: PluginEntry[] = [
    // Add the glossary plugin first
    function glossaryPluginWrapper(ctx: LoadContext) {
      return glossaryPlugin(ctx, glossary);
    },
  ];

  // Add classic preset plugins individually
  if (extendedDocsConfig) plugins.push(['@docusaurus/plugin-content-docs', extendedDocsConfig]);
  if (typeof extendedBlogConfig === 'object' && extendedBlogConfig !== null)
    plugins.push(['@docusaurus/plugin-content-blog', extendedBlogConfig]);
  if (extendedPagesConfig) plugins.push(['@docusaurus/plugin-content-pages', extendedPagesConfig]);
  if (gtag) plugins.push(['@docusaurus/plugin-google-gtag', gtag]);
  if (googleAnalytics) plugins.push(['@docusaurus/plugin-google-analytics', googleAnalytics]);
  if (googleTagManager) plugins.push(['@docusaurus/plugin-google-tag-manager', googleTagManager]);
  if (sitemap !== false) plugins.push(['@docusaurus/plugin-sitemap', sitemap || {}]);
  if (debug) plugins.push(['@docusaurus/plugin-debug', {}]);

  return {
    themes: [
      // Pass theme options (including customCss) to theme-classic
      ['@docusaurus/theme-classic', theme || {}],
    ],
    plugins,
  };
}
