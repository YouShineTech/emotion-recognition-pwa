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

2. **Launch Configurations** (`.vscode/launch.json`):

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/server/src/index.ts",
      "outFiles": ["${workspaceFolder}/server/dist/**/*.js"],
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "restart": true,
      "protocol": "inspector"
    },
    {
      "name": "Debug Client",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/client/src",
      "sourceMapPathOverrides": {
        "webpack:///src/*": "${webRoot}/*"
      }
    },
    {
      "name": "Debug Jest Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
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
# Test server endpoints
npm run test:api

# Interactive API testing
npm run test:api:interactive
```

#### 3. WebRTC Connection Testing

```bash
# Test WebRTC connectivity
npm run test:webrtc

# Debug WebRTC signaling
npm run debug:webrtc
```

## Build Verification

### Health Checks

```bash
# Verify all services are running
npm run health:check

# Detailed system status
npm run status:full
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

### Package.json Scripts

```json
{
  "scripts": {
    "setup": "npm run setup:basic",
    "setup:basic": "npm run install:all && npm run build:dev && npm run health:check:basic",
    "install:all": "npm install && cd client && npm install && cd ../server && npm install",
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\" \"npm run dev:monitor\"",
    "dev:server": "cd server && npm run dev",
    "dev:client": "cd client && npm run dev",
    "dev:monitor": "node scripts/module-monitor.js",
    "dev:trace": "DEBUG=emotion-pwa:* npm run dev",
    "build:dev": "npm run build:client:dev && npm run build:server:dev",
    "build:prod": "npm run build:client:prod && npm run build:server:prod",
    "build:watch": "concurrently \"npm run build:client:watch\" \"npm run build:server:watch\"",
    "test": "npm run test:lint && npm run test:type && npm run test:imports && npm run test:unit",
    "test:unit": "npm run test:client && npm run test:server",
    "test:client": "cd client && npm test",
    "test:server": "cd server && npm test",
    "test:coverage": "npm run test:client:coverage && npm run test:server:coverage",
    "test:watch": "concurrently \"npm run test:client:watch\" \"npm run test:server:watch\"",
    "test:integration": "cd server && npm run test:integration",
    "test:e2e": "npm run test:e2e:setup && cypress run",
    "health:check": "node scripts/health-check.js",
    "health:check:basic": "node scripts/health-check.js --basic",
    "monitor:modules": "node scripts/module-monitor.js",
    "clean": "npm run clean:client && npm run clean:server && npm run clean:root",
    "clean:install": "npm run clean && npm run install:all"
  }
}
```

## IDE Configuration

### VS Code Settings (`.vscode/settings.json`)

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "jest.autoRun": "watch",
  "jest.showCoverageOnLoad": true,
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/coverage": true
  }
}
```

### Recommended Extensions

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-jest",
    "ms-azuretools.vscode-docker",
    "humao.rest-client",
    "esbenp.prettier-vscode"
  ]
}
```

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

For more detailed information, see individual module documentation in `/docs/modules/`.
