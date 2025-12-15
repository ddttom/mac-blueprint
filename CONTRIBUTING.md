# Contributing Guide

## Git Workflow

### Branching Strategy

- `main` - Production-ready code
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Development Process

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clear, concise commit messages
   - Keep commits focused and atomic
   - Test your changes locally

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add feature description"
   ```

4. **Push to remote**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**
   - Provide a clear description
   - Link related issues
   - Request reviews from team members

6. **After PR approval**
   - Squash and merge into main
   - Delete the feature branch

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### Before Committing

- Run tests: `npm test`
- Run linter: `npm run lint` (if configured)
- Ensure code builds: `npm run build` (if applicable)

### CI/CD

GitHub Actions automatically runs on:
- Push to `main`
- Pull requests to `main`

The CI pipeline:
1. Installs dependencies
2. Runs linter
3. Runs tests
4. Builds the project
