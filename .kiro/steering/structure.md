# Project Structure & Organization

## Root Directory Layout

```
emotion-recognition-pwa/
├── client/                 # Frontend PWA application
├── server/                 # Backend Node.js application
├── shared/                 # Shared interfaces and utilities
├── docs/                   # Comprehensive documentation
├── scripts/                # Development and utility scripts
├── poc/                    # Proof-of-concept implementations
├── tests/                  # Cross-system testing
├── monitoring/             # Prometheus/Grafana configuration
├── nginx/                  # Load balancer configuration
└── reports/                # Generated reports and analysis
```

## Modular Architecture

### 11-Module System

The application follows a strict modular architecture with 11 independent, swappable modules:

**Client-Side Modules:**

- `MediaCaptureModule` - Device access and stream management
- `WebRTCTransportModule` - Real-time communication
- `OverlayRendererModule` - Emotion overlay rendering
- `PWAShellModule` - Progressive Web App features

**Server-Side Modules:**

- `MediaRelayModule` - Scalable WebRTC media server
- `FrameExtractionModule` - Video/audio processing
- `FacialAnalysisModule` - Facial emotion recognition
- `AudioAnalysisModule` - Voice emotion analysis
- `OverlayDataGenerator` - Multi-modal data fusion
- `ConnectionManagerModule` - Session management
- `NginxWebServerModule` - Static asset serving

### Module Structure Pattern

Each module follows this standard structure:

```
src/modules/{module-name}/
├── {ModuleName}Module.ts           # Main implementation
├── {ModuleName}Module.test.ts      # Unit tests
└── {ModuleName}Module.d.ts         # Type definitions (generated)
```

### Shared Interfaces

All modules communicate through typed interfaces in `shared/interfaces/`:

```
shared/interfaces/
├── common.interface.ts             # Base types and utilities
├── media-capture.interface.ts      # MediaCaptureModule contract
├── webrtc-transport.interface.ts   # WebRTCTransportModule contract
├── overlay-renderer.interface.ts   # OverlayRendererModule contract
└── [module-name].interface.ts      # Each module's interface
```

## POC-to-Module Development

### POC Structure

Each module starts as a POC for validation:

```
poc/{number}-{module-name}/
├── src/
│   └── poc.ts              # POC implementation using shared module
├── package.json            # POC-specific dependencies
├── tsconfig.json           # POC TypeScript config
└── README.md               # Findings and validation results
```

### Development Flow

1. **POC First**: New modules start as POCs to validate approach
2. **Shared Implementation**: POC evolves into production module
3. **Continuous Validation**: POCs remain as living test cases
4. **Risk Mitigation**: Technical risks resolved in POC phase

## File Naming Conventions

### Files and Directories

- **Files**: `kebab-case.extension` (e.g., `media-capture.interface.ts`)
- **Directories**: `kebab-case` (e.g., `media-capture/`)
- **Modules**: `PascalCase` (e.g., `MediaCaptureModule`)

### TypeScript Conventions

- **Classes**: `PascalCase` (e.g., `MediaCaptureService`)
- **Interfaces**: `PascalCase` with `I` prefix (e.g., `IMediaCaptureConfig`)
- **Functions/Variables**: `camelCase` (e.g., `startMediaCapture`)
- **Constants**: `SCREAMING_SNAKE_CASE` (e.g., `MAX_RETRY_COUNT`)

## Import Path Standards

### Use @ Alias for All Imports

```typescript
// ✅ Correct - Location independent
import { MediaCaptureModule } from '@/shared/interfaces/media-capture.interface';
import { EmotionScore } from '@/shared/interfaces/common.interface';

// ❌ Incorrect - Fragile relative paths
import { MediaCaptureModule } from '../../../shared/interfaces/media-capture.interface';
```

### Path Configuration

- **Client**: `@/*` resolves to `../` (workspace root)
- **Server**: `@/*` resolves to `../` (workspace root)
- **Benefits**: Refactoring safety, consistent patterns, location independence

## Testing Organization

### Test Structure

```
tests/
├── unit/                   # Fast, isolated module tests
├── integration/            # Inter-module communication tests
├── e2e/                    # Full system end-to-end tests
├── load/                   # Performance and scalability tests
└── fixtures/               # Test data and mocks
```

### Module Testing Strategy

- **POC Testing**: Boundary and equivalence testing in isolation
- **Integration Testing**: Module interaction validation in full system
- **Coverage Requirements**: 80%+ test coverage for all modules

## Documentation Structure

### Core Documentation

```
docs/
├── ARCHITECTURE.md         # System design and module relationships
├── BUILD_GUIDE.md          # Setup and development instructions
├── CODING_STANDARDS.md     # Code quality and style guidelines
├── DESIGN_SPECIFICATION.md # Detailed technical specifications
├── IMPLEMENTATION_PLAN.md  # Development roadmap and tasks
└── SECURITY.md             # Security procedures and guidelines
```

## Configuration Management

### Environment Files

- `.env.development` - Local development settings
- `.env.staging` - Pre-production configuration
- `.env.production` - Live deployment settings
- `.env.example` - Template with all required variables

### Build Configuration

- `tsconfig.json` - Root TypeScript configuration
- `client/tsconfig.json` - Frontend-specific settings
- `server/tsconfig.json` - Backend-specific settings
- `docker-compose.yml` - Multi-service development environment

## Development Scripts

### Key Utility Scripts

```
scripts/
├── health-check.js         # System health monitoring
├── debug-webrtc.js         # WebRTC connection diagnostics
├── module-monitor.js       # Real-time module performance
├── performance-monitor.js  # System performance tracking
├── security-scan.js        # Vulnerability scanning
└── validate-imports.js     # Import path validation
```

## Quality Assurance

### Pre-commit Requirements

- ESLint validation
- Prettier formatting
- TypeScript compilation
- Security scanning
- Import path validation

### CI/CD Integration

- Automated testing on all PRs
- Security vulnerability scanning
- Performance regression testing
- Deployment to staging/production environments
