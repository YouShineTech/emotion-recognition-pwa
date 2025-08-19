# Coding Standards & Best Practices

This document outlines the coding standards and best practices to be followed across all projects.

## 🏗️ Project Structure

### Standard Directory Layout

```
project-root/
├── src/                    # Source code
├── tests/                  # Test files
├── docs/                   # Documentation
├── scripts/                # Build/utility scripts
├── .github/workflows/      # CI/CD workflows
├── .husky/                 # Git hooks
├── reports/                # Generated reports
└── config/                 # Configuration files
```

### File Naming Conventions

- **Files**: `kebab-case.extension` (e.g., `user-service.ts`)
- **Directories**: `kebab-case` (e.g., `user-management/`)
- **Classes**: `PascalCase` (e.g., `UserService`)
- **Functions/Variables**: `camelCase` (e.g., `getUserData`)
- **Constants**: `SCREAMING_SNAKE_CASE` (e.g., `MAX_RETRY_COUNT`)
- **Interfaces**: `PascalCase` with `I` prefix (e.g., `IUserData`)

### Import Path Standards (TypeScript/JavaScript)

Use standardized `@` path alias that resolves to the workspace root for consistent imports:

**Configuration Requirements**:

- **Client Configuration**: `@/*` resolves to `../` (workspace root from client perspective)
- **Server Configuration**: `@/*` resolves to `../` (workspace root from server perspective)
- **Build Tools**: Configure TypeScript, Webpack, and Jest to recognize `@` alias

**Import Pattern**:

```typescript
// ✅ Correct - Use @ alias for all imports
import { MediaCaptureModule } from '@/shared/interfaces/media-capture-interface';
import { EmotionScore } from '@/shared/interfaces/common-interface';

// ❌ Incorrect - Avoid relative paths
import { MediaCaptureModule } from '../../../shared/interfaces/media-capture-interface';
import { EmotionScore } from '../../shared/interfaces/common-interface';
```

**Benefits**:

- Location independence - modules can be moved without changing imports
- Consistent import patterns regardless of nesting depth
- Refactoring safety - directory restructuring doesn't break imports
- Improved developer experience with predictable paths

## 🔒 Security Standards

### Pre-commit Security Requirements

1. **Vulnerability Scanning** - All dependencies scanned for HIGH/CRITICAL vulnerabilities
2. **Secret Detection** - No API keys, passwords, or tokens in commits
3. **Dependency Auditing** - NPM/Yarn audit must pass
4. **Security Linting** - Security-focused ESLint rules enabled

### Environment Management

- **Never commit secrets** - Use `.env` files with `.env.example` templates
- **Environment validation** - Validate required environment variables on startup
- **Secure defaults** - Fail securely when configuration is missing
- **Rotation strategy** - Document secret rotation procedures

### Security Configuration Files

- `.securityrc.json` - Security tool configuration
- `.trivyignore` - Documented vulnerability exceptions
- `docs/SECURITY.md` - Security procedures and contacts

## 🧪 Testing Standards

### Test Structure

```
tests/
├── unit/           # Unit tests (fast, isolated)
├── integration/    # Integration tests (services)
├── e2e/           # End-to-end tests (full system)
├── load/          # Performance/load tests
└── fixtures/      # Test data and mocks
```

### POC and Module Testing Requirements

#### POC Testing

- **Boundary Testing**: Test edge cases, limits, and invalid inputs
- **Equivalence Testing**: Test representative values from each equivalence class
- **Module Validation**: Verify the module works as designed in isolation

#### Full System Testing

- **Module Integration Tests**: Test how modules work together in the full system
- **Integration Validation**: Verify module interactions and data flow
- **System Boundary Tests**: Test system-level edge cases and limits

#### Test Coverage Strategy

