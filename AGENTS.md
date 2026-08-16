# AI Agent Project Management Guidelines

## Overview
This document defines how AI agents should manage and contribute to the SW-Forge project, based on 2025-2026 best practices for agentic project management.

## Agent Roles and Capabilities

### Agent Types

**1. Code Maintenance Agent**
- Reads and writes code
- Runs tests and builds
- Fixes bugs and implements features
- **Scope**: All source files in the project
- **Permissions**: Read all, write to code files, run build/test commands
- **Approval needed**: Major refactors, breaking changes, external API changes

**2. Debug Agent**
- Investigates reported issues
- Traces code execution paths
- Identifies root causes
- **Scope**: Source code, error logs, test results
- **Permissions**: Read all, create diagnostic files, run tests
- **Approval needed**: None for debugging (read-only investigation)

**3. Documentation Agent**
- Updates README, guides, API docs
- Keeps CHANGELOG current
- Generates technical documentation
- **Scope**: Documentation files
- **Permissions**: Read all, write to docs
- **Approval needed**: Major documentation restructures

## Agent Workflows

### Issue Resolution Workflow
1. **Claim Issue**: Agent moves issue from "Todo" to "Doing"
2. **Investigate**: Read issue description, reproduce locally if possible
3. **Root Cause Analysis**: Trace code, identify the actual problem
4. **Propose Fix**: Create minimal, targeted fix
5. **Test**: Run relevant tests, verify locally
6. **Commit**: Create commit with clear message
7. **Deploy**: Push changes, trigger CI/CD
8. **Close Issue**: Update issue status and notify reporter

### Feature Implementation Workflow
1. **Understand Requirements**: Read issue/PR description thoroughly
2. **Explore Codebase**: Find relevant existing code and patterns
3. **Plan**: Break down into small, testable steps
4. **Implement**: Follow existing code conventions
5. **Test**: Write or run tests
6. **Verify**: Check that the feature works as expected
7. **Document**: Update relevant documentation
8. **Commit and Deploy**: Push changes with proper attribution

## Guardrails and Permissions

### Read-Only Operations (No Approval Needed)
- Read any file in the project
- Run build/test commands
- Search codebase
- Inspect Git history
- View CI/CD status

### Write Operations (Approval Needed)
- Modify core architecture files
- Change build configuration
- Update dependencies
- Make breaking changes
- Modify security policies

### Always Prohibited
- Commit secrets or credentials
- Modify git configuration
- Push without user confirmation
- Make destructive database changes
- Modify production without approval

## Communication Patterns

### Progress Updates
- Post intermediate progress as comments on issues
- Report blockers immediately
- Summarize completed work clearly
- Provide evidence of testing

### Error Handling
- Report errors with full context
- Propose multiple solution approaches
- Ask for clarification when requirements are ambiguous
- Never proceed with destructive operations without confirmation

## Project-Specific Conventions

### Build Commands
- `npm run build` - Full build (translations, CSS, UI, HTML, validation)
- `npm run build:ui` - Build JavaScript UI bundle
- `npm run build:css` - Build CSS bundle
- `npm run build:translations` - Build translation files
- `npm test` / `npm run test` - Run tests via Vitest
- `npm run lint` - Run ESLint linter (JavaScript only)
- `npm audit` - Check for security vulnerabilities in dependencies

### Build and Test Configuration
- **ESLint**: Configured with flat config (eslint.config.js)
  - Ignores generated files: `js/ui.js`, `js/ui.js.map`
  - Ignores IIFE bootstrap files: `js/features/shell/bootstrap.js`, `js/features/monsters/bootstrap.js`
  - Rules downgraded to warnings for legacy code compatibility
  - Source type: module (ESM)
- **Vitest**: Configured with jsdom environment and global test variables
  - Setup file: `tests/setup.js` initializes `window.SWRM` globals
  - **Test Coverage:** 50 tests (parser, efficiency, utilities)
  - **Test Files:** `tests/parser.test.js`, `tests/rune-efficiency.test.js`, `tests/utils.test.js`
- **Dependencies**: 5 vulnerabilities currently reported (1 moderate, 4 high)
  - Do NOT run `npm audit fix` without user approval
  - Vulnerabilities are in dev dependencies (brace-expansion, fast-uri, js-yaml, nanoid, postcss)

### Git Workflow
- Feature branches for significant changes
- Clear commit messages explaining "why" not "what"
- Attribution preservation for external contributions
- Never commit secrets or credentials
- Use Windows-compatible command syntax for commits

### Testing
- Run tests before committing code changes
- Verify build passes after changes
- Test locally before deploying
- Use browser preview for UI changes
- **Test Coverage:** 50 tests in `tests/` directory (parser, efficiency, utilities)
- **Test Framework:** Vitest with jsdom environment
- **TDD:** Use test-driven development for new features (write failing test first, then implement)

### Code Style
- Follow existing patterns in the codebase
- Check package.json/cargo.toml before adding dependencies
- Prefer library versions published at least 7 days ago
- Write compact code with minimal nesting
- Follow language-specific idioms

### Recommended Skills
For SW-Forge development, the following skills are particularly useful:

**Testing & Quality:**
- `test-driven-development` - Use when implementing new logic or fixing bugs
- `verification` - Run full project audit before major releases
- `verify-security` - Check for security issues after dependency updates

**Browser Testing:**
- `browser-testing-with-devtools` - Test UI changes in real browser
  - Essential for rune table, tooltip, and dashboard changes
  - Use before deploying UI modifications
  - Check console errors and performance metrics

**Documentation:**
- Repository-local skill: `.devin/skills/sw-forge/SKILL.md`
  - Project-specific conventions and build details
  - Reference this for module-specific information
  - AGENTS.md provides broader agent guidelines

## Agent Performance Tracking

### Success Metrics
- Issues resolved successfully
- Code quality maintained (tests pass, lint clean)
- Build stability maintained
- Documentation kept current
- Response time to requests

### Quality Checks
- Do not break existing functionality
- Follow security best practices
- Preserve attribution for external contributions
- Maintain code consistency with project patterns
- Verify changes before deployment

## Continuous Improvement

Agents should:
- Learn from each interaction with the project
- Update this document with new patterns discovered
- Suggest improvements to project structure
- Identify recurring issues and propose systemic fixes
- Keep technical knowledge current with project evolution

## References

Based on 2025-2026 AI project management best practices:
- Atlassian AI Agents Guidelines
- IPMA AI Guidelines 2025
- Quire Agentic Project Management
- Stellary AI Agent Control Framework
- Hypertask Agent Integration Patterns
