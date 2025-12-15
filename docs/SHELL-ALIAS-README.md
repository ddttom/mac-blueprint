# Shell Aliases Guide

**Note:** These are my personal shell aliases that I find useful. They're included as examples and inspiration - you should customize them to match your own workflow and preferences. Pick and choose what works for you!

**Typo Corrections:** Many aliases include common typos I make (like `LS` for `ls`, `taul` for `tail`). These save frustration when typing quickly. Add your own typos if you find yourself making the same mistakes!

## Installation

Add these aliases to your shell configuration file:
- Zsh: `~/.zshrc`
- Bash: `~/.bashrc` or `~/.bash_profile`

After adding, reload your shell:
```bash
source ~/.zshrc  # or ~/.bashrc
```

## Essential Aliases

### File Operations
```bash
# Common typos and shortcuts
alias la='ls -la'                    # List all files with details
alias ll='ls -lh'                    # List with human-readable sizes
alias LS='ls'                        # Typo correction
alias md='mkdir -p'                  # Create directory (with parents)
alias mkdirp='mkdir -p'              # Alternative

# Navigation
alias ..='cd ..'
alias ...='cd ../..'
alias ....='cd ../../..'
alias ~='cd ~'
alias -- -='cd -'                    # Go to previous directory

# Safety features
alias rm='rm -i'                     # Confirm before delete
alias cp='cp -i'                     # Confirm before overwrite
alias mv='mv -i'                     # Confirm before overwrite
```

### Text Processing
```bash
# Typo corrections
alias taul='tail'
alias taIl='tail'
alias tal='tail'

# Common patterns
alias tf='tail -f'                   # Follow log files
alias tf100='tail -f -n 100'         # Follow last 100 lines
alias t1000='tail -n 1000'           # Last 1000 lines
```

### Git Workflows
```bash
# Quick commits
alias gac='git add . && git commit -m'
alias gacp='git add . && git commit -m "$1" && git push'
alias gp='git push'
alias gpl='git pull'
alias gs='git status'
alias gd='git diff'
alias gl='git log --oneline -n 10'
alias glg='git log --graph --oneline --all'
alias gco='git checkout'
alias gcb='git checkout -b'
alias gb='git branch'
alias gba='git branch -a'

# Git helpers
alias git-undo='git reset HEAD~1'
alias git-amend='git commit --amend'
alias git-last='git log -1 HEAD'
```

### Development Tools
```bash
# Bun shortcuts
alias bi='bun install'
alias br='bun run'
alias bt='bun test'
alias ba='bun add'
alias bad='bun add -d'
alias bu='bun update'

# NPM shortcuts (if you use both)
alias ni='npm install'
alias nr='npm run'
alias nt='npm test'
alias nls='npm list -g --depth=0'

# Flutter/Dart
alias fd='flutter doctor'
alias fpu='flutter pub upgrade'
alias fpg='flutter pub get'
alias fcc='flutter clean && flutter pub get'
alias dpa='dart pub global activate'
```

### System Utilities
```bash
# Make executable quickly
alias +x='chmod +x'
alias exe='chmod +x'

# Time Machine snapshots
alias tms='tmutil listlocalsnapshots /'
alias tmd='for d in $(tmutil listlocalsnapshotdates | grep "-"); do sudo tmutil deletelocalsnapshots $d; done'

# Network
alias myip='curl -s ifconfig.me'
alias ports='lsof -i -P | grep LISTEN'
alias ping8='ping 8.8.8.8'
```

### Docker (if you use it)
```bash
alias d='docker'
alias dc='docker-compose'
alias dps='docker ps'
alias dpsa='docker ps -a'
alias di='docker images'
alias dex='docker exec -it'
alias dstop='docker stop $(docker ps -q)'
alias dclean='docker system prune -af'
```

## Project-Specific Aliases

### AEM/CQ Development
```bash
# From your history
alias aem-author='java -Xmx512m -jar cq-author-*.jar'
alias aem-publish='java -Xmx512m -jar cq-publish-*.jar -Dsling.run.modes=publish'
alias aem-start='./start'
alias aem-stop='./stop'
alias aem-log='tail -f error.log'
alias aem-clear='./log-clear'
```