```typescript
// Example boundary and equivalence testing
describe('ModuleService', () => {
  describe('Boundary Tests', () => {
    it('should handle minimum valid input', () => {
      /* test */
    });
    it('should handle maximum valid input', () => {
      /* test */
    });
    it('should reject input below minimum', () => {
      /* test */
    });
    it('should reject input above maximum', () => {
      /* test */
    });
  });

  describe('Equivalence Tests', () => {
    it('should handle typical valid inputs', () => {
      /* test */
    });
    it('should handle edge valid inputs', () => {
      /* test */
    });
    it('should handle typical invalid inputs', () => {
      /* test */
    });
  });
});

// Example integration testing for full system
describe('Module Integration', () => {
  it('should integrate ModuleA with ModuleB correctly', () => {
    /* test */
  });
  it('should handle data flow between modules', () => {
    /* test */
  });
  it('should maintain consistency across module boundaries', () => {
    /* test */
  });
});
```

### Test Naming

- **Test files**: `*.test.ts` or `*.spec.ts`
- **Test descriptions**: Clear, behavior-focused descriptions
- **Test organization**: Group related tests with `describe` blocks

## 📝 Code Quality Standards

### Linting & Formatting

- **ESLint** - Enforce code quality rules
- **Prettier** - Consistent code formatting
- **TypeScript** - Strict type checking enabled
- **Auto-formatting** - Format on save and pre-commit

### Code Style Rules

- **Line length**: Maximum 100 characters
- **Indentation**: 2 spaces (no tabs)
- **Semicolons**: Always required
- **Quotes**: Single quotes for strings, double for JSX
- **Trailing commas**: Always in multiline structures

### Documentation Requirements

- **JSDoc comments** for all public functions/classes
- **README.md** with setup, usage, and contribution guidelines
- **CHANGELOG.md** for version history
- **API documentation** for all endpoints

## 🚀 Git Workflow Standards

### Branch Naming

- **Feature branches**: `feature/description` (e.g., `feature/user-authentication`)
- **Bug fixes**: `fix/description` (e.g., `fix/login-validation`)
- **Hotfixes**: `hotfix/description` (e.g., `hotfix/security-patch`)
- **Releases**: `release/version` (e.g., `release/1.2.0`)

### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples**:

- `feat(auth): add JWT token validation`
- `fix(api): resolve user data serialization issue`
- `docs(readme): update installation instructions`

### Pre-commit Hooks (Required)

1. **Code formatting** - Auto-format staged files
2. **Linting** - ESLint validation
3. **Type checking** - TypeScript compilation
4. **Security scanning** - Vulnerability and secret detection
5. **Tests** - Run affected unit tests

### Pre-push Hooks (Required)

1. **Full test suite** - All unit and integration tests
2. **Security audit** - Dependency vulnerability check
3. **Build validation** - Ensure project builds successfully

## 🏛️ Architecture Standards

### Design Principles

#### SOLID Principles

- **Single Responsibility** - Each module/class has one reason to change
- **Open/Closed** - Open for extension, closed for modification
- **Liskov Substitution** - Objects should be replaceable with instances of their subtypes
- **Interface Segregation** - Clients should not depend on interfaces they don't use
- **Dependency Inversion** - Depend on abstractions, not concretions

#### Additional Principles

