#!/usr/bin/env node

// Health Check Script
// Verifies that all services are running and accessible

const http = require('http');
const { exec } = require('child_process');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

const checkService = (name, url, timeout = 5000) => {
  return new Promise(resolve => {
    const request = http.get(url, { timeout }, res => {
      if (res.statusCode === 200) {
        log(`✅ ${name} is healthy`, colors.green);
        resolve(true);
      } else {
        log(`❌ ${name} returned status ${res.statusCode}`, colors.red);
        resolve(false);
      }
    });

    request.on('error', error => {
      log(`❌ ${name} is not accessible: ${error.message}`, colors.red);
      resolve(false);
    });

    request.on('timeout', () => {
      log(`❌ ${name} timed out`, colors.red);
      request.destroy();
      resolve(false);
    });
  });
};

const checkRedis = () => {
  return new Promise(resolve => {
    exec('redis-cli ping', (error, stdout) => {
      if (error) {
        log(`❌ Redis is not accessible: ${error.message}`, colors.red);
        resolve(false);
      } else if (stdout.trim() === 'PONG') {
        log(`✅ Redis is healthy`, colors.green);
        resolve(true);
      } else {
        log(`❌ Redis returned unexpected response: ${stdout}`, colors.red);
        resolve(false);
      }
    });
  });
};

const checkDocker = () => {
  return new Promise(resolve => {
    exec('docker-compose ps', (error, stdout) => {
      if (error) {
        log(`⚠️  Docker Compose not running: ${error.message}`, colors.yellow);
        resolve(false);
      } else {
        const lines = stdout.split('\n').filter(line => line.trim());
        const services = lines.slice(1); // Skip header

        if (services.length === 0) {
          log(`⚠️  No Docker services running`, colors.yellow);
          resolve(false);
        } else {
          log(`✅ Docker Compose services: ${services.length} running`, colors.green);
          resolve(true);
        }
      }
    });
  });
};

async function runHealthCheck() {
  const isBasic = process.argv.includes('--basic');

  log('🏥 Running Health Check...', colors.blue);
  log('========================', colors.blue);

  const checks = [];

  // Basic checks
  checks.push(checkService('Server API', 'http://localhost:3001/api/health'));

  if (!isBasic) {
    // Full checks
    checks.push(checkService('Client Dev Server', 'http://localhost:3000'));
    checks.push(checkRedis());
    checks.push(checkDocker());
  }

  const results = await Promise.all(checks);
  const healthyCount = results.filter(Boolean).length;
  const totalCount = results.length;

  log('========================', colors.blue);

  if (healthyCount === totalCount) {
    log(`🎉 All services healthy (${healthyCount}/${totalCount})`, colors.green);
    process.exit(0);
  } else {
    log(`⚠️  Some services unhealthy (${healthyCount}/${totalCount})`, colors.yellow);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', error => {
  log(`❌ Uncaught error: ${error.message}`, colors.red);
  process.exit(1);
});

runHealthCheck();
