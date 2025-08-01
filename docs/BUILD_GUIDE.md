# Build Environment Setup Guide

## Prerequisites

### Required Software

- **Node.js 18+** - [Download](https://nodejs.org/)
- **Docker & Docker Compose** - [Download](https://docs.docker.com/get-docker/)
- **Git** - [Download](https://git-scm.com/)
- **VS Code** (recommended) - [Download](https://code.visualstudio.com/)

### Optional (for advanced features)

- **Python 3.8+** - For audio analysis modules
- **OpenFace 2.0** - For facial analysis (Linux/macOS)

## Quick Start (5 minutes)

```bash
# 1. Clone and setup
git clone <repository-url>
cd emotion-recognition-pwa
npm run setup

# 2. Start development environment
npm run dev

# 3. Access application
# Client: http://localhost:3000
# Server: http://localhost:3001
# API Docs: http://localhost:3001/api/docs
```

## Detailed Setup

### 1. Environment Configuration

```bash
# Copy environment template
cp .env.example .env.development

# Edit configuration (required)
nano .env.development
```

**Required Environment Variables:**

```bash
NODE_ENV=development
PORT=3001
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://localhost:3000
```

### 2. Install Dependencies

```bash
# Install all dependencies (client + server)
npm run install:all

# Or install individually
cd client && npm install
cd ../server && npm install
```

### 3. Build Applications

```bash
# Development build (with source maps)
npm run build:dev

# Production build (optimized)
npm run build:prod

# Watch mode (rebuilds on changes)
npm run build:watch
```

### 4. Start Development Servers

#### Option A: Docker Compose (Production)

```bash
# Build and start all services
docker-compose build
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Note:** Current Docker setup is configured for development with volume mounts and hot reloading. Production Dockerfiles are available in the respective directories.

#### Option B: Manual Start

```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start Server
cd server && npm run dev

# Terminal 3: Start Client
cd client && npm run dev
```

## Testing Guide

### Unit Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific module tests
npm run test:module
```

### Integration Testing

```bash
# Run integration tests
npm run test:integration

# Run with debugging
npm run test:integration:debug
```

### End-to-End Testing

```bash
# Run E2E tests
npm run test:e2e

# Run E2E with browser visible
npm run test:e2e:headed
```

## Debugging Guide

### VS Code Debugging Setup

1. **Install Extensions:**
   - TypeScript Importer
   - Jest Runner
   - Docker
   - REST Client

2. **Debug with npm scripts**:

```bash
# Debug server with breakpoints
npm run dev:server:debug

# Debug client in browser
npm run dev:client:debug

# Debug specific modules
npm run debug:modules
npm run debug:webrtc
```

### Dynamic Testing & Module Communication

#### 1. Module Communication Inspector

```bash
# Start with module tracing
npm run dev:trace

# View module communication in real-time
npm run monitor:modules
```

#### 2. API Testing

```bash
# Test WebRTC connectivity
npm run test:webrtc

# Debug WebRTC signaling
npm run debug:webrtc
```

#### 3. Module Testing

```bash
# Test specific module dependencies
npm run test:dependencies

# Test module imports
npm run test:imports

# Fix import issues automatically
npm run test:imports:fix
```

## Build Verification

### Health Checks

```bash
# Verify all services are running
npm run health:check

# Monitor module performance
npm run monitor:perf
```

### Performance Testing

```bash
# Load test with 10 concurrent users
npm run test:load:small

# Load test with 100 concurrent users
npm run test:load:medium

# Stress test (find breaking point)
npm run test:stress
```

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Kill processes on ports
npm run kill:ports

# Or manually
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

#### Docker Issues

```bash
# Reset Docker environment
docker-compose down -v
docker system prune -f
npm run docker:reset
```

#### Module Not Found Errors

```bash
# Clear node_modules and reinstall
npm run clean:install
```

#### TypeScript Compilation Errors

```bash
# Check TypeScript configuration
npm run test:type

# Fix common issues
npm run lint:fix
```

### Debug Logs

```bash
# Enable debug logging
export DEBUG=emotion-pwa:*
npm run dev

# View specific module logs
export DEBUG=emotion-pwa:media-capture
npm run dev
```

## Build Scripts Reference

### Key Package.json Scripts

#### Setup & Development

- `npm run setup` - Complete environment setup
- `npm run dev` - Start development servers with monitoring
- `npm run dev:trace` - Development with debug logging
- `npm run dev:docker` - Start with Docker services

#### Building

- `npm run build:dev` - Development build with source maps
- `npm run build:prod` - Production optimized build
- `npm run build:watch` - Watch mode for development

#### Testing

- `npm test` - Run all tests (lint, type, imports, unit)
- `npm run test:coverage` - Run tests with coverage reports
- `npm run test:integration` - Integration tests
- `npm run test:e2e` - End-to-end tests with Cypress

#### Utilities

- `npm run health:check` - Verify system health
- `npm run clean:install` - Clean reinstall dependencies
- `npm run kill:ports` - Free up development ports
- `npm run reset` - Complete environment reset

#### AI Development Tools

- `npm run taskmaster:start` - Start Taskmaster AI server
- `npm run taskmaster:dev` - Taskmaster with debug logging

## IDE Configuration

### VS Code Setup (Optional)

Create `.vscode/settings.json` for optimal development experience:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/coverage": true
  }
}
```

### Recommended Extensions

Install these VS Code extensions for better development experience:

- TypeScript Importer
- Prettier - Code formatter
- ESLint
- Docker
- Jest Runner

## Continuous Integration

### Local CI Simulation

```bash
# Run full CI pipeline locally
npm run ci:local

# Run specific CI stages
npm run ci:lint
npm run ci:test
npm run ci:build
npm run ci:deploy:staging
```

### Pre-commit Hooks

```bash
# Install pre-commit hooks
npm run hooks:install

# Test pre-commit hooks
npm run hooks:test
```

## Performance Monitoring

### Development Metrics

```bash
# Monitor build performance
npm run build:analyze

# Monitor runtime performance
npm run perf:monitor

# Generate performance report
npm run perf:report
```

---

## Quick Reference Commands

| Command                 | Description                |
| ----------------------- | -------------------------- |
| `npm run setup`         | Complete environment setup |
| `npm run dev`           | Start development servers  |
| `npm test`              | Run all tests              |
| `npm run build:dev`     | Development build          |
| `npm run health:check`  | Verify system health       |
| `npm run clean:install` | Clean reinstall            |
| `npm run ci:local`      | Run CI pipeline locally    |

For more detailed information, see:

- **Architecture**: `docs/ARCHITECTURE.md`
- **Developer Onboarding**: `docs/DEVELOPER_ONBOARDING.md`
- **Design Specifications**: `docs/DESIGN_SPECIFICATION.md`
