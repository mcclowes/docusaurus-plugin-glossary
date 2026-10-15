import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToStaticMarkup } from 'react-dom/server.node';
import Glossary from './Glossary';
import { collectAnchor } from '../../jest/mocks/useBrokenLinks';

beforeEach(() => collectAnchor.mockClear());

it('embeds searchable glossary content without a page layout or duplicate title', async () => {
  const user = userEvent.setup();
  render(
    <Glossary
      showTitle={false}
      glossaryData={{
        title: 'Module glossary',
        terms: [
          { term: 'API', definition: 'An interface', category: 'Interfaces' },
          { term: 'Deploy', definition: 'Publish changes' },
        ],
      }}
    />
  );
  expect(screen.queryByTestId('layout')).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'A' })).toHaveAttribute('href', '#letter-A');
  await user.type(screen.getByPlaceholderText('Search terms...'), 'Interfaces');
  expect(screen.getByText('API')).toBeInTheDocument();
  expect(screen.queryByText('Deploy')).not.toBeInTheDocument();
});

it('registers exactly the rendered letter and term anchors with Docusaurus', () => {
  const { container } = render(
    <Glossary
      glossaryData={{
        terms: [
          { id: 'custom-api', term: 'API', definition: 'An interface' },
          { term: 'Machine Learning', definition: 'A technique' },
        ],
      }}
    />
  );
  const renderedIds = [...container.querySelectorAll('[id]')].map(element => element.id);
  expect(renderedIds).toEqual(['letter-A', 'custom-api', 'letter-M', 'machine-learning']);
  expect(collectAnchor.mock.calls.map(([id]) => id)).toEqual(renderedIds);
});

it('registers anchors during server rendering', () => {
  const html = renderToStaticMarkup(
    <Glossary glossaryData={{ terms: [{ term: 'API', definition: 'An interface' }] }} />
  );
  expect(html).toContain('id="letter-A"');
  expect(html).toContain('id="api"');
  expect(collectAnchor.mock.calls.map(([id]) => id)).toEqual(['letter-A', 'api']);
});

it('registers only visible anchors after filtering and none for an empty result', async () => {
  const user = userEvent.setup();
  const { container } = render(
    <Glossary
      glossaryData={{
        terms: [
          { term: 'API', definition: 'An interface' },
          { term: 'Deploy', definition: 'Publish changes' },
        ],
      }}
    />
  );
  await user.type(screen.getByPlaceholderText('Search terms...'), 'AP');
  collectAnchor.mockClear();
  await user.type(screen.getByPlaceholderText('Search terms...'), 'I');
  expect([...container.querySelectorAll('[id]')].map(element => element.id)).toEqual([
    'letter-A',
    'api',
  ]);
  expect(collectAnchor.mock.calls.map(([id]) => id)).toEqual(['letter-A', 'api']);

  collectAnchor.mockClear();
  await user.type(screen.getByPlaceholderText('Search terms...'), 'X');
  expect(container.querySelectorAll('[id]')).toHaveLength(0);
  expect(collectAnchor).not.toHaveBeenCalled();
});
