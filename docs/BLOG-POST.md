# Blueprint Your Mac: Keeping Two Machines in Sync

## The Problem

I have two Macs: a Mac Studio at home for heavy development work, and a MacBook Pro for when I travel. It's the perfect setup - power when I need it, portability when I'm on the go.

Except for one thing.

I'd install Bun on the Studio. Three weeks later, I'm at a coffee shop trying to run a script on the MacBook. "Command not found."

Or I'd spend an hour setting up the perfect shell aliases on the laptop. Fast-forward two months, I'm at my desk at home wondering why `gac` doesn't work.

GitHub repositories? Cloned on one machine but not the other. Flutter installed here but not there. That obscure Homebrew tap I needed? Can't remember which machine has it.

You get the picture.

After extensive production use and a comprehensive security review, the tool now includes security hardening, testing, and powerful features.

## The "Solutions" I Tried

**Manual lists?** I'd write down what I installed, then forget to update the list. Or lose it. Or find it three months later when I didn't need it anymore.

**Homebrew Brewfile?** Great for Homebrew packages. Doesn't help with NPM globals, Dart packages, Ruby gems, shell configs, or knowing which repositories I've cloned.

**Cloud sync?** Sure, I could sync application settings with various tools. But that doesn't tell me what's installed, just what's configured.

**Remember everything?** I'm a developer, not a database. My brain is already full of API endpoints and regex patterns.

## What I Actually Needed

I needed something simple:
1. Look at one Mac and capture everything important
2. Look at the other Mac and show me what's different
3. Optionally, install the differences automatically

Not a complex configuration management system. Not a cloud service. Just a straightforward blueprint-and-apply for my development environment.

## The Solution I Built: mac-blueprint

Three Node.js scripts. Simple but powerful.

**Script 1: Capture**
Run `node src/tools/capture.js` on your Mac. It creates a blueprint that captures:
- All your applications (with versions)
- Mac App Store apps
- Homebrew packages (taps, formulae, casks)
- Global packages (npm, bun, dart, ruby)
- Your ~/bin scripts
- GitHub repositories (with remote URLs)
- Shell configurations
- Git settings
- Version managers
- Menu bar apps and login items

Creates a single JSON file. About 200KB.

**Secret detection:** It warns you if it finds API keys, passwords, or tokens in your shell configs. Use `--redact-secrets` to automatically remove them before sharing.

**Script 2: Apply**
Run `node src/tools/apply.js mac-setup.json` on the other Mac. It:
- Installs all Homebrew packages automatically (with batch processing for speed)
- Installs Mac App Store apps (with `--install-mas` flag)
- Optionally installs global packages
- Verifies installations succeeded (with `--verify` flag)
- Lists what else needs attention
- Shows you repository URLs to clone
- Displays your shell config for review

Takes 30-60 minutes for the automatic bits. Another 30-60 for the manual steps (cloning repos, reviewing configs).

**Script 3: Diff**
Run `node src/tools/diff.js old-setup.json new-setup.json` to see what changed:
- Applications added, removed, or updated
- New packages installed
- Packages removed
- Complete change summary

Perfect for tracking environment changes over time or comparing work vs personal setups.

## The Dry-Run Feature

Before you commit to anything, run it with `--dry-run`. It shows you exactly what would happen, without changing anything.

This is particularly useful when you're not sure if the blueprint is from your personal Mac or work Mac, or if you've made customisations you want to review first.

## Real-World Usage

**Scenario 1: I installed something new on the Studio**
```bash
# On Mac Studio
node src/tools/capture.js
# Copy mac-setup.json to iCloud/Dropbox/wherever

# On MacBook (next time I use it)
node src/tools/apply.js mac-setup.json
# 30 minutes later, I'm aligned
```

**Scenario 2: New machine**

My MacBook Pro had a keyboard issue. Apple replaced it with a new one. Instead of spending a day reinstalling everything, I applied my latest blueprint. Two hours later, I was back to work.

**Scenario 3: Work vs personal**

I have different blueprints for work and personal projects. `mac-setup-work.json` and `mac-setup-personal.json`. When I switch contexts, I know exactly what's different.

## The Shell Aliases Bonus

While building this, I analysed my command history. Noticed I typed certain things hundreds of times. So I included my personal shell aliases as examples.

**Note:** These are my aliases that work for my workflow - you should customize them to match yours! They're included as inspiration.

For example, my favorites:
```
gacp "Fix bug"          # Instead of: git add . && git commit -m "Fix bug" && git push
mkcd new-project        # Instead of: mkdir new-project && cd new-project
```

**Typo corrections included:** The aliases also fix common typos I make when typing fast (like `LS` → `ls`, `taul` → `tail`). Track your own typos and add aliases for them - saves a lot of frustration!

Small time savings, but they add up. And it keeps those aliases in sync across machines too.

## What It Doesn't Do

