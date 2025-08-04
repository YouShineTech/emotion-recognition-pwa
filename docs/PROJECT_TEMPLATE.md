# Project Template & Setup Guide

This document provides a template and setup guide for creating new projects that follow our coding standards.

## 🚀 Quick Start Template

### 1. Project Initialization

```bash
# Create new project
mkdir my-new-project
cd my-new-project
git init

# Initialize package.json
npm init -y

# Create standard directory structure
mkdir -p src tests docs scripts .github/workflows config reports
```

### 2. Essential Dependencies

```bash
# Development dependencies (copy to all projects)
npm install -D \
  @typescript-eslint/eslint-plugin@^8.37.0 \
  @typescript-eslint/parser@^8.37.0 \
  eslint@^8.57.0 \
  eslint-config-prettier@^10.1.8 \
  eslint-plugin-prettier@^5.5.3 \
  prettier@^3.6.2 \
  husky@^8.0.3 \
  typescript@^5.0.0 \
  jest@^29.0.0 \
  @types/jest@^29.0.0 \
  ts-jest@^29.0.0 \
  concurrently@^8.2.2
```

### 3. Configuration Files

Copy these configuration files to every new project:

#### `.eslintrc.js`

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'prettier',
    'plugin:prettier/recommended',
  ],
  plugins: ['@typescript-eslint', 'prettier'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  env: {
    node: true,
    es6: true,
    jest: true,
  },
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'no-console': 'warn',
    'prefer-const': 'error',
  },
};
```

#### `.prettierrc`

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

#### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

#### `jest.config.js`

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/**/*.test.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### 4. Package.json Scripts Template

```json
{
  "scripts": {
    "dev": "ts-node src/index.ts",
    "build": "tsc",
    "build:watch": "tsc --watch",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write \"**/*.{js,ts,json,md}\"",
    "format:check": "prettier --check \"**/*.{js,ts,json,md}\"",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist coverage",
    "security:setup": "node scripts/setup-security-tools.js",
    "security:scan": "node scripts/security-scan.js",
    "security:fix": "node scripts/security-fix.js",
    "hooks:install": "husky install",
    "hooks:test": "npm run lint && npm run type-check && npm run test"
  }
}
```

### 5. Git Hooks Setup

```bash
# Install husky
npm run hooks:install

# Create pre-commit hook
echo '#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔒 Running pre-commit checks..."
npm run format:staged
git add -u
npm run hooks:test
npm run security:scan' > .husky/pre-commit

# Create pre-push hook
echo '#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🚀 Running pre-push checks..."
npm run test
npm audit --audit-level=high' > .husky/pre-push

chmod +x .husky/pre-commit .husky/pre-push
```

### 6. Security Setup

Copy these security files from the emotion-recognition-pwa project:

- `scripts/security-scan.js`
- `scripts/security-fix.js`
- `scripts/security-report.js`
- `scripts/setup-security-tools.js`
- `.securityrc.json`

### 7. GitHub Actions Workflow

Create `.github/workflows/ci-cd.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

permissions:
  contents: read
  actions: read

env:
  NODE_VERSION: '20'

jobs:
  lint:
    name: Lint and Format Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run linting
        run: npm run lint
      - name: Check formatting
        run: npm run format:check
      - name: Type check
        run: npm run type-check

  test:
    name: Tests
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm run test:coverage

  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Setup security tools
        run: npm run security:setup
      - name: Run security scan
        run: npm run security:scan
      - name: Upload security reports
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: security-reports
          path: reports/security/

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, test, security]
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Build project
        run: npm run build
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-artifacts
          path: dist/
```

### 8. Documentation Templates

Create these documentation files:

#### `README.md`

```markdown
# Project Name

Brief description of what this project does.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm 8+

### Installation

\`\`\`bash
git clone <repository-url>
cd <project-name>
npm install
npm run hooks:install
npm run security:setup
\`\`\`

### Development

\`\`\`bash
npm run dev
\`\`\`

### Testing

\`\`\`bash
npm test
npm run test:coverage
\`\`\`

### Building

\`\`\`bash
npm run build
npm start
\`\`\`

## 📚 Documentation

- [Coding Standards](docs/CODING_STANDARDS.md)
- [Security Guide](docs/SECURITY.md)
- [Contributing](CONTRIBUTING.md)

## 🔒 Security

This project includes automated security scanning. See [Security Guide](docs/SECURITY.md) for details.

## 🤝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.
```

#### `CONTRIBUTING.md`

```markdown
# Contributing Guidelines

## Development Process

1. Fork the repository
2. Create a feature branch: \`git checkout -b feature/my-feature\`
3. Make your changes
4. Run tests: \`npm test\`
5. Run security scan: \`npm run security:scan\`
6. Commit your changes (pre-commit hooks will run)
7. Push to your fork: \`git push origin feature/my-feature\`
8. Create a Pull Request

## Code Standards

- Follow the [Coding Standards](docs/CODING_STANDARDS.md)
- Ensure all tests pass
- Maintain test coverage above 80%
- Update documentation as needed

## Commit Message Format

Use conventional commits:

- \`feat: add new feature\`
- \`fix: resolve bug\`
- \`docs: update documentation\`
- \`test: add tests\`
```

### 9. Environment Configuration

Create environment files:

#### `.env.example`

```bash
# Application Configuration
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# Database Configuration
DATABASE_URL=

# External Services
API_KEY=
SECRET_KEY=
```

#### `.gitignore`

```
# Dependencies
node_modules/
npm-debug.log*

# Build outputs
dist/
build/

# Environment variables
.env
.env.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Coverage
coverage/

# Reports
reports/

# Security tools
scripts/security-tools/

# Cache
.cache/
```

## 📋 New Project Checklist

When creating a new project:

- [ ] Initialize git repository
- [ ] Set up package.json with standard scripts
- [ ] Install and configure development dependencies
- [ ] Set up TypeScript configuration
- [ ] Configure ESLint and Prettier
- [ ] Set up Jest for testing
- [ ] Install and configure Husky git hooks
- [ ] Set up security scanning tools
- [ ] Create GitHub Actions workflow
- [ ] Create documentation templates
- [ ] Set up environment configuration
- [ ] Create initial tests
- [ ] Verify all tools work correctly

## 🔄 Maintenance

Regular maintenance tasks for all projects:

- **Weekly**: Update dependencies, review security reports
- **Monthly**: Review and update documentation
- **Quarterly**: Review and update coding standards
- **As needed**: Update security configurations and tools

---

_Copy this template to new projects and customize as needed while maintaining core standards._
