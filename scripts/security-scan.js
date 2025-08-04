#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const SECURITY_TOOLS_DIR = path.join(__dirname, 'security-tools');
const TRIVY_PATH = path.join(SECURITY_TOOLS_DIR, 'trivy');
const REPORTS_DIR = path.join(__dirname, '..', 'reports', 'security');

// Ensure directories exist
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

if (!fs.existsSync(SECURITY_TOOLS_DIR)) {
  fs.mkdirSync(SECURITY_TOOLS_DIR, { recursive: true });
}

// Download Trivy if it doesn't exist
async function ensureTrivy() {
  if (!fs.existsSync(TRIVY_PATH)) {
    console.log(chalk.yellow('📥 Downloading Trivy security scanner...'));
    try {
      execSync(
        `curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b ${SECURITY_TOOLS_DIR}`,
        {
          stdio: 'pipe',
        }
      );
      console.log(chalk.green('✅ Trivy downloaded successfully'));
    } catch (error) {
      console.log(chalk.red('❌ Failed to download Trivy'));
      throw error;
    }
  }
}

async function runSecurityScan() {
  console.log(chalk.blue('🔒 Running security scans...'));

  let hasVulnerabilities = false;

  try {
    // Ensure Trivy is available
    await ensureTrivy();
    // 1. NPM Audit
    console.log(chalk.yellow('📦 Running npm audit...'));
    try {
      execSync('npm audit --audit-level=moderate', { stdio: 'inherit' });
      console.log(chalk.green('✅ NPM audit passed'));
    } catch (error) {
      console.log(chalk.red('❌ NPM audit found vulnerabilities'));
      hasVulnerabilities = true;
    }

    // 2. Trivy filesystem scan
    console.log(chalk.yellow('🔍 Running Trivy filesystem scan...'));
    const trivyOutput = path.join(REPORTS_DIR, 'trivy-scan.json');

    try {
      execSync(
        `${TRIVY_PATH} fs --format json --output ${trivyOutput} --severity HIGH,CRITICAL .`,
        {
          stdio: 'pipe',
        }
      );

      // Check if vulnerabilities were found
      const scanResults = JSON.parse(fs.readFileSync(trivyOutput, 'utf8'));
      const vulnerabilities = scanResults.Results?.some(
        result => result.Vulnerabilities && result.Vulnerabilities.length > 0
      );

      if (vulnerabilities) {
        console.log(chalk.red('❌ Trivy found HIGH/CRITICAL vulnerabilities'));
        console.log(chalk.yellow(`📄 Report saved to: ${trivyOutput}`));
        hasVulnerabilities = true;
      } else {
        console.log(chalk.green('✅ Trivy scan passed - no HIGH/CRITICAL vulnerabilities'));
      }
    } catch (error) {
      console.log(chalk.red('❌ Trivy scan failed'));
      hasVulnerabilities = true;
    }

    // 3. Check for secrets (basic patterns)
    console.log(chalk.yellow('🔐 Checking for potential secrets...'));
    try {
      const secretPatterns = [
        /(api[_-]?key|apikey)\s*[:=]\s*['"][^'"]{10,}['"]/gi,
        /(secret|password|pwd)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
        /(token)\s*[:=]\s*['"][^'"]{20,}['"]/gi,
        /sk-[a-zA-Z0-9]{48}/g, // OpenAI API keys
        /ghp_[a-zA-Z0-9]{36}/g, // GitHub tokens
      ];

      const filesToCheck = execSync('git diff --cached --name-only --diff-filter=ACM', {
        encoding: 'utf8',
      })
        .split('\n')
        .filter(file => file && !file.includes('node_modules') && !file.includes('.git'));

      let secretsFound = false;

      for (const file of filesToCheck) {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          for (const pattern of secretPatterns) {
            if (pattern.test(content)) {
              console.log(chalk.red(`❌ Potential secret found in: ${file}`));
              secretsFound = true;
            }
          }
        }
      }

      if (!secretsFound) {
        console.log(chalk.green('✅ No potential secrets detected'));
      } else {
        hasVulnerabilities = true;
      }
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not check for secrets'));
    }

    // Summary
    if (hasVulnerabilities) {
      console.log(chalk.red('\n❌ Security scan failed - vulnerabilities detected'));
      console.log(chalk.yellow('💡 Run "npm run security:fix" to attempt automatic fixes'));
      process.exit(1);
    } else {
      console.log(chalk.green('\n✅ All security scans passed!'));
    }
  } catch (error) {
    console.error(chalk.red('Security scan error:'), error.message);
    process.exit(1);
  }
}

// Run the security scan
runSecurityScan();
