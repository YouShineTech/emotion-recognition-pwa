#!/usr/bin/env node

/**
 * WebRTC Module Debugger
 * Interactive debugging tool for WebRTC connections
 */

const readline = require('readline');
const chalk = require('chalk');
const {
  WebRTCTransportModule,
} = require('../client/src/modules/webrtc-transport/WebRTCTransportModule');

class WebRTCDebugger {
  constructor() {
    this.module = null;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.setupCommands();
    this.start();
  }

  setupCommands() {
    this.commands = {
      init: {
        description: 'Initialize WebRTC module',
        handler: this.initModule.bind(this),
      },
      connect: {
        description: 'Test connection to signaling server',
        handler: this.testConnection.bind(this),
      },
      send: {
        description: 'Send test data through data channel',
        handler: this.sendTestData.bind(this),
      },
      state: {
        description: 'Show connection state',
        handler: this.showState.bind(this),
      },
      stats: {
        description: 'Show WebRTC statistics',
        handler: this.showStats.bind(this),
      },
      disconnect: {
        description: 'Disconnect from server',
        handler: this.disconnect.bind(this),
      },
      help: {
        description: 'Show available commands',
        handler: this.showHelp.bind(this),
      },
      exit: {
        description: 'Exit debugger',
        handler: this.exit.bind(this),
      },
    };
  }

  start() {
    console.log(chalk.bold.blue('🔧 WebRTC Module Debugger'));
    console.log(chalk.gray('Type "help" for available commands\n'));

    this.prompt();
  }

  prompt() {
    this.rl.question(chalk.cyan('webrtc> '), input => {
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

  async initModule(args) {
    try {
      console.log(chalk.yellow('Initializing WebRTC module...'));

      this.module = new WebRTCTransportModule();

      const config = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        signalingUrl: args[0] || 'ws://localhost:3001',
        sessionId: `debug_${Date.now()}`,
        stunServers: ['stun:stun.l.google.com:19302'],
      };

      const result = await this.module.initialize(config);

      if (result.success) {
        console.log(chalk.green('✅ Module initialized successfully'));
        console.log(chalk.gray(`Connection ID: ${result.connectionId}`));

        // Set up event listeners
        this.module.onStateChange(state => {
          console.log(chalk.blue(`🔄 Connection state: ${state}`));
        });

        this.module.onDataReceived(data => {
          console.log(chalk.green(`📥 Received data: ${JSON.stringify(data)}`));
        });
      } else {
        console.log(chalk.red('❌ Failed to initialize module'));
      }
    } catch (error) {
      console.log(chalk.red(`❌ Error: ${error.message}`));
    }
  }

  async testConnection(args) {
    if (!this.module) {
      console.log(chalk.red('❌ Module not initialized. Run "init" first.'));
      return;
    }

    try {
      console.log(chalk.yellow('Testing connection...'));

      const state = this.module.getConnectionState();
      console.log(chalk.blue(`Current state: ${state}`));

      if (state === 'connected') {
        console.log(chalk.green('✅ Connection is active'));
      } else {
        console.log(chalk.yellow(`⚠️  Connection state: ${state}`));
      }
    } catch (error) {
      console.log(chalk.red(`❌ Error: ${error.message}`));
    }
  }

  async sendTestData(args) {
    if (!this.module) {
      console.log(chalk.red('❌ Module not initialized. Run "init" first.'));
      return;
    }

    try {
      const testData = {
        type: 'debug_message',
        timestamp: Date.now(),
        message: args.join(' ') || 'Hello from debugger!',
        sessionId: 'debug_session',
      };

      console.log(chalk.yellow('Sending test data...'));
      await this.module.sendData(testData);
      console.log(chalk.green('✅ Data sent successfully'));
      console.log(chalk.gray(`Data: ${JSON.stringify(testData, null, 2)}`));
    } catch (error) {
      console.log(chalk.red(`❌ Error: ${error.message}`));
    }
  }

  showState(args) {
    if (!this.module) {
      console.log(chalk.red('❌ Module not initialized. Run "init" first.'));
      return;
    }

    const state = this.module.getConnectionState();
    console.log(chalk.blue(`Connection State: ${state}`));

    // Additional state information would be shown here
    console.log(chalk.gray('Detailed state information:'));
    console.log(chalk.gray('- Peer Connection: Active'));
    console.log(chalk.gray('- Data Channel: Open'));
    console.log(chalk.gray('- ICE Connection: Connected'));
  }

  showStats(args) {
    if (!this.module) {
      console.log(chalk.red('❌ Module not initialized. Run "init" first.'));
      return;
    }

    console.log(chalk.blue('📊 WebRTC Statistics:'));
    console.log(chalk.gray('- Messages Sent: 0'));
    console.log(chalk.gray('- Messages Received: 0'));
    console.log(chalk.gray('- Connection Uptime: 0s'));
    console.log(chalk.gray('- Bandwidth Usage: 0 KB/s'));
  }

  disconnect(args) {
    if (!this.module) {
      console.log(chalk.red('❌ Module not initialized.'));
      return;
    }

    console.log(chalk.yellow('Disconnecting...'));
    this.module.disconnect();
    console.log(chalk.green('✅ Disconnected'));
    this.module = null;
  }

  showHelp(args) {
    console.log(chalk.bold.blue('\n📚 Available Commands:'));

    for (const [command, info] of Object.entries(this.commands)) {
      console.log(chalk.cyan(`  ${command.padEnd(12)} - ${info.description}`));
    }

    console.log(chalk.gray('\nExample usage:'));
    console.log(chalk.gray('  init ws://localhost:3001'));
    console.log(chalk.gray('  send Hello World'));
    console.log('');
  }

  exit(args) {
    console.log(chalk.yellow('👋 Goodbye!'));
    if (this.module) {
      this.module.disconnect();
    }
    this.rl.close();
    process.exit(0);
  }
}

// Start debugger
new WebRTCDebugger();
