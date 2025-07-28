# File Documentation Matrix - Emotion Recognition PWA

## Overview

This document provides comprehensive documentation for every file in the emotion recognition PWA project, including purpose, technology stack, dependencies, and role in the overall system architecture.

## 📁 **Core Application Files**

### **Shared Interfaces (`shared/interfaces/`)**

| File                              | Purpose                               | Technology                    | Dependencies                    | Role in System                                              |
| --------------------------------- | ------------------------------------- | ----------------------------- | ------------------------------- | ----------------------------------------------------------- |
| `common.interface.ts`             | Base types and shared data structures | TypeScript                    | None                            | Defines ApiResponse, ModuleError, EmotionScore, BoundingBox |
| `media-capture.interface.ts`      | Media device access contract          | TypeScript, WebRTC APIs       | common.interface.ts             | Defines getUserMedia wrapper and device management          |
| `webrtc-transport.interface.ts`   | Real-time communication contract      | TypeScript, WebRTC, Socket.IO | common.interface.ts             | Defines peer connection and signaling protocols             |
| `frame-extraction.interface.ts`   | Video/audio processing contract       | TypeScript, FFmpeg            | media-relay.interface.ts        | Defines frame decoding and format conversion                |
| `facial-analysis.interface.ts`    | Facial emotion recognition contract   | TypeScript, OpenFace          | frame-extraction.interface.ts   | Defines Action Unit extraction and emotion mapping          |
| `audio-analysis.interface.ts`     | Voice emotion recognition contract    | TypeScript, Python ML         | frame-extraction.interface.ts   | Defines MFCC features and CNN emotion classification        |
| `overlay-data.interface.ts`       | Emotion overlay metadata contract     | TypeScript                    | facial-analysis, audio-analysis | Defines emotion fusion and overlay generation               |
| `overlay-renderer.interface.ts`   | Client-side rendering contract        | TypeScript, Canvas API        | overlay-data.interface.ts       | Defines bounding box and label rendering                    |
| `connection-manager.interface.ts` | Session management contract           | TypeScript, Redis             | webrtc-transport.interface.ts   | Defines session lifecycle and health monitoring             |
| `pwa-shell.interface.ts`          | Progressive Web App contract          | TypeScript, Service Workers   | media-capture.interface.ts      | Defines PWA features and offline handling                   |
| `nginx-server.interface.ts`       | Web server configuration contract     | TypeScript, Nginx             | None                            | Defines static asset serving and SSL configuration          |
| `media-relay.interface.ts`        | Media server scaling contract         | TypeScript, Mediasoup         | None                            | Defines WebRTC media routing and worker management          |

### **Client-Side Modules (`client/src/modules/`)**

| File                                             | Purpose                               | Technology                               | Dependencies                  | Role in System                                                            |
| ------------------------------------------------ | ------------------------------------- | ---------------------------------------- | ----------------------------- | ------------------------------------------------------------------------- |
| `media-capture/MediaCaptureModule.ts`            | Device media access implementation    | TypeScript, getUserMedia API             | media-capture.interface.ts    | Captures video/audio from user devices with permission handling           |
| `media-capture/MediaCaptureModule.test.ts`       | Unit tests for media capture          | Jest, TypeScript                         | MediaCaptureModule.ts         | Validates device access, permission handling, and error scenarios         |
| `webrtc-transport/WebRTCTransportModule.ts`      | WebRTC peer connection implementation | TypeScript, RTCPeerConnection, Socket.IO | webrtc-transport.interface.ts | Establishes real-time communication with backend server                   |
| `webrtc-transport/WebRTCTransportModule.test.ts` | Unit tests for WebRTC transport       | Jest, TypeScript                         | WebRTCTransportModule.ts      | Validates connection establishment, data transmission, and reconnection   |
| `overlay-renderer/OverlayRendererModule.ts`      | Canvas-based overlay rendering        | TypeScript, HTML5 Canvas API             | overlay-renderer.interface.ts | Draws emotion overlays on live video feed                                 |
| `overlay-renderer/OverlayRendererModule.test.ts` | Unit tests for overlay rendering      | Jest, TypeScript                         | OverlayRendererModule.ts      | Validates overlay drawing, positioning, and cleanup                       |
| `pwa-shell/PWAShellModule.ts`                    | Progressive Web App features          | TypeScript, Service Workers, Cache API   | pwa-shell.interface.ts        | Provides offline functionality, installation, and push notifications      |
| `pwa-shell/PWAShellModule.test.ts`               | Unit tests for PWA features           | Jest, TypeScript                         | PWAShellModule.ts             | Validates service worker registration, offline handling, and installation |