It's not trying to be everything:
- Doesn't copy your application preferences (use Mackup for that)
- Doesn't handle software licenses (you'll need to enter those)
- Doesn't sync your actual code (use git for that)
- Doesn't modify system preferences (use `defaults` commands if needed)

It captures what you've installed and how you've configured your development tools. That's the scope, and it does it well.

## Key Features

After extensive production use and feedback, the tool includes comprehensive security and reliability improvements:

**Security:**
- Input sanitization prevents command injection attacks
- Secret detection warns about API keys, passwords, tokens
- `--redact-secrets` flag removes sensitive data before sharing
- JSON validation prevents malformed data issues

**Features:**
- Mac App Store support (via `mas` CLI integration)
- Differential backups - see what changed between captures
- Installation verification - confirm packages installed correctly
- Better error reporting with `--verbose` flag

**Performance:**
- Batch processing speeds up large package installations
- Smart package parsing supports scoped npm packages

**Quality:**
- Comprehensive unit tests
- ESLint and Prettier for code quality
- Extensive documentation (security guide, changelog, quick start)

## Who Else Might Find This Useful?

**Multiple machines?** Whether it's home/travel, work/personal, or desktop/laptop, this keeps them aligned.

**Setting up new machines?** Instead of a day of installations, you've got a documented, reproducible setup.

**Team lead?** Create a standard setup for your team. New developer? Run the restore script. Done.

**Disaster recovery?** Keep the JSON backed up. If something goes wrong, you can rebuild quickly.

**Just curious what you've installed?** Run the inspection script. You might be surprised how many global packages you've accumulated.

## The Technical Bits (For Those Who Care)

**Architecture:**
- Pure Node.js, no external dependencies
- Works with both x86 and Apple Silicon Macs
- Modular utility functions (security, validation, MAS integration)
- Input sanitization prevents command injection
- JSON schema validation with version compatibility
- Comprehensive unit tests covering critical security functions
- Batch processing prevents ARG_MAX issues
- Handles Homebrew automatically with error tracking
- Detects what's installed, doesn't make assumptions
- Dry-run mode for safety
- Creates human-readable JSON (you can edit it)
- Captures menu bar apps and login items
- Includes shell aliases tailored to common patterns
- ESLint and Prettier for code quality

## Getting Started

**Quick Start:**

```bash
# On your main Mac
node src/tools/capture.js --redact-secrets

# On your other Mac (preview first)
node src/tools/apply.js mac-setup.json --dry-run

# Apply everything
node src/tools/apply.js mac-setup.json --install-mas --install-global-packages --verify
```

Complete snapshot of your development environment in 30 seconds. Restore in 1-2 hours.

See [QUICK-START.md](https://github.com/ddttom/mac-blueprint/blob/main/QUICK-START.md) for detailed examples and real-world scenarios.

## The Best Part

I've been using this for over a year now. My Mac Studio and MacBook are perfectly aligned. When I install something on one, I just re-run `src/tools/capture.js` and apply the blueprint on the other machine.

No more "wait, did I install this here?" No more missing dependencies. No more different aliases on different machines.

Just two Macs that work the same way.

I can track changes over time with `src/tools/diff.js`, verify installations succeeded, and share my setup securely with redacted secrets. It's evolved from "works for me" to "production-ready with testing and security."

## Why I'm Sharing This

Because if you're reading this, you probably have the same problem. Maybe it's two Macs. Maybe it's the dread of setting up a new machine. Maybe you just want to document what you've installed.

This solved my problem. It might solve yours.

The project is called **mac-blueprint**. Blueprint your Mac, apply anywhere.

## One More Thing

The complete package includes:
- Capture, apply, and diff scripts
- Security-hardened utilities with input sanitization
- Example shell aliases (30+ git shortcuts, development tools, utilities - customize to your needs!)
- Comprehensive unit tests
- Extensive documentation including:
  - Quick Start (5 minutes)
  - Security Guide (best practices)
  - Changelog (version history)
  - API documentation
- Examples and real-world scenarios
- Install vs recommend breakdown
- ESLint and Prettier configuration
- Mac App Store integration
- Secret detection and redaction
- Installation verification
- Differential backup comparison
- Batch processing for performance

It's all there, tested, documented, and ready to use.

---

**The bottom line:** Your development environment is important. It should be documented, reproducible, consistent across machines, and **secure**. mac-blueprint makes all of that happen.

Zero known vulnerabilities. Comprehensive tests. Production-ready.

Now excuse me while I install something on my Mac Studio, run `src/tools/capture.js --redact-secrets`, compare it with my previous setup using `src/tools/diff.js`, and apply the blueprint to my MacBook with verification enabled.

---

**mac-blueprint** - Blueprint your Mac. Apply anywhere. 🚀

[GitHub](https://github.com/ddttom/mac-blueprint) | [Quick Start](../QUICK-START.md) | [Security Guide](SECURITY.md) | [Changelog](../CHANGELOG.md)