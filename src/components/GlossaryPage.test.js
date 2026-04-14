import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GlossaryPage from './GlossaryPage';

// Mock CSS modules
jest.mock('./GlossaryPage.module.css', () => ({
  glossaryContainer: 'glossaryContainer',
  glossaryHeader: 'glossaryHeader',
  glossaryDescription: 'glossaryDescription',
  searchContainer: 'searchContainer',
  searchInput: 'searchInput',
  noResults: 'noResults',
  glossaryContent: 'glossaryContent',
  letterNav: 'letterNav',
  letterLink: 'letterLink',
  letterSection: 'letterSection',
  letterHeading: 'letterHeading',
  termList: 'termList',
  termItem: 'termItem',
  termName: 'termName',
  abbreviation: 'abbreviation',
  termDefinition: 'termDefinition',
  relatedTerms: 'relatedTerms',
  glossaryFooter: 'glossaryFooter',
}));

const mockGlossaryData = {
  title: 'Test Glossary Title',
  description: 'Test glossary',
  terms: [
    {
      id: 'api',
      term: 'API',
      definition: 'Application Programming Interface',
      abbreviation: 'API',
      relatedTerms: ['REST'],
    },
    {
      id: 'rest',
      term: 'REST',
      definition: 'Representational State Transfer',
      abbreviation: 'REST',
      relatedTerms: ['API'],
    },
    {
      id: 'ml',
      term: 'Machine Learning',
      definition: 'A type of artificial intelligence',
    },
  ],
};

