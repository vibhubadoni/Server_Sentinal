# Contributing to ServerSentinel

Thank you for your interest in contributing to ServerSentinel! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, inclusive, and professional in all interactions.

## Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/yourorg/serversentinel.git
   cd serversentinel
   ```

2. **Install dependencies**
   ```bash
   # Server
   cd server && npm install
   
   # Client
   cd ../client && npm install
   
   # Agent
   cd ../agent && npm install
   ```

3. **Set up environment variables**
   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   cp agent/.env.example agent/.env
   ```

4. **Start development environment**
   ```bash
   docker-compose up -d
   ./scripts/seed-and-run.sh
   ```

## Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Write/update tests
4. Run tests: `npm test`
5. Run linter: `npm run lint`
6. Commit with conventional commits: `git commit -m "feat: add new feature"`
7. Push and create a pull request

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## Pull Request Process

1. Update documentation if needed
2. Add tests for new features
3. Ensure all tests pass
4. Update CHANGELOG.md
5. Request review from maintainers

## Testing

- Unit tests: `npm test`
- Integration tests: `npm run test:integration`
- E2E tests: `npm run test:e2e`
- Load tests: `k6 run tests/load/metrics-ingestion.js`

## Code Style

- Follow TypeScript strict mode
- Use ESLint and Prettier configurations
- Maintain 80%+ test coverage
- Write clear, self-documenting code
- Add comments for complex logic

## Questions?

Open an issue or reach out to the maintainers.

Thank you for contributing! 🎉