### **Server-Side Modules (`server/src/modules/`)**

| File                                                 | Purpose                                  | Technology                                | Dependencies                    | Role in System                                                                 |
| ---------------------------------------------------- | ---------------------------------------- | ----------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------ |
| `media-relay/MediaRelayModule.ts`                    | Scalable WebRTC media server             | TypeScript, Mediasoup, Redis              | media-relay.interface.ts        | Routes media streams across multiple workers for scalability                   |
| `media-relay/MediaRelayModule.test.ts`               | Unit tests for media relay               | Jest, TypeScript                          | MediaRelayModule.ts             | Validates worker creation, media routing, and load balancing                   |
| `frame-extraction/FrameExtractionModule.ts`          | Video/audio frame processing             | TypeScript, FFmpeg, Node.js child_process | frame-extraction.interface.ts   | Decodes RTP streams to processable video frames and audio chunks               |
| `frame-extraction/FrameExtractionModule.test.ts`     | Unit tests for frame extraction          | Jest, TypeScript                          | FrameExtractionModule.ts        | Validates frame decoding, quality settings, and format conversion              |
| `facial-analysis/FacialAnalysisModule.ts`            | OpenFace facial emotion recognition      | TypeScript, OpenFace 2.0, child_process   | facial-analysis.interface.ts    | Processes video frames to extract facial Action Units and classify emotions    |
| `facial-analysis/FacialAnalysisModule.test.ts`       | Unit tests for facial analysis           | Jest, TypeScript                          | FacialAnalysisModule.ts         | Validates OpenFace integration, emotion classification, and face tracking      |
| `audio-analysis/AudioAnalysisModule.ts`              | Voice emotion recognition                | TypeScript, Python, librosa, TensorFlow   | audio-analysis.interface.ts     | Analyzes audio chunks using MFCC features and CNN models for emotion detection |
| `audio-analysis/AudioAnalysisModule.test.ts`         | Unit tests for audio analysis            | Jest, TypeScript                          | AudioAnalysisModule.ts          | Validates audio processing, feature extraction, and emotion classification     |
| `overlay-generator/OverlayDataGenerator.ts`          | Emotion data fusion and overlay creation | TypeScript                                | overlay-data.interface.ts       | Combines facial and audio emotion results into unified overlay metadata        |
| `overlay-generator/OverlayDataGenerator.test.ts`     | Unit tests for overlay generation        | Jest, TypeScript                          | OverlayDataGenerator.ts         | Validates emotion fusion, overlay creation, and JSON serialization             |
| `connection-manager/ConnectionManagerModule.ts`      | Session lifecycle management             | TypeScript, Redis, Socket.IO              | connection-manager.interface.ts | Manages WebRTC sessions, health monitoring, and reconnection handling          |
| `connection-manager/ConnectionManagerModule.test.ts` | Unit tests for connection management     | Jest, TypeScript                          | ConnectionManagerModule.ts      | Validates session creation, health monitoring, and cleanup                     |
| `nginx-server/NginxWebServerModule.ts`               | Web server configuration                 | TypeScript, Nginx configuration           | nginx-server.interface.ts       | Serves PWA static assets with SSL, compression, and load balancing             |
| `nginx-server/NginxWebServerModule.test.ts`          | Unit tests for web server                | Jest, TypeScript                          | NginxWebServerModule.ts         | Validates asset serving, SSL configuration, and health checks                  |

## 🔧 **Configuration Files**

### **Build & Development Configuration**

