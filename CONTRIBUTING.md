# Contributing to SW-Forge

Thank you for your interest in contributing to SW-Forge! This guide will help you get started.

## Quick Start

1. **Fork the repository** on GitHub
2. **Clone your fork:** `git clone https://github.com/your-username/SW-Forge.git`
3. **Navigate to the project:** `cd SW-Forge`
4. **Install dependencies:** `npm install`
5. **Start development server:** `npm run dev`
6. **Open in browser:** http://127.0.0.1:5500/

## Development Workflow

### Before Making Changes

1. **Read the documentation:**
   - Start with [`docs/00-MASTER.md`](docs/00-MASTER.md) for project overview
   - Check [`docs/03-PROJECT-STRUCTURE.md`](docs/03-PROJECT-STRUCTURE.md) for code organization
   - Review [`docs/05-WORKFLOWS.md`](docs/05-WORKFLOWS.md) for common tasks

2. **Check existing issues:** Look at GitHub Issues to see if someone is already working on what you want to do

3. **For AI agents:** See [`AGENTS.md`](AGENTS.md) for AI-specific guidelines

### Making Changes

1. **Create a branch:** `git checkout -b feature/your-feature-name`
2. **Make your changes** following project conventions
3. **Test your changes:**
   ```bash
   npm run build    # Full build
   npm test         # Run tests
   npm run lint     # Check code quality
   ```
4. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Clear description of your changes"
   ```
5. **Push to your fork:** `git push origin feature/your-feature-name`
6. **Create a Pull Request** on GitHub

## Project Structure

```
SW-Forge/
├── css/               # Stylesheets
│   ├── features/      # Feature-specific CSS
│   ├── foundation/    # Base styles
│   └── dist/          # Generated CSS bundle (do not edit)
├── js/                # JavaScript source
│   ├── core/          # Core utilities and translations
│   ├── data/          # Data parsing and databases
│   ├── engine/        # Rune verdict engine
│   ├── features/      # Feature modules
│   └── ui.js          # Generated UI bundle (do not edit)
├── docs/              # Documentation
├── data/              # Game data files
├── partials/          # HTML partials
├── tests/             # Test files
└── tools/             # Build scripts
```

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
- Clear commit messages explaining "why" not "what"
- Never commit secrets or credentials
- Use feature branches for significant changes

## Build Commands

```bash
npm run dev                # Local dev server
npm run build              # Full build
npm run build:ui           # Build JavaScript UI bundle
npm run build:css          # Build CSS bundle
npm run build:translations # Build translation files
npm run build:html         # Generate index.html
npm test                   # Run tests
npm run lint               # Run linter
npm run lint:fix           # Auto-fix linting issues
npm run format             # Format code with Prettier
```

## Testing

### Running Tests
```bash
npm test
```

### Writing Tests
- Tests are in `tests/` directory
- Use Vitest framework
- Test setup in `tests/setup.js`
- Follow TDD principles: write failing test first, then implement

### Test Coverage
- Current: 50 tests
- Aim for >80% coverage on new features
- Focus on critical business logic

## Documentation

### When to Update Docs
- Adding new features
- Changing build process
- Modifying project structure
- Updating workflows

### Documentation Files
- `docs/00-MASTER.md` - Entry point, build commands
- `docs/03-PROJECT-STRUCTURE.md` - Code organization
- `docs/05-WORKFLOWS.md` - Step-by-step guides
- `docs/07-TESTING.md` - Testing guide
- `AGENTS.md` - AI agent guidelines

## Known Limitations

### defaults.js (1276 lines)
- Contains tightly coupled threshold/formula/role logic
- Complex migration logic makes clean separation difficult
- Splitting is not recommended (see `docs/DEFAULTS-REFATORING-ANALYSIS.md`)
- Acceptable for now; revisit if exceeds 2000 lines

### CSS Linting
- CSS linting disabled due to legacy issues
- Focus on JS quality first
- Address CSS issues incrementally

## Getting Help

### For Human Contributors
- Check existing documentation in `docs/`
- Review similar code patterns in the codebase
- Ask questions in GitHub Issues

### For AI Agents
- See [`AGENTS.md`](AGENTS.md) for agent-specific guidelines
- Check [`.devin/skills/sw-forge/SKILL.md`](.devin/skills/sw-forge/SKILL.md) for project-specific details
- Follow workflows in `docs/05-WORKFLOWS.md`

## Code Review Process

1. **Automated checks:**
   - CI/CD runs on push to main
   - Build must pass
   - Tests must pass
   - Lint must show no errors

2. **Manual review:**
   - Code follows project conventions
   - Documentation updated if needed
   - Tests added for new functionality
   - No security issues introduced

## Security Best Practices

- Never commit secrets or credentials
- Never modify git configuration
- Never push without user confirmation
- Follow security best practices for user input
- Run `npm audit` periodically (do NOT auto-fix without review)

## Release Process

1. Update changelog in `js/core/changelog-data.js`
2. Increment version in relevant files
3. Run full build: `npm run build`
4. Test thoroughly in local environment
5. Commit with version bump
6. Create release on GitHub
7. Deploy to Cloudflare Pages (automatic via CI/CD)

## License

By contributing to SW-Forge, you agree that your contributions will be licensed under the project's license.

## Questions?

- Open an issue on GitHub
- Check existing documentation
- Review similar code patterns in the codebase

Thank you for contributing to SW-Forge! 🎉
