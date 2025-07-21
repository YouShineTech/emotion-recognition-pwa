# Dynamic Debugging & Development Guide

## 🚀 **Interactive Development Console**

Start the interactive development environment:

```bash
npm run dev:interactive
```

This gives you a command-line interface to control development in real-time.

### **Interactive Commands:**

| Command                       | Description                     | Example                |
| ----------------------------- | ------------------------------- | ---------------------- |
| `start`                       | Start development servers       | `start`                |
| `debug`                       | Start servers in debug mode     | `debug`                |
| `task 2`                      | Work on specific task           | `task 2`               |
| `module media-capture`        | Focus on specific module        | `module media-capture` |
| `test`                        | Run tests in watch mode         | `test`                 |
| `inspect client/src/index.ts` | View file contents              | `inspect <file>`       |
| `edit server/src/index.ts`    | Open file in VS Code            | `edit <file>`          |
| `monitor`                     | Watch module communications     | `monitor`              |
| `status`                      | Show current development status | `status`               |

## 🐛 **VS Code Debugging (Step-through)**

### **1. Debug Server Code:**

```bash
# Method 1: VS Code Debug Panel
1. Open server/src/index.ts
2. Set breakpoints (click left of line numbers)
3. Press F5 → Select "🚀 Debug Server"
4. Code execution stops at breakpoints

# Method 2: Interactive Console
npm run dev:interactive
> debug
# Then attach VS Code debugger
```

### **2. Debug Client Code:**

```bash
# Method 1: VS Code + Chrome
1. Start server: npm run dev:server
2. Set breakpoints in client/src/index.ts
3. Press F5 → Select "🌐 Debug Client"
4. Chrome opens with DevTools attached

# Method 2: Chrome DevTools
1. Open http://localhost:3000
2. Press F12 → Sources tab
3. Find your TypeScript files
4. Set breakpoints and step through
```

### **3. Debug Full Stack:**

```bash
# Debug both client and server simultaneously
1. Press F5 → Select "🚀 Debug Full Stack"
2. Both debuggers start together
3. Set breakpoints in both client and server code
```

## 🔍 **Step-by-Step Debugging Workflow**

### **Example: Debug Media Capture Module**

1. **Start Interactive Mode:**

   ```bash
   npm run dev:interactive
   > module media-capture
   ```

2. **Set Breakpoints:**

   ```bash
   # Open in VS Code
   > edit client/src/modules/media-capture/MediaCaptureModule.ts

   # Set breakpoints on these lines:
   - Line 17: requestPermissions() method
   - Line 43: startCapture() method
   - Line 54: stopCapture() method
   ```

3. **Start Debug Mode:**

   ```bash
   > debug
   # Server starts with debugger attached
   ```

4. **Trigger Breakpoints:**

   ```bash
   # Open browser to http://localhost:3000
   # Click "Start Emotion Recognition"
   # Code execution stops at your breakpoints
   ```

5. **Step Through Code:**
   - **F10** - Step over (next line)
   - **F11** - Step into (enter function)
   - **Shift+F11** - Step out (exit function)
   - **F5** - Continue execution

## 📊 **Real-time Development Monitoring**

### **Module Communication Monitor:**

```bash
npm run dev:interactive
> monitor

# Shows real-time communication between modules:
📡 MediaCapture → WebRTCTransport: data_transfer (1024 bytes)
📡 WebRTCTransport → MediaRelay: stream_data (2048 bytes)
```

### **Live Code Changes:**

```bash
# Watch mode - automatically rebuilds on changes
npm run dev:interactive
> build

# Make changes to any file
# Build automatically triggers
# Browser auto-refreshes
```

## 🧪 **Test-Driven Development**

### **Interactive Testing:**

```bash
npm run dev:interactive
> test

# Tests run in watch mode
# Make code changes
# Tests automatically re-run
# See results in real-time
```

### **Debug Failing Tests:**

```bash
# In VS Code:
1. Open test file: client/src/modules/media-capture/MediaCaptureModule.test.ts
2. Set breakpoints in test or source code
3. Press F5 → Select "🧪 Debug Jest Tests"
4. Step through test execution
```

## 🎯 **Task-Focused Development**

### **Work on Specific Tasks:**

```bash
npm run dev:interactive
> task 2

# Shows task details:
📝 Task Details:
WebRTC Media Capture PoC
- Create basic HTML page with getUserMedia API integration
- Implement camera/microphone permission handling
- Add device enumeration and selection functionality
- Test cross-browser compatibility

# Now all commands are focused on this task
[Task 2] dev> status
[Task 2] dev> module media-capture
[Task 2] dev> test
```

## 🔧 **Advanced Debugging Techniques**

### **1. Chrome DevTools Integration:**

```bash
# Start debug server
npm run dev:debug

# Open Chrome and go to:
chrome://inspect

# Click "inspect" next to your Node.js process
# Full Chrome DevTools for server-side code
```

### **2. Network Debugging:**

```bash
# Monitor WebRTC connections
1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Filter by "WS" (WebSocket)
4. See real-time WebRTC signaling
```

### **3. Performance Profiling:**

```bash
# In Chrome DevTools:
1. Performance tab
2. Click Record
3. Interact with your app
4. Stop recording
5. Analyze performance bottlenecks
```

## 📝 **Code Inspection & Editing**

### **Quick File Inspection:**

```bash
npm run dev:interactive
> inspect client/src/index.ts

# Shows file contents with line numbers
📄 client/src/index.ts (150 lines)
──────────────────────────────────────────────────
  1: // Client Entry Point
  2: // Emotion Recognition PWA Frontend
  3:
  4: import { MediaCaptureModule } from './modules/media-capture/MediaCaptureModule';
  ...
```

### **Quick Editing:**

```bash
> edit server/src/index.ts
# Opens file in VS Code immediately
```

## 🚨 **Error Debugging**

### **Common Debugging Scenarios:**

1. **WebRTC Connection Issues:**

   ```bash
   # Debug WebRTC module specifically
   npm run debug:webrtc
   > init ws://localhost:3001
   > connect
   > state
   ```

2. **Module Communication Problems:**

   ```bash
   # Monitor module interactions
   npm run dev:interactive
   > monitor
   # Watch for failed communications
   ```

3. **Build Errors:**
   ```bash
   # Watch build process
   npm run dev:interactive
   > build
   # See compilation errors in real-time
   ```

## 💡 **Pro Tips**

### **Efficient Debugging Workflow:**

1. **Use Interactive Console** for quick commands
2. **Set Strategic Breakpoints** at module boundaries
3. **Monitor Module Communications** to understand data flow
4. **Use Watch Mode** for immediate feedback
5. **Debug Tests** to understand expected behavior

### **Keyboard Shortcuts:**

- **F5** - Start debugging
- **Ctrl+Shift+F5** - Restart debugging
- **F9** - Toggle breakpoint
- **F10** - Step over
- **F11** - Step into
- **Shift+F11** - Step out

## 🎮 **Try It Now!**

```bash
# Start interactive development
npm run dev:interactive

# Try these commands:
> help
> status
> start
> task 2
> module media-capture
> debug
```

This gives you complete control over the development process with real-time debugging, monitoring, and code inspection! 🚀