describe('GlossaryPage', () => {
  it('should render glossary with all terms', () => {
    render(<GlossaryPage glossaryData={mockGlossaryData} />);

    expect(screen.getByText('Test Glossary Title')).toBeInTheDocument();
    expect(screen.getByText('Test glossary')).toBeInTheDocument();
    // Use getAllBy since terms can appear multiple times (in term names and related links)
    expect(screen.getAllByText('API').length).toBeGreaterThan(0);
    expect(screen.getAllByText('REST').length).toBeGreaterThan(0);
    expect(screen.getByText('Machine Learning')).toBeInTheDocument();
  });

  it('should show search input', () => {
    render(<GlossaryPage glossaryData={mockGlossaryData} />);

    const searchInput = screen.getByPlaceholderText('Search terms...');
    expect(searchInput).toBeInTheDocument();
  });

  it('should filter terms by search query', async () => {
    const user = userEvent.setup();
    render(<GlossaryPage glossaryData={mockGlossaryData} />);

    const searchInput = screen.getByPlaceholderText('Search terms...');
    await user.type(searchInput, 'API');

    expect(screen.getByText('API')).toBeInTheDocument();
    expect(screen.queryByText('Machine Learning')).not.toBeInTheDocument();
  });

  it('should filter by definition text', async () => {
    const user = userEvent.setup();
    render(<GlossaryPage glossaryData={mockGlossaryData} />);

    const searchInput = screen.getByPlaceholderText('Search terms...');
    await user.type(searchInput, 'artificial');

    expect(screen.getByText('Machine Learning')).toBeInTheDocument();
    expect(screen.queryByText('API')).not.toBeInTheDocument();
    expect(screen.queryByText('REST')).not.toBeInTheDocument();
  });

  it('should show no results message when no matches', async () => {
    const user = userEvent.setup();
    render(<GlossaryPage glossaryData={mockGlossaryData} />);

    const searchInput = screen.getByPlaceholderText('Search terms...');
    await user.type(searchInput, 'NonexistentTerm');

    expect(screen.getByText(/No terms found matching/)).toBeInTheDocument();
  });

  it('should group terms by first letter', () => {
    render(<GlossaryPage glossaryData={mockGlossaryData} />);

    // Check that terms are grouped under their first letter (multiple elements per letter)
    expect(screen.getAllByText('A').length).toBeGreaterThan(0);
    expect(screen.getAllByText('M').length).toBeGreaterThan(0);
    expect(screen.getAllByText('R').length).toBeGreaterThan(0);
  });

  it('should sort terms alphabetically within groups', () => {
    const dataWithMultipleTerms = {
      ...mockGlossaryData,
      terms: [
        { id: 'zebra', term: 'Zebra', definition: 'An animal' },
        { id: 'alpha', term: 'Alpha', definition: 'First letter' },
        { id: 'beta', term: 'Beta', definition: 'Second letter' },
      ],
    };

    render(<GlossaryPage glossaryData={dataWithMultipleTerms} />);

    const terms = screen.getAllByText(/Zebra|Alpha|Beta/);
    expect(terms).toHaveLength(3);
    // Check Alpha is before Beta, and Beta is before Zebra
    expect(terms[0]).toHaveTextContent('Alpha');
    expect(terms[1]).toHaveTextContent('Beta');
    expect(terms[2]).toHaveTextContent('Zebra');
  });

  it('should display abbreviations', () => {
    render(<GlossaryPage glossaryData={mockGlossaryData} />);

    // Check abbreviation appears in document
    expect(screen.getAllByText('(API)').length).toBeGreaterThan(0);
    expect(screen.getAllByText('(REST)').length).toBeGreaterThan(0);
  });

  it('should display related terms', () => {
    render(<GlossaryPage glossaryData={mockGlossaryData} />);

    // Related terms header appears multiple times (once per term with related terms)
    expect(screen.getAllByText('Related terms:').length).toBeGreaterThan(0);
    // REST appears as a term and in related links
    expect(screen.getAllByText('REST').length).toBeGreaterThan(0);
  });

  it('should show total term count in footer', () => {
    render(<GlossaryPage glossaryData={mockGlossaryData} />);

    expect(screen.getByText('Total terms: 3')).toBeInTheDocument();
  });

  it('should handle empty terms array', () => {
    const emptyData = { terms: [] };
    render(<GlossaryPage glossaryData={emptyData} />);

    expect(screen.getByText('Glossary')).toBeInTheDocument();
    expect(screen.getByText('A collection of terms and their definitions')).toBeInTheDocument();
    expect(screen.getByText('Total terms: 0')).toBeInTheDocument();
  });

  it('should handle missing glossaryData gracefully', () => {
    render(<GlossaryPage glossaryData={null} />);

    expect(screen.getByText('Glossary')).toBeInTheDocument();
    expect(screen.getByText('A collection of terms and their definitions')).toBeInTheDocument();
    expect(screen.getByText('Total terms: 0')).toBeInTheDocument();
  });

  it('should handle missing description gracefully', () => {
    const dataWithoutDescription = {
      terms: mockGlossaryData.terms,
    };
    render(<GlossaryPage glossaryData={dataWithoutDescription} />);

    expect(screen.getByText(/A collection of terms and their definitions/)).toBeInTheDocument();
  });

  it('should generate correct anchor links for terms', () => {
    render(<GlossaryPage glossaryData={mockGlossaryData} />);

    // Check navigation links are generated
    const navLinks = screen.getAllByRole('link', { name: /^[AMR]$/ });
    expect(navLinks.length).toBeGreaterThan(0);
    expect(navLinks[0]).toHaveAttribute('href', '#letter-A');
  });

  it('should clear search when input is cleared', async () => {
    const user = userEvent.setup();
    render(<GlossaryPage glossaryData={mockGlossaryData} />);

    const searchInput = screen.getByPlaceholderText('Search terms...');
    await user.type(searchInput, 'Machine');

    expect(screen.getByText('Machine Learning')).toBeInTheDocument();

    await user.clear(searchInput);

    expect(screen.getAllByText('API').length).toBeGreaterThan(0);
    expect(screen.getAllByText('REST').length).toBeGreaterThan(0);
    expect(screen.getByText('Machine Learning')).toBeInTheDocument();
  });
});
