# GitHub Workflow Guide

## Branch Model

- `main`: stable, review-ready milestones
- `dev`: shared integration branch
- `feature/*`: focused implementation branches
- `hotfix/*`: urgent production fixes when needed

## Commit Message Guidelines

Use Conventional Commits with concise, outcome-focused messages.

Examples:

- `feat: implement checkout and order submission flow`
- `fix: prevent admin statistics requests for unauthenticated users`
- `docs: add local setup guide for XAMPP and React app`
- `chore: clean repository and add GitHub templates`

## Seed Backlog

- Setup root repository structure and ignore policy
- Replace hardcoded DB and app config with environment-based setup
- Document local development workflow for frontend and backend
- Audit upload storage strategy and sample asset policy
- Add validation and error-handling consistency across PHP endpoints
- Add frontend test coverage for cart, auth, and admin flows
- Harden admin route protection and session handling
- Prepare deployment notes for XAMPP and local PHP hosting

## Recommended Labels

- `bug`
- `enhancement`
- `documentation`
- `tech-debt`
- `priority:high`
- `priority:medium`
- `needs-review`

## Natural Push Cadence

- Push meaningful work 2 to 4 times per week
- Keep one active feature branch at a time when possible
- Follow large feature commits with small review-driven cleanup commits only when they represent real improvements
