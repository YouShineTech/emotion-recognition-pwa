#!/usr/bin/env node

/**
 * Project Template Generator
 *
 * This script creates a new project with all the standard configurations
 * and best practices from our coding standards.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

const projectName = process.argv[2];

if (!projectName) {
  console.error(chalk.red('❌ Please provide a project name'));
  console.log(chalk.yellow('Usage: node scripts/create-project-template.js <project-name>'));
  process.exit(1);
}

const projectPath = path.join(process.cwd(), '..', projectName);

console.log(chalk.blue(`🚀 Creating new project: ${projectName}`));

try {
  // Create project directory
  if (fs.existsSync(projectPath)) {
    console.error(chalk.red(`❌ Directory ${projectName} already exists`));
    process.exit(1);
  }

  fs.mkdirSync(projectPath);
  process.chdir(projectPath);

  // Initialize git
  console.log(chalk.yellow('📦 Initializing git repository...'));
  execSync('git init', { stdio: 'inherit' });

  // Create directory structure
  console.log(chalk.yellow('📁 Creating directory structure...'));
  const directories = [
    'src',
    'tests/unit',
    'tests/integration',
    'docs',
    'scripts',
    '.github/workflows',
    'config',
    'reports/security',
  ];

  directories.forEach(dir => {
    fs.mkdirSync(dir, { recursive: true });
  });

  // Initialize package.json
  console.log(chalk.yellow('📄 Creating package.json...'));
  const packageJson = {
    name: projectName,
    version: '1.0.0',
    description: `${projectName} - Created with YouShine Tech standards`,
    main: 'dist/index.js',
    scripts: {
      dev: 'ts-node src/index.ts',
      build: 'tsc',
      'build:watch': 'tsc --watch',
      start: 'node dist/index.js',
      test: 'jest',
      'test:watch': 'jest --watch',
      'test:coverage': 'jest --coverage',
      lint: 'eslint src/**/*.ts',
      'lint:fix': 'eslint src/**/*.ts --fix',
      format: 'prettier --write "**/*.{js,ts,json,md}"',
      'format:check': 'prettier --check "**/*.{js,ts,json,md}"',
      'format:staged':
        'git diff --cached --name-only --diff-filter=ACM | grep -E "\\.(js|ts|json|md)$" | xargs -r npx prettier --write',
      'type-check': 'tsc --noEmit',
      clean: 'rm -rf dist coverage',
      'security:setup': 'node scripts/setup-security-tools.js',
      'security:scan': 'node scripts/security-scan.js',
      'security:fix': 'node scripts/security-fix.js',
      'security:report': 'node scripts/security-report.js',
      'hooks:install': 'husky install',
      'hooks:test': 'npm run lint && npm run type-check && npm run test',
    },
    keywords: [projectName, 'typescript', 'nodejs'],
    author: 'YouShine Tech',
    license: 'MIT',
    engines: {
      node: '>=20.0.0',
      npm: '>=8.0.0',
    },
  };

  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

  // Install dependencies
  console.log(chalk.yellow('📦 Installing dependencies...'));
  const devDependencies = [
    '@typescript-eslint/eslint-plugin@^8.37.0',
    '@typescript-eslint/parser@^8.37.0',
    'eslint@^8.57.0',
    'eslint-config-prettier@^10.1.8',
    'eslint-plugin-prettier@^5.5.3',
    'prettier@^3.6.2',
    'husky@^8.0.3',
    'typescript@^5.0.0',
    'jest@^29.0.0',
    '@types/jest@^29.0.0',
    'ts-jest@^29.0.0',
    '@types/node@^20.0.0',
    'ts-node@^10.0.0',
    'concurrently@^8.2.2',
    'chalk@^4.1.2',
  ];

  execSync(`npm install -D ${devDependencies.join(' ')}`, { stdio: 'inherit' });

  // Copy configuration files from current project
  console.log(chalk.yellow('⚙️  Creating configuration files...'));

  const configFiles = [
    '.eslintrc.js',
    '.prettierrc',
    'tsconfig.json',
    'jest.config.js',
    '.securityrc.json',
  ];

  const currentProjectPath = path.join(__dirname, '..');

  configFiles.forEach(file => {
    const sourcePath = path.join(currentProjectPath, file);
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, file);
    }
  });

  // Copy security scripts
  console.log(chalk.yellow('🔒 Setting up security tools...'));
  const securityScripts = [
    'security-scan.js',
    'security-fix.js',
    'security-report.js',
    'setup-security-tools.js',
  ];

  securityScripts.forEach(script => {
    const sourcePath = path.join(currentProjectPath, 'scripts', script);
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, path.join('scripts', script));
      fs.chmodSync(path.join('scripts', script), '755');
    }
  });

  // Create basic source files
  console.log(chalk.yellow('📝 Creating initial source files...'));

  // src/index.ts
  fs.writeFileSync(
    'src/index.ts',
    `/**
 * ${projectName}
 *
 * Main application entry point
 */

console.log('Hello from ${projectName}!');

export default function main(): void {
  console.log('Application started successfully');
}

if (require.main === module) {
  main();
}
`
  );

  // Basic test
  fs.writeFileSync(
    'tests/unit/index.test.ts',
    `import main from '../../src/index';

describe('${projectName}', () => {
  it('should run main function without errors', () => {
    expect(() => main()).not.toThrow();
  });
});
`
  );

  // Create documentation
  console.log(chalk.yellow('📚 Creating documentation...'));

  // README.md
  fs.writeFileSync(
    'README.md',
    `# ${projectName}

Brief description of what this project does.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm 8+

### Installation
\`\`\`bash
git clone <repository-url>
cd ${projectName}
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

This project includes automated security scanning. Run \`npm run security:scan\` to check for vulnerabilities.

## 🤝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.
`
  );

  // Copy documentation from current project
  const docFiles = ['CODING_STANDARDS.md', 'SECURITY.md'];
  docFiles.forEach(doc => {
    const sourcePath = path.join(currentProjectPath, 'docs', doc);
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, path.join('docs', doc));
    }
  });

  // Create .gitignore
  fs.writeFileSync(
    '.gitignore',
    `# Dependencies
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
`
  );

  // Create .env.example
  fs.writeFileSync(
    '.env.example',
    `# Application Configuration
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# Add your environment variables here
`
  );

  // Set up git hooks
  console.log(chalk.yellow('🪝 Setting up git hooks...'));
  execSync('npm run hooks:install', { stdio: 'inherit' });

  // Create pre-commit hook
  fs.writeFileSync(
    '.husky/pre-commit',
    `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔒 Running pre-commit checks..."
npm run format:staged
git add -u
npm run hooks:test
npm run security:scan
`
  );

  // Create pre-push hook
  fs.writeFileSync(
    '.husky/pre-push',
    `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🚀 Running pre-push checks..."
npm run test
npm audit --audit-level=high
`
  );

  fs.chmodSync('.husky/pre-commit', '755');
  fs.chmodSync('.husky/pre-push', '755');

  // Create GitHub Actions workflow
  console.log(chalk.yellow('🔄 Creating CI/CD workflow...'));
  fs.writeFileSync(
    '.github/workflows/ci-cd.yml',
    `name: CI/CD Pipeline

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
          node-version: \${{ env.NODE_VERSION }}
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
          node-version: \${{ env.NODE_VERSION }}
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
          node-version: \${{ env.NODE_VERSION }}
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
          node-version: \${{ env.NODE_VERSION }}
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
`
  );

  // Initial git commit
  console.log(chalk.yellow('📝 Creating initial commit...'));
  execSync('git add .', { stdio: 'inherit' });
  execSync(
    'git commit -m "feat: initial project setup with YouShine Tech standards\n\n- TypeScript configuration\n- ESLint and Prettier setup\n- Jest testing framework\n- Security scanning tools\n- Pre-commit and pre-push hooks\n- CI/CD pipeline\n- Documentation templates"',
    { stdio: 'inherit' }
  );

  console.log(chalk.green(`\n✅ Project ${projectName} created successfully!`));
  console.log(chalk.blue('\n🚀 Next steps:'));
  console.log(chalk.yellow(`  cd ${projectName}`));
  console.log(chalk.yellow('  npm run security:setup'));
  console.log(chalk.yellow('  npm run dev'));
  console.log(chalk.blue('\n📚 Documentation:'));
  console.log(chalk.yellow('  docs/CODING_STANDARDS.md - Coding standards'));
  console.log(chalk.yellow('  docs/SECURITY.md - Security guidelines'));
  console.log(chalk.yellow('  README.md - Project overview'));
} catch (error) {
  console.error(chalk.red('❌ Error creating project:'), error.message);
  process.exit(1);
}
