#!/usr/bin/env node
/**
 * Memory Profiler
 *
 * Profiles memory usage of the application for CI/CD performance validation
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class MemoryProfiler {
  constructor() {
    this.resultsDir = path.join(__dirname, '../tests/performance/results');
    this.profileData = {
      timestamp: new Date().toISOString(),
      samples: [],
      summary: {},
    };
  }

  async profileMemory() {
    console.log('🧠 Starting Memory Profiling...\n');

    // Ensure results directory exists
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }

    try {
      // Start the application in background
      const appProcess = await this.startApplication();

      // Profile memory for 60 seconds
      await this.collectMemoryData(60);

      // Stop the application
      appProcess.kill('SIGTERM');

      // Generate summary
      this.generateSummary();

      // Save results
      this.saveResults();

      console.log('✅ Memory profiling completed successfully');
    } catch (error) {
      console.error('❌ Memory profiling failed:', error.message);
      process.exit(1);
    }
  }

  async startApplication() {
    return new Promise((resolve, reject) => {
      console.log('🚀 Starting application for profiling...');

      const appProcess = spawn('npm', ['run', 'start:test'], {
        stdio: 'pipe',
        detached: false,
      });

      let started = false;
      const timeout = setTimeout(() => {
        if (!started) {
          appProcess.kill('SIGTERM');
          reject(new Error('Application failed to start within timeout'));
        }
      }, 30000);

      appProcess.stdout.on('data', data => {
        const output = data.toString();
        if (output.includes('Server running') || output.includes('listening')) {
          if (!started) {
            started = true;
            clearTimeout(timeout);
            console.log('✅ Application started successfully\n');
            resolve(appProcess);
          }
        }
      });

      appProcess.on('error', error => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  async collectMemoryData(durationSeconds) {
    console.log(`📊 Collecting memory data for ${durationSeconds} seconds...`);

    const interval = 1000; // Sample every second
    const samples = durationSeconds;

    for (let i = 0; i < samples; i++) {
      const memoryUsage = process.memoryUsage();
      const sample = {
        timestamp: Date.now(),
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
      };

      this.profileData.samples.push(sample);

      // Show progress
      if (i % 10 === 0) {
        console.log(
          `   Sample ${i + 1}/${samples}: RSS=${sample.rss}MB, Heap=${sample.heapUsed}MB`
        );
      }

      await this.sleep(interval);
    }

    console.log('✅ Memory data collection completed\n');
  }

  generateSummary() {
    console.log('📈 Generating memory usage summary...');

    const rssSamples = this.profileData.samples.map(s => s.rss);
    const heapSamples = this.profileData.samples.map(s => s.heapUsed);

    this.profileData.summary = {
      rss: {
        min: Math.min(...rssSamples),
        max: Math.max(...rssSamples),
        avg: Math.round(rssSamples.reduce((a, b) => a + b, 0) / rssSamples.length),
        samples: rssSamples.length,
      },
      heap: {
        min: Math.min(...heapSamples),
        max: Math.max(...heapSamples),
        avg: Math.round(heapSamples.reduce((a, b) => a + b, 0) / heapSamples.length),
        samples: heapSamples.length,
      },
    };

    // Display summary
    console.log('\n📊 Memory Usage Summary:');
    console.log(`   RSS Memory:`);
    console.log(`     Min: ${this.profileData.summary.rss.min}MB`);
    console.log(`     Max: ${this.profileData.summary.rss.max}MB`);
    console.log(`     Avg: ${this.profileData.summary.rss.avg}MB`);
    console.log(`   Heap Memory:`);
    console.log(`     Min: ${this.profileData.summary.heap.min}MB`);
    console.log(`     Max: ${this.profileData.summary.heap.max}MB`);
    console.log(`     Avg: ${this.profileData.summary.heap.avg}MB`);

    // Check against thresholds
    const maxMemoryThreshold = 2048; // MB from CI/CD spec
    const peakMemory = this.profileData.summary.rss.max;

    if (peakMemory > maxMemoryThreshold) {
      console.log(
        `\n⚠️  WARNING: Peak memory usage (${peakMemory}MB) exceeds threshold (${maxMemoryThreshold}MB)`
      );
    } else {
      console.log(
        `\n✅ Memory usage within acceptable limits (${peakMemory}MB < ${maxMemoryThreshold}MB)`
      );
    }
  }

  saveResults() {
    const resultsFile = path.join(this.resultsDir, 'memory-profile.json');
    fs.writeFileSync(resultsFile, JSON.stringify(this.profileData, null, 2));
    console.log(`💾 Results saved to: ${resultsFile}`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run if called directly
if (require.main === module) {
  const profiler = new MemoryProfiler();
  profiler.profileMemory().catch(error => {
    console.error('Memory profiling failed:', error);
    process.exit(1);
  });
}

module.exports = { MemoryProfiler };
