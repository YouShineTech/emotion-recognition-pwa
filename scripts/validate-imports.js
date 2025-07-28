#!/usr/bin/env node

/**
 * Import Validation Script
 * Validates that modules follow proper modular import patterns
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const SHARED_INTERFACES_DIR = 'shared/interfaces';
const CLIENT_MODULES_DIR = 'client/src/modules';
const SERVER_MODULES_DIR = 'server/src/modules';

// Validation rules
const FORBIDDEN_PATTERNS = [
  /from\s+['"].*\/index['"]/, // No index imports
  /from\s+['"].*\/index\.ts['"]/, // No index.ts imports
  /from\s+['"].*\/index\.js['"]/, // No index.js imports
  /from\s+['"]@\/shared\/interfaces['"]/, // No directory imports
  /from\s+['"]\.\.\/\.\.\/\.\.\/shared\/interfaces['"]/, // No relative directory imports
];

const REQUIRED_PATTERNS = [
  /from\s+['"]@\/shared\/interfaces\/[^\/]+\.interface['"]/, // Must use specific interface files
];

/**
 * Check if a file contains forbidden import patterns
 */
function validateFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const errors = [];
  const warnings = [];

  // Check for forbidden patterns
  FORBIDDEN_PATTERNS.forEach((pattern, index) => {
    if (pattern.test(content)) {
      errors.push({
        file: filePath,
        type: 'forbidden_import',
        pattern: pattern.toString(),
        message: getForbiddenPatternMessage(index),
      });
    }
  });

  // Check for proper interface imports
  const importLines = content.split('\n').filter(line =>
    line.trim().startsWith('import') && line.includes('shared/interfaces')
  );

  importLines.forEach((line, lineNumber) => {
    const hasValidPattern = REQUIRED_PATTERNS.some(pattern => pattern.test(line));
    if (!hasValidPattern && line.includes('shared/interfaces')) {
      warnings.push({
        file: filePath,
        line: lineNumber + 1,
        type: 'invalid_interface_import',
        content: line.trim(),
        message: 'Interface import should use specific .interface file',
      });
    }
  });

  return { errors, warnings };
}

/**
 * Get human-readable message for forbidden patterns
 */
function getForbiddenPatternMessage(patternIndex) {
  const messages = [
    'Importing from index files is not allowed. Use explicit interface imports.',
    'Importing from index.ts files is not allowed. Use explicit interface imports.',
    'Importing from index.js files is not allowed. Use explicit interface imports.',
    'Importing from interfaces directory is not allowed. Import from specific interface files.',
    'Importing from interfaces directory is not allowed. Import from specific interface files.',
  ];
  return messages[patternIndex] || 'Invalid import pattern detected.';
}

/**
 * Validate that no central export hub exists
 */
function validateNoCentralHub() {
  const errors = [];
  const hubFiles = [
    'shared/interfaces/index.ts',
    'shared/interfaces/index.js',
    'shared/interfaces/index.d.ts',
  ];

  hubFiles.forEach(hubFile => {
    if (fs.existsSync(hubFile)) {
      errors.push({
        file: hubFile,
        type: 'central_hub_exists',
        message: 'Central export hub detected. Remove this file to maintain modular architecture.',
      });
    }
  });

  return errors;
}

/**
 * Validate that each interface file serves exactly one module
 */
function validateSingleResponsibility() {
  const errors = [];
  const interfaceFiles = glob.sync(`${SHARED_INTERFACES_DIR}/*.interface.ts`);

  interfaceFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const exportCount = (content.match(/export\s+interface\s+\w+Module/g) || []).length;

    if (exportCount > 1) {
      errors.push({
        file,
        type: 'multiple_modules',
        message: `Interface file contains ${exportCount} module interfaces. Each file should serve exactly one module.`,
      });
    }
  });

  return errors;
}

/**
 * Validate circular dependencies
 */
