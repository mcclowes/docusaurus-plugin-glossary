import type { Preset } from '@docusaurus/types';
import glossaryPlugin, { getRemarkPlugin } from './index.js';
import type { GlossaryPluginOptions } from './index.js';

// Type definition for classic preset options (simplified to avoid dependency on @docusaurus/preset-classic)
export interface ClassicPresetOptions {
  docs?: any;
  blog?: any;
  pages?: any;
  theme?: any;
  gtag?: any;
  googleAnalytics?: any;
  googleTagManager?: any;
  sitemap?: any;
  debug?: any;
}

export interface GlossaryPresetOptions extends ClassicPresetOptions {
  glossary?: GlossaryPluginOptions;
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
export default function preset(
  context: any,
  options: GlossaryPresetOptions = {}
): Preset {
  // Explicitly extract glossary and any Docusaurus-added properties that shouldn't go to classic preset
  const { glossary = {}, id, ...restOptions } = options as any;

  // Extract only valid classic preset options
  const {
    docs,
    blog,
    pages,
    theme,
    gtag,
    googleAnalytics,
    googleTagManager,
    sitemap,
    debug,
  } = restOptions;

  // Build classic options object with only defined properties
  const classicOptions: any = {};
  if (docs !== undefined) classicOptions.docs = docs;
  if (blog !== undefined) classicOptions.blog = blog;
  if (pages !== undefined) classicOptions.pages = pages;
  if (theme !== undefined) classicOptions.theme = theme;
  if (gtag !== undefined) classicOptions.gtag = gtag;
  if (googleAnalytics !== undefined) classicOptions.googleAnalytics = googleAnalytics;
  if (googleTagManager !== undefined) classicOptions.googleTagManager = googleTagManager;
  if (sitemap !== undefined) classicOptions.sitemap = sitemap;
  if (debug !== undefined) classicOptions.debug = debug;

  const {
    glossaryPath = 'glossary/glossary.json',
    routePath = '/glossary',
  } = glossary;

  // Get the remark plugin configuration
  const remarkPlugin = getRemarkPlugin(
    { glossaryPath, routePath },
    { siteDir: context.siteDir }
  );

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
  const blogConfig = classicOptions.blog;
  let extendedBlogConfig = blogConfig;
  if (blogConfig && blogConfig !== false) {
    const blogRemarkPlugins =
      typeof blogConfig === 'object' ? blogConfig.remarkPlugins || [] : [];
    extendedBlogConfig =
      typeof blogConfig === 'object'
        ? {
            ...blogConfig,
            remarkPlugins: [...blogRemarkPlugins, remarkPlugin],
          }
        : blogConfig;
  }

  // Build the final classic preset options
  const finalClassicOptions: any = {};
  if (extendedDocsConfig !== undefined) finalClassicOptions.docs = extendedDocsConfig;
  if (extendedBlogConfig !== undefined) finalClassicOptions.blog = extendedBlogConfig;
  if (extendedPagesConfig !== undefined) finalClassicOptions.pages = extendedPagesConfig;
  if (theme !== undefined) finalClassicOptions.theme = theme;
  if (gtag !== undefined) finalClassicOptions.gtag = gtag;
  if (googleAnalytics !== undefined) finalClassicOptions.googleAnalytics = googleAnalytics;
  if (googleTagManager !== undefined) finalClassicOptions.googleTagManager = googleTagManager;
  if (sitemap !== undefined) finalClassicOptions.sitemap = sitemap;
  if (debug !== undefined) finalClassicOptions.debug = debug;

  const plugins: any[] = [
    // Add the glossary plugin first
    function glossaryPluginWrapper(context: any) {
      return glossaryPlugin(context, glossary);
    },
  ];

  // Add classic preset plugins individually
  if (extendedDocsConfig) plugins.push(['@docusaurus/plugin-content-docs', extendedDocsConfig]);
  if (extendedBlogConfig && extendedBlogConfig !== false) plugins.push(['@docusaurus/plugin-content-blog', extendedBlogConfig]);
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
