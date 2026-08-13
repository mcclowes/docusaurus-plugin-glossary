# Contributing to docusaurus-plugin-glossary

Thank you for your interest in contributing to docusaurus-plugin-glossary! This document provides guidelines and instructions for contributing to the project.

## Documentation repository

User-facing documentation lives in the sister repository at `/Users/mcclowes/Development/docusaurus/docusaurus-plugins-docs`. Make product documentation changes there. Keep this repository's README focused on package installation, API accuracy, and development essentials.

## Code of Conduct

Please be respectful and considerate of others when contributing to this project. We aim to create a welcoming and inclusive community for all contributors.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue on GitHub with:

- A clear title and description
- Steps to reproduce the bug
- Expected behavior
- Actual behavior
- Your environment (Node version, Docusaurus version, OS)
- Any relevant error messages or logs
- Example code or configuration that demonstrates the issue

### Suggesting Features

We welcome feature suggestions! Please create an issue with:

- A clear title and description
- The use case or problem the feature would solve
- Any examples or mockups if applicable
- Why you believe this feature would be valuable

### Pull Requests

We welcome pull requests! Please follow these guidelines:

1. **Fork the repository** and create a branch for your changes
2. **Test your changes** - ensure all existing tests pass and add new tests if needed
3. **Follow code style** - run `npm run format` to format your code
4. **Write clear commit messages** - follow conventional commit format when possible
5. **Keep changes focused** - make PRs as small and focused as possible
6. **Update documentation** - if you're adding features, update the README

## Development Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/mcclowes/docusaurus-plugin-glossary.git
   cd docusaurus-plugin-glossary
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Run tests:**

   ```bash
   npm test
   ```

   Or in watch mode:

   ```bash
   npm run test:watch
   ```

   Or with coverage:

   ```bash
   npm run test:coverage
   ```

4. **Build the project:**

   ```bash
   npm run build
   ```

   This uses tsup to build ESM, CommonJS, source maps, CSS assets, and declarations in `dist/`.

   For development with auto-rebuild on changes:

   ```bash
   npm run watch
   ```

5. **Run the example site:**

   ```bash
   npm run example:start
   ```

   This will start the development server for the example Docusaurus site in `examples/docusaurus-v3/`

6. **Build the example site:**

   ```bash
   npm run example:build
   ```

7. **Format code:**

   ```bash
   npm run format
   ```

   Or check formatting:

   ```bash
   npm run format:check
   ```

## Project Structure

Source files are TypeScript and TSX. Tsup generates ESM, CommonJS, source maps, CSS assets, and declarations in `dist/`.

```
docusaurus-plugin-glossary/
├── src/
│   ├── index.ts               # Main plugin entry point (TypeScript)
│   ├── components/
│   │   ├── GlossaryPage.tsx   # Main glossary page component
│   │   ├── GlossaryPage.module.css
│   │   └── GlossaryPage.test.js
│   ├── theme/
│   │   └── GlossaryTerm/
│   │       ├── index.tsx      # Inline term component
│   │       ├── styles.module.css
│   │       └── index.test.js
│   └── remark/
│       └── glossary-terms.ts  # Remark plugin for auto-linking
├── dist/                      # Compiled output (generated, don't edit directly)
│   ├── index.js               # ESM package entry
│   ├── index.cjs              # CommonJS package entry
│   ├── components/            # Bundled glossary page
│   ├── theme/                 # Bundled theme component
│   └── remark/                # Bundled remark plugin
├── __tests__/
│   └── plugin.test.js         # Plugin lifecycle tests
├── jest/
│   ├── mocks/                 # Test mocks
│   ├── cssMapper.js           # CSS module mapper for tests
│   └── setupFiles.js
├── examples/
│   └── docusaurus-v3/         # Example Docusaurus site
├── jest.config.cjs            # Jest configuration
├── tsconfig.json              # TypeScript configuration
├── tsup.config.ts             # Package build configuration
└── package.json
```

## Testing

This project uses Jest for unit tests, the MDX compiler for remark integration tests, and Playwright for browser tests. When adding new features or fixing bugs:

1. **Write tests** for your changes
2. **Ensure all tests pass** before submitting a PR
3. **Maintain or improve coverage** - aim for high coverage, especially for core functionality
4. **Test in the example site** - make sure your changes work in a real Docusaurus environment

### Test Organization

- Plugin lifecycle tests: `__tests__/plugin.test.js`
- Real MDX pipeline tests: `__tests__/remark-glossary-terms.integration.test.mjs`
- Component tests: alongside components (e.g., `src/components/GlossaryPage.test.js`, `src/theme/GlossaryTerm/index.test.js`)
- Use `jest/mocks/` for mocking Docusaurus APIs and dependencies

### Working with TypeScript

Run `npm run typecheck` after changing source types. Run `npm run check:exports` when changing package entries, declarations, or build configuration. For development, use `npm run watch` to rebuild on changes.

## Code Style

- We use Prettier for code formatting
- TypeScript and TSX for plugin, remark, and component code
- Follow modern ES6+ conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and small when possible

**Important**:

- Edit source files in `src/`, not `dist/`
- Run `npm run build` before testing locally
- Run `npm run format` before committing to ensure consistent formatting

## Commit Messages

We prefer conventional commit messages when possible:

- `feat: add new feature`
- `fix: resolve bug in X`
- `docs: update documentation`
- `test: add tests for X`
- `refactor: restructure code`
- `chore: update dependencies`

## Pull Request Process

1. **Ensure your branch is up to date** with the main branch
2. **Run all tests** and ensure they pass
3. **Format your code** with `npm run format`
4. **Check the example site** works with your changes
5. **Create a PR** with a clear title and description
6. **Link related issues** if applicable
7. **Respond to feedback** promptly

## Release Process

Only maintainers can release new versions. Publishing to npm is automated via the `Publish to npm` GitHub Action.

1. Run the version bump workflow and select the release type.
2. Review and merge its pull request.
3. The release workflow validates the package and example site, publishes to npm with trusted publishing and provenance, creates the tag, and creates the GitHub release.

## Questions?

If you have questions about contributing, please:

- Check existing issues and discussions
- Open a new issue with your question
- Reference this contributing guide

## License

By contributing, you agree that your contributions will be licensed under the same MIT License as the project.
