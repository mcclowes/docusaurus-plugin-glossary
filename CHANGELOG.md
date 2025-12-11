# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.0.0] - 2024-12-11

### Changed

- **BREAKING**: Removed `autoLinkTerms` option - use the preset for auto-linking instead
- Recommend preset (`docusaurus-plugin-glossary/preset`) as primary configuration method
- Updated all documentation to reflect preset-first approach

### Added

- New preset that extends `@docusaurus/preset-classic` with automatic remark plugin configuration
- `getRemarkPlugin()` helper for manual remark plugin configuration
- Glossary data validation with detailed error messages
- `CLAUDE.md` for Claude Code integration

### Fixed

- Documentation accuracy for auto-linking configuration
- Skill documentation references to non-existent paths

### Documentation

- Updated all Claude skills to use preset approach instead of legacy `autoLinkTerms`
- Added comprehensive troubleshooting for preset vs plugin usage
- Improved configuration examples

## [2.0.2] - 2024-11-07

### Fixed

- Fixed E2E test selectors to avoid strict mode violations
- CI workflow improvements

### Added

- E2E tests for glossary plugin with GitHub Actions workflow
- Comprehensive test coverage for plugin functionality

## [2.0.1] - 2024

### Fixed

- CI configuration fixes
- Package tracking improvements

## [2.0.0] - 2024

### Changed

- **BREAKING**: Reworked import methodology for better compatibility
- Moved build output to `dist/` directory
- Updated component auto-initialization approach

### Added

- Automatic component initialization using `getClientModules()`
- Improved dependency injection reliability

### Fixed

- Race conditions in dependency injection
- Package configuration issues

## [1.3.2] - 2024

### Fixed

- Package configuration improvements

## [1.3.1] - 2024

### Changed

- Improved component styles
- Updated test suite

## [1.3.0] - 2024

### Added

- Enhanced importing approaches for better compatibility

## [1.2.0] - 2024

### Added

- Auto-linking functionality for glossary terms
- Automatic term detection in markdown files

## [1.1.2] - 2024

### Fixed

- Glossary tooltip display issues

## [1.1.1] - 2024

### Fixed

- Glossary tooltip visibility improvements

## [1.1.0] - 2024

### Added

- Docusaurus v3 support
- Modern MDX v3 compatibility

## [1.0.2] - 2024

### Added

- Auto-configure remark plugin when autoLinkTerms is enabled

### Fixed

- Improved GlossaryTerm tooltip visibility

## [1.0.1] - 2024

### Fixed

- Jest configuration for unist-util-visit ESM module
- Packaging issues: use \_\_dirname for component path
- Updated README with better documentation

## [1.0.0] - 2024

### Added

- Initial release
- Auto-generated glossary page with alphabetical navigation
- Search functionality across terms and definitions
- GlossaryTerm component for inline term tooltips
- Automatic term detection via remark plugin
- Responsive design with dark mode support
- Related terms linking
- Abbreviation support
- Configurable glossary path and route

[unreleased]: https://github.com/mcclowes/docusaurus-plugin-glossary/compare/v3.0.0...HEAD
[3.0.0]: https://github.com/mcclowes/docusaurus-plugin-glossary/releases/tag/v3.0.0
[2.0.2]: https://github.com/mcclowes/docusaurus-plugin-glossary/releases/tag/v2.0.2
[2.0.1]: https://github.com/mcclowes/docusaurus-plugin-glossary/releases/tag/v2.0.1
[2.0.0]: https://github.com/mcclowes/docusaurus-plugin-glossary/releases/tag/v2.0.0
[1.3.2]: https://github.com/mcclowes/docusaurus-plugin-glossary/releases/tag/v1.3.2
[1.3.1]: https://github.com/mcclowes/docusaurus-plugin-glossary/releases/tag/v1.3.1
[1.3.0]: https://github.com/mcclowes/docusaurus-plugin-glossary/releases/tag/v1.3.0
[1.2.0]: https://github.com/mcclowes/docusaurus-plugin-glossary/releases/tag/v1.2.0
[1.1.2]: https://github.com/mcclowes/docusaurus-plugin-glossary/releases/tag/v1.1.2
[1.1.1]: https://github.com/mcclowes/docusaurus-plugin-glossary/releases/tag/v1.1.1
[1.1.0]: https://github.com/mcclowes/docusaurus-plugin-glossary/releases/tag/v1.1.0
[1.0.2]: https://github.com/mcclowes/docusaurus-plugin-glossary/releases/tag/v1.0.2
[1.0.1]: https://github.com/mcclowes/docusaurus-plugin-glossary/releases/tag/v1.0.1
[1.0.0]: https://github.com/mcclowes/docusaurus-plugin-glossary/releases/tag/v1.0.0
