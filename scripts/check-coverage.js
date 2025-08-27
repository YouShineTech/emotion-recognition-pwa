#!/usr/bin/env node
/**
 * Coverage Threshold Checker
 *
 * Validates that code coverage meets the minimum threshold defined in CI/CD specs
 */
const fs = require('fs');
const path = require('path');

// Coverage thresholds from CI/CD specification (REQ-QG-1)
const COVERAGE_THRESHOLDS = {
  lines: 90,
  functions: 90,
  branches: 90,
  statements: 90,
};

class CoverageChecker {
  constructor() {
    this.serverCoverageFile = path.join(__dirname, '../server/coverage/coverage-summary.json');
    this.clientCoverageFile = path.join(__dirname, '../client/coverage/coverage-summary.json');
  }

  checkCoverage() {
    console.log('🔍 Checking code coverage thresholds...\n');

    let overallPassed = true;

    // Check server coverage
    if (fs.existsSync(this.serverCoverageFile)) {
      const serverPassed = this.checkModuleCoverage('Server', this.serverCoverageFile);
      overallPassed = overallPassed && serverPassed;
    } else {
      console.log('⚠️  Server coverage file not found');
      overallPassed = false;
    }

    // Check client coverage
    if (fs.existsSync(this.clientCoverageFile)) {
      const clientPassed = this.checkModuleCoverage('Client', this.clientCoverageFile);
      overallPassed = overallPassed && clientPassed;
    } else {
      console.log('⚠️  Client coverage file not found');
      overallPassed = false;
    }

    // Final result
    console.log('\n' + '='.repeat(60));
    if (overallPassed) {
      console.log('✅ All coverage thresholds met!');
      process.exit(0);
    } else {
      console.log('❌ Coverage thresholds not met');
      process.exit(1);
    }
  }

  checkModuleCoverage(moduleName, coverageFile) {
    try {
      const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
      const total = coverage.total;

      console.log(`📊 ${moduleName} Coverage:`);
      let passed = true;

      const metrics = ['lines', 'functions', 'branches', 'statements'];
      for (const metric of metrics) {
        const pct = total[metric].pct;
        const threshold = COVERAGE_THRESHOLDS[metric];
        const status = pct >= threshold ? '✅' : '❌';

        console.log(
          `   ${metric.padEnd(12)}: ${pct.toFixed(2)}% ${status} (threshold: ${threshold}%)`
        );

        if (pct < threshold) {
          passed = false;
        }
      }

      // Output overall percentage for CI
      const avgCoverage =
        metrics.reduce((sum, metric) => sum + total[metric].pct, 0) / metrics.length;
      console.log(`   Overall: ${avgCoverage.toFixed(2)}%`);
      console.log(`${avgCoverage.toFixed(2)}`); // For CI parsing

      return passed;
    } catch (error) {
      console.log(`❌ Error reading ${moduleName} coverage: ${error.message}`);
      return false;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const checker = new CoverageChecker();
  checker.checkCoverage();
}

module.exports = { CoverageChecker };