function validateNoCycles() {
  const errors = [];
  const interfaceFiles = glob.sync(`${SHARED_INTERFACES_DIR}/*.interface.ts`);
  const dependencies = new Map();

  // Build dependency graph
  interfaceFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const imports = content.match(/from\s+['"]\.\/([^'"]+)\.interface['"]/g) || [];
    const fileName = path.basename(file, '.ts');

    dependencies.set(fileName, imports.map(imp => {
      const match = imp.match(/from\s+['"]\.\/([^'"]+)\.interface['"]/);
      return match ? match[1] + '.interface' : null;
    }).filter(Boolean));
  });

  // Simple cycle detection (could be more sophisticated)
  dependencies.forEach((deps, file) => {
    deps.forEach(dep => {
      const depDeps = dependencies.get(dep) || [];
      if (depDeps.includes(file)) {
        errors.push({
          file: `${SHARED_INTERFACES_DIR}/${file}.ts`,
          type: 'circular_dependency',
          message: `Circular dependency detected between ${file} and ${dep}`,
        });
      }
    });
  });

  return errors;
}

/**
 * Main validation function
 */
function validateImports() {
  console.log('🔍 Validating modular import patterns...\n');

  let totalErrors = 0;
  let totalWarnings = 0;

  // 1. Validate no central export hub exists
  console.log('1. Checking for central export hubs...');
  const hubErrors = validateNoCentralHub();
  if (hubErrors.length === 0) {
    console.log('   ✅ No central export hubs found');
  } else {
    console.log(`   ❌ Found ${hubErrors.length} central export hub(s)`);
    hubErrors.forEach(error => {
      console.log(`      - ${error.file}: ${error.message}`);
    });
  }
  totalErrors += hubErrors.length;

  // 2. Validate single responsibility
  console.log('\n2. Checking single responsibility principle...');
  const srpErrors = validateSingleResponsibility();
  if (srpErrors.length === 0) {
    console.log('   ✅ All interface files follow single responsibility principle');
  } else {
    console.log(`   ❌ Found ${srpErrors.length} single responsibility violation(s)`);
    srpErrors.forEach(error => {
      console.log(`      - ${error.file}: ${error.message}`);
    });
  }
  totalErrors += srpErrors.length;

  // 3. Validate no circular dependencies
  console.log('\n3. Checking for circular dependencies...');
  const cycleErrors = validateNoCycles();
  if (cycleErrors.length === 0) {
    console.log('   ✅ No circular dependencies found');
  } else {
    console.log(`   ❌ Found ${cycleErrors.length} circular dependenc(ies)`);
    cycleErrors.forEach(error => {
      console.log(`      - ${error.message}`);
    });
  }
  totalErrors += cycleErrors.length;

  // 4. Validate module import patterns
  console.log('\n4. Checking module import patterns...');
  const moduleFiles = [
    ...glob.sync(`${CLIENT_MODULES_DIR}/**/*.ts`),
    ...glob.sync(`${SERVER_MODULES_DIR}/**/*.ts`),
  ];

  let fileErrors = 0;
  let fileWarnings = 0;

  moduleFiles.forEach(file => {
    const { errors, warnings } = validateFile(file);
    fileErrors += errors.length;
    fileWarnings += warnings.length;

    if (errors.length > 0) {
      console.log(`   ❌ ${file}:`);
      errors.forEach(error => {
        console.log(`      - ${error.message}`);
      });
    }

    if (warnings.length > 0) {
      console.log(`   ⚠️  ${file}:`);
      warnings.forEach(warning => {
        console.log(`      - Line ${warning.line}: ${warning.message}`);
      });
    }
  });

  if (fileErrors === 0 && fileWarnings === 0) {
    console.log('   ✅ All module imports follow proper patterns');
  } else {
    console.log(`   Found ${fileErrors} error(s) and ${fileWarnings} warning(s) in module files`);
  }

  totalErrors += fileErrors;
  totalWarnings += fileWarnings;

  // Summary
  console.log('\n📊 Validation Summary:');
  console.log(`   Errors: ${totalErrors}`);
  console.log(`   Warnings: ${totalWarnings}`);

  if (totalErrors === 0) {
    console.log('\n✅ All modular import validations passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Modular import validation failed. Please fix the errors above.');
    process.exit(1);
  }
}

// Run validation
if (require.main === module) {
  validateImports();
}

module.exports = { validateImports };
