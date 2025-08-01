# Developer Onboarding Guide - Emotion Recognition PWA

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- VS Code (recommended)

### Setup (5 minutes)

```bash
# 1. Install dependencies
npm run install:all

# 2. Start development
npm run dev

# 3. Access application
# Client: http://localhost:3000
# Server: http://localhost:3001
```

## Project Architecture

### System Overview

Real-time emotion recognition PWA that:

1. **Captures** video/audio from user's device
2. **Streams** media via WebRTC to backend
3. **Processes** using AI (OpenFace + CNN models)
4. **Displays** emotion overlays in real-time

### Module Structure (11 POCs)

**Client-Side (4 modules):**

- **MediaCaptureModule**: Camera/microphone access ✅ **IMPLEMENTED**
- **WebRTCTransportModule**: Real-time communication 🔄 **STUB**
- **OverlayRendererModule**: Emotion overlay rendering ✅ **IMPLEMENTED**
- **PWAShellModule**: Progressive Web App features 🔄 **STUB**

**Server-Side (7 modules):**

- **MediaRelayModule**: Mediasoup WebRTC server 🔄 **STUB**
- **FrameExtractionModule**: FFmpeg video processing 🔄 **STUB**
- **FacialAnalysisModule**: OpenFace emotion recognition ✅ **IMPLEMENTED**
- **AudioAnalysisModule**: CNN audio analysis 🔄 **STUB**
- **OverlayDataGenerator**: Emotion data fusion 🔄 **STUB**
- **ConnectionManagerModule**: Session management 🔄 **STUB**
- **NginxWebServerModule**: Web server config 🔄 **STUB**

## Development Workflow

### Running Tests

```bash
# All tests
npm test

# Specific module
npm run test:client -- --testPathPattern=media-capture
npm run test:server -- --testPathPattern=facial-analysis

# With coverage
npm run test:coverage
```

### Debugging with VS Code

#### Debug Individual POCs

1. **Open Debug Panel**: `Ctrl+Shift+D`
2. **Select Configuration**: "Debug POC: [Module Name]"
3. **Set Breakpoints**: Click in gutter next to line numbers
4. **Press F5**: Start debugging

#### Available Debug Configurations

- **Debug POC: Media Capture** - Camera/microphone access
- **Debug POC: Overlay Renderer** - Canvas rendering
- **Debug POC: Facial Analysis** - OpenFace integration
- **Debug Full Stack** - Complete client + server debugging

#### Debugging Tips

- **Variables Panel**: Inspect current values
- **Debug Console**: Execute code in context
- **Call Stack**: See execution path
- **Conditional Breakpoints**: Right-click breakpoint → Add condition

### Development Tools Integration

#### Taskmaster AI Integration

The project includes Taskmaster AI for enhanced development workflow:

```bash
# Start Taskmaster AI server
npm run taskmaster:start

# Development mode with debug logging
npm run taskmaster:dev

# Reset database if needed
npm run taskmaster:reset
```

#### Dependency Validation

Automated dependency validation ensures module integrity:

```bash
# Validate all module dependencies
npm run test:dependencies

# Validate with coverage report
npm run test:dependencies:coverage

# Fix import issues automatically
npm run test:imports:fix
```

### Building for Production

```bash
# Development build
npm run build:dev

# Production build
npm run build:prod

# Watch mode
npm run build:watch
```

## Implementation Status

### Completed Modules ✅

#### MediaCaptureModule

- **Real browser API integration** with `navigator.mediaDevices.getUserMedia()`
- **Comprehensive error handling** for permissions, device not found
- **Device switching** functionality
- **8 passing unit tests**

#### OverlayRendererModule

- **Canvas-based rendering** with real-time overlay display
- **Facial landmark visualization** with bounding boxes
- **Audio emotion indicators** with opacity-based aging
- **Performance optimized** with requestAnimationFrame

#### FacialAnalysisModule

- **Action Unit mapping** to emotions (happy, sad, angry, etc.)
- **Mock OpenFace integration** ready for real implementation
- **Facial landmark generation** (68-point model)
- **Confidence scoring** and emotion classification

### Stub Modules 🔄

The remaining 8 modules have basic stub implementations with:

- Interface compliance
- Mock data responses
- Unit test coverage
- Ready for real implementation

## Contributing Guidelines

### Adding New Features

