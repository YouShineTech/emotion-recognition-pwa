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

| Directory/File                           | Purpose                                                                                  |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| **`docs/`**                              | **Comprehensive documentation** - Architecture, design, build guides, and specifications |
| **`docs/ARCHITECTURE.md`**               | **System architecture overview** - UML diagrams and module relationships                 |
| **`docs/BUILD_GUIDE.md`**                | **Step-by-step build instructions** - Development setup and deployment procedures        |
| **`docs/DEBUGGING_GUIDE.md`**            | **Troubleshooting guide** - Common issues and debugging techniques                       |
| **`docs/DESIGN_SPECIFICATION.md`**       | **Detailed design documentation** - Usage scenarios and technical decisions              |
| **`docs/GITHUB_SETUP.md`**               | **GitHub configuration guide** - Repository setup and branch protection                  |
| **`docs/IMPLEMENTATION_PLAN.md`**        | **9-task implementation roadmap** - Module-by-module development plan                    |
| **`docs/NODE_COMPATIBILITY.md`**         | **Node.js version requirements** - Compatibility matrix and upgrade paths                |
| **`docs/REQUIREMENTS_SPECIFICATION.md`** | **Functional requirements** - User stories and acceptance criteria                       |

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
- Python 3.8+ (for audio analysis)
- OpenFace 2.0 toolkit

### Development Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd emotion-recognition-pwa
   ```

2. **Install dependencies**

   ```bash
   # Client dependencies
   cd client && npm install

   # Server dependencies
   cd ../server && npm install
   ```

3. **Configure environment**

   ```bash
   cp .env.example .env.development
   # Edit .env.development with your configuration
   ```

4. **Start development environment**

   ```bash
   docker-compose up -d
   ```

5. **Access the application**
   - Client: http://localhost:3000
   - Server API: http://localhost:3001
   - Redis: localhost:6379

## 🧪 Testing

### Unit Tests

```bash
# Client tests
cd client && npm run test

# Server tests
cd server && npm run test

# Coverage reports
npm run test:coverage
```

### Integration Tests

```bash
# Run integration tests
cd server && npm run test:integration
```

### End-to-End Tests

```bash
# Run E2E tests
npm run test:e2e
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

## 📚 API Documentation

### Inter-Module Communication

All modules communicate through versioned contracts defined in `shared/interfaces/`. Key interfaces include:

- `MediaCaptureModule`: Device media access
- `WebRTCTransportModule`: Real-time communication
- `FacialAnalysisModule`: Facial emotion recognition
- `AudioAnalysisModule`: Voice emotion analysis

### REST API Endpoints

- `GET /api/health` - Health check
- `POST /api/sessions` - Create emotion recognition session
- `GET /api/sessions/:id` - Get session status
- `DELETE /api/sessions/:id` - End session

### WebSocket Events

- `connection` - Client connection established
- `offer` - WebRTC offer exchange
- `answer` - WebRTC answer exchange
- `ice-candidate` - ICE candidate exchange
- `overlay-data` - Emotion overlay metadata

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

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- Documentation: [Wiki](wiki-url)
- Issues: [GitHub Issues](issues-url)
- Discussions: [GitHub Discussions](discussions-url)

## 🗺️ Roadmap

- [x] Foundation Framework Implementation
- [ ] Proof of Concept Validation
- [ ] Core Module Development
- [ ] Integration Testing
- [ ] Production Deployment
- [ ] Performance Optimization
- [ ] Advanced Features (Multi-language support, Custom models)

---

Built with ❤️ by YouShine Tech
