#!/usr/bin/env node

/**
 * POC Specification Validation Script
 *
 * Validates that all POCs include proper specification testing
 * as required by the CI/CD pipeline and documentation requirements.
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// POC specification requirements mapping
const POC_REQUIREMENTS = {
  '01': ['REQ-1', 'REQ-6', 'REQ-15'],
  '02': ['REQ-2', 'REQ-12', 'REQ-23', 'REQ-26'],
  '03': ['REQ-7', 'REQ-8', 'REQ-24', 'REQ-27'],
  '04': ['REQ-4', 'REQ-5', 'REQ-29', 'REQ-30'],
  '05': ['REQ-4', 'REQ-13', 'REQ-25', 'REQ-21'],
  '06': ['REQ-5', 'REQ-13', 'REQ-25', 'REQ-31'],
  '07': ['REQ-3', 'REQ-13', 'REQ-28', 'REQ-21'],
  '08': ['REQ-3', 'REQ-15', 'REQ-32', 'REQ-28'],
  '09': ['REQ-8', 'REQ-9', 'REQ-20', 'REQ-24'],
  10: ['REQ-6', 'REQ-7', 'REQ-25'],
  11: ['REQ-15', 'REQ-16', 'REQ-17'],
};

const POC_NAMES = {
  '01': 'Media Capture',
  '02': 'WebRTC Transport',
  '03': 'Media Relay',
  '04': 'Frame Extraction',
  '05': 'Facial Analysis',
  '06': 'Audio Analysis',
  '07': 'Overlay Generator',
  '08': 'Overlay Renderer',
  '09': 'Connection Manager',
  10: 'PWA Shell',
  11: 'Nginx Server',
};

function validatePOCSpecifications() {
  console.log(chalk.blue('🔍 Validating POC Specification Testing\n'));

  let allValid = true;
  const results = [];

  // Check each POC
  for (const [pocNum, requirements] of Object.entries(POC_REQUIREMENTS)) {
    const pocName = POC_NAMES[pocNum];
    console.log(chalk.cyan(`Validating POC ${pocNum}: ${pocName}`));

    // Find POC directory
    const pocDirs = fs.readdirSync('poc').filter(dir => dir.startsWith(pocNum));
    if (pocDirs.length === 0) {
      console.log(chalk.red(`  ❌ POC directory not found`));
      allValid = false;
      results.push({
        poc: pocNum,
        name: pocName,
        status: 'missing',
        issues: ['Directory not found'],
      });
      continue;
    }

    const pocDir = pocDirs[0];
    const pocFilePath = path.join('poc', pocDir, 'src', 'poc.ts');

    if (!fs.existsSync(pocFilePath)) {
      console.log(chalk.red(`  ❌ POC file not found: ${pocFilePath}`));
      allValid = false;
      results.push({
        poc: pocNum,
        name: pocName,
        status: 'missing',
        issues: ['POC file not found'],
      });
      continue;
    }

    // Read POC file content
    const pocContent = fs.readFileSync(pocFilePath, 'utf8');
    const issues = [];

    // Check for specification testing method
    if (!pocContent.includes('runSpecificationTests')) {
      issues.push('Missing runSpecificationTests method');
    }

    // Check for specification compliance testing
    if (!pocContent.includes('Specification Compliance')) {
      issues.push('Missing specification compliance testing');
    }

    // Check for each required specification
    for (const req of requirements) {
      const reqPattern = new RegExp(`${req}.*Specification`, 'i');
      if (!reqPattern.test(pocContent)) {
        issues.push(`Missing ${req} specification testing`);
      }
    }

    // Check for specification validation messages
    const validationPattern = /✅.*specification validated/gi;
    const validationMatches = pocContent.match(validationPattern) || [];
    if (validationMatches.length < requirements.length) {
      issues.push(
        `Insufficient specification validation messages (found ${validationMatches.length}, expected ${requirements.length})`
      );
    }

    if (issues.length === 0) {
      console.log(chalk.green(`  ✅ All specification tests present`));
      console.log(chalk.gray(`     Requirements: ${requirements.join(', ')}`));
      results.push({ poc: pocNum, name: pocName, status: 'valid', issues: [] });
    } else {
      console.log(chalk.red(`  ❌ Issues found:`));
      issues.forEach(issue => console.log(chalk.red(`     - ${issue}`)));
      allValid = false;
      results.push({ poc: pocNum, name: pocName, status: 'invalid', issues });
    }

    console.log('');
  }

  // Summary
  console.log(chalk.blue('📊 Validation Summary\n'));

  const validPOCs = results.filter(r => r.status === 'valid');
  const invalidPOCs = results.filter(r => r.status !== 'valid');

  console.log(chalk.green(`✅ Valid POCs: ${validPOCs.length}/${results.length}`));
  if (invalidPOCs.length > 0) {
    console.log(chalk.red(`❌ Invalid POCs: ${invalidPOCs.length}/${results.length}`));
    console.log(chalk.red('\nPOCs requiring fixes:'));
    invalidPOCs.forEach(poc => {
      console.log(chalk.red(`  - POC ${poc.poc}: ${poc.name}`));
      poc.issues.forEach(issue => console.log(chalk.red(`    • ${issue}`)));
    });
  }

  // Check overall coverage
  const allRequirements = new Set();
  Object.values(POC_REQUIREMENTS).forEach(reqs => {
    reqs.forEach(req => allRequirements.add(req));
  });

  console.log(
    chalk.blue(`\n📋 Specification Coverage: ${allRequirements.size} requirements covered`)
  );
  console.log(chalk.gray(`Requirements: ${Array.from(allRequirements).sort().join(', ')}`));

  if (allValid) {
    console.log(chalk.green('\n🎉 All POCs include proper specification testing!'));
    process.exit(0);
  } else {
    console.log(chalk.red('\n💥 Some POCs are missing specification testing!'));
    console.log(chalk.yellow('Please ensure all POCs include:'));
    console.log(chalk.yellow('  1. runSpecificationTests() method'));
    console.log(chalk.yellow('  2. Specification compliance testing for all required REQs'));
    console.log(chalk.yellow('  3. Proper validation messages for each specification'));
    process.exit(1);
  }
}

// Run validation
if (require.main === module) {
  try {
    validatePOCSpecifications();
  } catch (error) {
    console.error(chalk.red('💥 Validation failed:'), error.message);
    process.exit(1);
  }
}

module.exports = { validatePOCSpecifications, POC_REQUIREMENTS, POC_NAMES };
