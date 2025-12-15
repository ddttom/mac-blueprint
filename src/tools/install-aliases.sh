#!/bin/bash

# Installation script for zsh aliases
# This script safely adds aliases to your .zshrc

ZSHRC="$HOME/.zshrc"
ALIAS_FILE="zsh-aliases.sh"

echo "Installing zsh aliases..."
echo ""

# Check if .zshrc exists
if [ ! -f "$ZSHRC" ]; then
    echo "Creating .zshrc file..."
    touch "$ZSHRC"
fi

# Create backup of .zshrc
BACKUP="$ZSHRC.backup-$(date +%Y%m%d-%H%M%S)"
cp "$ZSHRC" "$BACKUP"
echo "✓ Backed up .zshrc to: $BACKUP"

# Check if alias file is already sourced
if grep -q "source.*zsh-aliases.sh" "$ZSHRC"; then
    echo "⚠ Aliases already sourced in .zshrc"
    echo "  If you want to update, remove the old line first"
    exit 0
fi

# Copy alias file to home directory
if [ -f "$ALIAS_FILE" ]; then
    cp "$ALIAS_FILE" "$HOME/$ALIAS_FILE"
    echo "✓ Copied $ALIAS_FILE to ~/"
else
    echo "✗ Error: $ALIAS_FILE not found in current directory"
    exit 1
fi

# Add source line to .zshrc
echo "" >> "$ZSHRC"
echo "# Custom aliases" >> "$ZSHRC"
echo "source ~/$ALIAS_FILE" >> "$ZSHRC"

echo "✓ Added source line to .zshrc"
echo ""
echo "Installation complete!"
echo ""
echo "To activate the aliases, either:"
echo "  1. Run: source ~/.zshrc"
echo "  2. Close and reopen your terminal"
echo ""
echo "Test with: alias | grep gac"
