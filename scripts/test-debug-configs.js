#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

console.log(chalk.blue('🧪 Testing VS Code Debug Configurations\n'));

// Read launch.json
const launchConfig = JSON.parse(fs.readFileSync('.vscode/launch.json', 'utf8'));

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  issues: [],
};

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    return true;
  } else {
    results.issues.push(`Missing: ${filePath} (${description})`);
    return false;
  }
}

function analyzeConfiguration(config) {
  const issues = [];
  const warnings = [];

  // Check for required fields
  if (!config.name) issues.push('Missing name');
  if (!config.type) issues.push('Missing type');
  if (!config.request) issues.push('Missing request');

  // Type-specific checks
  if (config.type === 'node') {
    if (config.request === 'launch' && !config.program) {
      issues.push('Missing program');
    }
    if (config.request === 'attach' && !config.port) {
      issues.push('Missing port for attach configuration');
    }
    if (!config.cwd && config.request === 'launch') {
      warnings.push('Missing cwd (may use workspace root)');
    }

    // Check if program path exists
    if (config.program) {
      const programPath = config.program.replace('${workspaceFolder}', '.');
      if (programPath.includes('node_modules/.bin/')) {
        // Check if the binary exists in any of the relevant node_modules
        const binaryName = path.basename(programPath);
        const possiblePaths = [
          `node_modules/.bin/${binaryName}`,
          `client/node_modules/.bin/${binaryName}`,
          `server/node_modules/.bin/${binaryName}`,
        ];

        const exists = possiblePaths.some(p => fs.existsSync(p));
        if (!exists) {
          issues.push(`Binary not found: ${binaryName}`);
        }
      }
    }

    // Check working directory
    if (config.cwd) {
      const cwdPath = config.cwd.replace('${workspaceFolder}', '.');
      if (!fs.existsSync(cwdPath)) {
        issues.push(`Working directory not found: ${cwdPath}`);
      }
    }
  }

  if (config.type === 'chrome' || config.type === 'edge') {
    if (!config.url) issues.push('Missing url');
    if (!config.webRoot) warnings.push('Missing webRoot');

    // Check webRoot path
    if (config.webRoot) {
      const webRootPath = config.webRoot.replace('${workspaceFolder}', '.');
      if (!fs.existsSync(webRootPath)) {
        warnings.push(`WebRoot directory not found: ${webRootPath}`);
      }
    }
  }

  return { issues, warnings };
}

console.log(chalk.cyan('📋 Configuration Analysis'));
console.log('─'.repeat(50));

// Analyze each configuration
launchConfig.configurations.forEach((config, index) => {
  const analysis = analyzeConfiguration(config);

  if (analysis.issues.length === 0) {
    console.log(chalk.green('✓'), config.name);
    results.passed++;
  } else {
    console.log(chalk.red('✗'), config.name);
    analysis.issues.forEach(issue => {
      console.log(chalk.red('  • '), issue);
      results.issues.push(`${config.name}: ${issue}`);
    });
    results.failed++;
  }

  if (analysis.warnings.length > 0) {
    analysis.warnings.forEach(warning => {
      console.log(chalk.yellow('  ⚠ '), warning);
    });
    results.warnings += analysis.warnings.length;
  }
});

console.log('\n' + chalk.cyan('🔍 Redundancy Analysis'));
console.log('─'.repeat(50));

// Check for redundant configurations
const configsByType = {};
launchConfig.configurations.forEach(config => {
  const key = `${config.type}-${config.program || config.url}`;
  if (!configsByType[key]) {
    configsByType[key] = [];
  }
  configsByType[key].push(config.name);
});

let redundanciesFound = false;
Object.entries(configsByType).forEach(([key, configs]) => {
  if (configs.length > 1) {
    console.log(chalk.yellow('⚠'), `Potential redundancy: ${configs.join(', ')}`);
    redundanciesFound = true;
    results.warnings++;
  }
});

if (!redundanciesFound) {
  console.log(chalk.green('✓'), 'No redundant configurations found');
}

console.log('\n' + chalk.cyan('🔗 Compound Configuration Analysis'));
console.log('─'.repeat(50));

if (launchConfig.compounds && launchConfig.compounds.length > 0) {
  launchConfig.compounds.forEach(compound => {
    console.log(chalk.blue('📦'), compound.name);

    compound.configurations.forEach(configName => {
      const exists = launchConfig.configurations.some(c => c.name === configName);
      if (exists) {
        console.log(chalk.green('  ✓'), configName);
      } else {
        console.log(chalk.red('  ✗'), `Missing configuration: ${configName}`);
        results.issues.push(`Compound "${compound.name}" references missing config: ${configName}`);
        results.failed++;
      }
    });
  });
} else {
  console.log(chalk.gray('No compound configurations defined'));
}

