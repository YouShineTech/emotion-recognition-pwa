# Dynamic Debugging Guide

## Overview

The Emotion Recognition PWA provides comprehensive debugging capabilities for all components including POCs, production code, and tests. This guide covers how to use the debugging infrastructure to step through code line by line.

## Quick Start

### VS Code Debugging (Recommended)

1. Open the project in VS Code
2. Go to the Debug panel (Ctrl+Shift+D)
3. Select the appropriate debug configuration from the dropdown
4. Press F5 or click the green play button
5. Set breakpoints by clicking in the gutter next to line numbers

### Command Line Debugging

Use the unified npm scripts for consistent debugging across all components:

```bash
# Debug specific POCs
npm run debug:poc:01  # Media Capture
npm run debug:poc:02  # WebRTC Transport
npm run debug:poc:03  # Media Relay
# ... (all POCs 01-11 available)

# Debug production components
npm run debug:server  # Server with hot reload
npm run debug:client  # Client in browser

# Debug tests
npm run debug:integration  # Integration tests
npm run debug:e2e         # End-to-end tests

# Debug full stack
npm run dev:debug  # Both client and server
```

## Component-Specific Debugging

### POC Debugging

Each POC can be debugged independently:

**Available POCs:**

- POC 01: Media Capture Module
- POC 02: WebRTC Transport Module
- POC 03: Media Relay Module
- POC 04: Frame Extraction Module
- POC 05: Facial Analysis Module
- POC 06: Audio Analysis Module
- POC 07: Overlay Generator Module
- POC 08: Overlay Renderer Module
- POC 09: Connection Manager Module
- POC 10: PWA Shell Module
- POC 11: Nginx Server Module

**VS Code Configuration:** Select "Debug POC XX - [Name]" from the debug dropdown

**Command Line:** `npm run debug:poc:XX` (where XX is the POC number)

**Features:**

- TypeScript source map support
- Breakpoint debugging
- Variable inspection
- Call stack navigation
- Step-through execution

### Server Debugging

**VS Code Configuration:** "Debug Server Only"

**Command Line:** `npm run debug:server`

**Features:**

- Hot reload with debugging maintained
- Environment variable access
- Module-level debugging
- Real-time state inspection
- Cluster worker debugging (if applicable)

**Debug Ports:**

- Main server: 9229
- Worker processes: 9241-9244

### Client Debugging

**VS Code Configuration:** "Debug Client (Chrome)" or "Debug Client (Edge)"

**Command Line:** `npm run debug:client`

**Features:**

- Browser DevTools integration
- TypeScript source maps
- WebRTC connection debugging
- PWA debugging capabilities
- Hot module replacement with debug preservation

### Test Debugging

#### Unit Tests

**Client Tests:**

- VS Code: "Debug Jest Tests (Client)"
- Command: `cd client && npm run test:debug`

**Server Tests:**

- VS Code: "Debug Jest Tests (Server)"
- Command: `cd server && npm run test:debug`

#### Integration Tests

**VS Code Configuration:** "Debug Integration Tests"

**Command Line:** `npm run debug:integration`

**Features:**

- Full system context debugging
- Test fixture and mock debugging
- Cross-component debugging

#### End-to-End Tests

**VS Code Configuration:** "Debug E2E Tests"

**Command Line:** `npm run debug:e2e`

**Features:**

- Cypress debugging with browser DevTools
- Full user journey debugging
- WebRTC signaling debugging
- Database and Redis debugging during flows

## Advanced Debugging

### Full Stack Debugging

Debug both client and server simultaneously:

**VS Code Configuration:** "Debug E2E Full Stack" (compound configuration)

**Command Line:** `npm run debug:e2e:server` or `npm run debug:e2e:client`

### Multi-Process Debugging

For debugging multiple components at once:

1. Use compound configurations in VS Code
2. Each process gets its own debug port
3. Switch between processes in the debug console

### Source Map Configuration

All TypeScript files are automatically configured with source maps for debugging:

- Client: Webpack generates source maps
- Server: TypeScript compiler generates source maps
- POCs: Individual TypeScript compilation with source maps

## Troubleshooting

### Common Issues

#### Debugger Won't Attach

**Symptoms:** Debug session starts but breakpoints don't work

**Solutions:**

1. Ensure TypeScript is compiled: `npm run build`
2. Check source maps are generated
3. Verify correct debug port (check for conflicts)
4. Restart VS Code and try again

#### Port Conflicts

**Symptoms:** "Port already in use" errors

**Solutions:**

1. Kill existing processes: `npm run kill:ports`
2. Use different debug ports (automatically handled)
3. Check for other Node.js processes

#### Source Maps Not Working

**Symptoms:** Debugger shows compiled JavaScript instead of TypeScript

**Solutions:**

1. Rebuild with source maps: `npm run build:dev`
2. Check tsconfig.json has `"sourceMap": true`
3. Verify webpack configuration for client debugging

#### Hot Reload Issues

**Symptoms:** Debugging stops working after code changes

**Solutions:**

1. Use `debug:dev` scripts that support hot reload
2. Restart debug session after major changes
3. Check nodemon configuration

### Debug Ports Reference

| Component         | Port      | Usage                       |
| ----------------- | --------- | --------------------------- |
| Server Main       | 9229      | Production server debugging |
| Server Workers    | 9241-9244 | Cluster worker debugging    |
| POC 01-11         | 9230-9240 | Individual POC debugging    |
| Unit Tests        | 9245      | Jest unit test debugging    |
| Integration Tests | 9246      | Integration test debugging  |
| E2E Tests         | 9247      | End-to-end test debugging   |

### Performance Considerations

- Debugging adds overhead - use only during development
- Source maps increase memory usage
- Hot reload with debugging may be slower
- Disable debugging for performance testing

## Best Practices

### Setting Breakpoints

1. **Strategic Placement:** Set breakpoints at key decision points
2. **Conditional Breakpoints:** Use conditions to break only when needed
3. **Logpoints:** Use for logging without stopping execution

### Debugging Workflow

1. **Start Small:** Debug individual components before full stack
2. **Use Console:** Leverage console.log for quick debugging
3. **Step Through:** Use step-over, step-into, step-out effectively
4. **Inspect Variables:** Use the Variables panel to examine state

### Code Debugging

1. **Don't Modify POC Code:** Use debugging tools instead of code changes
2. **Use Watch Expressions:** Monitor specific variables or expressions
3. **Call Stack Navigation:** Understand the execution flow
4. **Exception Handling:** Enable break on exceptions for error debugging

## Integration with Development Workflow

### Git Hooks

Debugging configurations are preserved across commits and don't interfere with:

- Pre-commit hooks
- Linting and formatting
- Test execution

### CI/CD

Debugging configurations are development-only and don't affect:

- Build processes
- Deployment pipelines
- Production environments

### Team Development

- All debugging configurations are committed to the repository
- Consistent debugging experience across team members
- No additional setup required for new developers

## Additional Resources

- [VS Code Debugging Documentation](https://code.visualstudio.com/docs/editor/debugging)
- [Node.js Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [Chrome DevTools Documentation](https://developers.google.com/web/tools/chrome-devtools)
- [Jest Debugging Guide](https://jestjs.io/docs/troubleshooting)

For project-specific debugging questions, refer to the component documentation in the `docs/` directory.
