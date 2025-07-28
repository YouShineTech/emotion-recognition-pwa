# 🚀 Complete Debugging Guide for Emotion Recognition PWA

## Overview

This guide explains how to use the enhanced debugging setup for dynamic module debugging in your emotion recognition PWA project.

## 📋 Current Debug Configurations

### 🌐 **Frontend Debugging (Client-side)**

- **Debug Client (Chrome)**: Launches Chrome with your PWA at localhost:3000
- **Debug Client (Edge)**: Same as above but using Microsoft Edge
- **Full Stack Debug**: Starts server + automatically launches Chrome client

### 🧪 **Module-Specific Testing**

Each module has its own debug configuration:

#### **Client Modules:**

- **Debug MediaCapture Tests**: Tests camera/microphone access
- **Debug OverlayRenderer Tests**: Tests emotion overlay rendering
- **Debug PWAShell Tests**: Tests PWA functionality
- **Debug WebRTCTransport Tests**: Tests WebRTC communication

#### **Server Modules:**

- **Debug AudioAnalysis Tests**: Tests audio emotion analysis
- **Debug FacialAnalysis Tests**: Tests facial emotion analysis
- **Debug FrameExtraction Tests**: Tests video frame processing
- **Debug MediaRelay Tests**: Tests media streaming
- **Debug ConnectionManager Tests**: Tests WebRTC connections
- **Debug NginxServer Tests**: Tests web server functionality
- **Debug OverlayGenerator Tests**: Tests overlay data generation

### 🔍 **Dynamic Debugging Options**

- **Debug Current Test File**: Debugs whatever test file you have open
- **Debug All Client Modules**: Runs all client module tests
- **Debug All Server Modules**: Runs all server module tests

## 🎯 **Step-by-Step Dynamic Module Debugging**

### **Method 1: Individual Module Debugging**

1. **Open the module file** you want to debug (e.g., `MediaCaptureModule.ts`)
2. **Set breakpoints** by clicking left of line numbers
3. **Press F5** or go to Run → Start Debugging
4. **Select the specific module test** from the dropdown
5. **Watch the execution flow** - you can step through module → test → module

### **Method 2: Test-Driven Debugging**

1. **Open the test file** for the module (e.g., `MediaCaptureModule.test.ts`)
2. **Set breakpoints** in both the test AND the module
3. **Press F5** → Select "Debug Current Test File"
4. **Step through**: Test → Module → Test → Module
5. **Watch variables** change as tests execute

### **Method 3: Full Integration Debugging**

1. **Start Full Stack Debug** (F5 → "Debug Full Stack")
2. **Set breakpoints** in both client and server modules
3. **Use browser** normally - breakpoints will hit when modules are called
4. **Watch the flow**: Browser → Client Module → Server Module → Response

## 🔧 **Advanced Debugging Techniques**

### **Cross-Module Debugging**

```typescript
// Example: Debugging MediaCapture → WebRTCTransport flow
// 1. Set breakpoints in both modules
// 2. Start "Debug Full Stack"
// 3. Trigger media capture in browser
// 4. Watch execution move between modules
```

### **Real-time Variable Inspection**

- **Variables Panel**: Shows current values
- **Watch Panel**: Add expressions to monitor
- **Call Stack**: See the execution path through modules
- **Console**: Interact with running code

### **Conditional Breakpoints**

Right-click on breakpoint → Add condition:

```typescript
// Example conditions:
deviceId === 'specific-camera-id';
stream.getVideoTracks().length > 0;
error.message.includes('permission');
```

## 📁 **Project Structure for Debugging**

```
client/src/modules/
├── media-capture/          # Camera/microphone access
├── overlay-renderer/       # Emotion overlay display
├── pwa-shell/             # PWA functionality
└── webrtc-transport/      # Client-side WebRTC

server/src/modules/
├── audio-analysis/        # Audio emotion detection
├── facial-analysis/       # Facial emotion detection
├── frame-extraction/      # Video frame processing
├── media-relay/          # Media streaming
├── connection-manager/   # WebRTC connections
├── nginx-server/         # Web server
└── overlay-generator/    # Overlay data creation
```

## 🎮 **Quick Start Commands**

### **Start Development with Debugging**

```bash
# Method 1: Use VSCode
F5 → Select "Debug Full Stack"

# Method 2: Manual
cd server && npm run dev    # Terminal 1
cd client && npm run dev    # Terminal 2
```

### **Debug Specific Module**

```bash
# Find your module test file
code client/src/modules/[module-name]/[ModuleName]Module.test.ts

# Press F5 → Select "[ModuleName] Tests"
```

## 🐛 **Common Debugging Scenarios**

### **"My breakpoint isn't hitting"**

1. Check if source maps are enabled
2. Verify the correct debug configuration
3. Ensure the file is actually being executed

### **"I want to see module interactions"**

1. Use "Debug Full Stack"
2. Set breakpoints in multiple modules
3. Watch the call stack as execution flows

### **"Testing individual POC functionality"**

1. Open the specific module test
2. Use module-specific debug configuration
3. Step through the POC implementation

## 🎓 **Learning Path for Embedded Developers**

### **Week 1: Understanding the Architecture**

- Start with individual module tests
- Use "Debug [Module] Tests" configurations
- Focus on one module at a time

### **Week 2: Integration Flow**

- Use "Debug Full Stack"
- Set breakpoints in client → server communication
- Watch WebRTC negotiation process

### **Week 3: Advanced Debugging**

- Use conditional breakpoints
- Debug race conditions in async operations
- Profile performance across modules

## 🚨 **Pro Tips**

1. **Use the Debug Console**: You can execute code in the context of your running application
2. **Watch Expressions**: Add `module.exports` to see what's being exported
3. **Call Stack Navigation**: Click any frame to jump to that point in execution
4. **Restart Debugging**: Ctrl+Shift+F5 to restart with same configuration

## 📝 **Next Steps**

- Try debugging a simple module first (MediaCapture)
- Then move to integration debugging
- Finally, debug the full emotion recognition flow
