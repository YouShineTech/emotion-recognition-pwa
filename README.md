# Emotion Recognition PWA

A Progressive Web App that provides real-time emotion recognition through webcam video and audio analysis. The system streams live media to a cloud backend for AI-powered facial and voice emotion detection, displaying emotion overlays on the live video feed.

## 🏗️ Architecture Overview

The application follows a modular architecture with 11 independent, swappable modules:

### Client-Side Modules

- **Media Capture Module**: Device media access and stream management
- **WebRTC Transport Module**: Real-time communication with backend
- **Overlay Renderer Module**: Client-side emotion overlay rendering
- **PWA Shell Module**: Progressive Web App features and lifecycle

### Server-Side Modules

- **Media Relay Module**: Scalable WebRTC media server using Mediasoup
- **Frame Extraction Module**: Video/audio frame processing with FFmpeg
- **Facial Analysis Module**: Emotion recognition using OpenFace
- **Audio Analysis Module**: Voice emotion analysis with AI models
- **Overlay Data Generator**: Combines analysis results into overlay metadata
- **Connection Manager Module**: Session lifecycle and health monitoring
- **Nginx Web Server Module**: Static asset serving and load balancing

## 📁 Root Directory Structure & Purpose

### **Core Configuration Files**

| File               | Purpose                                                                          |
| ------------------ | -------------------------------------------------------------------------------- |
| **`.env.example`** | Environment variable template showing all required configuration options         |
| **`.eslintrc.js`** | Global ESLint configuration for TypeScript code quality and style                |
| **`.prettierrc`**  | Code formatting rules ensuring consistent code style across the project          |
| **`.gitignore`**   | Specifies files and directories to exclude from version control                  |
| **`package.json`** | Root package configuration with scripts for development, testing, and deployment |
| **`typedoc.json`** | TypeDoc configuration for automatic API documentation generation                 |

### **Development Environment**

| Directory/File              | Purpose                                                                                             |
| --------------------------- | --------------------------------------------------------------------------------------------------- |
| **`client/`**               | **Frontend PWA application** - Browser-based client with WebRTC, emotion overlays, and PWA features |
| **`server/`**               | **Backend application** - Node.js server handling WebRTC, AI processing, and session management     |
| **`shared/`**               | **Shared interfaces and types** - Module contracts ensuring type safety between client and server   |
| **`docker-compose.yml`**    | **Development environment** - Containerized setup with Redis, Nginx, and application services       |
| **`.vscode/settings.json`** | **Cursor/VS Code configuration** - Optimized settings for TypeScript development and testing        |

### **Documentation & Specifications**

| Directory/File                     | Purpose                                                                                  |
| ---------------------------------- | ---------------------------------------------------------------------------------------- |
| **`docs/`**                        | **Comprehensive documentation** - Architecture, design, build guides, and specifications |
| **`docs/ARCHITECTURE.md`**         | **System architecture overview** - UML diagrams and module relationships                 |
| **`docs/BUILD_GUIDE.md`**          | **Step-by-step build instructions** - Development setup and deployment procedures        |
| **`docs/DEBUGGING_GUIDE.md`**      | **Troubleshooting guide** - Common issues and debugging techniques                       |
| **`docs/DESIGN_SPECIFICATION.md`** | **Detailed design documentation** - Usage scenarios and technical decisions              |
| **`docs/GITHUB_SETUP.md`**         | **GitHub configuration guide** - Repository setup and branch protection                  |
| **`docs/IMPLEMENTATION_PLAN.md`**  | **6-phase implementation roadmap** - Comprehensive development plan and task checklist   |

| **`docs/REQUIREMENTS_SPECIFICATION.md`** | **Functional requirements** - User stories and acceptance criteria |

### **Development Tools & Scripts**

| Directory/File                   | Purpose                                                                    |
| -------------------------------- | -------------------------------------------------------------------------- |
| **`scripts/`**                   | **Development utilities** - Helper scripts for debugging and monitoring    |
| **`scripts/debug-webrtc.js`**    | **WebRTC debugging tools** - Connection diagnostics and media analysis     |
| **`scripts/health-check.js`**    | **System health monitoring** - Service availability and performance checks |
| **`scripts/interactive-dev.js`** | **Interactive development tools** - CLI utilities for development workflow |
| **`scripts/module-monitor.js`**  | **Module performance monitoring** - Real-time metrics and logging          |

