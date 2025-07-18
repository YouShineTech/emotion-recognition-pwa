#!/usr/bin/env node

/**
 * Module Communication Monitor
 * Real-time monitoring of inter-module communication
 */

const EventEmitter = require('events');
const chalk = require('chalk');
const Table = require('cli-table3');

class ModuleMonitor extends EventEmitter {
  constructor() {
    super();
    this.modules = new Map();
    this.communications = [];
    this.startTime = Date.now();

    this.setupMonitoring();
    this.startDisplay();
  }

  setupMonitoring() {
    // Monitor module registrations
    this.on('module:register', moduleInfo => {
      this.modules.set(moduleInfo.name, {
        ...moduleInfo,
        registeredAt: Date.now(),
        messageCount: 0,
        errorCount: 0,
        lastActivity: Date.now(),
      });

      console.log(chalk.green(`✅ Module registered: ${moduleInfo.name}`));
    });

    // Monitor module communications
    this.on('module:communication', commInfo => {
      const { from, to, type, data, timestamp } = commInfo;

      this.communications.push({
        from,
        to,
        type,
        dataSize: JSON.stringify(data).length,
        timestamp: timestamp || Date.now(),
        success: true,
      });

      // Update module stats
      if (this.modules.has(from)) {
        const module = this.modules.get(from);
        module.messageCount++;
        module.lastActivity = Date.now();
      }

      console.log(chalk.blue(`📡 ${from} → ${to}: ${type} (${JSON.stringify(data).length} bytes)`));
    });

    // Monitor module errors
    this.on('module:error', errorInfo => {
      const { module, error, timestamp } = errorInfo;

      if (this.modules.has(module)) {
        const moduleInfo = this.modules.get(module);
        moduleInfo.errorCount++;
        moduleInfo.lastActivity = Date.now();
      }

      console.log(chalk.red(`❌ Error in ${module}: ${error.message}`));
    });
  }

  startDisplay() {
    // Clear screen and show header
    console.clear();
    console.log(chalk.bold.cyan('🔍 Module Communication Monitor'));
    console.log(chalk.gray('Press Ctrl+C to exit\n'));

    // Update display every 2 seconds
    setInterval(() => {
      this.updateDisplay();
    }, 2000);
  }

  updateDisplay() {
    // Module Status Table
    const moduleTable = new Table({
      head: ['Module', 'Status', 'Messages', 'Errors', 'Last Activity'],
      colWidths: [20, 10, 10, 8, 15],
    });

    for (const [name, info] of this.modules) {
      const timeSinceActivity = Date.now() - info.lastActivity;
      const status = timeSinceActivity < 5000 ? chalk.green('Active') : chalk.yellow('Idle');

      const lastActivity =
        timeSinceActivity < 1000 ? 'Just now' : `${Math.floor(timeSinceActivity / 1000)}s ago`;

      moduleTable.push([
        name,
        status,
        info.messageCount.toString(),
        info.errorCount > 0 ? chalk.red(info.errorCount.toString()) : '0',
        lastActivity,
      ]);
    }

    // Recent Communications Table
    const commTable = new Table({
      head: ['Time', 'From', 'To', 'Type', 'Size'],
      colWidths: [12, 15, 15, 15, 10],
    });

    const recentComms = this.communications.slice(-10);
    for (const comm of recentComms) {
      const time = new Date(comm.timestamp).toLocaleTimeString();
      commTable.push([time, comm.from, comm.to, comm.type, `${comm.dataSize}b`]);
    }

    // Clear and redraw
    console.clear();
    console.log(chalk.bold.cyan('🔍 Module Communication Monitor'));
    console.log(chalk.gray(`Running for ${Math.floor((Date.now() - this.startTime) / 1000)}s\n`));

    console.log(chalk.bold('📊 Module Status:'));
    console.log(moduleTable.toString());

    console.log(chalk.bold('\n📡 Recent Communications:'));
    console.log(commTable.toString());

    console.log(chalk.gray('\nPress Ctrl+C to exit'));
  }

  // Simulate module activity for testing
  simulateActivity() {
    const modules = ['MediaCapture', 'WebRTCTransport', 'MediaRelay', 'FacialAnalysis'];

    // Register modules
    modules.forEach(name => {
      this.emit('module:register', {
        name,
        version: '1.0.0',
        type: name.includes('Capture') ? 'client' : 'server',
      });
    });

    // Simulate communications
    setInterval(() => {
      const from = modules[Math.floor(Math.random() * modules.length)];
      const to = modules[Math.floor(Math.random() * modules.length)];

      if (from !== to) {
        this.emit('module:communication', {
          from,
          to,
          type: 'data_transfer',
          data: { mockData: 'test', timestamp: Date.now() },
        });
      }
    }, 1000);

    // Simulate occasional errors
    setInterval(() => {
      const module = modules[Math.floor(Math.random() * modules.length)];
      this.emit('module:error', {
        module,
        error: new Error('Simulated error for testing'),
      });
    }, 10000);
  }
}

// Start monitoring
const monitor = new ModuleMonitor();

// If running in test mode, simulate activity
if (process.argv.includes('--simulate')) {
  monitor.simulateActivity();
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n👋 Shutting down module monitor...'));
  process.exit(0);
});

module.exports = ModuleMonitor;
