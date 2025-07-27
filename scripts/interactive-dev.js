#!/usr/bin/env node

// Interactive Development Script
// CLI utilities for development workflow

const readline = require('readline');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

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
  console.log(`${color}${message}${colors.reset}`);
};

class InteractiveDev {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.commands = {
      'help': 'Show available commands',
      'status': 'Check system status',
      'start': 'Start development servers',
      'stop': 'Stop development servers',
      'test': 'Run tests',
      'build': 'Build the project',
      'debug': 'Start debug mode',
      'logs': 'Show recent logs',
      'modules': 'List all modules',
      'health': 'Run health check',
      'clear': 'Clear console',
      'exit': 'Exit interactive mode',
    };

    this.processes = new Map();
  }

  async start() {
    log('🚀 Interactive Development Environment', colors.blue);
    log('=====================================', colors.blue);
    log('Type "help" for available commands', colors.cyan);
    log('', colors.reset);

    this.showPrompt();
  }

  showPrompt() {
    this.rl.question('emotion-pwa> ', (input) => {
      this.handleCommand(input.trim());
    });
  }

  async handleCommand(input) {
    const [command, ...args] = input.split(' ');

    switch (command.toLowerCase()) {
      case 'help':
        this.showHelp();
        break;

      case 'status':
        await this.showStatus();
        break;

      case 'start':
        await this.startServers(args);
        break;

      case 'stop':
        await this.stopServers();
        break;

      case 'test':
        await this.runTests(args);
        break;

      case 'build':
        await this.buildProject(args);
        break;

      case 'debug':
        await this.startDebugMode();
        break;

      case 'logs':
        await this.showLogs();
        break;

      case 'modules':
        this.listModules();
        break;

      case 'health':
        await this.runHealthCheck();
        break;

      case 'clear':
        console.clear();
        break;

      case 'exit':
        this.exit();
        return;

      case '':
        // Empty command, just show prompt again
        break;

      default:
        log(`❌ Unknown command: ${command}`, colors.red);
        log('Type "help" for available commands', colors.yellow);
    }

    this.showPrompt();
  }

  showHelp() {
    log('📚 Available Commands:', colors.blue);
    log('=====================', colors.blue);

    Object.entries(this.commands).forEach(([cmd, desc]) => {
      log(`  ${cmd.padEnd(10)} - ${desc}`, colors.cyan);
    });

    log('', colors.reset);
    log('Examples:', colors.yellow);
    log('  start server    - Start only the server', colors.yellow);
    log('  start client    - Start only the client', colors.yellow);
    log('  test client     - Run client tests', colors.yellow);
    log('  build prod      - Production build', colors.yellow);
  }

  async showStatus() {
    log('📊 System Status:', colors.blue);
    log('================', colors.blue);

    // Check if processes are running
    const serverRunning = this.processes.has('server');
    const clientRunning = this.processes.has('client');

    log(`Server: ${serverRunning ? '🟢 Running' : '🔴 Stopped'}`, serverRunning ? colors.green : colors.red);
    log(`Client: ${clientRunning ? '🟢 Running' : '🔴 Stopped'}`, clientRunning ? colors.green : colors.red);

    // Check ports
    await this.checkPort(3001, 'Server API');
    await this.checkPort(3000, 'Client Dev Server');
    await this.checkPort(6379, 'Redis');
  }

  async checkPort(port, service) {
    return new Promise((resolve) => {
      const net = require('net');
      const socket = new net.Socket();

      socket.setTimeout(1000);
      socket.on('connect', () => {
        log(`${service}: 🟢 Port ${port} is open`, colors.green);
        socket.destroy();
        resolve(true);
      });

      socket.on('timeout', () => {
        log(`${service}: 🔴 Port ${port} is closed`, colors.red);
        socket.destroy();
        resolve(false);
      });

      socket.on('error', () => {
        log(`${service}: 🔴 Port ${port} is closed`, colors.red);
        resolve(false);
      });

      socket.connect(port, 'localhost');
    });
  }

  async startServers(args) {
    const target = args[0] || 'all';

    if (target === 'all' || target === 'server') {
      log('🚀 Starting server...', colors.blue);
      await this.startProcess('server', 'npm', ['run', 'dev'], 'server');
    }

    if (target === 'all' || target === 'client') {
      log('🚀 Starting client...', colors.blue);
      await this.startProcess('client', 'npm', ['run', 'dev'], 'client');
    }

    if (target === 'all') {
      log('✅ All servers started', colors.green);
    }
  }

  async stopServers() {
    log('🛑 Stopping servers...', colors.yellow);

    for (const [name, process] of this.processes) {
      log(`Stopping ${name}...`, colors.yellow);
      process.kill('SIGTERM');
      this.processes.delete(name);
    }

    log('✅ All servers stopped', colors.green);
  }

  async startProcess(name, command, args, cwd) {
    if (this.processes.has(name)) {
      log(`⚠️  ${name} is already running`, colors.yellow);
      return;
    }

    const process = spawn(command, args, {
      cwd: path.join(__dirname, '..', cwd),
      stdio: 'pipe',
    });

    this.processes.set(name, process);

    process.stdout.on('data', (data) => {
      log(`[${name}] ${data.toString().trim()}`, colors.cyan);
    });

    process.stderr.on('data', (data) => {
      log(`[${name}] ${data.toString().trim()}`, colors.red);
    });

    process.on('close', (code) => {
      log(`[${name}] Process exited with code ${code}`, colors.yellow);
      this.processes.delete(name);
    });
  }

  async runTests(args) {
    const target = args[0] || 'all';

    log('🧪 Running tests...', colors.blue);

    if (target === 'all' || target === 'client') {
      await this.execCommand('npm test', 'client');
    }

    if (target === 'all' || target === 'server') {
      await this.execCommand('npm test', 'server');
    }
  }

  async buildProject(args) {
    const mode = args[0] || 'dev';

    log(`🔨 Building project (${mode})...`, colors.blue);

    if (mode === 'prod') {
      await this.execCommand('npm run build:prod');
    } else {
      await this.execCommand('npm run build:dev');
    }
  }

  async startDebugMode() {
    log('🐛 Starting debug mode...', colors.magenta);
    log('Debug servers will start with inspection enabled', colors.cyan);

    await this.startProcess('server-debug', 'npm', ['run', 'dev:debug'], 'server');
    await this.startProcess('client-debug', 'npm', ['run', 'dev'], 'client');

    log('🔍 Debug URLs:', colors.cyan);
    log('  Server: chrome://inspect (port 9229)', colors.cyan);
    log('  Client: http://localhost:3000', colors.cyan);
  }

  async showLogs() {
    log('📋 Recent Logs:', colors.blue);
    log('==============', colors.blue);

    try {
      const logPath = path.join(__dirname, '..', 'server', 'logs', 'combined.log');
      if (fs.existsSync(logPath)) {
        const logs = fs.readFileSync(logPath, 'utf8');
        const recentLogs = logs.split('\n').slice(-20).join('\n');
        log(recentLogs, colors.cyan);
      } else {
        log('No log files found', colors.yellow);
      }
    } catch (error) {
      log(`Error reading logs: ${error.message}`, colors.red);
    }
  }

  listModules() {
    log('📦 Available Modules:', colors.blue);
    log('====================', colors.blue);

    const modules = [
      'MediaCaptureModule - Device media access',
      'WebRTCTransportModule - Real-time communication',
      'OverlayRendererModule - Client-side overlay rendering',
      'PWAShellModule - Progressive Web App features',
      'MediaRelayModule - Scalable WebRTC media server',
      'FacialAnalysisModule - Emotion recognition using OpenFace',
      'AudioAnalysisModule - Voice emotion analysis',
      'OverlayDataGenerator - Combines analysis results',
    ];

    modules.forEach(module => {
      log(`  ${module}`, colors.cyan);
    });
  }

  async runHealthCheck() {
    log('🏥 Running health check...', colors.blue);
    await this.execCommand('node scripts/health-check.js');
  }

  async execCommand(command, cwd = '.') {
    return new Promise((resolve) => {
      exec(command, { cwd: path.join(__dirname, '..', cwd) }, (error, stdout, stderr) => {
        if (error) {
          log(`❌ Error: ${error.message}`, colors.red);
        }
        if (stdout) {
          log(stdout, colors.cyan);
        }
        if (stderr) {
          log(stderr, colors.yellow);
        }
        resolve();
      });
    });
  }

  exit() {
    log('👋 Stopping all processes and exiting...', colors.blue);

    // Stop all running processes
    for (const [name, process] of this.processes) {
      process.kill('SIGTERM');
    }

    this.rl.close();
    process.exit(0);
  }
}

// Start interactive development environment
const interactiveDev = new InteractiveDev();

// Handle graceful shutdown
process.on('SIGINT', () => {
  interactiveDev.exit();
});

interactiveDev.start();
