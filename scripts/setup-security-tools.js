#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const SECURITY_TOOLS_DIR = path.join(__dirname, 'security-tools');

console.log(chalk.blue('🔧 Setting up security tools...'));

// Ensure directory exists
if (!fs.existsSync(SECURITY_TOOLS_DIR)) {
  fs.mkdirSync(SECURITY_TOOLS_DIR, { recursive: true });
}

try {
  // Download Trivy
  console.log(chalk.yellow('📥 Downloading Trivy...'));
  execSync(
    `curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b ${SECURITY_TOOLS_DIR}`,
    {
      stdio: 'inherit',
    }
  );
  console.log(chalk.green('✅ Trivy installed successfully'));

  // Verify installation
  const trivyPath = path.join(SECURITY_TOOLS_DIR, 'trivy');
  if (fs.existsSync(trivyPath)) {
    console.log(chalk.green('✅ Security tools setup complete!'));
    console.log(chalk.blue('💡 You can now run: npm run security:scan'));
  } else {
    throw new Error('Trivy installation verification failed');
  }
} catch (error) {
  console.error(chalk.red('❌ Security tools setup failed:'), error.message);
  console.log(chalk.yellow('💡 You may need to install Trivy manually:'));
  console.log(
    '   curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b ./scripts/security-tools'
  );
  process.exit(1);
}
