// Setup file that runs before modules are loaded
// This sets up the mock for import.meta before any modules try to use it
// Note: This file cannot use import.meta itself since it needs to run in CommonJS context
// We use a simple require-based approach here
const { pathToFileURL } = require('url');

// Set mock for import.meta before any modules are loaded
globalThis.__importMeta__ = {
  url: pathToFileURL(__filename).href,
};

