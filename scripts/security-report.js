#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const REPORTS_DIR = path.join(__dirname, '..', 'reports', 'security');

console.log(chalk.blue('📊 Security Scan Report'));
console.log(chalk.blue('========================\n'));

try {
  // Check if reports directory exists
  if (!fs.existsSync(REPORTS_DIR)) {
    console.log(chalk.yellow('No security reports found. Run "npm run security:scan" first.'));
    process.exit(0);
  }

  // Read Trivy report
  const trivyReportPath = path.join(REPORTS_DIR, 'trivy-scan.json');
  if (fs.existsSync(trivyReportPath)) {
    console.log(chalk.yellow('🔍 Trivy Vulnerability Report:'));

    const trivyData = JSON.parse(fs.readFileSync(trivyReportPath, 'utf8'));

    if (trivyData.Results && trivyData.Results.length > 0) {
      let totalVulns = 0;
      let criticalCount = 0;
      let highCount = 0;

      trivyData.Results.forEach(result => {
        if (result.Vulnerabilities) {
          result.Vulnerabilities.forEach(vuln => {
            totalVulns++;
            if (vuln.Severity === 'CRITICAL') criticalCount++;
            if (vuln.Severity === 'HIGH') highCount++;

            console.log(
              `  ${vuln.Severity === 'CRITICAL' ? '🔴' : '🟠'} ${vuln.VulnerabilityID}: ${vuln.Title}`
            );
            console.log(`     Package: ${vuln.PkgName} (${vuln.InstalledVersion})`);
            if (vuln.FixedVersion) {
              console.log(`     Fix: Update to ${vuln.FixedVersion}`);
            }
            console.log('');
          });
        }
      });

      console.log(chalk.red(`Total vulnerabilities: ${totalVulns}`));
      console.log(chalk.red(`Critical: ${criticalCount}, High: ${highCount}\n`));
    } else {
      console.log(chalk.green('✅ No vulnerabilities found!\n'));
    }
  }

  // Show recommendations
  console.log(chalk.blue('💡 Recommendations:'));
  console.log('  • Run "npm run security:fix" to attempt automatic fixes');
  console.log('  • Review and update dependencies regularly');
  console.log('  • Consider using "npm audit" in your CI/CD pipeline');
  console.log('  • Check for security advisories for your dependencies\n');
} catch (error) {
  console.error(chalk.red('Error reading security reports:'), error.message);
  process.exit(1);
}
