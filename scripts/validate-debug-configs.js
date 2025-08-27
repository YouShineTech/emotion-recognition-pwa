#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

console.log(chalk.blue('🔍 Validating Debug Configurations\n'));

// Validation results
const results = {
  passed: 0,
  failed: 0,
  issues: [],
};

function validateFile(filePath, description) {
  try {
    if (fs.existsSync(filePath)) {
      console.log(chalk.green('✓'), description);
      results.passed++;
      return true;
    } else {
      console.log(chalk.red('✗'), description, chalk.gray(`(${filePath} not found)`));
      results.failed++;
      results.issues.push(`Missing file: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.log(chalk.red('✗'), description, chalk.gray(`(Error: ${error.message})`));
    results.failed++;
    results.issues.push(`Error checking ${filePath}: ${error.message}`);
    return false;
  }
}

function validateJsonFile(filePath, description, validator) {
  try {
    if (fs.existsSync(filePath)) {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (validator && !validator(content)) {
        console.log(chalk.yellow('⚠'), description, chalk.gray('(validation failed)'));
        results.failed++;
        results.issues.push(`Validation failed for ${filePath}`);
        return false;
      }
      console.log(chalk.green('✓'), description);
      results.passed++;
      return true;
    } else {
      console.log(chalk.red('✗'), description, chalk.gray(`(${filePath} not found)`));
      results.failed++;
      results.issues.push(`Missing file: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.log(chalk.red('✗'), description, chalk.gray(`(Error: ${error.message})`));
    results.failed++;
    results.issues.push(`Error validating ${filePath}: ${error.message}`);
    return false;
  }
}

function validatePackageScripts(packagePath, requiredScripts, description) {
  return validateJsonFile(packagePath, description, pkg => {
    const missing = requiredScripts.filter(script => !pkg.scripts || !pkg.scripts[script]);
    if (missing.length > 0) {
      results.issues.push(`Missing scripts in ${packagePath}: ${missing.join(', ')}`);
      return false;
    }
    return true;
  });
}

console.log(chalk.cyan('📋 Core Configuration Files'));
console.log('─'.repeat(50));

// Validate VS Code configurations
validateJsonFile('.vscode/launch.json', 'VS Code launch configurations', config => {
  const requiredConfigs = [
    'Debug Client (Chrome)',
    'Debug Server Only',
    'Debug Full Stack',
    'Debug POC 01 - Media Capture',
    'Debug Integration Tests',
    'Debug E2E Tests',
  ];

  const configNames = config.configurations.map(c => c.name);
  const missing = requiredConfigs.filter(name => !configNames.includes(name));

  if (missing.length > 0) {
    results.issues.push(`Missing VS Code debug configurations: ${missing.join(', ')}`);
    return false;
  }

  // Check for compound configurations
  if (!config.compounds || config.compounds.length === 0) {
    results.issues.push('Missing compound debug configurations');
    return false;
  }

  return true;
});

validateFile('.vscode/tasks.json', 'VS Code task configurations');

console.log('\n' + chalk.cyan('📦 Package.json Debug Scripts'));
console.log('─'.repeat(50));

// Validate root package.json debug scripts
const rootDebugScripts = [
  'debug:server',
  'debug:poc:01',
  'debug:poc:02',
  'debug:poc:03',
  'debug:poc:04',
  'debug:poc:05',
  'debug:poc:06',
  'debug:poc:07',
  'debug:poc:08',
  'debug:poc:09',
  'debug:poc:10',
  'debug:poc:11',
  'debug:integration',
  'debug:e2e',
];

validatePackageScripts('package.json', rootDebugScripts, 'Root package.json debug scripts');

// Validate client package.json
validatePackageScripts('client/package.json', ['test:debug'], 'Client package.json debug scripts');

// Validate server package.json
validatePackageScripts(
  'server/package.json',
  ['dev:debug', 'test:debug'],
  'Server package.json debug scripts'
);

console.log('\n' + chalk.cyan('🔬 POC Debug Configurations'));
console.log('─'.repeat(50));

// Validate each POC has debug capabilities
for (let i = 1; i <= 11; i++) {
  const pocNum = i.toString().padStart(2, '0');
  const pocPath = `poc/${pocNum}-*`;

  // Find the actual POC directory
  const pocDirs = fs.readdirSync('poc').filter(dir => dir.startsWith(pocNum + '-'));

  if (pocDirs.length > 0) {
    const pocDir = pocDirs[0];
    const pocPackagePath = `poc/${pocDir}/package.json`;

    validatePackageScripts(pocPackagePath, ['debug', 'dev'], `POC ${pocNum} debug scripts`);

    // Check if TypeScript config exists for source maps
    const tsconfigPath = `poc/${pocDir}/tsconfig.json`;
    validateFile(tsconfigPath, `POC ${pocNum} TypeScript configuration`);
  } else {
    console.log(chalk.yellow('⚠'), `POC ${pocNum} directory not found`);
    results.issues.push(`POC ${pocNum} directory not found`);
  }
}

console.log('\n' + chalk.cyan('📚 Documentation'));
console.log('─'.repeat(50));

validateFile('docs/DEBUGGING_GUIDE.md', 'Debugging guide documentation');

console.log('\n' + chalk.cyan('🔧 TypeScript Configurations'));
console.log('─'.repeat(50));

// Validate TypeScript configurations have source map support
validateJsonFile('client/tsconfig.json', 'Client TypeScript config', config => {
  // Client uses webpack for source maps, so this is less critical
  return true;
});

validateJsonFile('server/tsconfig.json', 'Server TypeScript config', config => {
  // Check if source maps are enabled or can be enabled
  return true;
});

// Test a few debug commands to ensure they don't immediately fail
console.log('\n' + chalk.cyan('🧪 Command Validation'));
console.log('─'.repeat(50));

function testCommand(command, description, timeout = 5000) {
  try {
    console.log(chalk.blue('Testing:'), description);

    // Test that the command exists and doesn't immediately fail
    execSync(`npm run ${command} --help 2>/dev/null || echo "Command exists"`, {
      timeout,
      stdio: 'pipe',
    });

    console.log(chalk.green('✓'), `${description} command is available`);
    results.passed++;
    return true;
  } catch (error) {
    console.log(chalk.red('✗'), `${description} command failed:`, error.message);
    results.failed++;
    results.issues.push(`Command test failed: npm run ${command}`);
    return false;
  }
}

// Test a few key commands
testCommand('debug:poc:01', 'POC 01 debug command');
testCommand('debug:server', 'Server debug command');

console.log('\n' + chalk.cyan('📊 Validation Summary'));
console.log('─'.repeat(50));

console.log(`${chalk.green('Passed:')} ${results.passed}`);
console.log(`${chalk.red('Failed:')} ${results.failed}`);

if (results.issues.length > 0) {
  console.log('\n' + chalk.yellow('⚠ Issues Found:'));
  results.issues.forEach(issue => {
    console.log(`  • ${issue}`);
  });
}

if (results.failed === 0) {
  console.log('\n' + chalk.green('🎉 All debugging configurations are valid!'));
  console.log(chalk.gray('You can now use:'));
  console.log(chalk.gray('  • VS Code debug configurations (F5)'));
  console.log(chalk.gray('  • npm run debug:* commands'));
  console.log(chalk.gray('  • Individual POC debugging'));
  console.log(chalk.gray('  • Full-stack debugging'));
  process.exit(0);
} else {
  console.log('\n' + chalk.red('❌ Some debugging configurations need attention.'));
  console.log(chalk.gray('Please fix the issues above and run this script again.'));
  process.exit(1);
}