| File                       | Purpose                                    | Technology               | Dependencies        | Role in System                                                          |
| -------------------------- | ------------------------------------------ | ------------------------ | ------------------- | ----------------------------------------------------------------------- |
| `package.json` (root)      | Root project configuration and scripts     | npm, Node.js             | None                | Orchestrates development workflow, testing, and deployment              |
| `client/package.json`      | Client-side dependencies and build scripts | npm, Webpack, TypeScript | None                | Manages PWA build process and client dependencies                       |
| `server/package.json`      | Server-side dependencies and runtime       | npm, Node.js, TypeScript | None                | Manages backend runtime dependencies and server scripts                 |
| `client/webpack.config.js` | Client build configuration                 | Webpack 5, TypeScript    | client/package.json | Bundles PWA for production with optimization and PWA features           |
| `client/tsconfig.json`     | Client TypeScript configuration            | TypeScript compiler      | None                | Configures TypeScript compilation for browser environment               |
| `server/tsconfig.json`     | Server TypeScript configuration            | TypeScript compiler      | None                | Configures TypeScript compilation for Node.js environment               |
| `docker-compose.yml`       | Development environment orchestration      | Docker, Docker Compose   | None                | Provides Redis, Nginx, and application containers for local development |

### **Testing Configuration**

| File                                | Purpose                           | Technology            | Dependencies        | Role in System                                                         |
| ----------------------------------- | --------------------------------- | --------------------- | ------------------- | ---------------------------------------------------------------------- |
| `client/jest.config.js`             | Client-side testing configuration | Jest, jsdom           | client/package.json | Configures unit testing for PWA components with browser environment    |
| `server/jest.config.js`             | Server-side testing configuration | Jest, Node.js         | server/package.json | Configures unit testing for backend modules with Node.js environment   |
| `server/jest.integration.config.js` | Integration testing configuration | Jest, Supertest       | server/package.json | Configures end-to-end testing for API endpoints and module integration |
| `client/src/setupTests.ts`          | Client test environment setup     | Jest, Testing Library | None                | Provides mocks for browser APIs (MediaStream, RTCPeerConnection)       |
| `server/src/setupTests.ts`          | Server test environment setup     | Jest                  | None                | Provides mocks for external services (OpenFace, Python processes)      |

### **Code Quality Configuration**

| File                  | Purpose                       | Technology            | Dependencies | Role in System                                        |
| --------------------- | ----------------------------- | --------------------- | ------------ | ----------------------------------------------------- |
| `.eslintrc.js` (root) | Global linting rules          | ESLint, TypeScript    | None         | Enforces code quality standards across entire project |
| `client/.eslintrc.js` | Client-specific linting rules | ESLint, React rules   | .eslintrc.js | Adds browser-specific and PWA linting rules           |
| `server/.eslintrc.js` | Server-specific linting rules | ESLint, Node.js rules | .eslintrc.js | Adds Node.js-specific and backend linting rules       |
| `.prettierrc`         | Code formatting configuration | Prettier              | None         | Ensures consistent code formatting across all files   |
| `.husky/pre-commit`   | Pre-commit git hook           | Husky, lint-staged    | None         | Runs linting and formatting checks before commits     |
| `.husky/pre-push`     | Pre-push git hook             | Husky                 | None         | Runs unit tests before pushing to remote repository   |

## 🌐 **PWA & Web Assets**

| File                          | Purpose                                  | Technology                     | Dependencies | Role in System                                                |
| ----------------------------- | ---------------------------------------- | ------------------------------ | ------------ | ------------------------------------------------------------- |
| `client/public/index.html`    | Main HTML entry point                    | HTML5, PWA meta tags           | None         | Provides PWA shell and loads JavaScript bundle                |
| `client/public/manifest.json` | PWA manifest configuration               | PWA specification              | None         | Defines PWA installation behavior, icons, and display mode    |
| `client/public/sw.js`         | Service worker for offline functionality | Service Workers API, Cache API | None         | Enables offline functionality and background sync             |
| `nginx/nginx.conf`            | Web server configuration                 | Nginx                          | None         | Serves PWA assets with SSL, compression, and security headers |

## 🚀 **Infrastructure & Deployment**

| File                            | Purpose                         | Technology                | Dependencies | Role in System                                                |
| ------------------------------- | ------------------------------- | ------------------------- | ------------ | ------------------------------------------------------------- |
| `.github/workflows/ci.yml`      | Continuous integration pipeline | GitHub Actions, Docker    | None         | Automates testing, building, and deployment on code changes   |
| `.github/branch-protection.yml` | Branch protection rules         | GitHub API                | None         | Enforces code review and testing requirements for main branch |
| `scripts/health-check.js`       | System health monitoring        | Node.js, HTTP requests    | None         | Validates all services are running and responsive             |
| `scripts/debug-webrtc.js`       | WebRTC debugging utilities      | Node.js, WebRTC debugging | None         | Provides tools for diagnosing WebRTC connection issues        |
| `scripts/interactive-dev.js`    | Development workflow tools      | Node.js, CLI utilities    | None         | Interactive tools for development tasks and debugging         |
| `scripts/module-monitor.js`     | Module performance monitoring   | Node.js, system metrics   | None         | Monitors individual module performance and resource usage     |

