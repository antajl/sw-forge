# SW-Forge Project Skill

AI agents working on the SW-Forge project should use this skill to understand project-specific conventions, build processes, and workflows.

## Project Overview

SW-Forge is a static JavaScript application for Summoners War rune analysis and optimization. It features:

- Rune dashboard with distribution analysis
- Rune table with virtual scrolling for large datasets
- Monster management and skill planning
- Multi-language support (English, Russian, French, Chinese)
- Test suite with 50 tests via Vitest (`tests/`)
- Cloudflare Workers deployment

## Key Commands

### Development
```bash
npm run dev                  # Start Vite dev server on port 5500 (with instant HMR)
npm run type-check           # Type check TypeScript modules (tsc --noEmit)
npm run build:vite           # Fast production build via Vite (tsc && vite build)
npm run build                # Full legacy build (translations, CSS, UI, HTML, validation)
npm run build:ui             # Build JavaScript UI bundle from source chunks
npm run build:css            # Build CSS bundle from source files
npm run build:translations   # Build translation files
npm test / npm run test      # Run full Vitest test suite (91 tests)
npm run lint                 # Run linter
```

### Build System
- **UI Build**: `tools/build-ui.mjs` - Assembles 41 source chunks into `js/ui.js`
- **CSS Build**: `tools/build-css.mjs` - Compiles 54 CSS files into `css/dist/app.css`
- **Translations**: `tools/build-translations.mjs` - Builds translation dictionaries
- **HTML Build**: `tools/build-html.mjs` - Generates `index.html` with hash-based cache busting

### Deployment
- CI/CD workflow: `.github/workflows/deploy.yml`
- Deploys `worker` directory to Cloudflare Workers via Wrangler
- Requires secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

## Project Structure

### Source Organization
```
js/
├── core/              # Core utilities and translations
├── features/          # Feature modules (runes, monsters, shell, etc.)
└── ui.js              # Generated UI bundle (do not edit directly)

css/
├── features/          # Feature-specific CSS
├── foundation/        # Base styles
└── dist/app.css       # Generated CSS bundle (do not edit directly)

tools/                 # Build scripts
worker/                # Cloudflare Workers deployment
```

### Important Modules

**Rune System** (`js/features/runes/`)
- `utils.js` - Tooltip system, shared helpers
- `table.js` - Rune table rendering
- `table-virtual.js` - Virtual scrolling for large datasets
- `table-filters.js` - URL-based filtering and state management
- `dashboard.js` - Rune distribution dashboard
- `verdict-filters.js` - Navigation between dashboard and table

**Navigation** (`js/features/shell/`)
- `theme-nav.js` - Tab navigation, URL hash management
- `bootstrap.js` - Application initialization
- `language-bindings.js` - Language switching

## Code Conventions

### JavaScript
- Use ES6+ features
- Follow existing patterns in similar modules
- Check `package.json` before adding dependencies
- Prefer dependency versions published at least 7 days ago
- Write compact code with minimal nesting
- No explicit comments unless requested

### CSS
- Use CSS custom properties (variables) for theming
- Follow BEM-like naming conventions
- Use `color-mix()` for color operations
- Include vendor prefixes only when necessary

### Git
- Feature branches for significant changes
- Clear commit messages explaining "why" not "what"
- Preserve attribution for external contributions
- Never commit secrets or credentials
- Use Windows-compatible command syntax for commits

## Known Issues and Patterns

### Tooltip System
- Located in `js/features/runes/utils.js`
- Uses `mouseenter`/`mouseleave` events on tooltip targets
- Avoids opacity/transform CSS transitions to prevent flickering
- Cleanup on tab switching to prevent stickiness

### URL State Management
- `history.replaceState()` disabled in table-filters.js (causes address bar flickering)
- Hash-based routing: `#gear/runetable`, `#dashboard`, etc.
- Tab navigation in `js/features/shell/theme-nav.js`

### Virtual Table
- Implemented in `js/features/runes/table-virtual.js`
- Uses requestAnimationFrame for smooth scrolling
- Schedule repaint with `scheduleRuneTableVirtualRepaint()`

## Testing and Verification

### Before Committing
1. Run `npm run build` to ensure full build passes
2. Run `npm test` to verify tests pass
3. Run `npm run lint` to check code quality
4. Test UI changes locally with `npm run dev`

### Build Validation
- Hardcoded hex colors are warned but not blocked
- Data validation checks translation completeness
- HTML build includes hash-based cache busting

## Common Tasks

### Adding a New Feature
1. Create feature-specific CSS in `css/features/`
2. Implement feature logic in `js/features/`
3. Add translations to `js/core/translations.js`
4. Run `npm run build:translations` if adding translation keys
5. Test locally with `npm run dev`
6. Run full build with `npm run build`
7. Commit with clear message

### Fixing a Bug
1. Reproduce the issue locally
2. Use code search to find relevant code
3. Read related files to understand patterns
4. Implement minimal fix following existing conventions
5. Test the fix
6. Run full build and tests
7. Commit with issue reference

### Adding Translations
1. Add keys to translation dictionaries
2. Run `npm run build:translations`
3. Test language switching
4. Update translation documentation if needed

## Security Considerations

- Never commit secrets or credentials
- Never modify git configuration
- Never make destructive database changes
- Never push without user confirmation
- Follow security best practices for user input

## Browser Testing

For UI changes, use browser preview:
1. Start dev server: `npm run dev` (or alternate port if occupied)
2. Create browser preview with the URL
3. Test the specific feature or fix
4. Check console for errors
5. Verify visual behavior matches expectations

## Deployment

- Deploy automatically on push to `main` branch
- Check GitHub Actions for deployment status
- Use `gh run list` to see recent workflow runs
- Use `gh run watch <run-id>` to monitor deployment

## Getting Help

- Check `AGENTS.md` for general agent guidelines
- Review existing code patterns in similar modules
- Search the codebase with grep or file search tools
- Ask user for clarification on ambiguous requirements
