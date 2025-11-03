# Contributing to docusaurus-plugin-glossary

Thank you for your interest in contributing to docusaurus-plugin-glossary! This document provides guidelines and instructions for contributing to the project.

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

4. **Run the example site:**

   ```bash
   npm run example:start
   ```

   This will start the development server for the example Docusaurus site in `examples/docusaurus-v3/`

5. **Build the example site:**

   ```bash
   npm run example:build
   ```

6. **Format code:**

   ```bash
   npm run format
   ```

   Or check formatting:

   ```bash
   npm run format:check
   ```

## Project Structure

```
docusaurus-plugin-glossary/
├── index.js                    # Main plugin entry point
├── components/
│   ├── GlossaryPage.js        # Main glossary page component
│   ├── GlossaryPage.module.css
│   ├── GlossaryPage.test.js   # Component tests
│   └── ...
├── theme/
│   └── GlossaryTerm/
│       ├── index.js           # Inline term component
│       ├── styles.module.css  # Term styles
│       └── index.test.js      # Component tests
├── remark/
│   └── glossary-terms.js      # Remark plugin for auto-linking
├── __tests__/
│   └── plugin.test.js         # Plugin lifecycle tests
├── jest/
│   ├── mocks/                 # Test mocks
│   └── cssMapper.js          # CSS module mapper for tests
├── examples/
│   └── docusaurus-v3/        # Example Docusaurus site
└── jest.config.js            # Jest configuration
```

## Testing

This project uses Jest for testing. When adding new features or fixing bugs:

1. **Write tests** for your changes
2. **Ensure all tests pass** before submitting a PR
3. **Maintain or improve coverage** - aim for high coverage, especially for core functionality
4. **Test in the example site** - make sure your changes work in a real Docusaurus environment

### Test Organization

- Plugin lifecycle tests: `__tests__/plugin.test.js`
- Component tests: alongside components (e.g., `components/GlossaryPage.test.js`)
- Use `jest/mocks/` for mocking Docusaurus APIs and dependencies

## Code Style

- We use Prettier for code formatting
- JavaScript/JSX should follow modern ES6+ conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and small when possible

Run `npm run format` before committing to ensure consistent formatting.

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

Only maintainers can release new versions. The release process includes:

1. Update version in `package.json`
2. Run tests to ensure everything passes
3. Update CHANGELOG if needed
4. Create a git tag
5. Publish to npm

## Questions?

If you have questions about contributing, please:

- Check existing issues and discussions
- Open a new issue with your question
- Reference this contributing guide

## License

By contributing, you agree that your contributions will be licensed under the same MIT License as the project.

