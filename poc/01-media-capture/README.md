# Media Capture Module POC

This POC demonstrates the WebRTC Media Capture Module functionality in isolation. It uses the exact same module code as the full system.

## 🎯 Purpose

Validates the Media Capture Module's ability to:

- Access camera and microphone using getUserMedia API
- Enumerate and switch between media devices
- Handle various error scenarios (permission denied, device not found, etc.)
- Manage media streams and device configurations
- Emit events for stream lifecycle and device changes

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run the POC
npm run poc

# Run in debug mode
npm run debug

# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 🧪 Testing

### Unit Tests

Comprehensive unit tests covering:

- ✅ **Initialization** - getUserMedia integration and error handling
- ✅ **Device Management** - Device enumeration and switching
- ✅ **Stream Management** - Stream lifecycle and cleanup
- ✅ **Configuration** - Dynamic configuration updates
- ✅ **Event Handling** - Event emission and listener management
- ✅ **Error Scenarios** - Permission denied, device not found, constraints
- ✅ **Performance** - Initialization timing and rapid operations

### Test Coverage

```bash
npm run test:coverage
```

Expected coverage: >90% for all metrics

## 🔍 Debug Mode

Run the POC in debug mode to step through the code:

```bash
npm run debug
```

Or use VS Code debug configuration:

1. Open VS Code in this directory
2. Set breakpoints in `src/poc.ts`
3. Press F5 to start debugging

## 📊 POC Features

### Core Functionality

- **getUserMedia Integration** - Real browser API usage
- **Device Enumeration** - List available cameras and microphones
- **Device Switching** - Switch between different devices
- **Stream Management** - Start, stop, and manage media streams
- **Error Handling** - Comprehensive error scenarios

### Configuration Options

```typescript
const config = {
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
    facingMode: 'user',
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
};
```

### Event System

```typescript
module.on('streamStarted', stream => {
  console.log('Stream started:', stream.id);
});

module.on('deviceSwitched', ({ type, deviceId }) => {
  console.log(`Switched ${type} to device:`, deviceId);
});

module.on('error', error => {
  console.error('Media capture error:', error);
});
```

## 🌐 Browser Compatibility

Tested and validated on:

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 📈 Performance Metrics

Expected performance benchmarks:

- **Initialization**: < 500ms
- **Device Enumeration**: < 100ms
- **Device Switching**: < 300ms
- **Stream Cleanup**: < 50ms

## 🔧 Integration with Full System

This POC uses the identical module code as the full system:

- **Same interfaces** - Implements `IMediaCaptureModule`
- **Same error handling** - Consistent error types and messages
- **Same configuration** - Compatible configuration options
- **Same events** - Identical event system

### Integration Points

```typescript
// Full system usage (identical to POC)
import { MediaCaptureModule } from './modules/media-capture/MediaCaptureModule';

const mediaCapture = new MediaCaptureModule(config);
await mediaCapture.initialize();
```

## 🐛 Common Issues

### Permission Denied

```
Error: PermissionDeniedError - Camera/microphone access denied by user
```

**Solution**: Ensure HTTPS and user grants permission

### Device Not Found

```
Error: DeviceNotFoundError - No camera or microphone found
```

**Solution**: Check device connections and drivers

### Constraint Error

```
Error: ConstraintError - Camera/microphone constraints cannot be satisfied
```

**Solution**: Adjust video/audio constraints

## 📚 API Reference

### Methods

- `initialize(): Promise<MediaStream>` - Initialize media capture
- `stop(): void` - Stop current media stream
- `switchCamera(deviceId: string): Promise<MediaStream>` - Switch camera
- `switchMicrophone(deviceId: string): Promise<MediaStream>` - Switch microphone
- `enumerateDevices(): Promise<DeviceInfo[]>` - List available devices
- `updateConfig(config: Partial<CaptureConfig>): void` - Update configuration

### Events

- `streamStarted` - Media stream started
- `streamStopped` - Media stream stopped
- `deviceSwitched` - Device switched
- `devicesChanged` - Available devices changed
- `error` - Error occurred

### Static Methods

- `MediaCaptureModule.isSupported(): boolean` - Check browser support
- `MediaCaptureModule.getSupportedConstraints(): Promise<MediaTrackSupportedConstraints>` - Get supported constraints

## 🔗 Related POCs

- **02-webrtc-transport** - WebRTC peer connections and signaling
- **08-overlay-renderer** - Real-time overlay rendering
- **10-pwa-shell** - PWA functionality and service workers
