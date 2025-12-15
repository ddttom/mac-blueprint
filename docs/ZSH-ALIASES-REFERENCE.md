# Zsh Aliases Quick Reference

**Note:** These are my personal aliases that work for my workflow. Use this as a reference to build your own alias collection that matches how you work. Feel free to pick and choose, or create entirely different ones!

**Typo Corrections Included:** Several aliases correct common typos (like `LS` → `ls`, `taul` → `tail`, `taIl` → `tail`). These prevent frustration when typing quickly. Track your own typos and add aliases for them!

## Installation

```bash
chmod +x src/tools/install-aliases.sh
./src/tools/install-aliases.sh
source ~/.zshrc
```

Or manually add to your `~/.zshrc`:
```bash
source ~/zsh-aliases.sh
```

## Essential Aliases

| Alias | Command | Description |
|-------|---------|-------------|
| `la` | `ls -la` | List all files with details |
| `LS` | `ls` | Typo correction for LS |
| `md` | `mkdir -p` | Create directory with parents |
| `taul` | `tail` | Typo correction |
| `taIl` | `tail` | Typo correction |
| `tal` | `tail` | Typo correction |
| `ll` | `ls -lh` | List with human-readable sizes |
| `tf` | `tail -f` | Follow log files |
| `+x` | `chmod +x` | Make file executable |

## Git Workflow

**Note:** Items marked with 📝 are functions (not aliases) - they accept arguments and can do more complex operations.

| Alias/Function | Command | Description |
|----------------|---------|-------------|
| `gac` | `git add . && git commit -m` | Add all and commit with message |
| `gacp` 📝 | `gacp "message"` | Add all, commit with message, and push |
| `gp` | `git push` | Push to remote |
| `gpl` | `git pull` | Pull from remote |
| `gs` | `git status` | Show status |
| `gd` | `git diff` | Show differences |
| `gl` | `git log --oneline -n 10` | Last 10 commits |
| `glg` | `git log --graph --oneline --all` | Visual log |
| `gco` | `git checkout` | Checkout branch |
| `gcb` | `git checkout -b` | Create and checkout branch |
| `gb` | `git branch` | List branches |
| `gba` | `git branch -a` | List all branches |
| `gaa` | `git add --all` | Add all changes |
| `gcm` | `git commit -m` | Commit with message |
| `gca` | `git commit --amend` | Amend last commit |
| `gcan` | `git commit --amend --no-edit` | Amend without editing message |
| `gpf` | `git push --force-with-lease` | Safe force push |
| `gwip` 📝 | `gwip` | Quick "WIP" commit (no message needed) |
| `gsave` 📝 | `gsave` | Quick "SAVEPOINT" commit (no message needed) |
| `qcp` 📝 | `qcp "message"` | Quick commit and push in one command |
| `gact` 📝 | `gact "message"` | Commit with timestamp and push |

## Bun Development

| Alias | Command | Description |
|-------|---------|-------------|
| `bi` | `bun install` | Install dependencies |
| `br` | `bun run` | Run script |
| `bt` | `bun test` | Run tests |
| `ba` | `bun add` | Add package |
| `bad` | `bun add -d` | Add dev package |
| `bu` | `bun update` | Update packages |
| `bx` | `bunx` | Execute package |

## NPM Development

| Alias | Command | Description |
|-------|---------|-------------|
| `ni` | `npm install` | Install dependencies |
| `nr` | `npm run` | Run script |
| `nt` | `npm test` | Run tests |
| `na` | `npm install --save` | Add package |
| `nad` | `npm install --save-dev` | Add dev package |
| `nls` | `npm list -g --depth=0` | List global packages |
| `nup` | `npm update` | Update packages |

## Flutter/Dart Development

| Alias | Command | Description |
|-------|---------|-------------|
| `fd` | `flutter doctor` | Check Flutter setup |
| `fpu` | `flutter pub upgrade` | Upgrade packages |
| `fpg` | `flutter pub get` | Get packages |
| `fcc` | `flutter clean && flutter pub get` | Clean and get packages |
| `frun` | `flutter run` | Run app |
| `fbuild` | `flutter build` | Build app |
| `dpa` | `dart pub global activate` | Activate Dart package |

## Navigation

| Alias | Command | Description |
|-------|---------|-------------|
| `..` | `cd ..` | Go up one directory |
| `...` | `cd ../..` | Go up two directories |
| `....` | `cd ../../..` | Go up three directories |
| `-` | `cd -` | Go to previous directory |
| `gh` | `cd ~/Documents/github` | Go to GitHub directory |
| `ghls` | `ls -la ~/Documents/github` | List GitHub directory |

## Useful Functions

| Function | Usage | Description |
|----------|-------|-------------|
| `mkcd` | `mkcd dirname` | Create and enter directory |
| `h` | `h keyword` | Search command history |
| `ff` | `ff filename` | Find files by name |
| `bak` | `bak file.txt` | Create timestamped backup |
| `extract` | `extract archive.zip` | Extract any archive type |

## macOS Specific

| Alias | Command | Description |
|-------|---------|-------------|
| `f` | `open -a Finder .` | Open current directory in Finder |
| `cpwd` | `pwd \| pbcopy` | Copy current path to clipboard |

## Usage Examples

### Git Workflow
```bash
# Quick commit and push
gac "Fix bug in login"

# Add, commit with message, and push
gacp "Add new feature"

# Create and switch to new branch
gcb feature/new-login

# Quick WIP commit
gwip

# Commit with timestamp
gact "Update documentation"
```

### Bun Development
```bash
# Install and run
bi
br start

# Add development package
bad typescript

# Run tests
bt
```

### Flutter/Dart
```bash
# Check setup and get packages
fd
fpg

# Clean rebuild
fcc

# Activate global package
dpa flutter_m1_patcher
```

### File Operations
```bash
# Create and enter directory
mkcd my-project

# Make script executable
+x deploy.sh

# Create backup before editing
bak important-file.txt

# Extract archive
extract project.tar.gz
```

### Search and Navigate
```bash
# Search history for git commands
h git

# Find all JavaScript files
ff "*.js"

# Quick navigation
gh            # Go to GitHub directory
..            # Go up one level
-             # Go to previous directory
```

## Testing Your Aliases

After installation, test with:
```bash
# List all aliases
alias

# Test specific alias
type gac

# Check function
which qcp
```

## Customisation

Edit `~/zsh-aliases.sh` to:
- Add your own aliases
- Modify existing ones
- Remove ones you don't need

After editing, reload with:
```bash
source ~/.zshrc
```

## Troubleshooting

**Aliases not working?**
1. Check if file is sourced: `grep zsh-aliases.sh ~/.zshrc`
2. Reload shell: `source ~/.zshrc`
3. Check for errors: `zsh -n ~/.zshrc`

**Conflict with existing aliases?**
1. Check existing: `alias | grep gac`
2. Remove from `~/zsh-aliases.sh`
3. Reload: `source ~/.zshrc`

**Function not found?**
Functions are defined in the aliases file. Make sure the entire file is loaded.