console.log('\n' + chalk.cyan('🎯 Specific Configuration Tests'));
console.log('─'.repeat(50));

// Test specific configurations that are critical
const criticalTests = [
  {
    name: 'POC ts-node availability',
    test: () => {
      // Check if POCs have ts-node in their dependencies
      const pocDirs = fs.readdirSync('poc').filter(dir => dir.match(/^\d{2}-/));
      let allHaveTsNode = true;

      pocDirs.forEach(pocDir => {
        const packagePath = `poc/${pocDir}/package.json`;
        if (fs.existsSync(packagePath)) {
          const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
          const hasTsNode =
            (pkg.devDependencies && pkg.devDependencies['ts-node']) ||
            (pkg.dependencies && pkg.dependencies['ts-node']);
          if (!hasTsNode) {
            results.issues.push(`${pocDir} missing ts-node dependency`);
            allHaveTsNode = false;
          }
        }
      });

      return allHaveTsNode;
    },
  },
  {
    name: 'Server ts-node configuration',
    test: () => {
      const serverPkg = JSON.parse(fs.readFileSync('server/package.json', 'utf8'));
      return (
        (serverPkg.devDependencies && serverPkg.devDependencies['ts-node']) ||
        (serverPkg.dependencies && serverPkg.dependencies['ts-node'])
      );
    },
  },
  {
    name: 'Client webpack dev server',
    test: () => {
      const clientPkg = JSON.parse(fs.readFileSync('client/package.json', 'utf8'));
      return clientPkg.devDependencies && clientPkg.devDependencies['webpack-dev-server'];
    },
  },
];

criticalTests.forEach(test => {
  try {
    if (test.test()) {
      console.log(chalk.green('✓'), test.name);
      results.passed++;
    } else {
      console.log(chalk.red('✗'), test.name);
      results.failed++;
    }
  } catch (error) {
    console.log(chalk.red('✗'), test.name, chalk.gray(`(${error.message})`));
    results.failed++;
    results.issues.push(`${test.name}: ${error.message}`);
  }
});

console.log('\n' + chalk.cyan('💡 Recommendations'));
console.log('─'.repeat(50));

// Provide recommendations
const recommendations = [];

// Check for missing useful configurations
const hasCurrentFileDebug = launchConfig.configurations.some(
  c => c.name.includes('Current') && c.args && c.args.includes('${fileBasenameNoExtension}')
);

if (!hasCurrentFileDebug) {
  recommendations.push('Consider adding a "Debug Current File" configuration for more flexibility');
}

// Check for attach configurations
const hasAttachConfig = launchConfig.configurations.some(c => c.request === 'attach');
if (!hasAttachConfig) {
  recommendations.push('Consider adding attach configurations for debugging running processes');
}

// Check for environment-specific configs
const hasProductionDebug = launchConfig.configurations.some(
  c => c.env && c.env.NODE_ENV === 'production'
);

if (hasProductionDebug) {
  recommendations.push('⚠ Production debugging detected - ensure this is intentional');
}

if (recommendations.length === 0) {
  console.log(chalk.green('✓'), 'Configuration looks comprehensive');
} else {
  recommendations.forEach(rec => {
    console.log(chalk.blue('💡'), rec);
  });
}

console.log('\n' + chalk.cyan('📊 Summary'));
console.log('─'.repeat(50));

console.log(`${chalk.green('Passed:')} ${results.passed}`);
console.log(`${chalk.red('Failed:')} ${results.failed}`);
console.log(`${chalk.yellow('Warnings:')} ${results.warnings}`);

if (results.issues.length > 0) {
  console.log('\n' + chalk.red('❌ Issues Found:'));
  results.issues.forEach(issue => {
    console.log(`  • ${issue}`);
  });
}

if (results.failed === 0) {
  console.log('\n' + chalk.green('🎉 All debug configurations should work!'));
  console.log(chalk.gray('Ready for debugging:'));
  console.log(chalk.gray('  • Press F5 in VS Code'));
  console.log(chalk.gray('  • Select any configuration from the dropdown'));
  console.log(chalk.gray('  • Set breakpoints and start debugging'));
} else {
  console.log('\n' + chalk.red('❌ Some configurations may not work properly.'));
  console.log(chalk.gray('Please address the issues above.'));
}

process.exit(results.failed > 0 ? 1 : 0);
