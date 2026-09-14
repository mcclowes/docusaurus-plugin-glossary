import assert from 'node:assert/strict';
import test from 'node:test';
import { compile } from '@mdx-js/mdx';
import remarkGlossaryTerms from '../dist/remark/glossary-terms.js';
import { getRemarkPlugin } from '../dist/index.js';
import preset from '../dist/preset.js';

const terms = [
  {
    term: 'API',
    id: 'api-term',
    definition: 'Application Programming Interface',
    aliases: ['interface contract'],
    documentation: { path: '/docs/api' },
  },
  { term: 'REST API', definition: 'A RESTful interface' },
];

async function compileWithGlossary(source, options = {}) {
  return String(
    await compile(source, {
      jsx: true,
      remarkPlugins: [[remarkGlossaryTerms, { terms, ...options }]],
    })
  );
}

test('compiles nested Markdown and prefers the longest matching term', async () => {
  const code = await compileWithGlossary('Use **the REST API** and an interface contract.');

  assert.match(code, /import GlossaryTerm from "@theme\/GlossaryTerm"/);
  assert.match(code, /term="REST API"/);
  assert.match(code, /term="API"/);
  assert.match(code, /id="api-term"/);
  assert.match(code, /documentationPath="\/docs\/api"/);
});

test('skips headings, links, code, and existing JSX content', async () => {
  const code = await compileWithGlossary(
    '# API\n\n[API](https://example.com) `API` <span>API</span> API'
  );

  assert.equal((code.match(/term="API"/g) || []).length, 1);
});

test('skips all descendants of links, reference links, headings, and MDX elements', async () => {
  const code = await compileWithGlossary(
    '# **API**\n\n[**API**](https://example.com) [*API*][guide]\n\n[guide]: https://example.com\n\n<span>**API**</span>\n\n<div>\n\n**API**\n\n</div>\n\nAPI'
  );

  assert.equal((code.match(/term="API"/g) || []).length, 1);
});

test('does not match terms inside larger Unicode words', async () => {
  const code = await compileWithGlossary('xAPIvalue caféAPI API中 𐐀API APÍ. İ API.');

  assert.equal((code.match(/term="API"/g) || []).length, 1);
  assert.match(code, />\{"API"\}<\/GlossaryTerm>/);
});

test('compiles repeated occurrences without malformed MDX', async () => {
  const code = await compileWithGlossary('API, API, and **API**.');

  assert.equal((code.match(/term="API"/g) || []).length, 3);
});

test('links each canonical term once per file, sharing aliases and plural forms', async () => {
  const source =
    '# API\n\n[API](https://example.com) API and APIs.\n\n**interface contract** and REST API. REST API.';
  const options = { linkOnlyFirstOccurrence: true };
  for (let file = 0; file < 2; file++) {
    const code = await compileWithGlossary(source, options);
    assert.equal((code.match(/term="API"/g) || []).length, 1);
    assert.equal((code.match(/term="REST API"/g) || []).length, 1);
    assert.match(code, /APIs/);
    assert.match(code, /interface contract/);
  }
});

test('forwards first-occurrence configuration through the helper and preset', () => {
  assert.equal(getRemarkPlugin({ linkOnlyFirstOccurrence: true })[1].linkOnlyFirstOccurrence, true);
  assert.equal(getRemarkPlugin({})[1].linkOnlyFirstOccurrence, false);
  const configured = preset(
    { siteDir: '/tmp' },
    { glossary: { linkOnlyFirstOccurrence: true }, blog: {} }
  );
  for (const name of ['docs', 'pages', 'blog']) {
    const plugin = configured.plugins.find(
      entry => Array.isArray(entry) && entry[0] === `@docusaurus/plugin-content-${name}`
    );
    assert.equal(plugin[1].remarkPlugins[0][1].linkOnlyFirstOccurrence, true);
  }
});