## 🔒 **Environment & Security**

| File               | Purpose                        | Technology            | Dependencies | Role in System                                                                 |
| ------------------ | ------------------------------ | --------------------- | ------------ | ------------------------------------------------------------------------------ |
| `.env.example`     | Environment variable template  | Environment variables | None         | Documents all required configuration options                                   |
| `.env.development` | Development environment config | Environment variables | None         | Local development configuration (database URLs, API keys)                      |
| `.env.staging`     | Staging environment config     | Environment variables | None         | Pre-production testing configuration                                           |
| `.env.production`  | Production environment config  | Environment variables | None         | Live deployment configuration with production secrets                          |
| `.gitignore`       | Version control exclusions     | Git                   | None         | Excludes sensitive files, build outputs, and dependencies from version control |

## 🔗 **Interface Architecture**

### **Explicit Import Strategy**

The system uses explicit interface imports instead of a central export hub to achieve:

- **Minimal Dependencies**: Each module imports only the interfaces it actually uses
- **Tree Shaking**: Build tools can eliminate unused interfaces for smaller bundles
- **Clear Dependencies**: Import statements explicitly show module relationships
- **Independent Development**: Modules can be developed without coordinating through a central hub

### **Interface Dependency Matrix**

The following matrix shows the explicit import relationships between interface files, demonstrating the modular architecture where each interface declares only its required dependencies:

| Interface File                    | Imports From                                                                      | Used By Modules                                                  | Module Boundary                    |
| --------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------- |
| `common.interface.ts`             | None (foundation layer)                                                           | All modules requiring base types                                 | Shared foundation types            |
| `media-capture.interface.ts`      | `./common.interface`                                                              | MediaCaptureModule, tests                                        | Client-side media access           |
| `webrtc-transport.interface.ts`   | `./common.interface`                                                              | WebRTCTransportModule, tests                                     | Client-side communication          |
| `frame-extraction.interface.ts`   | `./common.interface`                                                              | FrameExtractionModule, FacialAnalysisModule, AudioAnalysisModule | Server-side media processing       |
| `facial-analysis.interface.ts`    | `./common.interface`, `./frame-extraction.interface`                              | FacialAnalysisModule, OverlayDataGenerator, tests                | Server-side facial emotion AI      |
| `audio-analysis.interface.ts`     | `./common.interface`, `./frame-extraction.interface`                              | AudioAnalysisModule, OverlayDataGenerator                        | Server-side audio emotion AI       |
| `overlay-data.interface.ts`       | `./audio-analysis.interface`, `./facial-analysis.interface`, `./common.interface` | OverlayDataGenerator, OverlayRendererModule                      | Cross-boundary emotion data fusion |
| `overlay-renderer.interface.ts`   | `./overlay-data.interface`                                                        | OverlayRendererModule                                            | Client-side rendering              |
| `connection-manager.interface.ts` | `./common.interface`                                                              | ConnectionManagerModule                                          | Server-side session management     |
| `pwa-shell.interface.ts`          | None                                                                              | PWAShellModule                                                   | Client-side PWA features           |
| `nginx-server.interface.ts`       | None                                                                              | NginxWebServerModule                                             | Server-side web server             |
| `media-relay.interface.ts`        | None                                                                              | MediaRelayModule, FrameExtractionModule                          | Server-side media routing          |

### **Modular Import Guidelines**

#### **✅ Correct Import Patterns**

```typescript
// ✅ GOOD: Explicit imports from specific interface files
import { MediaCaptureModule, CaptureConfig } from '@/shared/interfaces/media-capture.interface';
import { EmotionScore, BoundingBox } from '@/shared/interfaces/common.interface';

// ✅ GOOD: Cross-module dependencies are explicit and minimal
import { ExtractedVideoFrame } from '@/shared/interfaces/frame-extraction.interface';
import { FacialAnalysisResult } from '@/shared/interfaces/facial-analysis.interface';

// ✅ GOOD: Named imports support tree-shaking
import { OverlayData, FacialOverlay } from '@/shared/interfaces/overlay-data.interface';
```

