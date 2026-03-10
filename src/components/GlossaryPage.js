import React, { useState, useMemo } from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './GlossaryPage.module.css';

/**
 * Groups glossary terms by their first letter
 */
function groupTermsByLetter(terms) {
  const grouped = {};

  terms.forEach(term => {
    const firstLetter = term.term.charAt(0).toUpperCase();
    if (!grouped[firstLetter]) {
      grouped[firstLetter] = [];
    }
    grouped[firstLetter].push(term);
  });

  // Sort each group alphabetically
  Object.keys(grouped).forEach(letter => {
    grouped[letter].sort((a, b) => a.term.localeCompare(b.term));
  });

  return grouped;
}

/**
 * GlossaryPage component - displays all glossary terms
 */
export default function GlossaryPage({ glossaryData }) {
  useDocusaurusContext();
  const [searchTerm, setSearchTerm] = useState('');

  const terms = useMemo(() => glossaryData?.terms || [], [glossaryData?.terms]);

  // Filter terms based on search
  const filteredTerms = useMemo(() => {
    if (!searchTerm) return terms;

    const lowerSearch = searchTerm.toLowerCase();
    return terms.filter(
      term =>
        term.term.toLowerCase().includes(lowerSearch) ||
        term.definition.toLowerCase().includes(lowerSearch)
    );
  }, [terms, searchTerm]);

  // Group terms by first letter
  const groupedTerms = useMemo(() => {
    return groupTermsByLetter(filteredTerms);
  }, [filteredTerms]);

  const letters = Object.keys(groupedTerms).sort();

  const glossaryTitle = glossaryData?.title || 'Glossary';

  return (
    <Layout title={glossaryTitle} description="A glossary of terms and definitions">
      <div className={styles.glossaryContainer}>
        <header className={styles.glossaryHeader}>
          <h1>{glossaryTitle}</h1>
          <p className={styles.glossaryDescription}>
            {glossaryData?.description || 'A collection of terms and their definitions'}
          </p>

          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search terms..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        {filteredTerms.length === 0 ? (
          <div className={styles.noResults}>
            <p>No terms found matching "{searchTerm}"</p>
          </div>
        ) : (
          <div className={styles.glossaryContent}>
            {/* Letter navigation */}
            <nav className={styles.letterNav}>
              {letters.map(letter => (
                <a key={letter} href={`#letter-${letter}`} className={styles.letterLink}>
                  {letter}
                </a>
              ))}
            </nav>

            {/* Terms grouped by letter */}
            {letters.map(letter => (
              <section key={letter} id={`letter-${letter}`} className={styles.letterSection}>
                <h2 className={styles.letterHeading}>{letter}</h2>
                <dl className={styles.termList}>
                  {groupedTerms[letter].map((term, index) => (
                    <div
                      key={`${letter}-${index}`}
                      className={styles.termItem}
                      id={term.id || term.term.toLowerCase().replace(/\s+/g, '-')}
                    >
                      <dt className={styles.termName}>
                        {term.term}
                        {term.abbreviation && (
                          <span className={styles.abbreviation}> ({term.abbreviation})</span>
                        )}
                      </dt>
                      <dd className={styles.termDefinition}>
                        {term.definition}
                        {term.relatedTerms && term.relatedTerms.length > 0 && (
                          <div className={styles.relatedTerms}>
                            <strong>Related terms:</strong>{' '}
                            {term.relatedTerms.map((related, idx) => (
                              <React.Fragment key={idx}>
                                {idx > 0 && ', '}
                                <a href={`#${related.toLowerCase().replace(/\s+/g, '-')}`}>
                                  {related}
                                </a>
                              </React.Fragment>
                            ))}
                          </div>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        )}

        <footer className={styles.glossaryFooter}>
          <p>Total terms: {terms.length}</p>
        </footer>
      </div>
    </Layout>
  );
}
