module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
  env: {
    test: {
      plugins: [
        require.resolve('./jest/babel-plugin-transform-import-meta.cjs'),
      ],
    },
  },
};
