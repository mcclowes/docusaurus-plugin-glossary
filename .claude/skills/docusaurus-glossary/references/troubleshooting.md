# Troubleshooting Guide

## Glossary page returns 404

**Solutions:**

- Ensure plugin is configured in `docusaurus.config.js`
- Check `routePath` doesn't conflict with existing routes
- Run `npm run clear` to clear Docusaurus cache
- Restart dev server

## Glossary terms not showing

**Solutions:**

- Verify `glossary/glossary.json` exists at correct path
- Check JSON syntax is valid
- Ensure `terms` array is properly formatted
- Validate JSON with a linter

## GlossaryTerm component not found

**Solutions:**

- Import from `@theme/GlossaryTerm` (not a relative path)
- Clear cache: `npm run clear`
- Restart dev server
- Check plugin is listed in `plugins` array

## Automatic term detection not working

**Solutions:**

- Ensure `autoLinkTerms` is `true` (default) in plugin config
- Verify glossary file exists at configured `glossaryPath`
- Check terms in content match glossary terms (case-insensitive)
- Clear cache: `npm run clear` and restart dev server
- Remember: terms inside code blocks, links, or MDX components are NOT processed
- If manually configured remark plugin, ensure `siteDir` points to correct directory

## No tooltips appearing

**Solutions:**

- Confirm on Docusaurus v3 (`@docusaurus/core@^3`) and React 18
- Check plugin is in `plugins` array and `autoLinkTerms` not disabled
- Visit `/glossary` to verify route renders correctly
- If using local patch for v1.0.0, remove it for v1.0.2+

## Styles not applying

**Solutions:**

- Check for CSS conflicts in custom CSS
- Ensure CSS modules are loading correctly
- Clear cache and rebuild: `npm run clear && npm run build`
- Verify no other plugins override theme components

## Common Errors

### Module not found: Can't resolve '@theme/GlossaryTerm'

- Plugin not installed or not in config
- Clear `.docusaurus` cache directory
- Restart dev server

### Invalid glossary JSON

- Use JSON validator to check syntax
- Ensure all required fields (`term`, `definition`) are present
- Check for trailing commas (not valid in JSON)

## Docusaurus v3 Specific Issues

### MDX Import Issues

Plugin auto-injects `import GlossaryTerm from '@theme/GlossaryTerm';` when auto-linking. If you import manually, ensure same import path.

### Opting Out of Auto-linking

Set `autoLinkTerms: false` and add remark plugin manually, or only use `<GlossaryTerm />` component explicitly.
