# Debug Configurations Guide

This document describes all available debug configurations in VSCode for the Emotion Recognition PWA project.

## Prerequisites

Before using debug configurations, ensure you have:

1. **VSCode Extensions**: Install the following extensions:
   - Debugger for Chrome
   - Debugger for Firefox (optional)
   - Node.js debugging support (built-in)

2. **Dependencies**: Run the following to install all dependencies:

   ```bash
   npm run install:all
   ```

3. **Build**: Ensure the project is built:
   ```bash
   npm run build:dev
   ```

## Available Debug Configurations

### Client-Side Debugging

#### Browser Debugging

- **Debug Client (Chrome)**: Launches Chrome with debugging enabled, connects to webpack dev server
- **Debug Client (Edge)**: Same as Chrome but uses Microsoft Edge
- **Debug Client (Firefox)**: Uses Firefox for debugging (requires Firefox Debugger extension)

#### Client Test Debugging

- **Debug All Client Tests**: Runs all client-side Jest tests with debugging
- **Debug Current Test File**: Debugs the currently open test file
- **Debug POC: Media Capture**: Debugs Media Capture module tests
- **Debug POC: Overlay Renderer**: Debugs Overlay Renderer module tests
- **Debug POC: PWA Shell**: Debugs PWA Shell module tests
- **Debug POC: WebRTC Transport**: Debugs WebRTC Transport module tests

### Server-Side Debugging

#### Server Application Debugging

- **Debug Server**: Runs the server with debugging enabled
- **Debug Full Stack**: Starts server with debugging, then launches client browser

#### Server Test Debugging

- **Debug All Server Tests**: Runs all server-side Jest tests with debugging
- **Debug Server Integration Tests**: Runs integration tests with debugging
- **Debug POC: Audio Analysis**: Debugs Audio Analysis module tests
- **Debug POC: Connection Manager**: Debugs Connection Manager module tests
- **Debug POC: Facial Analysis**: Debugs Facial Analysis module tests
- **Debug POC: Frame Extraction**: Debugs Frame Extraction module tests
- **Debug POC: Media Relay**: Debugs Media Relay module tests
- **Debug POC: Nginx Server**: Debugs Nginx Server module tests
- **Debug POC: Overlay Generator**: Debugs Overlay Generator module tests

## How to Use Debug Configurations

### Method 1: VSCode Debug Panel

1. Open the Debug panel (Ctrl+Shift+D / Cmd+Shift+D)
2. Select the desired configuration from the dropdown
3. Click the green play button or press F5

### Method 2: Command Palette

1. Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Type "Debug: Select and Start Debugging"
3. Choose your configuration

### Method 3: Keyboard Shortcuts

- F5: Start debugging with the currently selected configuration
- Ctrl+F5: Start without debugging
- Shift+F5: Stop debugging

## Debugging Individual POCs

Each POC (Proof of Concept) module has its own debug configuration:

### Client POCs

- **Media Capture**: Handles device media access and stream management
- **Overlay Renderer**: Renders emotion overlays on video streams
- **PWA Shell**: Progressive Web App shell functionality
- **WebRTC Transport**: WebRTC communication handling

### Server POCs

- **Audio Analysis**: Audio emotion analysis processing
- **Connection Manager**: WebSocket and connection management
- **Facial Analysis**: Facial emotion recognition processing
- **Frame Extraction**: Video frame extraction and processing
- **Media Relay**: Media stream relay functionality
- **Nginx Server**: Web server configuration and management
- **Overlay Generator**: Server-side overlay data generation

## Debugging Tips

### Setting Breakpoints

1. Click in the gutter next to line numbers to set breakpoints
2. Use conditional breakpoints for specific scenarios
3. Set logpoints to output values without stopping execution

### Debug Console

- Access variables and execute code in the debug console
- Use `console.log()` statements for additional debugging output

### Source Maps

- Client debugging uses webpack source maps for TypeScript debugging
- Server debugging uses ts-node for direct TypeScript execution

### Environment Variables

- Test configurations set `NODE_ENV=test`
- Development configurations set `NODE_ENV=development`
- Check `.env.*` files for environment-specific settings

## Troubleshooting

### Common Issues

1. **"Cannot connect to runtime process"**
   - Ensure the dev server is running
   - Check if ports 3000 (client) and 3001 (server) are available

2. **"Source maps not working"**
   - Verify webpack configuration includes source maps
   - Check TypeScript configuration has `sourceMap: true`

3. **"Module not found" errors**
   - Run `npm run install:all` to ensure all dependencies are installed
   - Check path mappings in tsconfig.json files

4. **Jest tests not debugging**
   - Ensure Jest is installed in the respective directories
   - Check Jest configuration files are properly set up

### Getting Help

If you encounter issues:

1. Check the VSCode Debug Console for error messages
2. Verify all dependencies are installed
3. Ensure the project builds successfully
4. Check the terminal output for any error messages

## Configuration Files

The debug configurations are defined in:

- `.vscode/launch.json`: Debug configurations
- `.vscode/tasks.json`: Pre-launch tasks
- `client/jest.config.js`: Client test configuration
- `server/jest.config.js`: Server test configuration
- `server/jest.integration.config.js`: Integration test configuration
