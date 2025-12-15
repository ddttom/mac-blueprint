# mac-blueprint v2.0

Blueprint your Mac development environment. Capture on one machine, apply on another.

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](CHANGELOG.md)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](package.json)
[![Tests](https://img.shields.io/badge/tests-20%20passing-success.svg)](#testing)
[![Security](https://img.shields.io/badge/security-hardened-success.svg)](docs/SECURITY.md)

## Why This Exists

I have a Mac Studio at home for heavy work and a MacBook for travel. I'd install a tool or configure something on one machine, then weeks later realise I never set it up on the other. Missing packages, different shell aliases, repositories cloned on one but not the other - it was frustrating.

This tool solves that problem. Capture a blueprint on one Mac, copy the JSON to the other, apply the blueprint. Done. Your development environments stay aligned.

It's also perfect for:
- Setting up a new Mac (personal or work)
- Disaster recovery (keep the blueprint backed up)
- Team onboarding (share your standardised setup)
- Testing changes (dry-run before applying)
- Tracking environment changes over time (new in v2.0!)

## Overview

Secure, tested Node.js scripts that blueprint and recreate your Mac development setup.

**src/tools/capture.js** - Captures your current setup into a JSON blueprint (with secret detection)
**src/tools/apply.js** - Applies a blueprint by installing packages (with verification)
**src/tools/diff.js** - Compare two blueprints to see what changed

## ✨ What's New in v2.0

- 🔒 **Security hardened** - Input sanitization prevents command injection
- 🔍 **Secret detection** - Warns about API keys, passwords, tokens in configs
- ✅ **Installation verification** - `--verify` flag checks packages installed correctly
- 📊 **Differential backups** - Compare setups to see what changed
- 🍎 **Mac App Store support** - Capture and restore MAS apps (requires `mas` CLI)
- ⚡ **Performance improvements** - Batch processing for large package lists
- 🧪 **Test suite** - 20 passing tests for critical functions
- 📚 **Comprehensive docs** - Security guide, changelog, quick start

[See CHANGELOG.md for full details](CHANGELOG.md)

## What Gets Captured

### Applications & Packages
- All applications in /Applications with versions and bundle IDs
- **Mac App Store apps** (new in v2.0 - requires `brew install mas`)
- Homebrew taps, casks, and formulae with versions
- NPM global packages (including scoped packages like @org/package)
- Bun global packages
- Dart global packages
- Ruby gems

### Development Environment
- ~/bin directory (all scripts, executables, symlinks)
- GitHub repositories in ~/Documents/github
- Git remote URLs and current branches
- Uncommitted changes warnings
- Shell configs (.zshrc, .bashrc, etc.) with full content
- Git global configuration and .gitignore_global
- Version managers (nvm, pyenv, rbenv) with installed versions

### System Integration
- Menu bar configuration
- Login items (apps that start at login)
- Running menu bar applications
- Launch agents (user and system)
- System binaries in /usr/local/bin and /opt/homebrew/bin

## Quick Start

See [QUICK-START.md](QUICK-START.md) for detailed instructions and examples.

### 1. Capture Blueprint

On your current Mac:

```bash
# Basic capture
node src/tools/capture.js

# With security (recommended if sharing)
node src/tools/capture.js --redact-secrets
```

This creates `mac-setup.json` containing your complete setup.

**New Options in v2.0:**
- `--dry-run` - Preview what would be captured
- `--redact-secrets` - Remove sensitive data (API keys, passwords, tokens)
- `--verbose` - Show detailed error information
- `--help` - Show all options

### 2. Apply Blueprint

On another Mac (or after reviewing the blueprint):

```bash
# Preview first (recommended)
node src/tools/apply.js mac-setup.json --dry-run

# Basic restore
node src/tools/apply.js mac-setup.json

# Full automatic restore
node src/tools/apply.js mac-setup.json --install-global-packages --install-mas --verify
```

**New Options in v2.0:**
- `--verify` - Verify installations completed successfully
- `--install-mas` - Automatically install Mac App Store apps (requires `mas`)
- `--install-global-packages` - Auto-install npm/bun/dart/ruby packages
- `--help` - Show all options

### 3. Compare Setups (New in v2.0)

```bash
# See what changed between two captures
node src/tools/diff.js mac-setup-old.json mac-setup-new.json
```

**What gets applied automatically:**
- ✓ Homebrew taps
- ✓ Homebrew formulae (CLI tools)
- ✓ Homebrew casks (GUI apps)
- ✓ Mac App Store apps (with `--install-mas`)
- ✓ Global packages (with `--install-global-packages`)

**What gets listed for manual action:**
- Applications not in Homebrew or MAS
- ~/bin scripts to copy
- GitHub repositories to clone
- Shell configurations to review
- Git settings to configure
- Version managers to install
- Menu bar apps and login items

See [INSTALL-VS-RECOMMEND.md](INSTALL-VS-RECOMMEND.md) for the complete breakdown.

### 4. Install Shell Aliases (Optional)

```bash
chmod +x src/tools/install-aliases.sh
./src/tools/install-aliases.sh
source ~/.zshrc
```

Adds 30+ productivity aliases like:
- `gac "message"` - git add . && commit
- `gacp "message"` - git add . && commit && push
- `mkcd dirname` - create and enter directory
- `bi` - bun install
- `fd` - flutter doctor

See [docs/ZSH-ALIASES-REFERENCE.md](docs/ZSH-ALIASES-REFERENCE.md) for the complete list.

## Example Output

### After Capture

```
System information captured
- Applications: 45
- Homebrew casks: 23
- Homebrew formulae: 67
- Homebrew taps: 3
- Binaries: 156
- ~/bin files: 12
- GitHub repositories: 8
- NPM global packages: 5
- Bun global packages: 3
- Dart global packages: 4
- Ruby gems: 15
- Shell config files: 2
- Git config entries: 12
- Login items: 5
- Running menu bar apps: 18
- Launch agents: 24

Setup saved to: mac-setup.json
```

### After Apply

The apply script:
- Installs Homebrew packages automatically (30-60 minutes)
- Lists applications requiring manual installation
- Shows ~/bin files to restore
- Provides GitHub repository clone URLs
- Displays shell configurations for review
- Shows git configuration commands
- Lists version managers to install
- Reports menu bar apps and login items

Total time: 1-2 hours (30-60 min automatic + 30-60 min manual steps)

## What's Captured

### Applications
- Name, version, and bundle identifier
- Location in /Applications directory

### Homebrew
- Taps (additional repositories)
- Formulae (command-line tools)
- Casks (GUI applications)
- Versions of installed packages

### Binaries
- Executables in /usr/local/bin and /opt/homebrew/bin
- Symlinks and their targets

### ~/bin Directory
- All files and scripts in ~/bin
- File types (executable, symlink, regular file)
- Symlink targets
- File sizes

### GitHub Repositories
- Top-level directories in ~/Documents/github
- Git status (repository or regular directory)
- Remote URLs for git repositories
- Current branch names
- Uncommitted changes warnings

### Global Packages
- NPM global packages with versions
- Bun global packages with versions
- Dart global packages with versions
- Ruby gems with versions

### Shell Configuration
- Shell config files (.zshrc, .bashrc, .bash_profile, etc.)
- File contents for backup/reference
- Line counts and sizes

### Git Configuration
- User name and email
- All global git config settings
- Global .gitignore file content

### Version Managers
- nvm (Node Version Manager) - installed versions
- pyenv (Python Version Manager) - installed versions
- rbenv (Ruby Version Manager) - installed versions

### Menu Bar & System
- Login items (apps that auto-start)
- Running menu bar applications
- Launch agents (user and system)

## Security & Best Practices

⚠️ **Important**: Before sharing setup files:
- Use `--redact-secrets` flag to remove sensitive data
- Review the JSON for API keys, passwords, tokens
- See [docs/SECURITY.md](docs/SECURITY.md) for comprehensive security guide

✅ **What v2.0 Protects Against:**
- Command injection attacks (input sanitization)
- Accidental secret exposure (detection + redaction)
- Malformed data (JSON validation)
- Resource exhaustion (batch processing)

## Testing

v2.0 includes a comprehensive test suite:

```bash
# Run all tests (20 test cases)
npm test

# Watch mode for development
npm run test:watch

# Code quality
npm run lint
npm run format
```

## Limitations

1. ~~**Mac App Store apps**~~ - Now supported with `--install-mas` flag (v2.0)
2. **Application settings** - Not captured; you'll need to reconfigure
3. **Licenses** - Must be reactivated manually
4. **Custom binaries** - Only locations are recorded, not sources
5. **System preferences** - Not included

## Additional Resources

### Documentation
- 📖 [QUICK-START.md](QUICK-START.md) - Get started in 5 minutes
- 🔒 [docs/SECURITY.md](docs/SECURITY.md) - Security best practices and threat model
- 📋 [CHANGELOG.md](CHANGELOG.md) - Version history and migration guide
- 📊 [IMPROVEMENTS-SUMMARY.md](IMPROVEMENTS-SUMMARY.md) - v2.0 implementation details
- 🚀 [PROJECT-README.md](PROJECT-README.md) - Complete project overview
- 💻 [docs/SHELL-ALIAS-README.md](docs/SHELL-ALIAS-README.md) - My personal shell aliases (use as inspiration)
- ⚡ [docs/ZSH-ALIASES-REFERENCE.md](docs/ZSH-ALIASES-REFERENCE.md) - Quick alias reference (customize to your needs)
- 📦 [INSTALL-VS-RECOMMEND.md](INSTALL-VS-RECOMMEND.md) - What's automated vs manual
- ✍️ [BLOG-POST.md](docs/BLOG-POST.md) - Shareable explanation
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) - Development guidelines

### Tips

**v2.0 Best Practices:**
- Use `--redact-secrets` when capturing for sharing
- Run `--verify` after applying to check success
- Compare setups with `src/tools/diff.js` before applying
- Use `--verbose` to debug capture issues
- Run capture regularly to track changes over time
- Store `mac-setup.json` in version control or cloud storage
- Review the blueprint before applying
- Always use `--dry-run` first to preview changes
- Run `brew cleanup` after applying

### For Developers

The scripts capture your complete development environment:

**~/bin scripts** - Listed with details so you can restore them:
- Copy these files from backup or version control
- Set execute permissions: `chmod +x ~/bin/script-name`
- Ensure ~/bin is in your PATH

**GitHub repositories** - Shows what you had:
- Which repositories were on your old machine
- Their remote URLs for easy cloning
- Current branches
- Uncommitted changes warnings

To apply repositories:
```bash
mkdir -p ~/Documents/github
cd ~/Documents/github
git clone git@github.com:user/repo.git
```

**Shell configuration** - Your shell config files are captured with full content:
- Extract from the JSON or restore from separate backup
- Review PATH modifications and custom settings
- See docs/SHELL-ALIAS-README.md for recommended aliases

**Git configuration** - Your global git settings are captured:
```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

**Global packages** - All package managers are captured:
- NPM: `npm install -g <packages>`
- Bun: `bun install -g <packages>`
- Dart: `dart pub global activate <package>`
- Ruby: `gem install <gems>`

Or use `--install-global-packages` flag to install automatically.

**Version managers** - The script detects nvm, pyenv, and rbenv with their installed versions.

## JSON Structure

The generated JSON contains (v2.0 schema):

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
  "masApps": [...],  // NEW in v2.0
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

**Note**: v1.0 files are automatically upgraded when applied.

## Troubleshooting

### Homebrew Issues
```bash
brew update
brew doctor
sudo chown -R $(whoami) /usr/local/*
```

### Aliases Not Working
```bash
grep aliases ~/.zshrc           # Check if sourced
source ~/.zshrc                 # Reload
alias | grep gac                # Check for conflicts
```

### Permission Errors
```bash
chmod +x ~/bin/*
sudo chown -R $(whoami) ~/bin
```

## Project Structure

```
mac-blueprint/
├── src/
│   ├── tools/                  # Main command-line tools
│   │   ├── capture.js          # Capture setup with security features
│   │   ├── apply.js            # Apply setup with verification
│   │   ├── diff.js             # Compare two setups
│   │   ├── aliases.sh          # 30+ productivity shell aliases
│   │   ├── install-aliases.sh  # Alias installer script
│   │   └── agentsetup.sh       # Agent setup script
│   └── utils/                  # Shared utilities
│       ├── exec.js             # Secure command execution
│       ├── schema.js           # JSON validation & diff
│       └── mas.js              # Mac App Store integration
│
├── docs/                       # Documentation files
│   ├── BLOG-POST.md            # Shareable blog post
│   ├── SECURITY.md             # Security guide
│   ├── SHELL-ALIAS-README.md   # Shell alias guide
│   └── ZSH-ALIASES-REFERENCE.md # Quick alias reference
│
├── tests/                      # Test suite
│   ├── unit/                   # Unit tests (20 passing)
│   └── fixtures/               # Test data
│
├── Root Files
│   ├── README.md               # This file
│   ├── CHANGELOG.md            # Version history
│   ├── CONTRIBUTING.md         # Development guidelines
│   ├── CLAUDE.md               # AI assistant guide
│   └── package.json            # NPM configuration
│
└── Configuration
    ├── .eslintrc.json          # Code quality
    ├── .prettierrc.json        # Formatting
    └── .gitignore              # Git ignore rules
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

**Want to help?**
- 🐛 Report bugs via GitHub Issues
- 💡 Suggest features via GitHub Discussions
- 🔒 Report security issues (see [docs/SECURITY.md](docs/SECURITY.md))
- ✨ Submit pull requests

## License

ISC License - Use freely. Modify as needed. Share improvements.

## Acknowledgments

- Built for developers with multiple Macs
- Inspired by the need for environment consistency
- v2.0 security improvements based on comprehensive code review
- All tests passing ✓ All security issues resolved ✓

---

**Blueprint your Mac. Apply anywhere. Now with security and verification. 🚀**

**Version 2.0.0** | [Changelog](CHANGELOG.md) | [Security](docs/SECURITY.md) | [Quick Start](QUICK-START.md)