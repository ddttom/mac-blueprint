# Claude Developer Guide

This document helps AI assistants understand and work effectively with the mac-blueprint project.

## Project Overview

**mac-blueprint v2.0** - Blueprint your Mac development environment. Capture on one machine, apply on another.

- **Language**: Node.js (CommonJS)
- **Node Version**: >=18.0.0
- **Main Scripts**: capture.js, apply.js, diff.js
- **Test Suite**: 20 passing tests using Node's built-in test runner
- **Security**: Input sanitization, secret detection, command injection protection

## Project Purpose

Solves the problem of keeping multiple Macs synchronized (e.g., Mac Studio at home + MacBook for travel). Captures complete development environment and applies it elsewhere.

## Core Scripts

### capture.js
Captures current Mac setup into JSON blueprint.

**Flags**:
- `--dry-run` - Preview what would be captured
- `--redact-secrets` - Remove sensitive data (API keys, passwords, tokens)
- `--verbose` - Show detailed error information
- `--help` - Show all options

### apply.js
Applies a blueprint by installing packages and listing manual steps.

**Flags**:
- `--dry-run` - Preview changes without applying
- `--verify` - Verify installations completed successfully
- `--install-mas` - Auto-install Mac App Store apps (requires `mas` CLI)
- `--install-global-packages` - Auto-install npm/bun/dart/ruby packages
- `--verbose` - Show detailed output
- `--help` - Show all options

### diff.js (NEW in v2.0)
Compare two blueprints to see what changed.

**Usage**: `node src/tools/diff.js old.json new.json`

## Utility Modules

Located in `src/utils/`:

### exec.js
Secure command execution with:
- Input sanitization (prevents command injection)
- Command validation
- Error handling

### schema.js
JSON validation and diff functionality:
- Schema version validation
- Blueprint format checking
- Diff comparison between blueprints

### mas.js
Mac App Store integration:
- Capture MAS apps (requires `mas` CLI)
- Install MAS apps by ID
- Check if `mas` is installed

## What Gets Captured

1. **Applications** - All apps in /Applications with versions and bundle IDs
2. **Mac App Store Apps** - MAS apps (requires `brew install mas`)
3. **Homebrew** - Taps, casks, formulae with versions
4. **Global Packages** - npm, bun, dart, ruby packages
5. **~/bin Directory** - All scripts, executables, symlinks
6. **GitHub Repos** - Repos in ~/Documents/github with remotes and branches
7. **Shell Configs** - .zshrc, .bashrc, etc. with full content
8. **Git Config** - Global git configuration
9. **Version Managers** - nvm, pyenv, rbenv installed versions
10. **System Integration** - Menu bar apps, login items, launch agents

## What Gets Applied

**Automatic** (if flags used):
- Homebrew taps, formulae, casks
- Mac App Store apps (--install-mas)
- Global packages (--install-global-packages)

**Manual** (listed for user):
- Non-Homebrew/MAS applications
- ~/bin scripts to copy
- GitHub repos to clone
- Shell configs to review
- Git settings to configure
- Version managers to install
- Menu bar apps and login items

## JSON Blueprint Structure (v2.0)

```json
{
  "version": "2.0",
  "system": {
    "hostname": "...",
    "macosVersion": "...",
    "architecture": "...",
    "homebrewVersion": "...",
    "captureDate": "..."
  },
  "applications": [...],
  "masApps": [...],
  "homebrew": {
    "taps": [...],
    "casks": [...],
    "formulae": [...]
  },
  "binaries": [...],
  "homeBin": [...],
  "githubRepos": [...],
  "globalPackages": {
    "npm": [...],
    "bun": [...],
    "dart": [...],
    "ruby": [...]
  },
  "shellConfigs": [...],
  "gitConfig": {...},
  "versionManagers": {...},
  "menubarConfig": {...}
}
```

## Testing

**Run tests**: `npm test`
**Watch mode**: `npm run test:watch`

Tests are in `tests/unit/` with fixtures in `tests/fixtures/`.

Test coverage includes:
- Secure command execution
- Input sanitization
- Secret detection
- JSON validation
- Diff functionality
- MAS integration

## Security Features (v2.0)

1. **Input Sanitization** - Prevents command injection
2. **Secret Detection** - Warns about API keys, passwords, tokens
3. **Command Validation** - Only allows safe commands
4. **JSON Validation** - Schema checking
5. **Batch Processing** - Prevents resource exhaustion

**Security Guidelines**:
- Always use `--redact-secrets` when sharing blueprints
- Review JSON before applying blueprints
- Never commit sensitive credentials
- See docs/SECURITY.md for full threat model

