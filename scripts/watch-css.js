#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { watch } from 'fs';
import { existsSync } from 'fs';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const srcDir = join(rootDir, 'src');
const libDir = join(rootDir, 'lib');

async function copyThemeFiles() {
  // Ensure lib directory exists
  await fs.ensureDir(libDir);
  
  // Copy directories that contain non-TypeScript files (components, theme, remark)
  const itemsToCopy = ['components', 'theme', 'remark'];
  
  for (const item of itemsToCopy) {
    const sourcePath = join(srcDir, item);
    const destPath = join(libDir, item);
    
    if (existsSync(sourcePath)) {
      await fs.copy(sourcePath, destPath, { overwrite: true });
    }
  }
}

async function watchNonTSFiles() {
  console.log('Watching CSS and JS files for changes...');
  
  // Initial copy
  await copyThemeFiles();
  console.log('Initial copy complete');
  
  // Watch directories recursively - Node's watch API isn't great for recursive,
  // but we'll watch the main directories
  const dirsToWatch = ['components', 'theme', 'remark'];
  
  for (const dir of dirsToWatch) {
    const dirPath = join(srcDir, dir);
    if (existsSync(dirPath)) {
      try {
        watch(dirPath, { recursive: true }, async (eventType, filename) => {
          if (filename && (filename.endsWith('.css') || filename.endsWith('.js') || filename.endsWith('.jsx'))) {
            console.log(`File changed: ${dir}/${filename}`);
            await copyThemeFiles();
          }
        });
      } catch (error) {
        if (error.code === 'ERR_FEATURE_UNAVAILABLE_ON_PLATFORM') {
          console.warn(`Warning: Recursive watching not supported. Watching ${dir} directory only (not subdirectories).`);
          // Fallback to non-recursive watching
          watch(dirPath, async (eventType, filename) => {
            if (filename && (filename.endsWith('.css') || filename.endsWith('.js') || filename.endsWith('.jsx'))) {
              console.log(`File changed: ${dir}/${filename}`);
              await copyThemeFiles();
            }
          });
        } else {
          throw error;
        }
      }
    }
  }
}

watchNonTSFiles().catch(error => {
  console.error('Failed to watch files:', error);
  process.exit(1);
});

