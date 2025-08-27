# Technology Stack & Build System

## Core Technologies

### Frontend

- **TypeScript**: Strict typing with ES2020 target
- **Webpack**: Module bundling with dev server and HMR
- **PWA**: Service workers, manifest, offline support
- **WebRTC**: Real-time media streaming and data channels

### Backend

- **Node.js 18+**: Server runtime with cluster support
- **TypeScript**: CommonJS modules with strict typing
- **Mediasoup**: Scalable WebRTC SFU for 1000+ users
- **Socket.io**: WebSocket communication with Redis adapter
- **Express**: HTTP server with CORS and security middleware

### Infrastructure

- **Redis**: Session management and pub/sub for scaling
- **Nginx**: Load balancing, SSL termination, static assets
- **Docker**: Containerized development and deployment
- **Prometheus/Grafana**: Monitoring and metrics

### AI/ML

- **OpenFace**: Facial landmark detection and emotion analysis
- **Python**: Audio emotion analysis models
- **FFmpeg**: Media processing and frame extraction

## Build System

### Package Management

```bash
# Install all dependencies (client + server + shared)
npm run install:all

# Install individually
cd client && npm install
cd server && npm install
```

### Development

```bash
# Start full development environment
npm run dev

# Start with debugging
npm run dev:debug

# Start with Docker services
npm run dev:docker
```

### Building

```bash
# Development build (with source maps)
npm run build:dev

# Production build (optimized)
npm run build:prod

# Watch mode (rebuilds on changes)
npm run build:watch
```

### Testing

```bash
# Run all tests (lint, type, unit, imports)
npm test

# Run with coverage
npm run test:coverage

# Integration tests
npm run test:integration

# E2E tests with Cypress
npm run test:e2e
```

### Quality Assurance

```bash
# Lint and format
npm run lint
npm run format

# Type checking
npm run test:type

# Security scanning
npm run security:scan

# Performance testing
npm run test:load:small
npm run test:stress
```

## Import Path Configuration

Use `@/*` alias for all imports to maintain location independence:

```typescript
// ✅ Correct - Use @ alias
import { MediaCaptureModule } from '@/shared/interfaces/media-capture.interface';
import { EmotionScore } from '@/shared/interfaces/common.interface';

// ❌ Avoid relative paths
import { MediaCaptureModule } from '../../../shared/interfaces/media-capture.interface';
```

## Environment Setup

### Required Tools

- Node.js 18+
- Docker & Docker Compose
- Git
- VS Code (recommended)

### Configuration Files

- `.env.development` - Local development settings
- `.env.staging` - Staging environment
- `.env.production` - Production deployment
- `docker-compose.yml` - Multi-service development

### TypeScript Configuration

- **Client**: ES2020 target, ESNext modules, React JSX
- **Server**: ES2020 target, CommonJS modules
- **Shared**: Strict typing with path aliases

## Development Workflow

### Git Hooks (Husky)

- **Pre-commit**: Lint, format, type check, security scan
- **Pre-push**: Full test suite, build validation

### CI/CD Pipeline

1. Code quality (ESLint, Prettier, TypeScript)
2. Security scanning (Trivy, dependency audit)
3. Testing (unit, integration, E2E)
4. Building (client/server bundles)
5. Deployment (staging/production)

## Performance Optimization

### Bundle Optimization

- Tree-shaking enabled
- Code splitting for vendor/interface chunks
- Source maps in development only

### Runtime Performance

- WebRTC connection pooling
- Redis session clustering
- Nginx load balancing across 4 server instances
- Memory limits (512MB per instance)
- CPU throttling (1 core per instance)
