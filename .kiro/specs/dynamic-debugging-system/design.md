# Design Document

## Overview

The Dynamic Debugging System provides comprehensive debugging capabilities for the Emotion Recognition PWA project. The system enables line-by-line debugging of POCs, production components, and test suites through Node.js debugger integration, VS Code configurations, and browser debugging tools.

## Architecture

### Core Components

1. **Debug Script Manager**: Centralized npm scripts for consistent debugging commands
2. **VS Code Integration**: Pre-configured launch configurations for all debugging scenarios
3. **POC Debug Infrastructure**: Individual debugging capabilities for each POC
4. **Server Debug Infrastructure**: Production server debugging with hot reload support
5. **Client Debug Infrastructure**: Browser-based debugging with source map support
6. **Test Debug Infrastructure**: Jest and integration test debugging capabilities

### Debug Flow Architecture

```
Developer Request
       ↓
Debug Script Manager
       ↓
Component-Specific Debug Launcher
       ↓
Node.js Debugger / Browser DevTools
       ↓
VS Code Debug Interface (optional)
```

## Components and Interfaces

### Debug Script Manager

**Purpose**: Provides unified npm scripts for all debugging operations

**Key Methods**:

- `debug:poc:<poc-name>`: Debug specific POC
- `debug:server`: Debug production server
- `debug:client`: Debug client application
- `debug:test:<test-type>`: Debug test suites
- `debug:full-stack`: Debug entire application
- `debug:e2e`: Debug end-to-end tests with full system
- `debug:e2e:server`: Debug server during E2E test execution
- `debug:e2e:client`: Debug client during E2E test execution

**Configuration**:

- Port management for multiple debug sessions
- Environment variable handling
- Source map configuration
- Debugger attachment verification

### POC Debug Infrastructure

**Purpose**: Enables debugging of individual POCs in isolation

**Implementation**:

- Enhanced package.json scripts for each POC
- TypeScript source map generation
- Debugger attachment at startup
- Dependency resolution for debugging context

**Debug Ports**:

- POC 01-11: Ports 9230-9240 (incremental)
- Automatic port conflict resolution

### Server Debug Infrastructure

**Purpose**: Provides debugging for production server components

**Features**:

- Hot reload with maintained debug connection
- Individual module debugging
- Cluster worker debugging options
- Environment variable access
- Real-time module state inspection

**Debug Configuration**:

- Main server process: Port 9229
- Worker processes: Ports 9241-9244
- Integration with nodemon for hot reload

### Client Debug Infrastructure

**Purpose**: Browser-based debugging for frontend components

**Features**:

- Chrome/Edge DevTools integration
- TypeScript source map support
- WebRTC connection debugging
- PWA debugging capabilities
- Real-time state inspection

**Browser Integration**:

- Webpack dev server with debugging enabled
- Source map generation for all TypeScript files
- Hot module replacement with debug preservation

### Test Debug Infrastructure

**Purpose**: Debugging capabilities for all test types

**Features**:

- Jest debugging with single-threaded execution
- Integration test debugging
- Test fixture and mock debugging
- Cross-component test debugging

**Test Debug Ports**:

- Unit tests: Port 9245
- Integration tests: Port 9246
- E2E tests: Port 9247

### End-to-End Debug Infrastructure

**Purpose**: Full system debugging across client, server, and test interactions

**Features**:

- Simultaneous client and server debugging
- WebRTC connection debugging across both ends
- Real-time data flow debugging
- Multi-process debugging coordination
- Full user journey debugging from browser to backend

**E2E Debug Configuration**:

- Cypress debugging with browser DevTools
- Server-side debugging during E2E test execution
- WebRTC signaling debugging
- Media stream debugging across client-server boundary
- Database and Redis debugging during E2E flows

## Data Models

### Debug Configuration Model

```typescript
interface DebugConfig {
  component: 'poc' | 'server' | 'client' | 'test';
  target: string; // specific POC, module, or test file
  port: number;
  sourceMaps: boolean;
  hotReload: boolean;
  environment: Record<string, string>;
  breakOnStart: boolean;
}
```

### Debug Session Model

```typescript
interface DebugSession {
  id: string;
  config: DebugConfig;
  status: 'starting' | 'attached' | 'running' | 'paused' | 'stopped';
  pid: number;
  debuggerUrl: string;
  startTime: Date;
  logs: string[];
}
```

## Error Handling

### Port Conflict Resolution

1. **Detection**: Check if debug port is already in use
2. **Resolution**: Automatically increment port number
3. **Notification**: Inform developer of port change
4. **Retry**: Attempt connection with new port

### Debug Attachment Failures

1. **Timeout Handling**: 30-second timeout for debugger attachment
2. **Fallback**: Provide non-debug execution option
3. **Error Reporting**: Clear error messages with troubleshooting steps
4. **Recovery**: Automatic cleanup of failed debug sessions

### Source Map Issues

1. **Validation**: Verify source map generation before debugging
2. **Regeneration**: Automatic rebuild if source maps are missing
3. **Fallback**: Debug compiled JavaScript if TypeScript maps fail
4. **Notification**: Warn developer about source map limitations

## Testing Strategy

### Debug Infrastructure Testing

1. **Unit Tests**: Test debug script generation and configuration
2. **Integration Tests**: Verify debugger attachment across components
3. **E2E Tests**: Test complete debugging workflows
4. **Performance Tests**: Ensure debugging doesn't impact performance significantly

### Debug Session Validation

1. **Attachment Verification**: Confirm debugger successfully attaches
2. **Breakpoint Testing**: Verify breakpoints work correctly
3. **Source Map Validation**: Test TypeScript debugging accuracy
4. **Hot Reload Testing**: Ensure debugging persists through code changes

### Cross-Platform Testing

1. **VS Code Integration**: Test all launch configurations
2. **Browser Compatibility**: Verify Chrome and Edge debugging
3. **Node.js Versions**: Test across supported Node.js versions
4. **Operating System**: Validate on Linux, macOS, and Windows

## Implementation Details

### Enhanced Package.json Scripts

Each component will receive enhanced debugging scripts:

```json
{
  "scripts": {
    "debug": "node --inspect-brk=0.0.0.0:9229 dist/index.js",
    "debug:dev": "nodemon --exec node --inspect-brk=0.0.0.0:9229 -r ts-node/register src/index.ts",
    "debug:test": "node --inspect-brk node_modules/.bin/jest --runInBand"
  }
}
```

### VS Code Launch Configurations

Comprehensive launch.json configurations for all debugging scenarios:

1. Individual POC debugging
2. Server component debugging
3. Client browser debugging
4. Test suite debugging
5. Full-stack debugging
6. End-to-end debugging with simultaneous client/server
7. Compound debugging configurations for multi-process scenarios

### Debug Documentation

1. **Quick Start Guide**: Getting started with debugging
2. **Component-Specific Guides**: Debugging each type of component
3. **Troubleshooting Guide**: Common issues and solutions
4. **Advanced Debugging**: Performance debugging and optimization
5. **VS Code Integration**: Using VS Code debugging features

### Monitoring and Logging

1. **Debug Session Tracking**: Monitor active debug sessions
2. **Performance Impact**: Track debugging overhead
3. **Error Logging**: Comprehensive error logging for debug failures
4. **Usage Analytics**: Track debugging feature usage

This design provides a comprehensive debugging infrastructure that meets all requirements while maintaining the existing codebase structure and not modifying POC or production code unnecessarily.
