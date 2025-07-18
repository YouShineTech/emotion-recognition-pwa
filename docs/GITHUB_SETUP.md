# GitHub Repository Setup Guide

## Repository Structure

This project should be committed to GitHub with the following structure:

```
emotion-recognition-pwa/
├── .github/workflows/          # CI/CD pipeline
├── .kiro/specs/               # Kiro specifications
├── .vscode/                   # VS Code configuration
├── client/                    # PWA frontend
├── docs/                      # Documentation
├── scripts/                   # Build and debug scripts
├── server/                    # Backend services
├── shared/                    # Shared interfaces
├── .env.example              # Environment template
├── .eslintrc.js              # ESLint configuration
├── .gitignore                # Git ignore rules
├── .prettierrc               # Prettier configuration
├── docker-compose.yml        # Docker development environment
├── package.json              # Root package configuration
└── README.md                 # Project documentation
```

## Initial Repository Setup

### 1. Create GitHub Repository

```bash
# On GitHub.com, create a new repository named: emotion-recognition-pwa
# Choose: Public or Private (your preference)
# Don't initialize with README (we already have one)
```

### 2. Initialize Local Git Repository

```bash
# Navigate to your project directory
cd ~/projects/kiatest

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "feat: initial project setup with foundation framework

- Complete modular architecture with 11 independent modules
- CI/CD pipeline with GitHub Actions
- Comprehensive build and test environment
- VS Code debugging configuration
- Docker development environment
- Module communication monitoring tools
- Health check and debugging scripts
- PWA with responsive design
- TypeScript configuration for client and server
- Jest testing framework with 80% coverage requirement"

# Add remote repository (replace with your GitHub URL)
git remote add origin https://github.com/YOUR_USERNAME/emotion-recognition-pwa.git

# Push to GitHub
git push -u origin main
```

### 3. Set Up Branch Protection Rules

On GitHub.com, go to Settings > Branches and add protection for `main`:

- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Include administrators

## Repository Configuration

### GitHub Actions Secrets

Add these secrets in GitHub Settings > Secrets and variables > Actions:

```bash
# For deployment (add when ready)
DEPLOY_HOST=your-server-host
DEPLOY_USER=your-deploy-user
DEPLOY_KEY=your-ssh-private-key

# For notifications (optional)
SLACK_WEBHOOK=your-slack-webhook-url
DISCORD_WEBHOOK=your-discord-webhook-url
```

### Branch Strategy

```bash
main        # Production-ready code
develop     # Integration branch
feature/*   # Feature development branches
hotfix/*    # Production hotfixes
release/*   # Release preparation
```

### Commit Message Convention

Use conventional commits format:

```bash
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: adding tests
chore: maintenance tasks

# Examples:
git commit -m "feat: implement WebRTC media capture module"
git commit -m "fix: resolve connection timeout in MediaRelay module"
git commit -m "docs: update build guide with debugging instructions"
```

## Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/webrtc-transport-module

# Make changes and commit
git add .
git commit -m "feat: implement WebRTC transport with Socket.IO signaling"

# Push feature branch
git push origin feature/webrtc-transport-module

# Create Pull Request on GitHub
```

### 2. Code Review Process

1. **Create Pull Request** with detailed description
2. **Automated Checks** run (CI/CD pipeline)
3. **Code Review** by team members
4. **Merge** after approval and passing checks

### 3. Release Process

```bash
# Create release branch
git checkout -b release/v1.0.0

# Update version numbers
npm version minor

# Create release PR
# After merge, tag the release
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

## Files to Commit

### ✅ Include These Files:

- **Source Code**: All `.ts`, `.js`, `.html`, `.css` files
- **Configuration**: `package.json`, `tsconfig.json`, `webpack.config.js`
- **Documentation**: `README.md`, `docs/`, `.kiro/specs/`
- **CI/CD**: `.github/workflows/`
- **Development Tools**: `.vscode/`, `scripts/`
- **Docker**: `docker-compose.yml`
- **Environment Template**: `.env.example`

### ❌ Exclude These Files (in .gitignore):

- **Dependencies**: `node_modules/`
- **Build Output**: `dist/`, `build/`
- **Environment Files**: `.env`, `.env.local`
- **Logs**: `*.log`, `logs/`
- **Coverage Reports**: `coverage/`
- **IDE Files**: `.vscode/chrome-debug-profile/`
- **OS Files**: `.DS_Store`, `Thumbs.db`

## Repository Maintenance

### Regular Tasks

```bash
# Update dependencies monthly
npm audit
npm update

# Clean up branches
git branch -d feature/completed-feature
git push origin --delete feature/completed-feature

# Sync with upstream
git fetch origin
git rebase origin/main
```

### Security

- **Dependabot**: Enable automatic dependency updates
- **CodeQL**: Enable code scanning for security issues
- **Secret Scanning**: Enable to detect committed secrets

## Collaboration

### Team Setup

1. **Add Collaborators** in GitHub Settings > Manage access
2. **Set up Teams** for different roles (Frontend, Backend, DevOps)
3. **Configure Notifications** for important events

### Issue Templates

Create `.github/ISSUE_TEMPLATE/` with:

- Bug report template
- Feature request template
- Task template

### Pull Request Template

Create `.github/pull_request_template.md` with:

- Description of changes
- Testing checklist
- Breaking changes notice

## Deployment Integration

### Staging Environment

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging
on:
  push:
    branches: [develop]
# ... deployment steps
```

### Production Environment

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production
on:
  push:
    tags: ['v*']
# ... deployment steps
```

---

## Quick Commands Reference

```bash
# Initial setup
git init && git add . && git commit -m "feat: initial setup"

# Daily workflow
git checkout -b feature/my-feature
git add . && git commit -m "feat: implement feature"
git push origin feature/my-feature

# Sync with main
git checkout main && git pull origin main
git checkout feature/my-feature && git rebase main

# Clean up
git branch -d feature/completed-feature
```

This repository structure provides a solid foundation for collaborative development with proper CI/CD, testing, and deployment workflows.
