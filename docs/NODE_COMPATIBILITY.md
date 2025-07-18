# Node.js Compatibility Guide

## Current Setup (Node.js 18.19.1)

The project has been configured to work with Node.js 18+ to ensure compatibility with your current environment.

## Removed Dependencies (Temporarily)

These packages require Node.js 20+ and have been removed from the initial setup:

- `mediasoup` - Requires Node.js 20+
- `opencv4nodejs` - Complex native compilation
- `@tensorflow/tfjs-node` - Heavy ML dependency
- `artillery` - Load testing (downgraded to v1.7.9)

## Current Working Dependencies

✅ **Server Dependencies:**

- `express` - Web server
- `socket.io` - WebRTC signaling
- `winston` - Logging
- `redis` - Session storage
- `cors` - Cross-origin requests
- `helmet` - Security headers
- `dotenv` - Environment configuration

✅ **Client Dependencies:**

- `socket.io-client` - WebRTC signaling
- `@types/webrtc` - TypeScript definitions

## Upgrade Path

### Option 1: Upgrade Node.js (Recommended)

```bash
# Using Node Version Manager (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# Verify version
node --version  # Should show v20.x.x
```

### Option 2: Use Docker (Alternative)

```bash
# Use Node.js 20 in Docker
docker run -it --rm -v $(pwd):/app -w /app node:20 npm run setup
```

### Option 3: Continue with Node.js 18 (Current)

The foundation framework works with Node.js 18. Advanced features will be added later:

```bash
# Current working setup
npm run setup:basic
npm run dev:basic
```

## Re-adding Advanced Dependencies

Once you upgrade to Node.js 20+, add these back:

```bash
# Add Mediasoup for WebRTC media server
npm install --save mediasoup@^3.12.16

# Add OpenCV for facial analysis (requires system dependencies)
sudo apt-get install libopencv-dev  # Ubuntu/Debian
npm install --save opencv4nodejs@^5.6.0

# Add TensorFlow for audio analysis
npm install --save @tensorflow/tfjs-node@^4.14.0

# Add load testing
npm install --save-dev artillery@^2.0.0
```

## System Dependencies for Advanced Features

### OpenCV (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install -y \
    libopencv-dev \
    libopencv-contrib-dev \
    cmake \
    build-essential
```

### OpenCV (macOS)

```bash
brew install opencv
```

### OpenCV (Windows)

```bash
# Use vcpkg or pre-built binaries
# See: https://docs.opencv.org/4.x/d3/d52/tutorial_windows_install.html
```

## Current Limitations

With Node.js 18 setup:

❌ **Not Available:**

- Mediasoup media relay (WebRTC server)
- OpenCV facial analysis
- TensorFlow audio analysis
- Advanced load testing

✅ **Available:**

- Complete project structure
- Build and test system
- WebRTC client-side code
- Socket.IO signaling
- Module stubs and interfaces
- CI/CD pipeline
- Development tools

## Testing Current Setup

```bash
# Clean install
npm run clean:install

# Basic setup (Node.js 18 compatible)
npm run setup:basic

# Start development
npm run dev:basic

# Run tests
npm test
```

## Recommended Next Steps

1. **Immediate**: Use current Node.js 18 setup for development
2. **Short-term**: Upgrade to Node.js 20+ for full features
3. **Long-term**: Deploy with Docker using Node.js 20+

The foundation framework is fully functional with Node.js 18 - you can start developing the core modules and upgrade later for advanced AI features.
