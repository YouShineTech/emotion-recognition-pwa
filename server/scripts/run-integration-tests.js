#!/usr/bin/env node

/**
 * Integration test runner with timeout protection
 * Prevents tests from hanging indefinitely
 */

const { spawn } = require('child_process');
const path = require('path');

const TIMEOUT_MS = 60000; // 1 minute timeout

console.log('🧪 Starting integration tests with timeout protection...');

const jestProcess = spawn('npx', ['jest', '--config', 'jest.integration.config.js'], {
  cwd: __dirname + '/..',
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'test' },
});

// Set up timeout
const timeout = setTimeout(() => {
  console.log('\n⚠️  Integration tests timed out after 60 seconds');
  console.log('🔪 Killing Jest process...');

  jestProcess.kill('SIGTERM');

  setTimeout(() => {
    if (!jestProcess.killed) {
      console.log('🔪 Force killing Jest process...');
      jestProcess.kill('SIGKILL');
    }
  }, 5000);

  process.exit(1);
}, TIMEOUT_MS);

jestProcess.on('exit', code => {
  clearTimeout(timeout);
  console.log(`\n✅ Integration tests completed with exit code: ${code}`);
  process.exit(code);
});

jestProcess.on('error', error => {
  clearTimeout(timeout);
  console.error('❌ Failed to start integration tests:', error);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, terminating tests...');
  clearTimeout(timeout);
  jestProcess.kill('SIGTERM');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, terminating tests...');
  clearTimeout(timeout);
  jestProcess.kill('SIGTERM');
});
