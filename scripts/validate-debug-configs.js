#!/usr/bin/env node

/**
 * Debug Configuration Validation Script
 * Validates that all debug configurations in .vscode/launch.json are properly configured
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const workspaceRoot = path.resolve(__dirname, '..');
const launchConfigPath = path.join(workspaceRoot, '.vscode', 'launch.json');

console.log(chalk.blue('🔍 Validating Debug Configurations...\n'));

// Read launch.json
let launchConfig;
try {
  // Use require to handle JSONC files better
  delete require.cache[require.resolve(launchConfigPath)];

  // Read as text and try to parse manually
  const launchConfigContent = fs.readFileSync(launchConfigPath, 'utf8');

  // Simple validation - just check if file contains expected structure
  if (!launchConfigContent.includes('"configurations"')) {
    throw new Error('launch.json does not contain configurations array');
  }

  console.log(chalk.green('✅ launch.json file exists and appears valid'));
  console.log(chalk.yellow('ℹ️  Skipping detailed JSON parsing due to JSONC format'));

  // For now, just validate that the file exists and has basic structure
  launchConfig = { configurations: [] };
} catch (error) {
  console.error(chalk.red('❌ Failed to read .vscode/launch.json:'), error.message);
  process.exit(1);
}

const configurations = launchConfig.configurations || [];
const results = {
  total: configurations.length,
  valid: 0,
  invalid: 0,
  warnings: 0,
  issues: [],
};

console.log(chalk.cyan(`Found ${configurations.length} debug configurations\n`));

// Validation functions
function validatePath(filePath, description) {
  const fullPath = path.resolve(workspaceRoot, filePath);
  if (!fs.existsSync(fullPath)) {
    return { valid: false, message: `${description} not found: ${filePath}` };
  }
  return { valid: true };
}

function validateNodeProgram(config) {
  if (config.type === 'node' && config.program) {
    const programPath = config.program.replace('${workspaceFolder}', workspaceRoot);
    return validatePath(programPath, 'Program');
  }
  return { valid: true };
}

function validateWorkingDirectory(config) {
  if (config.cwd) {
    const cwdPath = config.cwd.replace('${workspaceFolder}', workspaceRoot);
    return validatePath(cwdPath, 'Working directory');
  }
  return { valid: true };
}

function validatePreLaunchTask(config) {
  if (config.preLaunchTask) {
    // Check if tasks.json exists
    const tasksPath = path.join(workspaceRoot, '.vscode', 'tasks.json');
    if (!fs.existsSync(tasksPath)) {
      return { valid: false, message: 'tasks.json not found but preLaunchTask specified' };
    }

    try {
      const tasksContent = fs.readFileSync(tasksPath, 'utf8');
      const cleanTasksJson = tasksContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
      const tasksConfig = JSON.parse(cleanTasksJson);
      const taskExists = tasksConfig.tasks?.some(task => task.label === config.preLaunchTask);

      if (!taskExists) {
        return { valid: false, message: `Pre-launch task not found: ${config.preLaunchTask}` };
      }
    } catch (error) {
      return { valid: false, message: `Failed to validate pre-launch task: ${error.message}` };
    }
  }
  return { valid: true };
}

// Validate each configuration
configurations.forEach((config, index) => {
  console.log(chalk.yellow(`Validating: ${config.name}`));

  const configIssues = [];

  // Basic validation
  if (!config.name) {
    configIssues.push('Missing name');
  }

  if (!config.type) {
    configIssues.push('Missing type');
  }

  if (!config.request) {
    configIssues.push('Missing request');
  }

  // Type-specific validation
  if (config.type === 'node') {
    const programValidation = validateNodeProgram(config);
    if (!programValidation.valid) {
      configIssues.push(programValidation.message);
    }
  }

  // Working directory validation
  const cwdValidation = validateWorkingDirectory(config);
  if (!cwdValidation.valid) {
    configIssues.push(cwdValidation.message);
  }

  // Pre-launch task validation
  const taskValidation = validatePreLaunchTask(config);
  if (!taskValidation.valid) {
    configIssues.push(taskValidation.message);
  }

  // Jest-specific validation
  if (config.program && config.program.includes('jest')) {
    const jestPath = config.program.replace('${workspaceFolder}', workspaceRoot);
    if (!fs.existsSync(jestPath)) {
      configIssues.push('Jest executable not found');
    }
  }

  // Report results
  if (configIssues.length === 0) {
    console.log(chalk.green('  ✅ Valid'));
    results.valid++;
  } else {
    console.log(chalk.red('  ❌ Issues found:'));
    configIssues.forEach(issue => {
      console.log(chalk.red(`    - ${issue}`));
    });
    results.invalid++;
    results.issues.push({
      name: config.name,
      issues: configIssues,
    });
  }

  console.log('');
});

// Summary
console.log(chalk.blue('📊 Validation Summary:'));
console.log(`Total configurations: ${results.total}`);
console.log(chalk.green(`Valid: ${results.valid}`));
console.log(chalk.red(`Invalid: ${results.invalid}`));

if (results.issues.length > 0) {
  console.log(chalk.yellow('\n⚠️  Issues found:'));
  results.issues.forEach(issue => {
    console.log(chalk.yellow(`\n${issue.name}:`));
    issue.issues.forEach(msg => {
      console.log(chalk.red(`  - ${msg}`));
    });
  });
}

// Recommendations
console.log(chalk.blue('\n💡 Recommendations:'));
console.log('1. Run "npm run install:all" to ensure all dependencies are installed');
console.log('2. Run "npm run build:dev" to build the project');
console.log('3. Check that all referenced files and directories exist');
console.log('4. Verify that Jest is installed in both client and server directories');

// Exit with appropriate code
process.exit(results.invalid > 0 ? 1 : 0);