- **DRY (Don't Repeat Yourself)** - Eliminate code duplication
- **KISS (Keep It Simple, Stupid)** - Prefer simple solutions

### Module Structure

#### POC-to-Module Development

- **POC First**: Every new module must start as a POC to validate the approach
- **Shared Implementation**: The POC evolves into the actual module that both POC and production use
- **POC Persistence**: POCs remain as living examples and independent module validation
- **Single Source**: Both POC and full system import from the same module implementation
- **Continuous Validation**: POCs serve as ongoing test cases for module changes
- **Dynamic Debugging**: Both POCs and full system must include runtime debugging capabilities
- **Comprehensive Testing**: POCs test boundary/equivalence cases; full system tests module integration
- **Risk Mitigation**: Technical risks are identified and resolved in POC phase
- **Iterative Refinement**: Modules evolve through POC feedback and real-world usage

#### Standard Module Structure

```typescript
// Standard module structure with @ imports and debugging
import { BaseConfig } from '@/shared/interfaces/common-interface';
import { Logger } from '@/shared/utils/logger';
import { Debugger } from '@/shared/utils/debugger';

export interface IModuleConfig extends BaseConfig {
  // Configuration interface
  debugMode?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export interface IModuleService {
  // Service interface
  enableDebug(enabled: boolean): void;
  getDebugInfo(): object;
}

export class ModuleService implements IModuleService {
  private debugger: Debugger;

  constructor(config: IModuleConfig) {
    this.debugger = new Debugger(config.debugMode);
  }

  enableDebug(enabled: boolean): void {
    this.debugger.setEnabled(enabled);
  }

  getDebugInfo(): object {
    return this.debugger.getState();
  }

  // Implementation with debug points
}

export default ModuleService;
```

#### POC Structure

```
poc-{module-name}/
├── src/
│   └── index.ts          # POC implementation using the shared module
├── tests/
│   └── poc.test.ts       # POC-specific tests
├── README.md             # POC documentation and findings
└── package.json          # POC dependencies
```

### Error Handling

- **Consistent error types** - Use custom error classes
- **Proper error propagation** - Don't swallow errors
- **Logging standards** - Structured logging with levels
- **Graceful degradation** - Handle failures gracefully

## 📊 Performance Standards

### Performance Best Practices

- **Bundle optimization** - Monitor and optimize bundle sizes
- **Memory management** - Prevent memory leaks in long-running processes
- **Query optimization** - Avoid N+1 queries and optimize database access
- **Lazy loading** - Load resources only when needed

### Monitoring Implementation

- **Health checks** - Implement standardized health check endpoints
- **Structured logging** - Use consistent logging formats and levels
- **Error tracking** - Implement centralized error reporting
- **Metrics collection** - Include performance monitoring in code

## 🔧 Development Environment

### Required Tools

- **Node.js** - LTS version
- **Package manager** - npm or yarn (consistent across team)
- **IDE/Editor** - VSCode with recommended extensions
- **Git** - Latest stable version

### VSCode Extensions (Recommended)

- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- GitLens
- Thunder Client (API testing)

### Environment Setup

- **EditorConfig** - Consistent editor settings
- **VSCode settings** - Shared workspace settings
- **Development scripts** - Standardized npm scripts
- **Docker support** - Containerized development environment

## 📋 Code Review Standards

### Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] Security considerations addressed
- [ ] Performance impact considered
- [ ] Error handling implemented
- [ ] No hardcoded values or secrets

### Review Process

1. **Self-review** - Review your own PR first
2. **Automated checks** - Ensure CI/CD passes
3. **Peer review** - At least one team member approval
4. **Security review** - For security-sensitive changes

## 🚀 CI/CD Standards

### Pipeline Standards

1. **Lint & Format** - Code quality validation
2. **Security Scan** - Vulnerability and secret detection
3. **Test** - Automated test execution
4. **Build** - Compile and bundle application
5. **Deploy** - Automated deployment process

### Environment Standards

- **Environment parity** - Keep development, staging, and production similar
- **Configuration management** - Use environment variables for configuration
- **Deployment automation** - Standardize deployment processes

## 📚 Documentation Standards

### Required Documentation

- **README.md** - Project overview and setup
- **CONTRIBUTING.md** - Contribution guidelines
- **CHANGELOG.md** - Version history
- **API.md** - API documentation
- **ARCHITECTURE.md** - System design
- **SECURITY.md** - Security procedures

### Documentation Guidelines

- **Keep it current** - Update docs with code changes
- **Clear examples** - Include code examples
- **Troubleshooting** - Common issues and solutions
- **Getting started** - Step-by-step setup guide

## 🔄 Maintenance Standards

### Code Maintenance Practices

- **Dependency management** - Keep dependencies updated and secure
- **Code refactoring** - Regular cleanup and improvement
- **Documentation updates** - Keep documentation current with code changes
- **Technical debt management** - Address technical debt systematically

### Monitoring Implementation Standards

- **Structured logging** - Use consistent log formats and levels
- **Error handling** - Implement proper error tracking and reporting
- **Performance instrumentation** - Add performance monitoring to critical paths
- **Security monitoring** - Implement security event logging

---

_This document should be reviewed and updated regularly to reflect evolving best practices and team needs._
