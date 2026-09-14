import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Glossary from './Glossary';

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