#### **❌ Forbidden Import Patterns**

```typescript
// ❌ BAD: Central export hub imports (violates modular architecture)
import { MediaCaptureModule } from '@/shared/interfaces/index';
import * as Interfaces from '@/shared/interfaces';

// ❌ BAD: Directory imports without specific files
import { MediaCaptureModule } from '@/shared/interfaces';

// ❌ BAD: Relative path imports that bypass the @ alias
import { MediaCaptureModule } from '../../../shared/interfaces/media-capture.interface';

// ❌ BAD: Wildcard imports (prevents tree-shaking)
import * as MediaCapture from '@/shared/interfaces/media-capture.interface';
```

#### **Interface Organization Principles**

1. **Single Responsibility**: Each interface file serves exactly one module
2. **Explicit Dependencies**: All imports use specific file paths with @ alias
3. **Minimal Contracts**: Interfaces expose only essential methods and types
4. **Clear Boundaries**: Module relationships are unidirectional without cycles
5. **Tree-Shaking Support**: Named imports enable build optimization

#### **Module Boundary Guidelines**

| Boundary Type      | Import Pattern                                   | Example                       | Purpose                             |
| ------------------ | ------------------------------------------------ | ----------------------------- | ----------------------------------- |
| **Foundation**     | `@/shared/interfaces/common.interface`           | Base types, errors, responses | Shared across all modules           |
| **Client-Only**    | `@/shared/interfaces/media-capture.interface`    | Browser APIs, PWA features    | Client-side functionality           |
| **Server-Only**    | `@/shared/interfaces/frame-extraction.interface` | Node.js APIs, AI processing   | Server-side functionality           |
| **Cross-Boundary** | `@/shared/interfaces/overlay-data.interface`     | Data transfer objects         | Communication between client/server |

#### **Interface Contract Documentation**

Each interface file includes:

```typescript
// Interface file header with version and purpose
// Media Capture Module Interface
// Version 1.0

import { ApiResponse, ModuleError } from './common.interface';

// Primary module interface with clear contract
export interface MediaCaptureModule {
  // Minimal, essential methods only
  requestPermissions(): Promise<MediaCaptureResult>;
  startCapture(config: CaptureConfig): Promise<MediaStream>;
  stopCapture(): void;
}

// Module-specific configuration types
export interface CaptureConfig {
  video: VideoConstraints;
  audio: AudioConstraints;
}

// Module-specific result types
export interface MediaCaptureResult extends ApiResponse {
  stream?: MediaStream;
  availableDevices: MediaDeviceInfo[];
}

// Module-specific error types
export interface MediaCaptureError extends ModuleError {
  type: 'NotAllowedError' | 'NotFoundError' | 'DeviceError';
}
```

## 🧪 **Dependency Validation & Testing**

### **Automated Dependency Validation**

The project includes comprehensive automated tests to ensure modular interface architecture principles are maintained:

| File                                                 | Purpose                                 | Technology       | Dependencies                    | Role in System                                                  |
| ---------------------------------------------------- | --------------------------------------- | ---------------- | ------------------------------- | --------------------------------------------------------------- |
| `server/src/__tests__/dependency-validation.test.ts` | Server-side dependency validation tests | Jest, TypeScript | dependency-validation.utils.ts  | Validates modular architecture compliance for server modules    |
| `client/src/__tests__/dependency-validation.test.ts` | Client-side dependency validation tests | Jest, TypeScript | dependency-validation.utils.ts  | Validates modular architecture compliance for client modules    |
| `shared/test-utils/dependency-validation.utils.ts`   | Shared validation utilities             | TypeScript       | fs, path                        | Common functions for dependency analysis and validation         |
| `scripts/test-dependency-validation.js`              | Standalone dependency validation runner | Node.js          | Jest, validation utilities      | Executable script for CI/CD and manual validation               |
| `scripts/validate-imports.js`                        | Import pattern validation script        | Node.js          | glob, fs                        | Build-time validation of import patterns and architecture rules |
| `reports/dependency-validation-report.md`            | Automated validation report             | Markdown         | Generated by validation scripts | Comprehensive report of architecture compliance status          |

### **Validation Test Categories**

#### **1. Central Export Hub Validation**