## Development Workflow

1. **Code Quality**:
   - `npm run lint` - Check code quality
   - `npm run lint:fix` - Auto-fix issues
   - `npm run format` - Format with Prettier
   - `npm run format:check` - Check formatting

2. **Testing**:
   - Run tests before committing
   - Add tests for new features
   - Use fixtures for test data

3. **Documentation**:
   - Update relevant .md files
   - Keep CHANGELOG.md current
   - Document new flags/features

## Common Development Tasks

### Adding a New Capture Feature

1. Add capture logic to `src/tools/capture.js`
2. Update JSON schema in `src/utils/schema.js`
3. Add handling in `src/tools/apply.js`
4. Update diff logic in `src/tools/diff.js` if needed
5. Add tests
6. Update documentation

### Adding a New Flag

1. Add to argument parser in relevant script
2. Implement functionality
3. Update `--help` text
4. Document in README.md and QUICK-START.md
5. Add to this file

### Improving Security

1. Review code for vulnerabilities
2. Add input validation
3. Add tests for security scenarios
4. Update docs/SECURITY.md
5. Document in CHANGELOG.md

## File Manifest

- `src/tools/capture.js` - Main capture script
- `src/tools/apply.js` - Main apply script
- `src/tools/diff.js` - Blueprint comparison tool
- `src/tools/aliases.sh` - 30+ productivity shell aliases
- `src/tools/install-aliases.sh` - Alias installer
- `src/tools/agentsetup.sh` - Agent setup script
- `src/utils/exec.js` - Secure command execution
- `src/utils/schema.js` - JSON validation & diff
- `src/utils/mas.js` - Mac App Store integration
- `tests/unit/*.test.js` - Test suite
- `package.json` - Project configuration

## Documentation Files

- `README.md` - Main documentation
- `QUICK-START.md` - 5-minute getting started guide
- `docs/SECURITY.md` - Security best practices
- `CHANGELOG.md` - Version history
- `IMPROVEMENTS-SUMMARY.md` - v2.0 implementation details
- `PROJECT-README.md` - Complete project overview
- `docs/SHELL-ALIAS-README.md` - Personal shell aliases
- `docs/ZSH-ALIASES-REFERENCE.md` - Quick alias reference
- `INSTALL-VS-RECOMMEND.md` - What's automated vs manual
- `BLOG-POST.md` - Shareable explanation
- `CONTRIBUTING.md` - Development guidelines
- `FILE-MANIFEST.md` - Complete file listing
- `CLAUDE.md` - This file

## Common User Requests

### "Capture my setup"
```bash
node src/tools/capture.js
# Or with security:
node src/tools/capture.js --redact-secrets
```

### "Apply a blueprint"
```bash
node src/tools/apply.js mac-setup.json --dry-run  # Preview first
node src/tools/apply.js mac-setup.json             # Then apply
```

### "Full automatic restore"
```bash
node src/tools/apply.js mac-setup.json --install-global-packages --install-mas --verify
```

### "What changed between setups?"
```bash
node src/tools/diff.js old.json new.json
```

### "Install shell aliases"
```bash
chmod +x src/tools/install-aliases.sh
./src/tools/install-aliases.sh
source ~/.zshrc
```

### "Run tests"
```bash
npm test
```

## Important Notes

1. **Never suggest modifications that could compromise security** - input sanitization is critical
2. **Always recommend --dry-run first** - preview before applying
3. **Always recommend --redact-secrets** - when sharing blueprints
4. **Respect the simple architecture** - avoid over-engineering
5. **Test changes thoroughly** - 20 tests must pass
6. **Update CHANGELOG.md** - for any user-facing changes
7. **This is CommonJS, not ES modules** - use `require()`, not `import`

## Version History

- **v1.0** - Initial release
- **v2.0** - Security hardening, secret detection, verification, MAS support, diff tool, test suite

## Current Status

- ✅ All 20 tests passing
- ✅ Security hardened
- ✅ Full documentation
- ✅ Ready for production use
- ✅ Active development

## When Users Need Help

Point them to:
1. `README.md` - Overview and quick start
2. `QUICK-START.md` - Detailed examples
3. `docs/SECURITY.md` - Security concerns
4. `docs/ZSH-ALIASES-REFERENCE.md` - Alias list
5. `TROUBLESHOOTING` section in README.md

---

**Remember**: This tool manages critical development environments. Prioritize security, test thoroughly, and always recommend dry-run mode first.
