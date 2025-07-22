# Dynamic Debugging Guide - All POCs and Unit Tests

## Overview

This comprehensive guide provides step-by-step instructions for dynamically debugging each of the 11 technology-specific POCs (Proof of Concepts) and their associated unit tests. Each POC can be debugged independently using various tools and techniques across different environments.

## 🎯 Quick Reference Commands

### **All POCs at Once**

```bash
# Run all client POC tests
npm run test:client

# Run all server POC tests
npm run test:server

# Run specific POC
npm run test:client -- --testNamePattern="ModuleName"
npm run test:server -- --testNamePattern="ModuleName"
```

## 🔧 Client-Side POC Debugging

### **1. MediaCaptureModule POC**

**Technology**: WebRTC getUserMedia API, MediaStream API

#### **Unit Test Debugging**

```bash
# Run with verbose output
npm run test:client -- --testNamePattern="MediaCaptureModule" --verbose

# Debug with Node.js inspector
node --inspect-brk ./node_modules/.bin/jest client/src/modules/media-capture/MediaCaptureModule.test.ts --runInBand

# VS Code debug configuration
```

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug MediaCapture Tests",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["client/src/modules/media-capture/MediaCaptureModule.test.ts", "--runInBand"],
  "console": "integratedTerminal"
}
```

#### **Browser Debugging**

1. **Open**: http://localhost:3000
2. **DevTools**: F12 → Console
3. **Test permissions**:
   ```javascript
   // In browser console
   navigator.mediaDevices
     .getUserMedia({ video: true, audio: true })
     .then(stream => console.log('Success:', stream))
     .catch(err => console.error('Error:', err));
   ```

#### **Device Testing**

- **Chrome**: chrome://settings/content/camera
- **Firefox**: about:preferences#privacy → Permissions → Camera
- **Safari**: Safari → Preferences → Websites → Camera

---

### **2. WebRTCTransportModule POC**

**Technology**: WebRTC, RTCPeerConnection, STUN/TURN

#### **Unit Test Debugging**

```bash
# Run specific tests
npm run test:client -- --testNamePattern="WebRTCTransportModule" --verbose

# Debug with breakpoints
node --inspect-brk ./node_modules/.bin/jest client/src/modules/webrtc-transport/WebRTCTransportModule.test.ts --runInBand
```

#### **Browser Debugging**

1. **Open**: http://localhost:3000
2. **DevTools**: F12 → Console
3. **WebRTC debugging**:

   ```javascript
   // Check WebRTC support
   console.log('RTCPeerConnection supported:', !!window.RTCPeerConnection);

   // Test STUN server
   const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
   pc.onicecandidate = e => console.log('ICE candidate:', e.candidate);
   ```

#### **Advanced WebRTC Debugging**

- **Chrome**: chrome://webrtc-internals/
- **Firefox**: about:webrtc
- **Safari**: Develop → WebRTC

---

### **3. OverlayRendererModule POC**

**Technology**: HTML5 Canvas, WebGL, CSS animations

#### **Unit Test Debugging**

```bash
# Run canvas tests
npm run test:client -- --testNamePattern="OverlayRendererModule" --verbose

# Debug with visual inspection
node --inspect-brk ./node_modules/.bin/jest client/src/modules/overlay-renderer/OverlayRendererModule.test.ts --runInBand
```

#### **Browser Debugging**

1. **Open**: http://localhost:3000
2. **DevTools**: F12 → Elements → Canvas inspection
3. **Canvas debugging**:
   ```javascript
   // Test canvas rendering
   const canvas = document.createElement('canvas');
   const ctx = canvas.getContext('2d');
   ctx.fillStyle = 'red';
   ctx.fillRect(0, 0, 100, 100);
   console.log('Canvas rendered:', canvas.toDataURL());
   ```

#### **Performance Debugging**

- **Chrome**: Performance tab → Record canvas operations
- **Firefox**: Performance → Canvas profiler

---

### **4. PWAShellModule POC**

**Technology**: Service Workers, Web App Manifest, Cache API

#### **Unit Test Debugging**

```bash
# Run PWA tests
npm run test:client -- --testNamePattern="PWAShellModule" --verbose

