#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const srcDir = join(rootDir, 'src');
const distDir = join(rootDir, 'dist');

async function build() {
  console.log('Copying JS files and directories to dist...');

  // Ensure dist directory exists (tsc should have created it)
  await fs.ensureDir(distDir);

  // Copy JS files and directories (TypeScript compiles index.ts to index.js)
  const itemsToCopy = ['components', 'theme', 'remark', 'client'];

  for (const item of itemsToCopy) {
    const sourcePath = join(srcDir, item);
    const destPath = join(distDir, item);

    if (await fs.pathExists(sourcePath)) {
      const stat = await fs.stat(sourcePath);
      if (stat.isDirectory()) {
        await fs.copy(sourcePath, destPath);
        console.log(`Copied directory: ${item}`);
      } else {
        await fs.copy(sourcePath, destPath);
        console.log(`Copied file: ${item}`);
      }
    } else {
      console.warn(`Warning: ${item} not found, skipping...`);
    }
  }

  console.log('Build complete!');
}

build().catch(error => {
  console.error('Build failed:', error);
  process.exit(1);
});
