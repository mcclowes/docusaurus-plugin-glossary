import assert from 'node:assert/strict';
import test from 'node:test';
import { compile } from '@mdx-js/mdx';
import remarkGlossaryTerms from '../dist/remark/glossary-terms.js';

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

async function compileWithGlossary(source) {
  return String(
    await compile(source, {
      jsx: true,
      remarkPlugins: [[remarkGlossaryTerms, { terms }]],
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

test('does not match terms inside larger Unicode words', async () => {
  const code = await compileWithGlossary('The xAPIvalue differs from API.');

  assert.equal((code.match(/term="API"/g) || []).length, 1);
});

test('compiles repeated occurrences without malformed MDX', async () => {
  const code = await compileWithGlossary('API, API, and **API**.');

  assert.equal((code.match(/term="API"/g) || []).length, 3);
});