- ✅ Verifies no central export hub files exist (`index.ts`, `index.js`)
- ✅ Prevents imports from central export hubs
- ✅ Ensures modules use explicit interface imports

#### **2. Module Import Requirements**

- ✅ Validates explicit interface imports with specific file paths
- ✅ Ensures modules import only required interfaces
- ✅ Detects unused imports and enforces minimal dependencies

#### **3. Circular Dependency Detection**

- ✅ Uses DFS algorithm to detect circular dependencies
- ✅ Maintains clean dependency graph structure
- ✅ Prevents interface dependency cycles

#### **4. Single Responsibility Validation**

- ✅ Ensures each interface file serves exactly one module
- ✅ Validates consistent naming conventions
- ✅ Enforces minimal, essential interface contracts

#### **5. Interface Change Impact Analysis**

- ✅ Identifies which modules import each interface
- ✅ Ensures interface changes have bounded impact scope
- ✅ Maintains module isolation and independence

#### **6. Build System Compatibility**

- ✅ Validates tree-shaking optimization support
- ✅ Ensures consistent path resolution patterns
- ✅ Supports build optimization and dead code elimination

### **Running Dependency Validation**

```bash
# Run all dependency validation tests
npm run test:dependencies

# Run with coverage reporting
npm run test:dependencies:coverage

# Run only server-side validation
cd server && npm test -- --testPathPattern=dependency-validation

# Run only client-side validation
cd client && npm test -- --testPathPattern=dependency-validation

# Run import pattern validation
npm run test:imports
```

### **Architecture Compliance Monitoring**

The validation system ensures continuous compliance with modular architecture principles:

- **Automated Testing**: Runs in CI/CD pipeline to prevent architecture violations
- **Real-time Validation**: ESLint rules prevent forbidden import patterns during development
- **Comprehensive Reporting**: Generates detailed reports of architecture compliance status
- **Impact Analysis**: Tracks which modules would be affected by interface changes

## 🔧 **Maintaining Modular Architecture**

### **Development Guidelines**

#### **Adding New Interfaces**

When adding a new interface file, follow these steps:

1. **Create Interface File**: Use the naming pattern `{module-name}.interface.ts`
2. **Single Responsibility**: Ensure the interface serves exactly one module
3. **Explicit Dependencies**: Import only required interfaces using `./relative-path.interface`
4. **Minimal Contract**: Expose only essential methods and types
5. **Documentation**: Include version header and clear contract documentation

```typescript
// Example: new-module.interface.ts
// New Module Interface
// Version 1.0

import { ApiResponse, ModuleError } from './common.interface';

export interface NewModule {
  // Minimal, essential methods only
  initialize(config: NewModuleConfig): Promise<void>;
  process(data: InputData): Promise<OutputData>;
  cleanup(): void;
}

export interface NewModuleConfig {
  // Configuration properties
}

export interface OutputData extends ApiResponse {
  // Result properties
}
```

#### **Modifying Existing Interfaces**

When modifying interfaces, consider impact:

1. **Impact Analysis**: Run `npm run test:dependencies` to identify affected modules
2. **Backward Compatibility**: Prefer additive changes over breaking changes
3. **Version Updates**: Update version header when making changes
4. **Test Updates**: Update dependency validation tests if needed

#### **Refactoring Module Dependencies**

When refactoring dependencies:

1. **Minimize Dependencies**: Remove unused imports
2. **Explicit Imports**: Use specific interface file paths
3. **Validate Changes**: Run dependency validation tests
4. **Update Documentation**: Update interface dependency matrix

### **Architecture Enforcement**

#### **ESLint Rules**

The project enforces modular architecture through ESLint rules:

```javascript
// Forbidden import patterns
'no-restricted-imports': [
  'error',
  {
    patterns: [
      {
        group: ['**/index', '**/index.ts', '**/index.js'],
        message: 'Importing from index files is not allowed. Use explicit interface imports.',
      },
      {
        group: ['@/shared/interfaces/index*'],
        message: 'Central export hubs are not allowed. Import from specific interface files.',
      },
    ],
    paths: [
      {
        name: '@/shared/interfaces',
        message: 'Import from specific interface files, not the interfaces directory.',
      },
    ],
  },
],
```

#### **Pre-commit Hooks**

Git hooks prevent architecture violations:

