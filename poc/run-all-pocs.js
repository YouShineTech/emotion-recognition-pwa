#!/usr/bin/env node

/**
 * POC Runner - Execute all POCs individually or together
 *
 * This script allows running individual POCs or all POCs in sequence
 * Each POC runs in isolation and validates module functionality
 */

const { spawn } = require('child_process');
const path = require('path');
const chalk = require('chalk');

const POCS = [
  {
    id: '01',
    name: 'Media Capture',
    dir: '01-media-capture',
    description: 'WebRTC getUserMedia integration',
  },
  {
    id: '02',
    name: 'WebRTC Transport',
    dir: '02-webrtc-transport',
    description: 'Peer connections and signaling',
  },
  {
    id: '03',
    name: 'Media Relay',
    dir: '03-media-relay',
    description: 'Mediasoup SFU integration',
  },
  {
    id: '04',
    name: 'Frame Extraction',
    dir: '04-frame-extraction',
    description: 'FFmpeg media processing',
  },
  {
    id: '05',
    name: 'Facial Analysis',
    dir: '05-facial-analysis',
    description: 'OpenFace emotion recognition',
  },
  {
    id: '06',
    name: 'Audio Analysis',
    dir: '06-audio-analysis',
    description: 'Python ML audio emotion',
  },
  {
    id: '07',
    name: 'Overlay Generator',
    dir: '07-overlay-generator',
    description: 'Emotion fusion and overlay data',
  },
  {
    id: '08',
    name: 'Overlay Renderer',
    dir: '08-overlay-renderer',
    description: 'Canvas-based overlay rendering',
  },
  {
    id: '09',
    name: 'Connection Manager',
    dir: '09-connection-manager',
    description: 'Session lifecycle management',
  },
  { id: '10', name: 'PWA Shell', dir: '10-pwa-shell', description: 'Progressive Web App features' },
  {
    id: '11',
    name: 'Nginx Server',
    dir: '11-nginx-server',
    description: 'Web server configuration',
  },
];

class POCRunner {
  constructor() {
    this.results = new Map();
  }

  async runAll() {
    console.log(chalk.blue('🚀 Running All POCs'));
    console.log(chalk.blue('==================\n'));

    console.log(chalk.yellow('📋 Available POCs:'));
    POCS.forEach(poc => {
      console.log(`   ${poc.id}. ${poc.name} - ${poc.description}`);
    });
    console.log('');

    let successCount = 0;
    let totalTime = 0;

    for (const poc of POCS) {
      const startTime = Date.now();
      console.log(chalk.cyan(`\n🔍 Running POC ${poc.id}: ${poc.name}`));
      console.log(chalk.cyan('='.repeat(50)));

      try {
        const success = await this.runPOC(poc);
        const endTime = Date.now();
        const duration = endTime - startTime;
        totalTime += duration;

        if (success) {
          successCount++;
          this.results.set(poc.id, { status: 'success', duration });
          console.log(chalk.green(`✅ POC ${poc.id} completed successfully (${duration}ms)`));
        } else {
          this.results.set(poc.id, { status: 'failed', duration });
          console.log(chalk.red(`❌ POC ${poc.id} failed (${duration}ms)`));
        }
      } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        totalTime += duration;

        this.results.set(poc.id, { status: 'error', duration, error: error.message });
        console.log(chalk.red(`💥 POC ${poc.id} error: ${error.message} (${duration}ms)`));
      }
    }

