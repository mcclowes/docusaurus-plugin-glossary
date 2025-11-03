/**
 * Mock implementation of unist-util-visit for Jest
 * Since v5 is ESM-only, we provide a CommonJS mock
 */

function visit(tree, test, visitor) {
  if (!tree || !visitor) return;

  // Simple mock implementation that traverses the tree
  function traverse(node, index, parent) {
    if (!node) return;

    // Call visitor if test matches
    if (!test || typeof test === 'string' || test.type === node.type) {
      const result = visitor(node, index, parent);
      if (result === false) return; // Stop traversal
    }

    // Recurse into children
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child, idx) => {
        traverse(child, idx, node);
      });
    }
  }

  traverse(tree);
}

// Export constants
visit.CONTINUE = Symbol('CONTINUE');
visit.EXIT = Symbol('EXIT');
visit.SKIP = Symbol('SKIP');

module.exports = { visit, CONTINUE: visit.CONTINUE, EXIT: visit.EXIT, SKIP: visit.SKIP };
