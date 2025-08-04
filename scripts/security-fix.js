#!/usr/bin/env node

const { execSync } = require('child_process');
const chalk = require('chalk');

console.log(chalk.blue('🔧 Attempting to fix security vulnerabilities...'));

try {
  // 1. NPM audit fix
  console.log(chalk.yellow('📦 Running npm audit fix...'));
  try {
    execSync('npm audit fix', { stdio: 'inherit' });
    console.log(chalk.green('✅ NPM audit fix completed'));
  } catch (error) {
    console.log(chalk.yellow('⚠️  Some vulnerabilities may require manual intervention'));
  }

  // 2. Update dependencies in client
  console.log(chalk.yellow('📦 Fixing client dependencies...'));
  try {
    execSync('cd client && npm audit fix', { stdio: 'inherit' });
    console.log(chalk.green('✅ Client dependencies fixed'));
  } catch (error) {
    console.log(chalk.yellow('⚠️  Some client vulnerabilities may require manual intervention'));
  }

  // 3. Update dependencies in server
  console.log(chalk.yellow('📦 Fixing server dependencies...'));
  try {
    execSync('cd server && npm audit fix', { stdio: 'inherit' });
    console.log(chalk.green('✅ Server dependencies fixed'));
  } catch (error) {
    console.log(chalk.yellow('⚠️  Some server vulnerabilities may require manual intervention'));
  }

  console.log(chalk.green('\n✅ Security fix attempt completed!'));
  console.log(chalk.blue('💡 Run "npm run security:scan" to verify fixes'));
} catch (error) {
  console.error(chalk.red('Security fix error:'), error.message);
  process.exit(1);
}
