#!/usr/bin/env node

/**
 * System Health Check
 * Verifies that all components are working correctly
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class HealthChecker {
  constructor() {
    this.checks = [];
    this.results = [];
  }

  async runAllChecks() {
    console.log(chalk.bold.blue('🏥 System Health Check'));
    console.log(chalk.gray('Verifying build environment and dependencies...\n'));

    // Define all health checks
    this.checks = [
      { name: 'Node.js Version', check: this.checkNodeVersion.bind(this) },
      { name: 'NPM Version', check: this.checkNpmVersion.bind(this) },
      { name: 'Project Structure', check: this.checkProjectStructure.bind(this) },
      { name: 'Dependencies Installed', check: this.checkDependencies.bind(this) },
      { name: 'TypeScript Configuration', check: this.checkTypeScriptConfig.bind(this) },
      { name: 'Build System', check: this.checkBuildSystem.bind(this) },
      { name: 'Test Framework', check: this.checkTestFramework.bind(this) },
      { name: 'Docker Environment', check: this.checkDockerEnvironment.bind(this) },
      { name: 'Server Health', check: this.checkServerHealth.bind(this) },
      { name: 'Redis Connection', check: this.checkRedisConnection.bind(this) },
      { name: 'Environment Configuration', check: this.checkEnvironmentConfig.bind(this) },
    ];

    // Run all checks
    for (const check of this.checks) {
      await this.runCheck(check);
    }

    // Display results
    this.displayResults();

    return this.results.every(result => result.status === 'pass');
  }

  async runCheck(check) {
    try {
      console.log(chalk.yellow(`⏳ Checking ${check.name}...`));

      const result = await check.check();

      this.results.push({
        name: check.name,
        status: 'pass',
        message: result.message || 'OK',
        details: result.details,
      });

      console.log(chalk.green(`✅ ${check.name}: ${result.message || 'OK'}`));
    } catch (error) {
      this.results.push({
        name: check.name,
        status: 'fail',
        message: error.message,
        details: error.details,
      });

      console.log(chalk.red(`❌ ${check.name}: ${error.message}`));
    }
  }

  async checkNodeVersion() {
    const { stdout } = await execAsync('node --version');
    const version = stdout.trim();
    const majorVersion = parseInt(version.substring(1).split('.')[0]);

    if (majorVersion < 18) {
      throw new Error(`Node.js ${majorVersion} detected. Requires Node.js 18+`);
    }

    return { message: `${version} (✓ Compatible)` };
  }

  async checkNpmVersion() {
    const { stdout } = await execAsync('npm --version');
    const version = stdout.trim();
    const majorVersion = parseInt(version.split('.')[0]);

    if (majorVersion < 8) {
      throw new Error(`npm ${majorVersion} detected. Requires npm 8+`);
    }

    return { message: `${version} (✓ Compatible)` };
  }

  async checkProjectStructure() {
    const requiredPaths = [
      'client/package.json',
      'server/package.json',
      'shared/interfaces',
      '.github/workflows',
      'docker-compose.yml',
      'README.md',
    ];

    const missing = [];

    for (const filePath of requiredPaths) {
      if (!fs.existsSync(filePath)) {
        missing.push(filePath);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Missing files/directories: ${missing.join(', ')}`);
    }

    return { message: `All required files present (${requiredPaths.length} checked)` };
  }

  async checkDependencies() {
    const clientNodeModules = fs.existsSync('client/node_modules');
    const serverNodeModules = fs.existsSync('server/node_modules');
    const rootNodeModules = fs.existsSync('node_modules');

    if (!clientNodeModules || !serverNodeModules || !rootNodeModules) {
      throw new Error('Dependencies not installed. Run "npm run install:all"');
    }

    return { message: 'All dependencies installed' };
  }

  async checkTypeScriptConfig() {
    const clientTsConfig = fs.existsSync('client/tsconfig.json');
    const serverTsConfig = fs.existsSync('server/tsconfig.json');

    if (!clientTsConfig || !serverTsConfig) {
      throw new Error('TypeScript configuration missing');
    }

    // Test TypeScript compilation
    try {
      await execAsync('cd client && npx tsc --noEmit');
      await execAsync('cd server && npx tsc --noEmit');
    } catch (error) {
      throw new Error('TypeScript compilation errors detected');
    }

    return { message: 'TypeScript configuration valid' };
  }

  async checkBuildSystem() {
    try {
      // Test client build
      await execAsync('cd client && npm run build', { timeout: 30000 });

      // Test server build
      await execAsync('cd server && npm run build', { timeout: 30000 });

      return { message: 'Build system working correctly' };
    } catch (error) {
      throw new Error('Build system failed. Check build configuration');
    }
  }

  async checkTestFramework() {
    try {
      // Run a quick test to verify Jest is working
      await execAsync('cd client && npm test -- --passWithNoTests', { timeout: 15000 });
      await execAsync('cd server && npm test -- --passWithNoTests', { timeout: 15000 });

      return { message: 'Test framework configured correctly' };
    } catch (error) {
      throw new Error('Test framework not working. Check Jest configuration');
    }
  }

  async checkDockerEnvironment() {
    try {
      await execAsync('docker --version');
      await execAsync('docker-compose --version');

      return { message: 'Docker environment available' };
    } catch (error) {
      return { message: 'Docker not available (optional for development)' };
    }
  }

  async checkServerHealth() {
    return new Promise((resolve, reject) => {
      const req = http.get('http://localhost:3001/api/health', { timeout: 5000 }, res => {
        if (res.statusCode === 200) {
          resolve({ message: 'Server responding correctly' });
        } else {
          reject(new Error(`Server returned status ${res.statusCode}`));
        }
      });

      req.on('error', () => {
        resolve({ message: 'Server not running (start with "npm run dev")' });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Server health check timeout'));
      });
    });
  }

  async checkRedisConnection() {
    try {
      await execAsync('redis-cli ping', { timeout: 5000 });
      return { message: 'Redis connection successful' };
    } catch (error) {
      return { message: 'Redis not running (start with Docker or locally)' };
    }
  }

  async checkEnvironmentConfig() {
    const envFiles = ['.env.example'];
    const missing = envFiles.filter(file => !fs.existsSync(file));

    if (missing.length > 0) {
      throw new Error(`Missing environment files: ${missing.join(', ')}`);
    }

    return { message: 'Environment configuration files present' };
  }

  displayResults() {
    console.log('\n' + chalk.bold.blue('📊 Health Check Summary'));
    console.log('='.repeat(50));

    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;

    console.log(chalk.green(`✅ Passed: ${passed}`));
    console.log(chalk.red(`❌ Failed: ${failed}`));
    console.log(chalk.blue(`📋 Total: ${this.results.length}`));

    if (failed > 0) {
      console.log('\n' + chalk.bold.red('❌ Failed Checks:'));
      this.results
        .filter(r => r.status === 'fail')
        .forEach(result => {
          console.log(chalk.red(`  • ${result.name}: ${result.message}`));
        });
    }

    console.log('\n' + chalk.bold.cyan('🚀 Quick Start Commands:'));
    console.log(chalk.gray('  npm run setup     - Complete environment setup'));
    console.log(chalk.gray('  npm run dev       - Start development servers'));
    console.log(chalk.gray('  npm test          - Run all tests'));
    console.log(chalk.gray('  npm run docker:up - Start with Docker'));

    if (failed === 0) {
      console.log('\n' + chalk.bold.green('🎉 All systems operational! Ready for development.'));
    } else {
      console.log(
        '\n' + chalk.bold.yellow('⚠️  Some issues detected. Please resolve before continuing.')
      );
    }
  }
}

// Run health check if called directly
if (require.main === module) {
  const checker = new HealthChecker();
  checker
    .runAllChecks()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error(chalk.red('Health check failed:', error.message));
      process.exit(1);
    });
}

module.exports = HealthChecker;