### GitHub Directories
```bash
# Quick navigation to common work directories
alias gh='cd ~/Documents/github'
alias ghls='ls -la ~/Documents/github'
```

## Function Aliases (More Powerful)

Add these to your shell config for more functionality:

```bash
# Create and enter directory
mkcd() {
  mkdir -p "$1" && cd "$1"
}

# Extract various archive types
extract() {
  if [ -f "$1" ]; then
    case "$1" in
      *.tar.bz2)   tar xjf "$1"     ;;
      *.tar.gz)    tar xzf "$1"     ;;
      *.bz2)       bunzip2 "$1"     ;;
      *.rar)       unrar x "$1"     ;;
      *.gz)        gunzip "$1"      ;;
      *.tar)       tar xf "$1"      ;;
      *.tbz2)      tar xjf "$1"     ;;
      *.tgz)       tar xzf "$1"     ;;
      *.zip)       unzip "$1"       ;;
      *.Z)         uncompress "$1"  ;;
      *.7z)        7z x "$1"        ;;
      *)           echo "'$1' cannot be extracted" ;;
    esac
  else
    echo "'$1' is not a valid file"
  fi
}

# Find files by name
ff() {
  find . -type f -iname "*$1*"
}

# Find directories by name
fd() {
  find . -type d -iname "*$1*"
}

# Git commit with timestamp
gact() {
  git add . && git commit -m "$1 [$(date '+%Y-%m-%d %H:%M')]" && git push
}

# Quick git commit and push
qcp() {
  if [ -z "$1" ]; then
    echo "Usage: qcp 'commit message'"
    return 1
  fi
  git add . && git commit -m "$1" && git push
}

# Search history
h() {
  history | grep "$1"
}

# Create backup of file
bak() {
  cp "$1" "$1.bak-$(date +%Y%m%d-%H%M%S)"
}
```

## Useful Environment Variables

Add these to your shell config:

```bash
# Set default editor
export EDITOR='nano'  # or 'vim', 'code', etc.

# Homebrew (for Apple Silicon Macs)
export PATH="/opt/homebrew/bin:$PATH"

# Add ~/bin to PATH (for your custom scripts)
export PATH="$HOME/bin:$PATH"

# Ruby (if installed via Homebrew)
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"

# History settings
export HISTSIZE=10000
export HISTFILESIZE=20000
export HISTCONTROL=ignoredups:erasedups
```

## Oh My Zsh Plugin Recommendations

If you use Oh My Zsh (seen in your history), enable these plugins:

```bash
# In ~/.zshrc
plugins=(
  git
  brew
  npm
  node
  docker
  flutter
  gem
  history
  z                    # Jump to frequent directories
  zsh-autosuggestions  # Suggests commands as you type
  zsh-syntax-highlighting
)
```

## Platform-Specific Notes

### macOS Specific
```bash
# Open Finder in current directory
alias f='open -a Finder .'

# Copy current directory path
alias cpwd='pwd | pbcopy'

# Flush DNS
alias flushdns='sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder'

# Show/hide hidden files in Finder
alias showfiles='defaults write com.apple.finder AppleShowAllFiles YES; killall Finder'
alias hidefiles='defaults write com.apple.finder AppleShowAllFiles NO; killall Finder'
```

## Tips

1. **Don't overdo it** - Only add aliases you'll actually use
2. **Keep it memorable** - Use patterns that make sense to you
3. **Test first** - Try aliases before adding them permanently
4. **Document** - Add comments for complex aliases
5. **Backup** - Keep your shell config in version control

## Testing Your Aliases

After adding aliases, test them:
```bash
# List all aliases
alias

# Test specific alias
type gac  # Shows what the alias expands to
```

## Common Pitfalls

1. **Conflicting aliases** - Check if a command already exists: `type command_name`
2. **Quotes matter** - Use single quotes for literal strings, double for variables
3. **Functions vs aliases** - Use functions for multi-step operations
4. **PATH order** - Earlier paths take precedence

## Maintenance

Review and clean your aliases periodically:
```bash
# See which aliases you never use
history | awk '{print $2}' | sort | uniq -c | sort -rn | head -20
```

This will show your most-used commands, helping you decide which aliases are worth keeping.
