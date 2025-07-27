#!/usr/bin/env node

// WebRTC Debug Script
// Connection diagnostics and media analysis tools

const http = require('http');
const WebSocket = require('ws');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
};

const log = (message, color = colors.reset) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
};

class WebRTCDebugger {
  constructor() {
    this.connections = new Map();
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      failedConnections: 0,
      dataChannelMessages: 0,
    };
  }

  async start() {
    log('🔧 Starting WebRTC Debugger...', colors.blue);

    // Test server connectivity
    await this.testServerConnection();

    // Monitor WebSocket signaling
    this.monitorSignaling();

    // Display debug interface
    this.displayDebugInterface();

    // Start periodic stats update
    setInterval(() => {
      this.updateStats();
    }, 2000);
  }

  async testServerConnection() {
    log('🔍 Testing server connection...', colors.cyan);

    try {
      const response = await this.makeRequest('http://localhost:3001/api/health');
      if (response) {
        log('✅ Server is accessible', colors.green);
        log(`📊 Active connections: ${response.activeConnections || 0}`, colors.cyan);

        if (response.resourceUsage) {
          const { cpuUsage, memoryUsage } = response.resourceUsage;
          log(`💻 Server resources: CPU ${cpuUsage.toFixed(1)}%, Memory ${memoryUsage.toFixed(1)}%`, colors.cyan);
        }
      }
    } catch (error) {
      log(`❌ Server connection failed: ${error.message}`, colors.red);
    }
  }

  monitorSignaling() {
    log('🔌 Connecting to WebSocket signaling server...', colors.cyan);

    try {
      const ws = new WebSocket('ws://localhost:3001/socket.io/?EIO=4&transport=websocket');

      ws.on('open', () => {
        log('✅ WebSocket connection established', colors.green);
      });

      ws.on('message', (data) => {
        try {
          const message = data.toString();
          this.handleSignalingMessage(message);
        } catch (error) {
          log(`⚠️  Error parsing WebSocket message: ${error.message}`, colors.yellow);
        }
      });

      ws.on('error', (error) => {
        log(`❌ WebSocket error: ${error.message}`, colors.red);
      });

      ws.on('close', () => {
        log('🔌 WebSocket connection closed', colors.yellow);

        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          log('🔄 Attempting to reconnect...', colors.cyan);
          this.monitorSignaling();
        }, 5000);
      });

    } catch (error) {
      log(`❌ Failed to connect to WebSocket: ${error.message}`, colors.red);
    }
  }

  handleSignalingMessage(message) {
    // Parse Socket.IO message format
    if (message.startsWith('42')) {
      try {
        const jsonData = message.substring(2);
        const [event, data] = JSON.parse(jsonData);

        switch (event) {
          case 'offer':
            log('📤 WebRTC Offer received', colors.magenta);
            this.stats.totalConnections++;
            break;

          case 'answer':
            log('📥 WebRTC Answer received', colors.magenta);
            break;

          case 'ice-candidate':
            log('🧊 ICE Candidate received', colors.cyan);
            break;

          case 'overlay-data':
            log('🎭 Overlay data received', colors.green);
            this.stats.dataChannelMessages++;
            this.analyzeOverlayData(data);
            break;

          default:
            log(`📨 Unknown signaling event: ${event}`, colors.yellow);
        }
      } catch (error) {
        log(`⚠️  Error parsing signaling message: ${error.message}`, colors.yellow);
      }
    }
  }

  analyzeOverlayData(data) {
    if (data && data.facialOverlays) {
      const faceCount = data.facialOverlays.length;
      log(`👤 Faces detected: ${faceCount}`, colors.green);

      data.facialOverlays.forEach((face, index) => {
        log(`  Face ${index + 1}: ${face.emotionLabel} (${(face.confidence * 100).toFixed(1)}%)`, colors.green);
      });
    }

    if (data && data.audioOverlay) {
      log(`🎵 Audio emotion: ${data.audioOverlay.emotionLabel} (${(data.audioOverlay.confidence * 100).toFixed(1)}%)`, colors.green);
    }

    if (data && data.totalProcessingTime) {
      log(`⏱️  Processing time: ${data.totalProcessingTime}ms`, colors.cyan);
    }
  }

  displayDebugInterface() {
    console.clear();
    log('🔧 WebRTC Debug Dashboard', colors.blue);
    log('==========================', colors.blue);

    this.updateStats();

    log('', colors.reset);
    log('Available Commands:', colors.yellow);
    log('  Ctrl+C - Exit debugger', colors.yellow);
    log('  Monitor logs above for real-time WebRTC activity', colors.yellow);
  }

  updateStats() {
    // Update active connections from server
    this.makeRequest('http://localhost:3001/api/health')
      .then(response => {
        if (response && response.activeConnections !== undefined) {
          this.stats.activeConnections = response.activeConnections;
        }
      })
      .catch(() => {
        // Silently handle errors
      });

    // Display current stats
    log('📊 Connection Stats:', colors.cyan);
    log(`  Total Connections: ${this.stats.totalConnections}`, colors.cyan);
    log(`  Active Connections: ${this.stats.activeConnections}`, colors.cyan);
    log(`  Data Channel Messages: ${this.stats.dataChannelMessages}`, colors.cyan);
  }

  makeRequest(url) {
    return new Promise((resolve, reject) => {
      const request = http.get(url, { timeout: 5000 }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            resolve(data);
          }
        });
      });

      request.on('error', reject);
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }
}

// Start debugging
const debugger = new WebRTCDebugger();

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('👋 WebRTC Debugger stopped', colors.blue);
  process.exit(0);
});

debugger.start();
