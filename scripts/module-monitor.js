#!/usr/bin/env node

// Module Monitor Script
// Real-time monitoring of module performance and status

const http = require('http');
const WebSocket = require('ws');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

const log = (message, color = colors.reset) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
};

class ModuleMonitor {
  constructor() {
    this.modules = [
      'MediaCaptureModule',
      'WebRTCTransportModule',
      'OverlayRendererModule',
      'PWAShellModule',
      'MediaRelayModule',
      'FacialAnalysisModule',
      'AudioAnalysisModule',
      'OverlayDataGenerator',
    ];

    this.stats = {};
    this.isRunning = false;
  }

  async start() {
    log('🔍 Starting Module Monitor...', colors.blue);
    this.isRunning = true;

    // Initialize stats
    this.modules.forEach(module => {
      this.stats[module] = {
        status: 'unknown',
        lastUpdate: null,
        errorCount: 0,
        successCount: 0,
      };
    });

    // Start monitoring loops
    this.startHealthMonitoring();
    this.startPerformanceMonitoring();
    this.startLogMonitoring();

    // Display initial status
    this.displayStatus();

    // Set up periodic status updates
    setInterval(() => {
      if (this.isRunning) {
        this.displayStatus();
      }
    }, 5000);
  }

  stop() {
    log('🛑 Stopping Module Monitor...', colors.yellow);
    this.isRunning = false;
  }

  startHealthMonitoring() {
    const checkHealth = async () => {
      if (!this.isRunning) return;

      try {
        const response = await this.makeRequest('http://localhost:3001/api/health');
        if (response) {
          log('✅ Server health check passed', colors.green);
          this.updateModuleStatus('MediaRelayModule', 'healthy');
        }
      } catch (error) {
        log(`❌ Server health check failed: ${error.message}`, colors.red);
        this.updateModuleStatus('MediaRelayModule', 'unhealthy');
      }

      setTimeout(checkHealth, 10000); // Check every 10 seconds
    };

    checkHealth();
  }

  startPerformanceMonitoring() {
    const checkPerformance = async () => {
      if (!this.isRunning) return;

      try {
        const response = await this.makeRequest('http://localhost:3001/api/health');
        if (response && response.resourceUsage) {
          const { cpuUsage, memoryUsage, activeConnections } = response.resourceUsage;
          log(`📊 Performance: CPU ${cpuUsage.toFixed(1)}%, Memory ${memoryUsage.toFixed(1)}%, Connections ${activeConnections}`, colors.cyan);
        }
      } catch (error) {
        // Silently handle performance monitoring errors
      }

      setTimeout(checkPerformance, 15000); // Check every 15 seconds
    };

    checkPerformance();
  }

  startLogMonitoring() {
    // Monitor console logs for module activity
    const originalLog = console.log;
    console.log = (...args) => {
      const message = args.join(' ');

      // Check for module activity in logs
      this.modules.forEach(module => {
        if (message.includes(`[${module}]`)) {
          this.updateModuleActivity(module);
        }
      });

      originalLog.apply(console, args);
    };
  }

  updateModuleStatus(module, status) {
    if (this.stats[module]) {
      this.stats[module].status = status;
      this.stats[module].lastUpdate = new Date();

      if (status === 'healthy') {
        this.stats[module].successCount++;
      } else {
        this.stats[module].errorCount++;
      }
    }
  }

  updateModuleActivity(module) {
    if (this.stats[module]) {
      this.stats[module].lastUpdate = new Date();
      this.stats[module].status = 'active';
    }
  }

  displayStatus() {
    console.clear();
    log('🔍 Module Monitor Dashboard', colors.blue);
    log('============================', colors.blue);

    this.modules.forEach(module => {
      const stats = this.stats[module];
      const statusColor = this.getStatusColor(stats.status);
      const lastUpdate = stats.lastUpdate ?
        stats.lastUpdate.toLocaleTimeString() : 'Never';

      log(`${module.padEnd(25)} ${stats.status.padEnd(10)} Last: ${lastUpdate} ✓${stats.successCount} ✗${stats.errorCount}`, statusColor);
    });

    log('============================', colors.blue);
    log('Press Ctrl+C to stop monitoring', colors.yellow);
  }

  getStatusColor(status) {
    switch (status) {
      case 'healthy':
      case 'active':
        return colors.green;
      case 'unhealthy':
        return colors.red;
      case 'unknown':
        return colors.yellow;
      default:
        return colors.reset;
    }
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

// Start monitoring
const monitor = new ModuleMonitor();

// Handle graceful shutdown
process.on('SIGINT', () => {
  monitor.stop();
  log('👋 Module Monitor stopped', colors.blue);
  process.exit(0);
});

process.on('SIGTERM', () => {
  monitor.stop();
  process.exit(0);
});

monitor.start();
