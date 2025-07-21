#!/usr/bin/env node

/**
 * Interactive Development Console
 * Hands-on development with real-time code execution and debugging
 */

const readline = require('readline');
const chalk = require('chalk');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class InteractiveDeveloper {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.processes = new Map();
    this.currentTask = null;
    this.debugMode = false;

    this.setupCommands();
    this.start();
  }

  setupCommands() {
    this.commands = {
      start: {
        description: 'Start development servers',
        handler: this.startServers.bind(this),
      },
      debug: {
        description: 'Start servers in debug mode',
        handler: this.startDebugMode.bind(this),
      },
      test: {
        description: 'Run tests with watch mode',
        handler: this.runTests.bind(this),
      },
      module: {
        description: 'Work on specific module (e.g., module media-capture)',
        handler: this.workOnModule.bind(this),
      },
      task: {
        description: 'Start working on a specific task (e.g., task 2)',
        handler: this.startTask.bind(this),
      },
      build: {
        description: 'Build and watch for changes',
        handler: this.buildWatch.bind(this),
      },
      logs: {
        description: 'Show real-time logs',
        handler: this.showLogs.bind(this),
      },
      monitor: {
        description: 'Monitor module communications',
        handler: this.startMonitoring.bind(this),
      },
      inspect: {
        description: 'Inspect code (e.g., inspect client/src/index.ts)',
        handler: this.inspectCode.bind(this),
      },
      edit: {
        description: 'Quick edit file (e.g., edit server/src/index.ts)',
        handler: this.editFile.bind(this),
      },
      status: {
        description: 'Show development status',
        handler: this.showStatus.bind(this),
      },
      stop: {
        description: 'Stop all running processes',
        handler: this.stopAll.bind(this),
      },
      help: {
        description: 'Show available commands',
        handler: this.showHelp.bind(this),
      },
      exit: {
        description: 'Exit interactive mode',
        handler: this.exit.bind(this),
      },
    };
  }

  start() {
    console.log(chalk.bold.blue('🚀 Interactive Development Console'));
    console.log(chalk.gray('Type "help" for available commands\n'));

    this.showStatus();
    this.prompt();
  }

  prompt() {
    const taskIndicator = this.currentTask ? chalk.yellow(`[Task ${this.currentTask}] `) : '';
    const debugIndicator = this.debugMode ? chalk.red('[DEBUG] ') : '';

    this.rl.question(chalk.cyan(`${taskIndicator}${debugIndicator}dev> `), input => {
      this.handleCommand(input.trim());
    });
  }

  handleCommand(input) {
    const [command, ...args] = input.split(' ');

    if (this.commands[command]) {
      this.commands[command].handler(args);
    } else if (input) {
      console.log(chalk.red(`Unknown command: ${command}`));
      console.log(chalk.gray('Type "help" for available commands'));
    }

    setTimeout(() => this.prompt(), 100);
  }

  async startServers(args) {
    console.log(chalk.yellow('🚀 Starting development servers...'));

    // Start server
    const serverProcess = spawn('npm', ['run', 'dev:server'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    });

    serverProcess.stdout.on('data', data => {
      console.log(chalk.blue('[SERVER] ') + data.toString().trim());
    });

    serverProcess.stderr.on('data', data => {
      console.log(chalk.red('[SERVER ERROR] ') + data.toString().trim());
    });

    this.processes.set('server', serverProcess);

    // Start client after a delay
    setTimeout(() => {
      const clientProcess = spawn('npm', ['run', 'dev:client'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
      });

      clientProcess.stdout.on('data', data => {
        console.log(chalk.green('[CLIENT] ') + data.toString().trim());
      });

      clientProcess.stderr.on('data', data => {
        console.log(chalk.red('[CLIENT ERROR] ') + data.toString().trim());
      });

      this.processes.set('client', clientProcess);

      console.log(chalk.green('✅ Development servers started!'));
      console.log(chalk.gray('- Server: http://localhost:3001'));
      console.log(chalk.gray('- Client: http://localhost:3000'));
    }, 2000);
  }

  async startDebugMode(args) {
    console.log(chalk.yellow('🐛 Starting debug mode...'));
    this.debugMode = true;

    // Start server in debug mode
    const serverProcess = spawn('npm', ['run', 'dev:debug'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    });

    serverProcess.stdout.on('data', data => {
      console.log(chalk.blue('[DEBUG SERVER] ') + data.toString().trim());
    });

    this.processes.set('debug-server', serverProcess);

    console.log(chalk.green('✅ Debug server started!'));
    console.log(chalk.gray('- Debugger: chrome://inspect'));
    console.log(chalk.gray('- VS Code: Attach to process'));
  }

  async runTests(args) {
    console.log(chalk.yellow('🧪 Running tests in watch mode...'));

    const testProcess = spawn('npm', ['run', 'test:watch'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    });

    testProcess.stdout.on('data', data => {
      console.log(chalk.cyan('[TESTS] ') + data.toString().trim());
    });

    this.processes.set('tests', testProcess);
  }

  async workOnModule(args) {
    const moduleName = args[0];
    if (!moduleName) {
      console.log(chalk.red('Please specify a module name'));
      console.log(
        chalk.gray('Available modules: media-capture, webrtc-transport, media-relay, etc.')
      );
      return;
    }

    console.log(chalk.yellow(`🔧 Working on ${moduleName} module...`));

    // Find module files
    const clientModule = `client/src/modules/${moduleName}`;
    const serverModule = `server/src/modules/${moduleName}`;

    if (fs.existsSync(clientModule)) {
      console.log(chalk.green(`📁 Client module: ${clientModule}`));
      this.listFiles(clientModule);
    }

    if (fs.existsSync(serverModule)) {
      console.log(chalk.green(`📁 Server module: ${serverModule}`));
      this.listFiles(serverModule);
    }

    // Start module-specific tests
    console.log(chalk.blue('Starting module tests...'));
    const testProcess = spawn('npm', ['run', 'test:module', moduleName], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    });

    testProcess.stdout.on('data', data => {
      console.log(chalk.cyan(`[${moduleName.toUpperCase()} TESTS] `) + data.toString().trim());
    });

    this.processes.set(`test-${moduleName}`, testProcess);
  }

  async startTask(args) {
    const taskNumber = args[0];
    if (!taskNumber) {
      console.log(chalk.red('Please specify a task number (e.g., task 2)'));
      return;
    }

    this.currentTask = taskNumber;
    console.log(chalk.yellow(`📋 Starting Task ${taskNumber}...`));

    // Read task details from tasks.md
    try {
      const tasksContent = fs.readFileSync('.kiro/specs/emotion-recognition-pwa/tasks.md', 'utf8');
      const taskRegex = new RegExp(`- \\[ \\] ${taskNumber}\\. (.+?)(?=\\n- \\[|$)`, 's');
      const match = tasksContent.match(taskRegex);

      if (match) {
        console.log(chalk.blue('📝 Task Details:'));
        console.log(chalk.gray(match[1].trim()));
      }
    } catch (error) {
      console.log(chalk.red('Could not read task details'));
    }

    console.log(chalk.green(`✅ Now working on Task ${taskNumber}`));
    console.log(chalk.gray('Use "status" to see current progress'));
  }

  async buildWatch(args) {
    console.log(chalk.yellow('🔨 Starting build watch mode...'));

    const buildProcess = spawn('npm', ['run', 'build:watch'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    });

    buildProcess.stdout.on('data', data => {
      console.log(chalk.magenta('[BUILD] ') + data.toString().trim());
    });

    this.processes.set('build', buildProcess);
  }

  async showLogs(args) {
    console.log(chalk.yellow('📋 Real-time logs:'));

    // Show logs from all running processes
    for (const [name, process] of this.processes) {
      console.log(chalk.blue(`[${name.toUpperCase()}] Process running (PID: ${process.pid})`));
    }
  }

  async startMonitoring(args) {
    console.log(chalk.yellow('📡 Starting module communication monitor...'));

    const monitorProcess = spawn('npm', ['run', 'monitor:modules'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    });

    monitorProcess.stdout.on('data', data => {
      console.log(chalk.cyan('[MONITOR] ') + data.toString().trim());
    });

    this.processes.set('monitor', monitorProcess);
  }

  async inspectCode(args) {
    const filePath = args[0];
    if (!filePath) {
      console.log(chalk.red('Please specify a file path'));
      return;
    }

    if (!fs.existsSync(filePath)) {
      console.log(chalk.red(`File not found: ${filePath}`));
      return;
    }

    console.log(chalk.yellow(`🔍 Inspecting: ${filePath}`));

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      console.log(chalk.blue(`📄 ${filePath} (${lines.length} lines)`));
      console.log(chalk.gray('─'.repeat(50)));

      // Show first 20 lines with line numbers
      lines.slice(0, 20).forEach((line, index) => {
        const lineNum = (index + 1).toString().padStart(3, ' ');
        console.log(chalk.gray(`${lineNum}: `) + line);
      });

      if (lines.length > 20) {
        console.log(chalk.gray(`... and ${lines.length - 20} more lines`));
      }
    } catch (error) {
      console.log(chalk.red(`Error reading file: ${error.message}`));
    }
  }

  async editFile(args) {
    const filePath = args[0];
    if (!filePath) {
      console.log(chalk.red('Please specify a file path'));
      return;
    }

    console.log(chalk.yellow(`✏️  Opening ${filePath} in VS Code...`));

    exec(`code ${filePath}`, error => {
      if (error) {
        console.log(chalk.red("Could not open VS Code. Make sure it's installed and in PATH"));
        console.log(chalk.gray('Alternative: Open the file manually in your editor'));
      } else {
        console.log(chalk.green('✅ File opened in VS Code'));
      }
    });
  }

  listFiles(directory) {
    try {
      const files = fs.readdirSync(directory);
      files.forEach(file => {
        const filePath = path.join(directory, file);
        const stats = fs.statSync(filePath);
        const icon = stats.isDirectory() ? '📁' : '📄';
        console.log(chalk.gray(`  ${icon} ${file}`));
      });
    } catch (error) {
      console.log(chalk.red(`Could not list files in ${directory}`));
    }
  }

  showStatus() {
    console.log(chalk.bold.blue('📊 Development Status'));
    console.log(chalk.gray('─'.repeat(40)));

    // Show current task
    if (this.currentTask) {
      console.log(chalk.yellow(`📋 Current Task: ${this.currentTask}`));
    } else {
      console.log(chalk.gray('📋 No active task'));
    }

    // Show running processes
    console.log(chalk.blue(`🔄 Running Processes: ${this.processes.size}`));
    for (const [name, process] of this.processes) {
      console.log(chalk.gray(`  • ${name} (PID: ${process.pid})`));
    }

    // Show debug mode
    if (this.debugMode) {
      console.log(chalk.red('🐛 Debug Mode: Active'));
    }

    console.log('');
  }

  stopAll() {
    console.log(chalk.yellow('🛑 Stopping all processes...'));

    for (const [name, process] of this.processes) {
      console.log(chalk.gray(`Stopping ${name}...`));
      process.kill('SIGTERM');
    }

    this.processes.clear();
    this.debugMode = false;

    console.log(chalk.green('✅ All processes stopped'));
  }

  showHelp() {
    console.log(chalk.bold.blue('\n📚 Available Commands:'));
    console.log(chalk.gray('─'.repeat(50)));

    for (const [command, info] of Object.entries(this.commands)) {
      console.log(chalk.cyan(`  ${command.padEnd(12)} - ${info.description}`));
    }

    console.log(chalk.gray('\n💡 Examples:'));
    console.log(chalk.gray('  start                    - Start dev servers'));
    console.log(chalk.gray('  debug                    - Start in debug mode'));
    console.log(chalk.gray('  task 2                   - Work on Task 2'));
    console.log(chalk.gray('  module media-capture     - Focus on media capture'));
    console.log(chalk.gray('  inspect client/src/index.ts - View file'));
    console.log('');
  }

  exit() {
    console.log(chalk.yellow('👋 Stopping all processes and exiting...'));
    this.stopAll();

    setTimeout(() => {
      console.log(chalk.green('Goodbye! Happy coding! 🚀'));
      this.rl.close();
      process.exit(0);
    }, 1000);
  }
}

// Start interactive development
new InteractiveDeveloper();
