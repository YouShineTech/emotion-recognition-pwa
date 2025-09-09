#!/usr/bin/env node

/**
 * Gherkin Coverage Validation Script
 * Ensures all Gherkin scenarios have corresponding unit tests
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

class GherkinCoverageValidator {
  constructor() {
    this.gherkinFile = 'tests/gherkin-user-stories.feature';
    this.mappingFile = 'tests/gherkin-test-mapping.md';
    this.testFiles = [];
    this.scenarios = [];
    this.coverage = {
      total: 0,
      covered: 0,
      missing: [],
    };
  }

  async validate() {
    console.log('🔍 Validating Gherkin scenario coverage...\n');

    try {
      await this.loadGherkinScenarios();
      await this.findTestFiles();
      await this.analyzeCoverage();
      this.generateReport();
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    }
  }

  async loadGherkinScenarios() {
    if (!fs.existsSync(this.gherkinFile)) {
      throw new Error(`Gherkin file not found: ${this.gherkinFile}`);
    }

    const content = fs.readFileSync(this.gherkinFile, 'utf8');
    const lines = content.split('\n');

    let currentFeature = '';

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('Feature:')) {
        currentFeature = trimmed.replace('Feature:', '').trim();
      } else if (trimmed.startsWith('Scenario:')) {
        const scenario = trimmed.replace('Scenario:', '').trim();
        this.scenarios.push({
          feature: currentFeature,
          scenario: scenario,
          fullName: `${currentFeature} - ${scenario}`,
        });
      }
    }

    console.log(`📋 Found ${this.scenarios.length} Gherkin scenarios`);
  }

  async findTestFiles() {
    const patterns = [
      'client/src/**/*.test.ts',
      'server/src/**/*.test.ts',
      'poc/**/src/*.test.ts',
      'tests/**/*.test.ts',
    ];

    for (const pattern of patterns) {
      const files = glob.sync(pattern, { ignore: 'node_modules/**' });
      this.testFiles.push(...files);
    }

    console.log(`🧪 Found ${this.testFiles.length} test files`);
  }

  async analyzeCoverage() {
    this.coverage.total = this.scenarios.length;

    for (const scenario of this.scenarios) {
      const hasTest = await this.findCorrespondingTest(scenario);

      if (hasTest) {
        this.coverage.covered++;
      } else {
        this.coverage.missing.push(scenario);
      }
    }
  }

  async findCorrespondingTest(scenario) {
    // Simple heuristic: look for test descriptions that match scenario keywords
    const keywords = this.extractKeywords(scenario.scenario);

    for (const testFile of this.testFiles) {
      try {
        const content = fs.readFileSync(testFile, 'utf8');

        // Check if test file contains relevant keywords
        const hasKeywords = keywords.some(keyword =>
          content.toLowerCase().includes(keyword.toLowerCase())
        );

        if (hasKeywords) {
          return true;
        }
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }

    return false;
  }

  extractKeywords(scenario) {
    // Extract meaningful keywords from scenario name
    return scenario
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['should', 'when', 'given', 'then', 'and'].includes(word));
  }

  generateReport() {
    const coveragePercent = ((this.coverage.covered / this.coverage.total) * 100).toFixed(1);

    console.log('\n📊 Gherkin Coverage Report');
    console.log('='.repeat(50));
    console.log(`Total Scenarios: ${this.coverage.total}`);
    console.log(`Covered: ${this.coverage.covered}`);
    console.log(`Missing: ${this.coverage.missing.length}`);
    console.log(`Coverage: ${coveragePercent}%`);

    if (this.coverage.missing.length > 0) {
      console.log('\n❌ Missing Test Coverage:');
      console.log('-'.repeat(30));

      this.coverage.missing.forEach((scenario, index) => {
        console.log(`${index + 1}. ${scenario.feature}`);
        console.log(`   Scenario: ${scenario.scenario}\n`);
      });

      console.log('💡 Recommendations:');
      console.log('- Implement unit tests for missing scenarios');
      console.log('- Update gherkin-test-mapping.md with new mappings');
      console.log('- Ensure test descriptions match Gherkin scenarios');
    } else {
      console.log('\n✅ All Gherkin scenarios have corresponding tests!');
    }

    // Generate coverage badge
    const badgeColor =
      coveragePercent >= 90 ? 'brightgreen' : coveragePercent >= 70 ? 'yellow' : 'red';

    console.log(
      `\n🏆 Coverage Badge: ![Gherkin Coverage](https://img.shields.io/badge/Gherkin%20Coverage-${coveragePercent}%25-${badgeColor})`
    );
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new GherkinCoverageValidator();
  validator.validate();
}

module.exports = GherkinCoverageValidator;