1. **Start with interface** - Define contract in `shared/interfaces/`
2. **Write tests first** - Create comprehensive unit tests
3. **Implement module** - Follow existing patterns
4. **Debug thoroughly** - Use VS Code debug configurations
5. **Update documentation** - Keep this guide current

### Code Quality Standards

- **TypeScript strict mode** enabled
- **ESLint + Prettier** for code formatting
- **80%+ test coverage** required
- **Interface-first design** for modularity

### Module Development Rules

1. **Single Responsibility** - Each module has one clear purpose
2. **Explicit Contracts** - All interfaces defined with versioned schemas
3. **Minimal Dependencies** - Import only what you need
4. **Error Handling** - Comprehensive error scenarios covered
5. **Testing** - Unit tests for all public methods

## Troubleshooting

### Common Issues

**Port conflicts:**

```bash
npm run kill:ports  # Kills processes on 3000, 3001, 6379
```

**Module not found errors:**

```bash
npm run clean:install  # Clean reinstall of dependencies
```

**TypeScript compilation errors:**

```bash
npm run type:check  # Check TypeScript configuration
```

**Docker issues:**

```bash
docker-compose down -v  # Reset Docker environment
docker system prune -f
```

### Debug Logs

```bash
# Enable debug logging
DEBUG=emotion-pwa:* npm run dev

# Module-specific logging
DEBUG=emotion-pwa:media-capture npm run dev
```

## Next Steps

## New Developer Onboarding Path

### Week 1: Understanding the Architecture

1. **Read the Documentation**:
   - Start with this onboarding guide
   - Review `docs/ARCHITECTURE.md` for system design
   - Study `docs/DESIGN_SPECIFICATION.md` for implementation details

2. **Explore Working Modules**:
   - **MediaCaptureModule** - Fully implemented camera/microphone access
   - **OverlayRendererModule** - Canvas-based emotion overlay rendering
   - **FacialAnalysisModule** - Mock OpenFace integration with real emotion mapping

3. **Run and Debug**:
   - Set up the development environment
   - Use VS Code debug configurations to step through working modules
   - Understand the interface-first design pattern

### Week 2: Contributing to Development

1. **Pick a Stub Module** to implement:
   - **WebRTCTransportModule** - Core communication layer (high priority)
   - **MediaRelayModule** - Server-side WebRTC handling (high priority)
   - **FrameExtractionModule** - Video processing pipeline
   - **AudioAnalysisModule** - Voice emotion analysis
   - **PWAShellModule** - Progressive Web App features

2. **Follow the Development Pattern**:
   - Interface → Tests → Implementation
   - Use existing modules as reference
   - Maintain comprehensive error handling

### Week 3+: Advanced Integration

1. **End-to-End Testing**:
   - Complete emotion recognition flow
   - Cross-browser compatibility testing
   - Performance testing with multiple users
   - Real-time latency validation

2. **Production Readiness**:
   - Load testing with Artillery
   - Docker deployment testing
   - Monitoring and alerting setup

## Essential Resources for New Developers

### Documentation

- **Architecture Details**: `docs/ARCHITECTURE.md` - Complete system design and module relationships
- **Design Specifications**: `docs/DESIGN_SPECIFICATION.md` - Implementation patterns and data models
- **Build Configuration**: `docs/BUILD_GUIDE.md` - Deployment and production setup
- **Requirements**: `docs/REQUIREMENTS_SPECIFICATION.md` - Business requirements and acceptance criteria

### Code Structure

- **Interface Contracts**: `shared/interfaces/` - All module interfaces and type definitions
- **Client Modules**: `client/src/modules/` - Browser-side implementations
- **Server Modules**: `server/src/modules/` - Backend processing implementations
- **Debug Configurations**: `.vscode/launch.json` - VS Code debugging setups

### Development Tools

- **Package Scripts**: `package.json` - All available npm commands
- **Test Configurations**: `client/jest.config.js`, `server/jest.config.js`
- **Linting Rules**: `.eslintrc.js`, `.prettierrc`
- **Docker Setup**: `docker-compose.yml` - Local development environment

## Getting Help

### Common Issues and Solutions

**"Module not found" errors**: Run `npm run clean:install` to reset dependencies

**Port conflicts**: Use `npm run kill:ports` to free up development ports

**TypeScript compilation errors**: Check `npm run test:type` for type issues

**Test failures**: Run `npm run test:dependencies` to validate module structure

### Development Community

- Follow the contributing guidelines in this document
- Use the established patterns from working modules
- Write comprehensive tests for new functionality
- Document your changes and update interfaces as needed