```bash
# .husky/pre-commit
npm run test:lint
npm run test:imports
npm run test:dependencies
```

#### **CI/CD Pipeline**

Continuous integration validates architecture:

```yaml
# .github/workflows/ci.yml
- name: Validate Architecture
  run: |
    npm run test:imports
    npm run test:dependencies
    npm run test:lint
```

### **Troubleshooting Common Issues**

#### **Circular Dependency Errors**

```bash
# Error: Circular dependency detected
# Solution: Refactor interfaces to remove cycles
npm run test:dependencies -- --verbose
```

#### **Forbidden Import Patterns**

```bash
# Error: ESLint no-restricted-imports
# Solution: Use explicit interface imports
# ❌ import { Module } from '@/shared/interfaces';
# ✅ import { Module } from '@/shared/interfaces/module.interface';
```

#### **Unused Import Detection**

```bash
# Error: Unused import detected
# Solution: Remove unused imports or use imported types
npm run test:dependencies
```

### **Best Practices Summary**

1. **✅ DO**: Use explicit interface imports with @ alias
2. **✅ DO**: Import only what you need for minimal dependencies
3. **✅ DO**: Use named imports for tree-shaking support
4. **✅ DO**: Run dependency validation tests regularly
5. **❌ DON'T**: Import from central export hubs or index files
6. **❌ DON'T**: Use wildcard imports that prevent optimization
7. **❌ DON'T**: Create circular dependencies between interfaces
8. **❌ DON'T**: Bypass the @ alias with relative paths

## 📚 **Documentation**

| File                           | Purpose                           | Technology                  | Dependencies | Role in System                                            |
| ------------------------------ | --------------------------------- | --------------------------- | ------------ | --------------------------------------------------------- | ---- | ------- | ---------- | ------------ | -------------- |
| `README.md`                    | Project overview and quick start  | Markdown                    | None         | Primary documentation entry point with setup instructions |
| `docs/ARCHITECTURE.md`         | System architecture documentation | Markdown, Mermaid diagrams  | None         | Detailed system design and module relationships           |
| `docs/DESIGN_SPECIFICATION.md` | Detailed design documentation     | Markdown, Gherkin scenarios | None         | Usage scenarios and technical implementation details      |
| `docs/IMPLEMENTATION_PLAN.md`  | Development roadmap               | Markdown                    | None         | Task breakdown and development timeline                   |
| `docs/BUILD_GUIDE.md`          | Build and deployment instructions | Markdown                    | None         | Step-by-step build and deployment procedures              |
| `docs/DEBUGGING_GUIDE.md`      | Troubleshooting documentation     | Markdown                    | None         | Common issues and debugging techniques                    |
| `docs/GITHUB_SETUP.md`         | Repository configuration guide    | Markdown                    | None         | GitHub-specific setup and configuration                   |
| `docs/NODE_COMPATIBILITY.md`   | Node.js version requirements      | Markdown                    | None         | Node.js compatibility matrix and upgrade procedures       |
| `docs/FILE_DOCUMENTATION.md`   | Complete file reference matrix    | Markdown                    | None         | Documents purpose and dependencies of every project file  |
| `typedoc.json`                 | API documentation generation      | TypeDoc                     | None         | Generates API documentation from TypeScript interfaces    | File | Purpose | Technology | Dependencies | Role in System |
| ------------------------------ | --------------------------------- | --------------------------- | ------------ | --------------------------------------------------------- |
| `README.md`                    | Project overview and quick start  | Markdown                    | None         | Primary documentation entry point with setup instructions |
| `docs/ARCHITECTURE.md`         | System architecture documentation | Markdown, Mermaid diagrams  | None         | Detailed system design and module relationships           |
| `docs/DESIGN_SPECIFICATION.md` | Detailed design documentation     | Markdown, Gherkin scenarios | None         | Usage scenarios and technical implementation details      |
| `docs/IMPLEMENTATION_PLAN.md`  | Development roadmap               | Markdown                    | None         | Task breakdown and development timeline                   |
| `docs/BUILD_GUIDE.md`          | Build and deployment instructions | Markdown                    | None         | Step-by-step build and deployment procedures              |
| `docs/DEBUGGING_GUIDE.md`      | Troubleshooting documentation     | Markdown                    | None         | Common issues and debugging techniques                    |
| `docs/GITHUB_SETUP.md`         | Repository configuration guide    | Markdown                    | None         | GitHub-specific setup and configuration                   |
| `docs/NODE_COMPATIBILITY.md`   | Node.js version requirements      | Markdown                    | None         | Node.js compatibility matrix and upgrade procedures       |
| `docs/FILE_DOCUMENTATION.md`   | Complete file reference matrix    | Markdown                    | None         | Documents purpose and dependencies of every project file  |
| `typedoc.json`                 | API documentation generation      | TypeDoc                     | None         | Generates API documentation from TypeScript interfaces    |

