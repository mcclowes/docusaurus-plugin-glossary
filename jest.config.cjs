module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))',
  ],
  moduleNameMapper: {
    '^@theme/Layout$': '<rootDir>/jest/mocks/Layout',
    '^@theme/(.*)$': '<rootDir>/src/theme/$1',
    '^@docusaurus/(.*)$': '<rootDir>/jest/mocks/$1',
    '\\.module\\.css$': 'identity-obj-proxy',
    '\\.css$': require.resolve('./jest/cssMapper.js'),
    '^unist-util-visit$': '<rootDir>/jest/mocks/unist-util-visit.js',
  },
  testMatch: ['**/__tests__/**/*.js', '**/*.test.js'],
  collectCoverageFrom: [
    'src/components/**/*.{js,jsx,ts,tsx}',
    'src/theme/**/*.{js,jsx,ts,tsx}',
    'src/index.{js,ts}',
    '!**/node_modules/**',
  ],
};