# Debug service worker registration
node --inspect-brk ./node_modules/.bin/jest client/src/modules/pwa-shell/PWAShellModule.test.ts --runInBand
```

#### **Browser Debugging**

1. **Open**: http://localhost:3000
2. **DevTools**: F12 → Application tab
3. **Service Worker debugging**:
   - **Service Workers**: Check registration status
   - **Manifest**: Verify PWA configuration
   - **Cache Storage**: Check cached resources

#### **PWA Testing Commands**

```javascript
// In browser console
// Check service worker
navigator.serviceWorker.controller;

// Check manifest
fetch('/manifest.json')
  .then(r => r.json())
  .then(console.log);

// Test install prompt
window.addEventListener('beforeinstallprompt', e => {
  console.log('Install prompt available:', e);
  e.preventDefault();
  window.deferredPrompt = e;
});
```

#### **Mobile PWA Testing**

- **Chrome Mobile**: chrome://inspect/#devices
- **Safari iOS**: Settings → Safari → Advanced → Web Inspector

---

## 🔧 Server-Side POC Debugging

### **5. MediaRelayModule POC**

**Technology**: Mediasoup, RTP/RTCP, DTLS/SRTP

#### **Unit Test Debugging**

```bash
# Run server tests
npm run test:server -- --testNamePattern="MediaRelayModule" --verbose

# Debug with Node.js inspector
node --inspect-brk ./node_modules/.bin/jest server/src/modules/media-relay/MediaRelayModule.test.ts --runInBand
```

#### **Docker Debugging**

```bash
# Debug in Docker container
docker-compose exec server node --inspect=0.0.0.0:9229 server/src/modules/media-relay/MediaRelayModule.test.ts
```

#### **Mediasoup Debugging**

```bash
# Enable debug logging
DEBUG=mediasoup* npm run test:server -- MediaRelayModule
```

---

### **6. FrameExtractionModule POC**

**Technology**: FFmpeg, RTP decoding, video codecs

#### **Unit Test Debugging**

```bash
# Run frame extraction tests
npm run test:server -- --testNamePattern="FrameExtractionModule" --verbose

# Debug with FFmpeg logging
DEBUG=ffmpeg* npm run test:server -- FrameExtractionModule
```

#### **FFmpeg Debugging**

```bash
# Test FFmpeg availability
ffmpeg -version

# Debug RTP processing
DEBUG=rtp* npm run test:server -- FrameExtractionModule
```

---

### **7. FacialAnalysisModule POC**

**Technology**: OpenFace toolkit, facial landmarks, Action Units

#### **Unit Test Debugging**

```bash
# Run facial analysis tests
npm run test:server -- --testNamePattern="FacialAnalysisModule" --verbose

# Debug with OpenFace logging
DEBUG=openface* npm run test:server -- FacialAnalysisModule
```

#### **OpenFace Debugging**

```bash
# Test OpenFace installation
which FeatureExtraction

# Debug facial landmarks
DEBUG=landmarks* npm run test:server -- FacialAnalysisModule
```

---

### **8. AudioAnalysisModule POC**

**Technology**: TensorFlow.js, MFCC, CNN models

#### **Unit Test Debugging**

```bash
# Run audio analysis tests
npm run test:server -- --testNamePattern="AudioAnalysisModule" --verbose

# Debug with TensorFlow logging
DEBUG=tensorflow* npm run test:server -- AudioAnalysisModule
```

#### **TensorFlow Debugging**

```bash
# Test TensorFlow availability
python -c "import tensorflow as tf; print(tf.__version__)"

