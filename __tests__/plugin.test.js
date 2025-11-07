import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import glossaryPluginModule from '../dist/index.js';

const glossaryPlugin = glossaryPluginModule.default || glossaryPluginModule;

describe('glossaryPlugin', () => {
  let tempDir;
  let context;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'glossary-plugin-'));
    context = {
      siteDir: tempDir,
    };

    // Create test glossary file
    await fs.ensureDir(path.join(tempDir, 'glossary'));
    await fs.writeJson(path.join(tempDir, 'glossary/glossary.json'), {
      terms: [
        { term: 'API', definition: 'Application Programming Interface' },
        { term: 'REST', definition: 'Representational State Transfer' },
      ],
    });
  });

  afterEach(async () => {
    if (tempDir) {
      await fs.remove(tempDir);
    }
  });

  it('should return a plugin object with correct name', () => {
    const plugin = glossaryPlugin(context, {});
    expect(plugin.name).toBe('docusaurus-plugin-glossary');
  });

  it('should load glossary content from default path', async () => {
    const plugin = glossaryPlugin(context, {});
    const content = await plugin.loadContent();

    expect(content.terms).toHaveLength(2);
    expect(content.terms[0].term).toBe('API');
    expect(content.terms[1].term).toBe('REST');
  });

  it('should load glossary content from custom path', async () => {
    // Create custom path glossary
    await fs.ensureDir(path.join(tempDir, 'custom'));
    await fs.writeJson(path.join(tempDir, 'custom/custom-glossary.json'), {
      terms: [{ term: 'Custom', definition: 'Custom term' }],
    });

    const plugin = glossaryPlugin(context, {
      glossaryPath: 'custom/custom-glossary.json',
    });
    const content = await plugin.loadContent();

    expect(content.terms).toHaveLength(1);
    expect(content.terms[0].term).toBe('Custom');
  });

  it('should return empty terms when glossary file not found', async () => {
    const plugin = glossaryPlugin(context, {
      glossaryPath: 'nonexistent/glossary.json',
    });
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    const content = await plugin.loadContent();

    expect(content.terms).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should call contentLoaded actions', async () => {
    const plugin = glossaryPlugin(context, {});
    const content = await plugin.loadContent();

    const mockCreateData = jest.fn(() => Promise.resolve('path/to/data.json'));
    const mockAddRoute = jest.fn();

    await plugin.contentLoaded({
      content,
      actions: {
        createData: mockCreateData,
        addRoute: mockAddRoute,
        setGlobalData: jest.fn(),
      },
    });

    expect(mockCreateData).toHaveBeenCalledWith(
      'glossary-data.json',
      expect.stringContaining('"terms"')
    );
    expect(mockAddRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/glossary',
        exact: true,
      })
    );
  });

  it('should use custom route path', async () => {
    const plugin = glossaryPlugin(context, { routePath: '/custom-glossary' });
    const content = await plugin.loadContent();

    const mockAddRoute = jest.fn();

    await plugin.contentLoaded({
      content,
      actions: {
        createData: jest.fn(() => Promise.resolve('path/to/data.json')),
        addRoute: mockAddRoute,
        setGlobalData: jest.fn(),
      },
    });

    expect(mockAddRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/custom-glossary',
      })
    );
  });

  it('should return theme path', () => {
    const plugin = glossaryPlugin(context, {});
    const themePath = plugin.getThemePath();

    expect(themePath).toContain('theme');
    expect(fs.pathExistsSync(themePath)).toBe(true);
  });

  it('should return paths to watch', () => {
    const plugin = glossaryPlugin(context, {});
    const pathsToWatch = plugin.getPathsToWatch();

    expect(pathsToWatch).toHaveLength(1);
    expect(pathsToWatch[0]).toContain('glossary.json');
  });

  it('should return paths to watch for custom glossary path', () => {
    const plugin = glossaryPlugin(context, {
      glossaryPath: 'custom/glossary.json',
    });
    const pathsToWatch = plugin.getPathsToWatch();

    expect(pathsToWatch[0]).toContain('custom');
    expect(pathsToWatch[0]).toContain('glossary.json');
  });

  it('should call postBuild callback', async () => {
    const plugin = glossaryPlugin(context, {});
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await plugin.postBuild({ outDir: '/tmp/build' });

    expect(consoleSpy).toHaveBeenCalledWith('Glossary plugin: Build completed');

    consoleSpy.mockRestore();
  });
});