## 🎯 **Entry Points & Application Flow**

### **Application Entry Points**

| File                  | Purpose                        | Technology                     | Dependencies       | Role in System                                                            |
| --------------------- | ------------------------------ | ------------------------------ | ------------------ | ------------------------------------------------------------------------- |
| `client/src/index.ts` | Client application entry point | TypeScript, DOM APIs           | All client modules | Initializes PWA, sets up modules, and starts emotion recognition          |
| `server/src/index.ts` | Server application entry point | TypeScript, Express, Socket.IO | All server modules | Starts HTTP server, WebSocket server, and initializes processing pipeline |

### **Data Flow Architecture**

```mermaid
graph LR
    A[client/src/index.ts] --> B[MediaCaptureModule]
    B --> C[WebRTCTransportModule]
    C --> D[server/src/index.ts]
    D --> E[MediaRelayModule]
    E --> F[FrameExtractionModule]
    F --> G[FacialAnalysisModule]
    F --> H[AudioAnalysisModule]
    G --> I[OverlayDataGenerator]
    H --> I
    I --> C
    C --> J[OverlayRendererModule]
```

## 🔍 **Technology Stack Summary**

### **Frontend Technologies**

- **TypeScript**: Type-safe JavaScript development
- **WebRTC**: Real-time peer-to-peer communication
- **Canvas API**: 2D graphics rendering for overlays
- **Service Workers**: Offline functionality and caching
- **Webpack**: Module bundling and optimization

### **Backend Technologies**

- **Node.js**: JavaScript runtime environment
- **Mediasoup**: Scalable WebRTC media server
- **FFmpeg**: Video and audio processing
- **OpenFace**: Facial landmark detection and emotion analysis
- **Python/TensorFlow**: Audio emotion recognition models
- **Redis**: Session state management and caching

### **Infrastructure Technologies**

- **Nginx**: Web server and reverse proxy
- **Docker**: Containerization and deployment
- **GitHub Actions**: CI/CD pipeline automation
- **Jest**: Unit and integration testing framework

## 📊 **File Dependency Matrix**

This matrix shows which files depend on which other files:

```mermaid
graph TD
    subgraph "Shared Interfaces"
        SI[shared/interfaces/*.ts]
    end

    subgraph "Client Modules"
        CM[client/src/modules/*.ts]
    end

    subgraph "Server Modules"
        SM[server/src/modules/*.ts]
    end

    subgraph "Configuration"
        CF[*.config.js, tsconfig.json]
    end

    subgraph "Tests"
        TF[*.test.ts]
    end

    SI --> CM
    SI --> SM
    CF --> CM
    CF --> SM
    CM --> TF
    SM --> TF
```

## 🎯 **Quick Reference**

### **Find Files by Purpose**

- **Module Interfaces**: `shared/interfaces/*.interface.ts`
- **Client Implementation**: `client/src/modules/*/Module.ts`
- **Server Implementation**: `server/src/modules/*/Module.ts`
- **Unit Tests**: `*/*.test.ts`
- **Configuration**: `*.config.js`, `tsconfig.json`, `.eslintrc.js`
- **Documentation**: `docs/*.md`, `README.md`
- **Build Scripts**: `package.json` (scripts section)

### **Find Files by Technology**

- **TypeScript**: `*.ts` files
- **WebRTC**: `webrtc-transport/`, `media-relay/`
- **AI/ML**: `facial-analysis/`, `audio-analysis/`
- **PWA**: `pwa-shell/`, `manifest.json`, `sw.js`
- **Testing**: `*.test.ts`, `jest.config.js`, `setupTests.ts`
- **Infrastructure**: `docker-compose.yml`, `nginx.conf`, `.github/`

This documentation provides a complete reference for understanding the purpose, technology, and role of every file in the emotion recognition PWA project.