    this.printSummary(successCount, totalTime);
  }

  async runSingle(pocId) {
    const poc = POCS.find(p => p.id === pocId || p.dir === pocId);

    if (!poc) {
      console.error(chalk.red(`❌ POC not found: ${pocId}`));
      console.log(chalk.yellow('Available POCs:'));
      POCS.forEach(p => console.log(`   ${p.id}: ${p.name}`));
      process.exit(1);
    }

    console.log(chalk.blue(`🚀 Running POC ${poc.id}: ${poc.name}`));
    console.log(chalk.blue('='.repeat(50)));

    const startTime = Date.now();
    const success = await this.runPOC(poc);
    const endTime = Date.now();
    const duration = endTime - startTime;

    if (success) {
      console.log(chalk.green(`\n✅ POC ${poc.id} completed successfully (${duration}ms)`));
    } else {
      console.log(chalk.red(`\n❌ POC ${poc.id} failed (${duration}ms)`));
      process.exit(1);
    }
  }

  async runPOC(poc) {
    const pocDir = path.join(__dirname, poc.dir);

    // Check if POC directory exists
    try {
      require('fs').accessSync(pocDir);
    } catch (error) {
      console.log(chalk.yellow(`   ⚠️  POC directory not found: ${pocDir}`));
      console.log(chalk.yellow(`   📝 This POC needs to be implemented`));
      return false;
    }

    return new Promise(resolve => {
      const child = spawn('npm', ['run', 'poc'], {
        cwd: pocDir,
        stdio: 'inherit',
        shell: true,
      });

      child.on('exit', code => {
        resolve(code === 0);
      });

      child.on('error', error => {
        console.error(chalk.red(`   💥 Failed to start POC: ${error.message}`));
        resolve(false);
      });
    });
  }

  printSummary(successCount, totalTime) {
    console.log(chalk.blue('\n📊 POC Execution Summary'));
    console.log(chalk.blue('========================'));

    console.log(`\n📈 Results:`);
    console.log(`   Total POCs: ${POCS.length}`);
    console.log(`   Successful: ${chalk.green(successCount)}`);
    console.log(`   Failed: ${chalk.red(POCS.length - successCount)}`);
    console.log(`   Success Rate: ${((successCount / POCS.length) * 100).toFixed(1)}%`);
    console.log(`   Total Time: ${totalTime}ms (${(totalTime / 1000).toFixed(1)}s)`);

    console.log(`\n📋 Detailed Results:`);
    for (const [pocId, result] of this.results) {
      const poc = POCS.find(p => p.id === pocId);
      const statusIcon =
        result.status === 'success' ? '✅' : result.status === 'failed' ? '❌' : '💥';
      const statusColor = result.status === 'success' ? chalk.green : chalk.red;

      console.log(
        `   ${statusIcon} POC ${pocId}: ${poc.name} - ${statusColor(result.status)} (${result.duration}ms)`
      );
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
    }

    if (successCount === POCS.length) {
      console.log(chalk.green('\n🎉 All POCs completed successfully!'));
      console.log(chalk.green('💡 All modules are ready for integration into the full system.'));
    } else {
      console.log(chalk.yellow('\n⚠️  Some POCs failed or need implementation.'));
      console.log(chalk.yellow('💡 Check individual POC results above for details.'));
    }
  }

  printHelp() {
    console.log(chalk.blue('POC Runner - Execute Proof of Concept modules'));
    console.log(chalk.blue('============================================\n'));

    console.log('Usage:');
    console.log('  node run-all-pocs.js [command] [options]\n');

    console.log('Commands:');
    console.log('  all                 Run all POCs in sequence');
    console.log('  <poc-id>           Run specific POC (e.g., 01, 02, media-capture)');
    console.log('  list               List all available POCs');
    console.log('  help               Show this help message\n');

    console.log('Examples:');
    console.log('  node run-all-pocs.js all');
    console.log('  node run-all-pocs.js 01');
    console.log('  node run-all-pocs.js media-capture');
    console.log('  node run-all-pocs.js list\n');

    console.log('Available POCs:');
    POCS.forEach(poc => {
      console.log(`  ${poc.id}: ${poc.name} - ${poc.description}`);
    });
  }

  listPOCs() {
    console.log(chalk.blue('📋 Available POCs'));
    console.log(chalk.blue('=================\n'));

    POCS.forEach(poc => {
      const pocDir = path.join(__dirname, poc.dir);
      const exists = require('fs').existsSync(pocDir);
      const status = exists ? chalk.green('✅ Ready') : chalk.yellow('📝 Needs Implementation');

      console.log(`${poc.id}. ${chalk.cyan(poc.name)}`);
      console.log(`   Description: ${poc.description}`);
      console.log(`   Directory: ${poc.dir}`);
      console.log(`   Status: ${status}`);
      console.log('');
    });
  }
}

// Main execution
async function main() {
  const runner = new POCRunner();
  const command = process.argv[2] || 'help';

  switch (command.toLowerCase()) {
    case 'all':
      await runner.runAll();
      break;
    case 'list':
      runner.listPOCs();
      break;
    case 'help':
    case '--help':
    case '-h':
      runner.printHelp();
      break;
    default:
      // Try to run specific POC
      await runner.runSingle(command);
      break;
  }
}

// Handle errors
process.on('unhandledRejection', error => {
  console.error(chalk.red('💥 Unhandled rejection:'), error);
  process.exit(1);
});

process.on('uncaughtException', error => {
  console.error(chalk.red('💥 Uncaught exception:'), error);
  process.exit(1);
});

if (require.main === module) {
  main().catch(console.error);
}