### **CI/CD & Quality Assurance**

| Directory/File                      | Purpose                                                                       |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| **`.github/`**                      | **GitHub Actions CI/CD** - Automated testing, building, and deployment        |
| **`.github/workflows/ci.yml`**      | **Continuous integration pipeline** - Linting, testing, and security scanning |
| **`.github/branch-protection.yml`** | **Branch protection rules** - Code review and merge requirements              |
| **`.husky/`**                       | **Git hooks** - Pre-commit and pre-push quality checks                        |
| **`.husky/pre-commit`**             | **Pre-commit hooks** - Linting and formatting validation                      |
| **`.husky/pre-push`**               | **Pre-push hooks** - Test execution before pushing to remote                  |

### **Environment Configuration**

| File                   | Purpose                                                                  |
| ---------------------- | ------------------------------------------------------------------------ |
| **`.env.development`** | **Development environment variables** - Local development configuration  |
| **`.env.staging`**     | **Staging environment variables** - Pre-production testing configuration |
| **`.env.production`**  | **Production environment variables** - Live deployment configuration     |

### **TypeScript & Build Configuration**

| Directory/File                 | Purpose                                                             |
| ------------------------------ | ------------------------------------------------------------------- |
| **`client/tsconfig.json`**     | **Client TypeScript configuration** - Frontend compilation settings |
| **`server/tsconfig.json`**     | **Server TypeScript configuration** - Backend compilation settings  |
| **`client/webpack.config.js`** | **Client build configuration** - Webpack bundling for PWA           |
| **`client/jest.config.js`**    | **Client testing configuration** - Jest setup for frontend tests    |
| **`server/jest.config.js`**    | **Server testing configuration** - Jest setup for backend tests     |
| **`client/.eslintrc.js`**      | **Client ESLint configuration** - Frontend-specific linting rules   |
| **`server/.eslintrc.js`**      | **Server ESLint configuration** - Backend-specific linting rules    |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- VS Code (recommended for debugging)

### 5-Minute Setup

```bash
# 1. Install dependencies
npm run install:all

# 2. Start development
npm run dev

# 3. Access application
# Client: http://localhost:3000
# Server: http://localhost:3001
```

### For Detailed Setup

See **[Developer Onboarding Guide](docs/DEVELOPER_ONBOARDING.md)** for comprehensive setup, debugging, and contribution instructions.

## 🧪 Comprehensive Testing Framework

### Automated Testing

```bash
# Unit tests
cd client && npm run test
cd server && npm run test

# Integration tests
cd server && npm run test:integration

# End-to-end tests
npm run test:e2e

# Coverage reports
npm run test:coverage
```

### Manual Testing & QA

The project includes a comprehensive manual testing framework with structured test cases, matrices, and traceability:

```bash
# View testing guidelines
open tests/templates/testing-guidelines.md

# Access test matrices
open tests/matrices/coverage-matrix.csv
open tests/matrices/requirements-traceability.csv

# Execute manual test cases
open tests/manual/system-tests/functional-tests.csv
```

#### Testing Organization

**Functional Test Areas:**

- **Media Capture** (`tests/functional/media-capture/`) - Camera/microphone access and device management
- **Real-time Streaming** (`tests/functional/real-time-streaming/`) - WebRTC connections and media streaming
- **Emotion Analysis** (`tests/functional/emotion-analysis/`) - Facial and audio emotion detection
- **Cross-Platform** (`tests/functional/cross-platform/`) - PWA compatibility across devices
- **Performance** (`tests/functional/performance/`) - Scalability and load testing
- **Security & Privacy** (`tests/functional/security-privacy/`) - Data protection and compliance
- **User Experience** (`tests/functional/user-experience/`) - End-to-end workflows

**Manual Test Types:**

