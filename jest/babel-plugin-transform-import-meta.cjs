// Babel plugin to transform import.meta for Jest
// This transforms import.meta.url to use __filename which is available after Babel transforms to CommonJS
const { pathToFileURL } = require('url');

module.exports = function ({ types: t }) {
  const transformImportMetaUrl = () => {
    // Replace import.meta.url with pathToFileURL(__filename).href
    // This works because Babel transforms ES modules to CommonJS which has __filename
    return t.memberExpression(
      t.callExpression(
        t.memberExpression(
          t.callExpression(
            t.identifier('require'),
            [t.stringLiteral('url')]
          ),
          t.identifier('pathToFileURL'),
          false
        ),
        [t.identifier('__filename')]
      ),
      t.identifier('href'),
      false
    );
  };

  const isImportMetaUrl = (node) => {
    return (
      node.type === 'MemberExpression' &&
      node.object.type === 'MetaProperty' &&
      node.object.meta.name === 'import' &&
      node.object.property.name === 'meta' &&
      node.property &&
      node.property.name === 'url'
    );
  };

  return {
    name: 'transform-import-meta',
    visitor: {
      UnaryExpression(path) {
        // Handle typeof import.meta.url
        if (
          path.node.operator === 'typeof' &&
          isImportMetaUrl(path.node.argument)
        ) {
          // Transform typeof import.meta.url to typeof pathToFileURL(__filename).href
          path.replaceWith(
            t.unaryExpression(
              'typeof',
              transformImportMetaUrl()
            )
          );
        }
      },
      MemberExpression: {
        exit(path) {
          // Transform import.meta.url to pathToFileURL(__filename).href
          if (isImportMetaUrl(path.node)) {
            path.replaceWith(transformImportMetaUrl());
          }
        },
      },
      MetaProperty(path) {
        // Transform standalone import.meta to an object
        if (path.node.meta.name === 'import' && path.node.property.name === 'meta') {
          // Check if this is part of a MemberExpression accessing .url
          const parent = path.parent;
          if (parent.type === 'MemberExpression' && parent.property && parent.property.name === 'url') {
            // Let the MemberExpression visitor handle it
            return;
          }
          // For standalone import.meta, replace with an object
          path.replaceWith(
            t.objectExpression([
              t.objectProperty(
                t.identifier('url'),
                t.memberExpression(
                  t.callExpression(
                    t.memberExpression(
                      t.callExpression(
                        t.identifier('require'),
                        [t.stringLiteral('url')]
                      ),
                      t.identifier('pathToFileURL'),
                      false
                    ),
                    [t.identifier('__filename')]
                  ),
                  t.identifier('href'),
                  false
                )
              ),
            ])
          );
        }
      },
    },
  };
};

