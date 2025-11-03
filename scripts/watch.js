#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starting watch mode...');
console.log('  - TypeScript compiler watching for .ts files');
console.log('  - CSS/JS watcher watching for .css, .js, .jsx files');

// Start TypeScript compiler in watch mode
const tsc = spawn('tsc', ['--watch'], {
  stdio: 'inherit',
  shell: true
});

// Start CSS/JS file watcher
const cssWatcherPath = join(__dirname, 'watch-css.js');
const cssWatcher = spawn('node', [cssWatcherPath], {
  stdio: 'inherit',
  shell: true
});

// Handle process termination
process.on('SIGINT', () => {
  tsc.kill();
  cssWatcher.kill();
  process.exit();
});

process.on('SIGTERM', () => {
  tsc.kill();
  cssWatcher.kill();
  process.exit();
});

// Handle child process errors
tsc.on('error', (err) => {
  console.error('TypeScript compiler error:', err);
});

cssWatcher.on('error', (err) => {
  console.error('CSS watcher error:', err);
});

