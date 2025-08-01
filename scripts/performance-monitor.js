#!/usr/bin/env node

/**
 * Performance Monitoring Script for Emotion Recognition PWA
 * Monitors system performance metrics in real-time
 */

const os = require('os');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const chalk = require('chalk');

class PerformanceMonitor {
  constructor(options = {}) {
    this.options = {
      interval: options.interval || 5000, // 5 seconds
      logFile: options.logFile || './logs/performance.log',
      maxLogSize: options.maxLogSize || 10 * 1024 * 1024, // 10MB
      enableAlerts: options.enableAlerts !== false,
      thresholds: {
        cpu: options.cpuThreshold || 80,
        memory: options.memoryThreshold || 85,
        disk: options.diskThreshold || 90,
        responseTime: options.responseTimeThreshold || 1000
      }
    };

    this.metrics = {
      startTime: Date.now(),
      samples: [],
      alerts: []
    };

    this.setupLogging();
  }

  setupLogging() {
    const logDir = path.dirname(this.options.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  async getSystemMetrics() {
    const metrics = {
      timestamp: Date.now(),
      uptime: process.uptime(),
      cpu: await this.getCPUUsage(),
      memory: this.getMemoryUsage(),
      disk: await this.getDiskUsage(),
      network: await this.getNetworkStats(),
      process: this.getProcessMetrics()
    };

    return metrics;
  }

  async getCPUUsage() {
    return new Promise((resolve) => {
      const cpus = os.cpus();
      const totalIdle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
      const totalTick = cpus.reduce((acc, cpu) =>
        acc + cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq, 0);

      const idle = totalIdle / cpus.length;
      const total = totalTick / cpus.length;
      const usage = 100 - (100 * idle / total);

      resolve(Math.round(usage * 100) / 100);
    });
  }

  getMemoryUsage() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;

    return {
      total: this.formatBytes(total),
      used: this.formatBytes(used),
      free: this.formatBytes(free),
      percentage: Math.round((used / total) * 100)
    };
  }

  async getDiskUsage() {
    return new Promise((resolve) => {
      exec('df -h / | tail -1', (error, stdout) => {
        if (error) {
          resolve({ percentage: 0, available: 'Unknown' });
          return;
        }

        const parts = stdout.trim().split(/\s+/);
        const percentage = parseInt(parts[4].replace('%', ''));
        const available = parts[3];

        resolve({ percentage, available });
      });
    });
  }

  async getNetworkStats() {
    return new Promise((resolve) => {
      exec('netstat -i | grep -E "^(eth|wlan|en|wl)" | head -1', (error, stdout) => {
        if (error) {
          resolve({ rx: 0, tx: 0 });
          return;
        }

        const parts = stdout.trim().split(/\s+/);
        resolve({
          rx: parseInt(parts[3]) || 0,
          tx: parseInt(parts[7]) || 0
        });
      });
    });
  }

  getProcessMetrics() {
    const usage = process.memoryUsage();
    return {
      rss: this.formatBytes(usage.rss),
      heapUsed: this.formatBytes(usage.heapUsed),
      heapTotal: this.formatBytes(usage.heapTotal),
      external: this.formatBytes(usage.external)
    };
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async checkApplicationHealth() {
    try {
      const response = await fetch('http://localhost:3001/health');
      const data = await response.json();
      return {
        status: response.status,
        responseTime: response.headers.get('x-response-time'),
        data
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async checkWebRTCPerformance() {
    try {
      const response = await fetch('http://localhost:3001/api/webrtc/stats');
      const data = await response.json();
      return {
        activeConnections: data.activeConnections || 0,
        averageLatency: data.averageLatency || 0,
        bandwidth: data.bandwidth || 0
      };
    } catch (error) {
      return {
        activeConnections: 0,
        averageLatency: 0,
        bandwidth: 0,
        error: error.message
      };
    }
  }

  checkThresholds(metrics) {
    const alerts = [];

    if (metrics.cpu > this.options.thresholds.cpu) {
      alerts.push(`High CPU usage: ${metrics.cpu}%`);
    }

    if (metrics.memory.percentage > this.options.thresholds.memory) {
      alerts.push(`High memory usage: ${metrics.memory.percentage}%`);
    }

    if (metrics.disk.percentage > this.options.thresholds.disk) {
      alerts.push(`High disk usage: ${metrics.disk.percentage}%`);
    }

    return alerts;
  }

  logMetrics(metrics, alerts = []) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      metrics,
      alerts
    };

    // Console output
    console.log(chalk.blue('=== Performance Metrics ==='));
    console.log(chalk.gray(`Time: ${logEntry.timestamp}`));
    console.log(chalk.cyan(`CPU: ${metrics.cpu}%`));
    console.log(chalk.cyan(`Memory: ${metrics.memory.percentage}% (${metrics.memory.used}/${metrics.memory.total})`));
    console.log(chalk.cyan(`Disk: ${metrics.disk.percentage}% (${metrics.disk.available} available)`));
    console.log(chalk.cyan(`Process RSS: ${metrics.process.rss}`));

    if (alerts.length > 0) {
      console.log(chalk.red('⚠️  Alerts:'));
      alerts.forEach(alert => console.log(chalk.red(`  - ${alert}`)));
    }

    console.log(chalk.gray('==========================\n'));

    // File logging
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(this.options.logFile, logLine);

    // Rotate log if too large
    this.rotateLogIfNeeded();
  }

  rotateLogIfNeeded() {
    try {
      const stats = fs.statSync(this.options.logFile);
      if (stats.size > this.options.maxLogSize) {
        const backupFile = this.options.logFile + '.backup';
        fs.renameSync(this.options.logFile, backupFile);
        console.log(chalk.yellow(`Log rotated: ${backupFile}`));
      }
    } catch (error) {
      // Log file doesn't exist yet, ignore
    }
  }

  async start() {
    console.log(chalk.green('🚀 Starting Performance Monitor...'));
    console.log(chalk.gray(`Monitoring interval: ${this.options.interval}ms`));
    console.log(chalk.gray(`Log file: ${this.options.logFile}`));
    console.log(chalk.gray('Press Ctrl+C to stop\n'));

    const monitor = async () => {
      try {
        const metrics = await this.getSystemMetrics();
        const health = await this.checkApplicationHealth();
        const webrtc = await this.checkWebRTCPerformance();

        const fullMetrics = {
          ...metrics,
          health,
          webrtc
        };

        const alerts = this.checkThresholds(metrics);
        this.logMetrics(fullMetrics, alerts);

        this.metrics.samples.push(fullMetrics);
        if (alerts.length > 0) {
          this.metrics.alerts.push(...alerts);
        }

        // Keep only last 100 samples
        if (this.metrics.samples.length > 100) {
          this.metrics.samples = this.metrics.samples.slice(-100);
        }

      } catch (error) {
        console.error(chalk.red('Error collecting metrics:'), error.message);
      }
    };

    // Initial run
    await monitor();

    // Set up interval
    this.interval = setInterval(monitor, this.options.interval);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }

    const duration = Date.now() - this.metrics.startTime;
    console.log(chalk.green('\n📊 Performance Monitor Summary:'));
    console.log(chalk.gray(`Duration: ${Math.round(duration / 1000)}s`));
    console.log(chalk.gray(`Samples collected: ${this.metrics.samples.length}`));
    console.log(chalk.gray(`Alerts triggered: ${this.metrics.alerts.length}`));

    if (this.metrics.samples.length > 0) {
      const avgCPU = this.metrics.samples.reduce((sum, s) => sum + s.cpu, 0) / this.metrics.samples.length;
      const avgMemory = this.metrics.samples.reduce((sum, s) => sum + s.memory.percentage, 0) / this.metrics.samples.length;

      console.log(chalk.cyan(`Average CPU: ${avgCPU.toFixed(2)}%`));
      console.log(chalk.cyan(`Average Memory: ${avgMemory.toFixed(2)}%`));
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--interval':
        options.interval = parseInt(args[++i]) || 5000;
        break;
      case '--log-file':
        options.logFile = args[++i];
        break;
      case '--cpu-threshold':
        options.cpuThreshold = parseInt(args[++i]) || 80;
        break;
      case '--memory-threshold':
        options.memoryThreshold = parseInt(args[++i]) || 85;
        break;
      case '--help':
        console.log(`
Performance Monitor for Emotion Recognition PWA

Usage: node performance-monitor.js [options]

Options:
  --interval <ms>         Monitoring interval in milliseconds (default: 5000)
  --log-file <path>       Log file path (default: ./logs/performance.log)
  --cpu-threshold <%>     CPU usage threshold for alerts (default: 80)
  --memory-threshold <%>  Memory usage threshold for alerts (default: 85)
  --help                  Show this help message

Examples:
  node performance-monitor.js
  node performance-monitor.js --interval 10000 --cpu-threshold 90
        `);
        process.exit(0);
    }
  }

  const monitor = new PerformanceMonitor(options);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n🛑 Stopping Performance Monitor...'));
    monitor.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log(chalk.yellow('\n🛑 Stopping Performance Monitor...'));
    monitor.stop();
    process.exit(0);
  });

  monitor.start();
}

module.exports = PerformanceMonitor;
