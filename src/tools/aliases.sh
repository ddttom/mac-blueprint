# ============================================================================
# Custom Aliases for ~/.zshrc
# Add these to your ~/.zshrc file or source this file from .zshrc
# To use: echo "source ~/zsh-aliases.sh" >> ~/.zshrc
# ============================================================================

# ----------------------------------------------------------------------------
# Essential Aliases - Typo Corrections
# ----------------------------------------------------------------------------
alias la='ls -la'                    # List all files with details
alias LS='ls'                        # Typo correction
alias md='mkdir -p'                  # Create directory with parents
alias taul='tail'                    # Typo correction
alias taIl='tail'                    # Typo correction
alias tal='tail'                     # Typo correction

# ----------------------------------------------------------------------------
# Git Workflow Shortcuts
# ----------------------------------------------------------------------------
alias gac='git add . && git commit -m'
alias gacp='_gacp() { git add . && git commit -m "$1" && git push; }; _gacp'
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
alias gm='git merge'
alias gr='git remote -v'

# Git helpers
alias git-undo='git reset HEAD~1'
alias git-amend='git commit --amend'
alias git-last='git log -1 HEAD'

# ----------------------------------------------------------------------------
# Bun Shortcuts
# ----------------------------------------------------------------------------
alias bi='bun install'
alias br='bun run'
alias bt='bun test'
alias ba='bun add'
alias bad='bun add -d'
alias bu='bun update'
alias bx='bunx'

# ----------------------------------------------------------------------------
# NPM Shortcuts
# ----------------------------------------------------------------------------
alias ni='npm install'
alias nr='npm run'
alias nt='npm test'
alias na='npm install --save'
alias nad='npm install --save-dev'
alias nls='npm list -g --depth=0'
alias nup='npm update'

# ----------------------------------------------------------------------------
# Flutter/Dart Shortcuts
# ----------------------------------------------------------------------------
alias fd='flutter doctor'
alias fpu='flutter pub upgrade'
alias fpg='flutter pub get'
alias fcc='flutter clean && flutter pub get'
alias frun='flutter run'
alias fbuild='flutter build'
alias dpa='dart pub global activate'

# ----------------------------------------------------------------------------
# Additional Useful Aliases
# ----------------------------------------------------------------------------
# Navigation
alias ..='cd ..'
alias ...='cd ../..'
alias ....='cd ../../..'
alias -- -='cd -'

# File operations
alias ll='ls -lh'
alias l='ls -CF'
alias tf='tail -f'

# Make executable
alias +x='chmod +x'
alias exe='chmod +x'

# Git extras
alias gaa='git add --all'
alias gcm='git commit -m'
alias gca='git commit --amend'
alias gcan='git commit --amend --no-edit'
alias gpf='git push --force-with-lease'
alias gst='git stash'
alias gstp='git stash pop'
alias gstl='git stash list'

# Quick commit patterns
alias gwip='git add -A && git commit -m "WIP"'
alias gsave='git add -A && git commit -m "SAVEPOINT"'

# ----------------------------------------------------------------------------
# Useful Functions
# ----------------------------------------------------------------------------

# Quick commit and push with message
qcp() {
  if [ -z "$1" ]; then
    echo "Usage: qcp 'commit message'"
    return 1
  fi
  git add . && git commit -m "$1" && git push
}

# Create and enter directory
mkcd() {
  mkdir -p "$1" && cd "$1"
}

# Git commit with timestamp
gact() {
  git add . && git commit -m "$1 [$(date '+%Y-%m-%d %H:%M')]" && git push
}

# Search history
h() {
  history | grep "$1"
}

# Find files by name
ff() {
  find . -type f -iname "*$1*"
}

# Create backup of file
bak() {
  cp "$1" "$1.bak-$(date +%Y%m%d-%H%M%S)"
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

# ----------------------------------------------------------------------------
# GitHub Quick Navigation
# ----------------------------------------------------------------------------
alias gh='cd ~/Documents/github'
alias ghls='ls -la ~/Documents/github'

# ----------------------------------------------------------------------------
# macOS Specific
# ----------------------------------------------------------------------------
alias f='open -a Finder .'
alias cpwd='pwd | pbcopy'

echo "✓ Custom aliases loaded"
