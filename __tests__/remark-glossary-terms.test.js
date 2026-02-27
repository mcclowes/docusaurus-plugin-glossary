import remarkGlossaryTerms from '../src/remark/glossary-terms';

function makeTree(text) {
  return {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [{ type: 'text', value: text }],
      },
    ],
  };
}

function getChildren(tree) {
  return tree.children.find(n => n.type === 'paragraph').children;
}

describe('remarkGlossaryTerms', () => {
  it('should auto-link terms by default', () => {
    const transformer = remarkGlossaryTerms({
      terms: [{ term: 'API', definition: 'Application Programming Interface' }],
    });

    const tree = makeTree('The API is useful.');
    transformer(tree);
    const children = getChildren(tree);

    const glossaryNode = children.find(n => n.name === 'GlossaryTerm');
    expect(glossaryNode).toBeDefined();
    expect(glossaryNode.attributes[0].value).toBe('API');
  });

  it('should skip terms with autoLink: false', () => {
    const transformer = remarkGlossaryTerms({
      terms: [{ term: 'API', definition: 'Application Programming Interface', autoLink: false }],
    });

    const tree = makeTree('The API is useful.');
    transformer(tree);
    const children = getChildren(tree);

    expect(children).toHaveLength(1);
    expect(children[0].type).toBe('text');
    expect(children[0].value).toBe('The API is useful.');
  });

  it('should still auto-link terms with autoLink: true', () => {
    const transformer = remarkGlossaryTerms({
      terms: [{ term: 'API', definition: 'Application Programming Interface', autoLink: true }],
    });

    const tree = makeTree('The API is useful.');
    transformer(tree);
    const children = getChildren(tree);

    const glossaryNode = children.find(n => n.name === 'GlossaryTerm');
    expect(glossaryNode).toBeDefined();
  });

  it('should auto-link some terms while skipping others', () => {
    const transformer = remarkGlossaryTerms({
      terms: [
        { term: 'API', definition: 'Application Programming Interface', autoLink: false },
        { term: 'REST', definition: 'Representational State Transfer' },
      ],
    });

    const tree = makeTree('The API uses REST.');
    transformer(tree);
    const children = getChildren(tree);

    const glossaryNodes = children.filter(n => n.name === 'GlossaryTerm');
    expect(glossaryNodes).toHaveLength(1);
    expect(glossaryNodes[0].attributes[0].value).toBe('REST');
  });
});
