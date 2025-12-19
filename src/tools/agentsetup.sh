#!/bin/bash

# agentsetup.sh
# Recreates symlinks for multi-AI environment setup

# 1. Symlink GEMINI.md to CLAUDE.md (Google Gemini compatibility)
if [ ! -L "GEMINI.md" ]; then
    echo "Creating symlink: GEMINI.md -> CLAUDE.md"
    ln -s CLAUDE.md GEMINI.md
else
    echo "Symlink GEMINI.md already exists."
fi

# 2. Symlink AGENTS.md to CLAUDE.md (legacy compatibility)
if [ ! -L "AGENTS.md" ]; then
    echo "Creating symlink: AGENTS.md -> CLAUDE.md"
    ln -s CLAUDE.md AGENTS.md
else
    echo "Symlink AGENTS.md already exists."
fi

# 3. Setup .agents/workflows symlink
# Ensure .agent directory exists
if [ ! -d ".agents" ]; then
    echo "Creating directory: .agents"
    mkdir -p .agents
fi

# Create symlink if it doesn't exist
if [ ! -L ".agents/workflows" ]; then
    echo "Creating symlink: .agents/workflows -> ../.claude/skills"
    # Note: Using relative path for symlink within .agent directory
    ln -s ../.claude/skills .agents/workflows
else
    echo "Symlink .agents/workflows already exists."
fi

# 4. Ensure symlink entries exist in .gitignore
GITIGNORE_FILE=".gitignore"
GITIGNORE_ENTRIES=(".agents/" "GEMINI.md" "AGENTS.md")

# Create .gitignore if it doesn't exist
if [ ! -f "$GITIGNORE_FILE" ]; then
    echo "Creating $GITIGNORE_FILE"
    touch "$GITIGNORE_FILE"
fi

# Check and add missing entries
ADDED_ANY=false
for entry in "${GITIGNORE_ENTRIES[@]}"; do
    if ! grep -qF "$entry" "$GITIGNORE_FILE"; then
        if [ "$ADDED_ANY" = false ]; then
            echo "" >> "$GITIGNORE_FILE"
            echo "# symlinks for AI tools" >> "$GITIGNORE_FILE"
            ADDED_ANY=true
        fi
        echo "Adding $entry to .gitignore"
        echo "$entry" >> "$GITIGNORE_FILE"
    else
        echo "$entry already in .gitignore"
    fi
done

echo "Agent setup complete."
