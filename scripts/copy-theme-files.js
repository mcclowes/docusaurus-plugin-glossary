#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const srcThemeDir = join(rootDir, 'src', 'theme');
const distThemeDir = join(rootDir, 'dist', 'theme');

async function copyThemeFiles() {
  // Ensure dist/theme directory exists
  await fs.ensureDir(distThemeDir);

  // Note: MDXComponents.js is no longer needed as GlossaryTerm
  // is available via @theme/GlossaryTerm and auto-injected by the remark plugin
}

copyThemeFiles().catch(error => {
  console.error('Failed to copy theme files:', error);
  process.exit(1);
});
