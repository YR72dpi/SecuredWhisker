# Contributing to Secured Whisker

Thank you for your interest in contributing to Secured Whisker! This document explains how to contribute effectively and respectfully.

## General Rules

- Open an issue first to discuss a significant new feature or architecture change.
- Respect the project's `CODE_OF_CONDUCT` (if present) and remain courteous.

## Workflow

1. Fork the repository and create a branch on your fork: `feature/your-feature` or `fix/brief-description`.
2. Work locally and write clear, atomic commits.
3. Open a Pull Request (PR) against the `dev` branch of the main repository.
4. Wait for reviews: a maintainer may request changes before merging.

## Code Quality

- Follow the style rules of the subproject (PHP-CS-Fixer / ESLint, etc.).
- Add tests for new features (unit/integration) when feasible.
- Document important changes in the `README` or `docs/`.

## Running tests & lint

- Front (Next.js):

```bash
cd front
npm install
npm run lint
```

- Backend (PHP / Symfony): run PHPUnit tests and address any failing tests or warnings.

## Security

If you discover a security vulnerability, do not disclose details publicly. Report it following the process described in `SECURITY.md`.

Thank you — your contributions make this project better.
