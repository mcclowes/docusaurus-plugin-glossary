const path = require('path');

module.exports = function mdxComponentsPlugin() {
  return {
    name: 'mdx-components-plugin',
    getThemePath() {
      return path.join(__dirname, 'theme');
    },
  };
};


