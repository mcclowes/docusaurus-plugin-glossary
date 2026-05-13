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

  it('should not auto-link terms inside headings (h1-h6)', () => {
    const transformer = remarkGlossaryTerms({
      terms: [{ term: 'API', definition: 'Application Programming Interface' }],
    });

    const tree = {
      type: 'root',
      children: [1, 2, 3, 4, 5, 6].map(depth => ({
        type: 'heading',
        depth,
        children: [{ type: 'text', value: `The API at level ${depth}` }],
      })),
    };

    transformer(tree);

    for (const heading of tree.children) {
      expect(heading.children).toHaveLength(1);
      expect(heading.children[0].type).toBe('text');
      expect(heading.children[0].value).toBe(`The API at level ${heading.depth}`);
    }
  });

  it('should not auto-link terms nested inside heading formatting (emphasis/strong)', () => {
    const transformer = remarkGlossaryTerms({
      terms: [{ term: 'API', definition: 'Application Programming Interface' }],
    });

    const tree = {
      type: 'root',
      children: [
        {
          type: 'heading',
          depth: 2,
          children: [
            {
              type: 'strong',
              children: [{ type: 'text', value: 'The API matters' }],
            },
          ],
        },
      ],
    };

    transformer(tree);

    const strong = tree.children[0].children[0];
    expect(strong.children).toHaveLength(1);
    expect(strong.children[0].type).toBe('text');
    expect(strong.children[0].value).toBe('The API matters');
  });

  it('should still auto-link terms in paragraphs when a heading is present', () => {
    const transformer = remarkGlossaryTerms({
      terms: [{ term: 'API', definition: 'Application Programming Interface' }],
    });

    const tree = {
      type: 'root',
      children: [
        {
          type: 'heading',
          depth: 1,
          children: [{ type: 'text', value: 'About the API' }],
        },
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'The API is useful.' }],
        },
      ],
    };

    transformer(tree);

    const heading = tree.children.find(n => n.type === 'heading');
    expect(heading.children).toHaveLength(1);
    expect(heading.children[0].type).toBe('text');
    expect(heading.children[0].value).toBe('About the API');

    const paragraphChildren = tree.children.find(n => n.type === 'paragraph').children;
    const glossaryNode = paragraphChildren.find(n => n.name === 'GlossaryTerm');
    expect(glossaryNode).toBeDefined();
    expect(glossaryNode.attributes[0].value).toBe('API');
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

  it('should match aliases and link them to the canonical term', () => {
    const transformer = remarkGlossaryTerms({
      terms: [
        {
          term: 'clean',
          definition: 'Free from dirt',
          aliases: ['cleaning', 'cleaned'],
        },
      ],
    });

    const tree = makeTree('She was cleaning the room after it was cleaned.');
    transformer(tree);
    const children = getChildren(tree);

    const glossaryNodes = children.filter(n => n.name === 'GlossaryTerm');
    expect(glossaryNodes).toHaveLength(2);

    // Both nodes should point at the canonical term "clean"
    expect(glossaryNodes[0].attributes[0].value).toBe('clean');
    expect(glossaryNodes[1].attributes[0].value).toBe('clean');

    // Display text preserves what the author wrote
    expect(glossaryNodes[0].children[0].value).toBe('cleaning');
    expect(glossaryNodes[1].children[0].value).toBe('cleaned');
  });

  it('should match the canonical term even when aliases are defined', () => {
    const transformer = remarkGlossaryTerms({
      terms: [
        {
          term: 'clean',
          definition: 'Free from dirt',
          aliases: ['cleaning'],
        },
      ],
    });

    const tree = makeTree('Keep it clean.');
    transformer(tree);
    const children = getChildren(tree);

    const glossaryNodes = children.filter(n => n.name === 'GlossaryTerm');
    expect(glossaryNodes).toHaveLength(1);
    expect(glossaryNodes[0].attributes[0].value).toBe('clean');
    expect(glossaryNodes[0].children[0].value).toBe('clean');
  });

  it('should not match aliases when autoLink is false', () => {
    const transformer = remarkGlossaryTerms({
      terms: [
        {
          term: 'clean',
          definition: 'Free from dirt',
          aliases: ['cleaning'],
          autoLink: false,
        },
      ],
    });

    const tree = makeTree('She was cleaning the clean room.');
    transformer(tree);
    const children = getChildren(tree);

    expect(children).toHaveLength(1);
    expect(children[0].type).toBe('text');
  });

  it('should prefer the longest match when aliases overlap the canonical term', () => {
    const transformer = remarkGlossaryTerms({
      terms: [
        {
          term: 'API',
          definition: 'Application Programming Interface',
          aliases: ['Application Programming Interface'],
        },
      ],
    });

    const tree = makeTree('The Application Programming Interface is useful.');
    transformer(tree);
    const children = getChildren(tree);

    const glossaryNodes = children.filter(n => n.name === 'GlossaryTerm');
    expect(glossaryNodes).toHaveLength(1);
    expect(glossaryNodes[0].attributes[0].value).toBe('API');
    expect(glossaryNodes[0].children[0].value).toBe('Application Programming Interface');
  });

  it('should ignore empty or non-string aliases without crashing', () => {
    const transformer = remarkGlossaryTerms({
      terms: [
        {
          term: 'clean',
          definition: 'Free from dirt',
          aliases: ['cleaning', '', '   '],
        },
      ],
    });

    const tree = makeTree('cleaning');
    transformer(tree);
    const children = getChildren(tree);

    const glossaryNodes = children.filter(n => n.name === 'GlossaryTerm');
    expect(glossaryNodes).toHaveLength(1);
    expect(glossaryNodes[0].attributes[0].value).toBe('clean');
  });

  describe('case sensitivity', () => {
    it('should match terms case-insensitively by default', () => {
      const transformer = remarkGlossaryTerms({
        terms: [{ term: 'API', definition: 'Application Programming Interface' }],
      });

      const tree = makeTree('The api is useful.');
      transformer(tree);
      const children = getChildren(tree);

      const glossaryNode = children.find(n => n.name === 'GlossaryTerm');
      expect(glossaryNode).toBeDefined();
      expect(glossaryNode.children[0].value).toBe('api');
    });

    it('should only match exact case when caseSensitive is true', () => {
      const transformer = remarkGlossaryTerms({
        terms: [
          { term: 'REST', definition: 'Representational State Transfer', caseSensitive: true },
        ],
      });

      const tree = makeTree('We had a good rest before writing REST endpoints.');
      transformer(tree);
      const children = getChildren(tree);

      const glossaryNodes = children.filter(n => n.name === 'GlossaryTerm');
      expect(glossaryNodes).toHaveLength(1);
      expect(glossaryNodes[0].children[0].value).toBe('REST');
    });

    it('should not match lowercase variant when caseSensitive is true', () => {
      const transformer = remarkGlossaryTerms({
        terms: [
          { term: 'REST', definition: 'Representational State Transfer', caseSensitive: true },
        ],
      });

      const tree = makeTree('Take a rest.');
      transformer(tree);
      const children = getChildren(tree);

      const glossaryNodes = children.filter(n => n.name === 'GlossaryTerm');
      expect(glossaryNodes).toHaveLength(0);
    });

    it('should treat aliases as case-sensitive when caseSensitive is true', () => {
      const transformer = remarkGlossaryTerms({
        terms: [
          {
            term: 'REST',
            definition: 'Representational State Transfer',
            aliases: ['RESTful'],
            caseSensitive: true,
          },
        ],
      });

      const tree = makeTree('A restful sleep is not a RESTful API.');
      transformer(tree);
      const children = getChildren(tree);

      const glossaryNodes = children.filter(n => n.name === 'GlossaryTerm');
      expect(glossaryNodes).toHaveLength(1);
      expect(glossaryNodes[0].children[0].value).toBe('RESTful');
    });

    it('should mix case-sensitive and case-insensitive terms in the same document', () => {
      const transformer = remarkGlossaryTerms({
        terms: [
          { term: 'REST', definition: 'Representational State Transfer', caseSensitive: true },
          { term: 'API', definition: 'Application Programming Interface' },
        ],
      });

      const tree = makeTree('A REST api and some rest.');
      transformer(tree);
      const children = getChildren(tree);

      const glossaryNodes = children.filter(n => n.name === 'GlossaryTerm');
      expect(glossaryNodes).toHaveLength(2);
      expect(glossaryNodes[0].attributes[0].value).toBe('REST');
      expect(glossaryNodes[0].children[0].value).toBe('REST');
      expect(glossaryNodes[1].attributes[0].value).toBe('API');
      expect(glossaryNodes[1].children[0].value).toBe('api');
    });

    it('should still allow plural forms with case-sensitive terms', () => {
      const transformer = remarkGlossaryTerms({
        terms: [
          { term: 'REST', definition: 'Representational State Transfer', caseSensitive: true },
        ],
      });

      const tree = makeTree('We use RESTs everywhere.');
      transformer(tree);
      const children = getChildren(tree);

      const glossaryNodes = children.filter(n => n.name === 'GlossaryTerm');
      expect(glossaryNodes).toHaveLength(1);
      expect(glossaryNodes[0].children[0].value).toBe('RESTs');
    });
  });

  describe('expandAcronymsOnFirstUse', () => {
    const psp = {
      term: 'PSP',
      abbreviation: 'Payment Service Provider',
      definition: 'A company that provides payment processing services.',
    };

    it('should not expand when option is disabled (default)', () => {
      const transformer = remarkGlossaryTerms({ terms: [psp] });

      const tree = makeTree('The PSP charges a fee.');
      transformer(tree);
      const glossaryNode = getChildren(tree).find(n => n.name === 'GlossaryTerm');

      expect(glossaryNode).toBeDefined();
      expect(glossaryNode.children[0].value).toBe('PSP');
    });

    it('should expand the first canonical match to "Long Form (Term)"', () => {
      const transformer = remarkGlossaryTerms({
        terms: [psp],
        expandAcronymsOnFirstUse: true,
      });

      const tree = makeTree('The PSP charges a fee.');
      transformer(tree);
      const glossaryNode = getChildren(tree).find(n => n.name === 'GlossaryTerm');

      expect(glossaryNode).toBeDefined();
      expect(glossaryNode.attributes.find(a => a.name === 'term').value).toBe('PSP');
      expect(glossaryNode.children[0].value).toBe('Payment Service Provider (PSP)');
    });

    it('should only expand the first occurrence per file', () => {
      const transformer = remarkGlossaryTerms({
        terms: [psp],
        expandAcronymsOnFirstUse: true,
      });

      const tree = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', value: 'The PSP is set up.' }],
          },
          {
            type: 'paragraph',
            children: [{ type: 'text', value: 'Configure the PSP later.' }],
          },
        ],
      };

      transformer(tree);

      const paragraphs = tree.children.filter(n => n.type === 'paragraph');
      const firstNode = paragraphs[0].children.find(n => n.name === 'GlossaryTerm');
      const secondNode = paragraphs[1].children.find(n => n.name === 'GlossaryTerm');

      expect(firstNode.children[0].value).toBe('Payment Service Provider (PSP)');
      expect(secondNode.children[0].value).toBe('PSP');
    });

    it('should not expand terms without abbreviation', () => {
      const transformer = remarkGlossaryTerms({
        terms: [{ term: 'Webhook', definition: 'An HTTP callback.' }],
        expandAcronymsOnFirstUse: true,
      });

      const tree = makeTree('Configure a Webhook.');
      transformer(tree);
      const glossaryNode = getChildren(tree).find(n => n.name === 'GlossaryTerm');

      expect(glossaryNode.children[0].value).toBe('Webhook');
    });

    it('should not expand aliases (only canonical term)', () => {
      const transformer = remarkGlossaryTerms({
        terms: [
          {
            term: 'PSP',
            abbreviation: 'Payment Service Provider',
            definition: 'x',
            aliases: ['payment provider'],
          },
        ],
        expandAcronymsOnFirstUse: true,
      });

      const tree = makeTree('The payment provider charges a fee.');
      transformer(tree);
      const glossaryNode = getChildren(tree).find(n => n.name === 'GlossaryTerm');

      expect(glossaryNode.children[0].value).toBe('payment provider');
    });

    it('should not expand plural forms', () => {
      const transformer = remarkGlossaryTerms({
        terms: [psp],
        expandAcronymsOnFirstUse: true,
      });

      const tree = makeTree('Multiple PSPs are available.');
      transformer(tree);
      const glossaryNode = getChildren(tree).find(n => n.name === 'GlossaryTerm');

      expect(glossaryNode.children[0].value).toBe('PSPs');
    });

    it('should skip expansion if long form already appears immediately before', () => {
      const transformer = remarkGlossaryTerms({
        terms: [psp],
        expandAcronymsOnFirstUse: true,
      });

      const tree = makeTree('The Payment Service Provider (PSP) is configured.');
      transformer(tree);
      const glossaryNodes = getChildren(tree).filter(n => n.name === 'GlossaryTerm');

      expect(glossaryNodes).toHaveLength(1);
      expect(glossaryNodes[0].children[0].value).toBe('PSP');
    });

    it('should expand case-insensitive canonical match', () => {
      const transformer = remarkGlossaryTerms({
        terms: [psp],
        expandAcronymsOnFirstUse: true,
      });

      const tree = makeTree('The psp processes payments.');
      transformer(tree);
      const glossaryNode = getChildren(tree).find(n => n.name === 'GlossaryTerm');

      expect(glossaryNode.children[0].value).toBe('Payment Service Provider (psp)');
    });

    it('should respect autoLink: false (no expansion if term is opted out)', () => {
      const transformer = remarkGlossaryTerms({
        terms: [{ ...psp, autoLink: false }],
        expandAcronymsOnFirstUse: true,
      });

      const tree = makeTree('The PSP charges a fee.');
      transformer(tree);
      const children = getChildren(tree);

      expect(children).toHaveLength(1);
      expect(children[0].type).toBe('text');
    });

    it('should reset state between separate transformer invocations (per-file scope)', () => {
      const transformer = remarkGlossaryTerms({
        terms: [psp],
        expandAcronymsOnFirstUse: true,
      });

      const treeA = makeTree('The PSP is configured.');
      const treeB = makeTree('Configure the PSP.');

      transformer(treeA);
      transformer(treeB);

      const nodeA = getChildren(treeA).find(n => n.name === 'GlossaryTerm');
      const nodeB = getChildren(treeB).find(n => n.name === 'GlossaryTerm');

      expect(nodeA.children[0].value).toBe('Payment Service Provider (PSP)');
      expect(nodeB.children[0].value).toBe('Payment Service Provider (PSP)');
    });
  });
});
