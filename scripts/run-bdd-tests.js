#!/usr/bin/env node

/**
 * BDD Test Runner
 * Executes unit tests with Gherkin scenario context
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class BDDTestRunner {
  constructor() {
    this.gherkinFile = 'tests/gherkin-user-stories.feature';
    this.mappingFile = 'tests/gherkin-test-mapping.md';
  }

  async runTests(options = {}) {
    const { module = null, scenario = null, verbose = false, debug = false } = options;

    console.log('🥒 BDD Test Runner');
    console.log('='.repeat(40));

    if (module) {
      await this.runModuleTests(module, { scenario, verbose, debug });
    } else {
      await this.runAllTests({ verbose, debug });
    }
  }

  async runModuleTests(moduleName, options) {
    const testMapping = this.getTestMapping(moduleName);

    if (!testMapping) {
      console.error(`❌ No test mapping found for module: ${moduleName}`);
      return;
    }

    console.log(`🧪 Running tests for ${moduleName}`);
    console.log(`📋 Gherkin scenarios: ${testMapping.scenarios.length}`);

    if (options.scenario) {
      await this.runSpecificScenario(moduleName, options.scenario, options);
    } else {
      await this.runAllModuleScenarios(moduleName, testMapping, options);
    }
  }

  async runSpecificScenario(moduleName, scenarioName, options) {
    console.log(`\n🎯 Running scenario: "${scenarioName}"`);

    const gherkinContext = this.getGherkinContext(moduleName, scenarioName);
    if (gherkinContext) {
      console.log('\n📖 Gherkin Context:');
      console.log(gherkinContext);
    }

    await this.executeTest(moduleName, scenarioName, options);
  }

  async runAllModuleScenarios(moduleName, testMapping, options) {
    console.log(`\n🚀 Running all scenarios for ${moduleName}...\n`);

    for (const scenario of testMapping.scenarios) {
      if (options.verbose) {
        console.log(`\n📋 Scenario: ${scenario}`);
        const gherkinContext = this.getGherkinContext(moduleName, scenario);
        if (gherkinContext) {
          console.log('Given/When/Then:');
          console.log(gherkinContext);
        }
      }
    }

    await this.executeTest(moduleName, null, options);
  }

  async runAllTests(options) {
    console.log('🌟 Running all BDD tests...\n');

    const modules = this.getAllModules();

    for (const module of modules) {
      console.log(`\n📦 Module: ${module}`);
      await this.runModuleTests(module, options);
    }
  }

  getTestMapping(moduleName) {
    // This would normally parse the mapping file
    // For now, return a basic structure
    const moduleMap = {
      MediaCaptureModule: {
        testFile: 'client/src/modules/media-capture/MediaCaptureModule.test.ts',
        scenarios: [
          'Check browser support for media capture',
          'Initialize media capture successfully',
          'Handle permission denied during initialization',
          'Enumerate available devices successfully',
          'Switch to different camera device',
          'Stop media capture successfully',
        ],
      },
      WebRTCTransportModule: {
        testFile: 'client/src/modules/webrtc-transport/WebRTCTransportModule.test.ts',
        scenarios: [
          'Initialize WebRTC connection successfully',
          'Handle WebRTC connection failures',
          'Send media stream over WebRTC',
        ],
      },
      OverlayRendererModule: {
        testFile: 'client/src/modules/overlay-renderer/OverlayRendererModule.test.ts',
        scenarios: [
          'Initialize canvas overlay successfully',
          'Render emotion data as overlays',
          'Handle overlay expiration',
        ],
      },
    };

    return moduleMap[moduleName];
  }

  getGherkinContext(moduleName, scenarioName) {
    if (!fs.existsSync(this.gherkinFile)) {
      return null;
    }

    const content = fs.readFileSync(this.gherkinFile, 'utf8');
    const lines = content.split('\n');

    let inTargetScenario = false;
    let context = [];

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('Scenario:') && trimmed.includes(scenarioName)) {
        inTargetScenario = true;
        context.push(trimmed);
        continue;
      }

      if (inTargetScenario) {
        if (trimmed.startsWith('Scenario:') || trimmed.startsWith('Feature:')) {
          break;
        }

        if (
          trimmed.startsWith('Given') ||
          trimmed.startsWith('When') ||
          trimmed.startsWith('Then') ||
          trimmed.startsWith('And')
        ) {
          context.push(`  ${trimmed}`);
        }
      }
    }

    return context.length > 1 ? context.join('\n') : null;
  }

  async executeTest(moduleName, scenarioName, options) {
    const testMapping = this.getTestMapping(moduleName);
    if (!testMapping) {
      console.error(`❌ No test file found for ${moduleName}`);
      return;
    }

    const testFile = testMapping.testFile;
    const args = ['--runInBand', '--no-cache'];

    if (scenarioName) {
      // Try to match scenario name to test description
      args.push('--testNamePattern', this.scenarioToTestPattern(scenarioName));
    }

    if (options.debug) {
      args.unshift('--inspect-brk');
    }

    if (options.verbose) {
      args.push('--verbose');
    }

    args.push(testFile);

    console.log(`\n🔧 Executing: jest ${args.join(' ')}\n`);

    return new Promise((resolve, reject) => {
      const jest = spawn('npx', ['jest', ...args], {
        stdio: 'inherit',
        cwd: this.getTestDirectory(testFile),
      });

      jest.on('close', code => {
        if (code === 0) {
          console.log(`\n✅ Tests completed successfully for ${moduleName}`);
          resolve();
        } else {
          console.log(`\n❌ Tests failed for ${moduleName} (exit code: ${code})`);
          reject(new Error(`Tests failed with exit code ${code}`));
        }
      });

      jest.on('error', error => {
        console.error(`\n💥 Failed to start tests: ${error.message}`);
        reject(error);
      });
    });
  }

  scenarioToTestPattern(scenarioName) {
    // Convert Gherkin scenario name to Jest test pattern
    return scenarioName
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .join('.*');
  }

  getTestDirectory(testFile) {
    if (testFile.startsWith('client/')) {
      return path.join(process.cwd(), 'client');
    } else if (testFile.startsWith('server/')) {
      return path.join(process.cwd(), 'server');
    } else {
      return process.cwd();
    }
  }

  getAllModules() {
    return [
      'MediaCaptureModule',
      'WebRTCTransportModule',
      'OverlayRendererModule',
      'FrameExtractionModule',
      'FacialAnalysisModule',
      'AudioAnalysisModule',
      'MediaRelayModule',
      'ConnectionManagerModule',
      'OverlayDataGenerator',
      'PWAShellModule',
      'NginxWebServerModule',
      'CircuitBreakerModule',
    ];
  }
}

// CLI interface
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    module: null,
    scenario: null,
    verbose: false,
    debug: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--module':
      case '-m':
        options.module = args[++i];
        break;
      case '--scenario':
      case '-s':
        options.scenario = args[++i];
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--debug':
      case '-d':
        options.debug = true;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
    }
  }

  return options;
}

function showHelp() {
  console.log(`
🥒 BDD Test Runner

Usage: node scripts/run-bdd-tests.js [options]

Options:
  -m, --module <name>     Run tests for specific module
  -s, --scenario <name>   Run specific scenario within module
  -v, --verbose          Show detailed Gherkin context
  -d, --debug            Run tests in debug mode
  -h, --help             Show this help message

Examples:
  # Run all BDD tests
  node scripts/run-bdd-tests.js

  # Run tests for MediaCaptureModule
  node scripts/run-bdd-tests.js --module MediaCaptureModule

  # Run specific scenario with verbose output
  node scripts/run-bdd-tests.js --module MediaCaptureModule --scenario "Initialize media capture successfully" --verbose

  # Debug specific module tests
  node scripts/run-bdd-tests.js --module MediaCaptureModule --debug

Available Modules:
  - MediaCaptureModule
  - WebRTCTransportModule
  - OverlayRendererModule
  - FrameExtractionModule
  - FacialAnalysisModule
  - AudioAnalysisModule
  - MediaRelayModule
  - ConnectionManagerModule
  - OverlayDataGenerator
  - PWAShellModule
  - NginxWebServerModule
  - CircuitBreakerModule
`);
}

// Run if called directly
if (require.main === module) {
  const options = parseArgs();
  const runner = new BDDTestRunner();

  runner.runTests(options).catch(error => {
    console.error('💥 BDD Test Runner failed:', error.message);
    process.exit(1);
  });
}

module.exports = BDDTestRunner;
