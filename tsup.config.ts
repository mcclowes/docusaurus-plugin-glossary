import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    preset: 'src/preset.ts',
    validation: 'src/validation.ts',
    'remark/glossary-terms': 'src/remark/glossary-terms.ts',
    'components/GlossaryPage': 'src/components/GlossaryPage.tsx',
    'theme/GlossaryTerm/index': 'src/theme/GlossaryTerm/index.tsx',
  },
  dts: {
    entry: {
      index: 'src/index.ts',
      preset: 'src/preset.ts',
      validation: 'src/validation.ts',
      'remark/glossary-terms': 'src/remark/glossary-terms.ts',
    },
  },
  format: ['cjs', 'esm'],
  sourcemap: true,
  clean: true,
  target: 'es2020',
  shims: true,
  external: [
    '@docusaurus/ExecutionEnvironment',
    '@docusaurus/BrowserOnly',
    '@docusaurus/useGlobalData',
    '@docusaurus/useDocusaurusContext',
    '@docusaurus/Link',
    '@theme/Layout',
    '@theme-original/Root',
    'react',
    'react-dom',
  ],
  loader: {
    '.css': 'copy',
    '.js': 'jsx',
  },
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
});
