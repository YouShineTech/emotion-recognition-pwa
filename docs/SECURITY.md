# Security Guide

This document outlines the security measures and practices implemented in this project.

## Pre-commit Security Scanning

### Automated Scans

Every commit triggers the following security checks:

1. **NPM Audit** - Scans for known vulnerabilities in dependencies
2. **Trivy Filesystem Scan** - Comprehensive vulnerability scanning
3. **Secret Detection** - Checks for accidentally committed secrets
4. **Lint & Type Checks** - Code quality and security best practices

### Commands

```bash
# Setup security tools (run once)
npm run security:setup

# Run full security scan
npm run security:scan

# Attempt to fix vulnerabilities automatically
npm run security:fix

# View detailed security report
npm run security:report
```

## Security Scanning Tools

### Trivy

- **Purpose**: Vulnerability scanner for containers and filesystems
- **Scope**: HIGH and CRITICAL vulnerabilities
- **Location**: `./scripts/security-tools/trivy`
- **Reports**: Saved to `reports/security/`

### NPM Audit

- **Purpose**: Scans Node.js dependencies for known vulnerabilities
- **Level**: Moderate and above
- **Auto-fix**: Attempts automatic fixes when possible

### Secret Detection

- **Purpose**: Prevents accidental commit of API keys, tokens, passwords
- **Patterns**: API keys, tokens, passwords, GitHub tokens, OpenAI keys
- **Scope**: Only staged files (git diff --cached)

## Pre-commit Hook Workflow

```
git commit
    ↓
🔒 Security Scan
    ├── NPM Audit (moderate+)
    ├── Trivy Scan (HIGH/CRITICAL)
    ├── Secret Detection
    └── Code Quality Checks
    ↓
✅ Commit allowed / ❌ Commit blocked
```

## Pre-push Hook Workflow

```
git push
    ↓
🚀 Pre-push Checks
    ├── Unit Tests
    └── Quick Security Audit (high+)
    ↓
✅ Push allowed / ❌ Push blocked
```

## Security Configuration

Configuration is stored in `.securityrc.json`:

- **Trivy settings**: Severity levels, timeouts, ignored directories
- **NPM audit**: Audit levels, dev dependency handling
- **Secret patterns**: Regex patterns for secret detection
- **Report settings**: Output formats and locations

## Bypassing Security Checks

⚠️ **Not recommended** - Only use in emergencies:

```bash
# Skip pre-commit hooks (NOT RECOMMENDED)
git commit --no-verify

# Skip pre-push hooks (NOT RECOMMENDED)
git push --no-verify
```

## Security Reports

Reports are generated in `reports/security/`:

- `trivy-scan.json` - Detailed vulnerability report
- View reports with: `npm run security:report`

## Best Practices

1. **Regular Updates**: Keep dependencies updated
2. **Review Vulnerabilities**: Don't ignore security warnings
3. **Environment Variables**: Use `.env` files, never commit secrets
4. **Dependency Audit**: Regularly run `npm audit`
5. **Security Reviews**: Review security reports before releases

## Troubleshooting

### Common Issues

**Trivy not found**:

```bash
# Reinstall Trivy
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b ./scripts/security-tools
```

**NPM audit failures**:

```bash
# Try automatic fix
npm run security:fix

# Manual review
npm audit
```

**False positives**:

- Review the vulnerability details
- Consider updating dependencies
- Use `.trivyignore` for confirmed false positives

## Emergency Procedures

If security scans block critical commits:

1. **Review the vulnerability** - Is it actually exploitable?
2. **Attempt fixes** - Run `npm run security:fix`
3. **Update dependencies** - Manually update vulnerable packages
4. **Document exceptions** - Add to `.trivyignore` with justification
5. **Plan remediation** - Create issues for future fixes

## Integration with CI/CD

The GitHub Actions workflow includes:

- Trivy scanning with artifact upload
- NPM audit checks
- Dependency vulnerability reporting

Security scan results are available as downloadable artifacts from the Actions tab.