# Debug model loading
DEBUG=model* npm run test:server -- AudioAnalysisModule
```

---

### **9. OverlayDataGenerator POC**

**Technology**: JSON serialization, emotion fusion algorithms

#### **Unit Test Debugging**

```bash
# Run data fusion tests
npm run test:server -- --testNamePattern="OverlayDataGenerator" --verbose

# Debug data processing
DEBUG=fusion* npm run test:server -- OverlayDataGenerator
```

---

### **10. ConnectionManagerModule POC**

**Technology**: Redis, session management, load balancing

#### **Unit Test Debugging**

```bash
# Run connection tests
npm run test:server -- --testNamePattern="ConnectionManagerModule" --verbose

# Debug with Redis logging
DEBUG=redis* npm run test:server -- ConnectionManagerModule
```

#### **Redis Debugging**

```bash
# Test Redis connection
redis-cli ping

# Monitor Redis commands
redis-cli monitor
```

---

### **11. NginxWebServerModule POC**

**Technology**: Nginx, SSL/TLS, HTTP/2, caching

#### **Unit Test Debugging**

```bash
# Run web server tests
npm run test:server -- --testNamePattern="NginxWebServerModule" --verbose

# Debug Nginx configuration
nginx -t
```

#### **Nginx Debugging**

```bash
# Check Nginx status
systemctl status nginx

# Debug logs
tail -f /var/log/nginx/error.log
```

---

## 🌐 Cross-Platform Debugging

### **Browser Compatibility Matrix**

| Browser | MediaCapture | WebRTC  | Canvas  | PWA          |
| ------- | ------------ | ------- | ------- | ------------ |
| Chrome  | ✅ Full      | ✅ Full | ✅ Full | ✅ Full      |
| Firefox | ✅ Full      | ✅ Full | ✅ Full | ✅ Full      |
| Safari  | ✅ Full      | ✅ Full | ✅ Full | ✅ iOS 11.3+ |
| Edge    | ✅ Full      | ✅ Full | ✅ Full | ✅ Full      |

### **Mobile Debugging**

- **Chrome DevTools**: chrome://inspect/#devices
- **Safari Web Inspector**: Settings → Safari → Advanced → Web Inspector
- **Firefox Remote Debugging**: about:debugging#/runtime/this-firefox

---

## 🚀 Quick Start Debugging Session

### **Step 1: Start Development Environment**

```bash
# Terminal 1: Start client
npm run dev:client

# Terminal 2: Start server (in new terminal)
npm run dev:server
```

### **Step 2: Open Debugging Tools**

- **Client**: http://localhost:3000
- **Server**: http://localhost:3001
- **API Docs**: http://localhost:3001/api/docs

### **Step 3: Debug Specific POC**

```bash
# Debug MediaCapture in browser
npm run test:client -- --testNamePattern="MediaCaptureModule" --watch

# Debug WebRTC in browser
npm run test:client -- --testNamePattern="WebRTCTransportModule" --watch

# Debug PWA installation
npm run test:client -- --testNamePattern="PWAShellModule" --watch
```

---

## 📊 Debugging Checklist

### **Before Debugging**

- [ ] Development server running
- [ ] All dependencies installed
- [ ] Environment variables configured
- [ ] Browser debugging tools open

### **During Debugging**

- [ ] Unit tests passing
- [ ] Integration tests working
- [ ] Cross-browser compatibility verified
- [ ] Performance metrics measured
- [ ] Error handling tested

### **After Debugging**

- [ ] All POCs verified independently
- [ ] Integration flow validated
- [ ] Documentation updated
- [ ] Performance benchmarks recorded

## 🎯 Next Steps

1. **Choose a POC** to debug from the 11 available
2. **Follow the specific debugging steps** for that technology
3. **Use the appropriate debugging tools** (browser, Node.js, Docker)
4. **Verify functionality** with unit tests and integration tests
5. **Document findings** for integration planning

All POCs are ready for dynamic debugging with comprehensive tooling support!