- **System Tests** (`tests/manual/system-tests/`) - Functional, performance, and security validation
- **Integration Tests** (`tests/manual/integration-tests/`) - Module interaction testing
- **Boundary Tests** (`tests/manual/boundary-tests/`) - Edge cases and limit validation
- **Acceptance Tests** (`tests/manual/acceptance-tests/`) - User scenario validation

#### Test Coverage Metrics

| Coverage Type       | Requirements Covered | Test Cases | Coverage % |
| ------------------- | -------------------- | ---------- | ---------- |
| Functional Positive | 32/32                | 45         | 100%       |
| Functional Negative | 17/32                | 17         | 53%        |
| Boundary Value      | 12/32                | 19         | 38%        |
| Integration         | 12/32                | 13         | 38%        |
| Performance         | 10/32                | 13         | 31%        |
| Security            | 6/32                 | 16         | 19%        |
| User Acceptance     | 8/32                 | 5          | 25%        |

#### Testing Documentation

- **[Testing Guidelines](tests/templates/testing-guidelines.md)** - Execution procedures and quality standards
- **[Test Matrices](tests/matrices/)** - Coverage analysis and requirements traceability
- **[Test Templates](tests/templates/)** - Standardized test case formats and examples
- **[QA Documentation](tests/README.md)** - Complete testing framework overview

### Load Testing

```bash
# Small load test (100 users)
npm run test:load:small

# Medium load test (500 users)
npm run test:load:medium

# Stress test (1000+ users)
npm run test:stress
```

## 📦 Build and Deployment

### Development Build

```bash
# Build client
cd client && npm run build

# Build server
cd server && npm run build
```

### Production Deployment

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

## 🔧 Configuration

### Environment Variables

| Variable              | Description              | Default                   |
| --------------------- | ------------------------ | ------------------------- |
| `NODE_ENV`            | Environment mode         | `development`             |
| `PORT`                | Server port              | `3001`                    |
| `REDIS_URL`           | Redis connection URL     | `redis://localhost:6379`  |
| `MEDIASOUP_LISTEN_IP` | Mediasoup listen IP      | `0.0.0.0`                 |
| `OPENFACE_PATH`       | OpenFace executable path | `/usr/local/bin/OpenFace` |

### Module Configuration

Each module can be configured independently through their respective configuration interfaces. See the [API Documentation](#api-documentation) for details.

## 📚 Documentation

- **[Developer Onboarding Guide](docs/DEVELOPER_ONBOARDING.md)** - Setup, debugging, contributing
- **[Architecture](docs/ARCHITECTURE.md)** - System design and module relationships
- **[Implementation Plan](docs/IMPLEMENTATION_PLAN.md)** - Complete task checklist
- **[Build Guide](docs/BUILD_GUIDE.md)** - Detailed build instructions
- **[QA Testing Framework](tests/README.md)** - Comprehensive manual testing documentation

## 🏗️ Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - Feature development
- `hotfix/*` - Production hotfixes

### Code Quality

- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety
- Jest for unit testing
- 80%+ test coverage requirement

### CI/CD Pipeline

1. **Lint & Format Check** - Code quality validation
2. **Unit Tests** - Module-level testing
3. **Security Scan** - Vulnerability assessment
4. **Build** - Application compilation
5. **Integration Tests** - Inter-module testing
6. **Deploy** - Staging/Production deployment

## 🔒 Security

- HTTPS/WSS encryption for all communications
- WebRTC DTLS/SRTP for media encryption
- Input validation and sanitization
- Rate limiting and DDoS protection
- Dependency vulnerability scanning

## 📊 Performance

### Scalability Targets

- Support 1000+ concurrent connections
- Sub-500ms end-to-end latency
- 99.9% uptime availability
- Auto-scaling based on load

### Monitoring

- Prometheus metrics collection
- Grafana dashboards
- ELK stack for log aggregation
- Real-time performance alerts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the modular architecture principles
- Maintain 80%+ test coverage
- Use TypeScript for type safety
- Follow the established code style
- Update documentation for API changes

## 📚 Full Documentation

See **[docs/](docs/)** directory or **[Documentation Index](docs/README.md)** for complete documentation.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Ready to contribute?** Start with the **[Developer Onboarding Guide](docs/DEVELOPER_ONBOARDING.md)**
