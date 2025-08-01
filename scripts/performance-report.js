#!/usr/bin/env node

/**
 * Performance Report Generator for Emotion Recognition PWA
 * Analyzes performance logs and generates comprehensive reports
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const Table = require('cli-table3');

class PerformanceReportGenerator {
  constructor(options = {}) {
    this.options = {
      logFile: options.logFile || './logs/performance.log',
      outputFile: options.outputFile || './reports/performance-report.json',
      format: options.format || 'json', // json, html, markdown
      timeRange: options.timeRange || '24h', // 1h, 6h, 24h, 7d, 30d
      includeCharts: options.includeCharts !== false
    };

    this.data = [];
    this.report = {
      generatedAt: new Date().toISOString(),
      timeRange: this.options.timeRange,
      summary: {},
      metrics: {},
      alerts: [],
      recommendations: []
    };
  }

  async loadData() {
    try {
      if (!fs.existsSync(this.options.logFile)) {
        throw new Error(`Log file not found: ${this.options.logFile}`);
      }

      const logContent = fs.readFileSync(this.options.logFile, 'utf8');
      const lines = logContent.trim().split('\n');

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          this.data.push(entry);
        } catch (error) {
          console.warn(chalk.yellow(`Skipping invalid log line: ${error.message}`));
        }
      }

      console.log(chalk.green(`✓ Loaded ${this.data.length} performance samples`));
    } catch (error) {
      console.error(chalk.red(`Error loading data: ${error.message}`));
      throw error;
    }
  }

  filterDataByTimeRange() {
    const now = Date.now();
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const range = timeRanges[this.options.timeRange] || timeRanges['24h'];
    const cutoff = now - range;

    this.data = this.data.filter(entry => {
      const timestamp = new Date(entry.timestamp).getTime();
      return timestamp >= cutoff;
    });

    console.log(chalk.blue(`Filtered to ${this.data.length} samples in last ${this.options.timeRange}`));
  }

  generateSummary() {
    if (this.data.length === 0) {
      this.report.summary = { error: 'No data available for analysis' };
      return;
    }

    const cpuValues = this.data.map(d => d.metrics.cpu).filter(v => v !== undefined);
    const memoryValues = this.data.map(d => d.metrics.memory.percentage).filter(v => v !== undefined);
    const diskValues = this.data.map(d => d.metrics.disk.percentage).filter(v => v !== undefined);

    this.report.summary = {
      totalSamples: this.data.length,
      timeRange: {
        start: this.data[0]?.timestamp,
        end: this.data[this.data.length - 1]?.timestamp
      },
      averages: {
        cpu: cpuValues.length > 0 ? this.calculateAverage(cpuValues) : 0,
        memory: memoryValues.length > 0 ? this.calculateAverage(memoryValues) : 0,
        disk: diskValues.length > 0 ? this.calculateAverage(diskValues) : 0
      },
      peaks: {
        cpu: cpuValues.length > 0 ? Math.max(...cpuValues) : 0,
        memory: memoryValues.length > 0 ? Math.max(...memoryValues) : 0,
        disk: diskValues.length > 0 ? Math.max(...diskValues) : 0
      },
      alerts: this.data.reduce((sum, entry) => sum + (entry.alerts?.length || 0), 0)
    };
  }

  generateMetricsAnalysis() {
    if (this.data.length === 0) return;

    this.report.metrics = {
      cpu: this.analyzeMetric('cpu'),
      memory: this.analyzeMetric('memory.percentage'),
      disk: this.analyzeMetric('disk.percentage'),
      webrtc: this.analyzeWebRTCMetrics(),
      health: this.analyzeHealthMetrics()
    };
  }

  analyzeMetric(metricPath) {
    const values = this.data.map(entry => {
      const path = metricPath.split('.');
      let value = entry.metrics;
      for (const key of path) {
        value = value?.[key];
      }
      return value;
    }).filter(v => v !== undefined && !isNaN(v));

    if (values.length === 0) return null;

    return {
      count: values.length,
      average: this.calculateAverage(values),
      median: this.calculateMedian(values),
      min: Math.min(...values),
      max: Math.max(...values),
      standardDeviation: this.calculateStandardDeviation(values),
      percentiles: {
        p50: this.calculatePercentile(values, 50),
        p90: this.calculatePercentile(values, 90),
        p95: this.calculatePercentile(values, 95),
        p99: this.calculatePercentile(values, 99)
      }
    };
  }

  analyzeWebRTCMetrics() {
    const webrtcData = this.data
      .map(entry => entry.metrics.webrtc)
      .filter(data => data && !data.error);

    if (webrtcData.length === 0) return null;

    const connections = webrtcData.map(d => d.activeConnections).filter(v => v !== undefined);
    const latencies = webrtcData.map(d => d.averageLatency).filter(v => v !== undefined);
    const bandwidths = webrtcData.map(d => d.bandwidth).filter(v => v !== undefined);

    return {
      activeConnections: connections.length > 0 ? this.analyzeMetric('activeConnections') : null,
      averageLatency: latencies.length > 0 ? this.analyzeMetric('averageLatency') : null,
      bandwidth: bandwidths.length > 0 ? this.analyzeMetric('bandwidth') : null,
      totalSamples: webrtcData.length
    };
  }

  analyzeHealthMetrics() {
    const healthData = this.data
      .map(entry => entry.metrics.health)
      .filter(data => data && data.status !== 'error');

    if (healthData.length === 0) return null;

    const statusCodes = healthData.map(d => d.status);
    const responseTimes = healthData
      .map(d => d.responseTime)
      .filter(v => v !== undefined)
      .map(v => parseInt(v) || 0);

    return {
      totalChecks: healthData.length,
      successRate: (healthData.filter(d => d.status === 200).length / healthData.length) * 100,
      averageResponseTime: responseTimes.length > 0 ? this.calculateAverage(responseTimes) : 0,
      statusCodeDistribution: this.countOccurrences(statusCodes)
    };
  }

  generateAlerts() {
    this.report.alerts = this.data
      .flatMap(entry => entry.alerts || [])
      .map(alert => ({
        message: alert,
        timestamp: entry.timestamp
      }));
  }

  generateRecommendations() {
    const recommendations = [];

    // CPU recommendations
    if (this.report.summary.averages.cpu > 70) {
      recommendations.push({
        category: 'CPU',
        severity: 'high',
        message: 'High average CPU usage detected. Consider optimizing emotion analysis algorithms or scaling horizontally.',
        metric: `Average CPU: ${this.report.summary.averages.cpu.toFixed(2)}%`
      });
    }

    // Memory recommendations
    if (this.report.summary.averages.memory > 80) {
      recommendations.push({
        category: 'Memory',
        severity: 'high',
        message: 'High memory usage detected. Consider implementing memory pooling or garbage collection optimization.',
        metric: `Average Memory: ${this.report.summary.averages.memory.toFixed(2)}%`
      });
    }

    // WebRTC recommendations
    if (this.report.metrics.webrtc?.averageLatency?.average > 500) {
      recommendations.push({
        category: 'WebRTC',
        severity: 'medium',
        message: 'High WebRTC latency detected. Consider optimizing network configuration or using TURN servers.',
        metric: `Average Latency: ${this.report.metrics.webrtc.averageLatency.average.toFixed(2)}ms`
      });
    }

    // Health check recommendations
    if (this.report.metrics.health?.successRate < 95) {
      recommendations.push({
        category: 'Health',
        severity: 'high',
        message: 'Low health check success rate. Investigate server stability and error handling.',
        metric: `Success Rate: ${this.report.metrics.health.successRate.toFixed(2)}%`
      });
    }

    this.report.recommendations = recommendations;
  }

  calculateAverage(values) {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  calculateMedian(values) {
    const sorted = values.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  calculateStandardDeviation(values) {
    const avg = this.calculateAverage(values);
    const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
    const avgSquaredDiff = this.calculateAverage(squaredDiffs);
    return Math.sqrt(avgSquaredDiff);
  }

  calculatePercentile(values, percentile) {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (upper >= sorted.length) return sorted[sorted.length - 1];
    if (lower === upper) return sorted[lower];

    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  countOccurrences(values) {
    return values.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});
  }

  async generateReport() {
    console.log(chalk.blue('📊 Generating Performance Report...'));

    await this.loadData();
    this.filterDataByTimeRange();
    this.generateSummary();
    this.generateMetricsAnalysis();
    this.generateAlerts();
    this.generateRecommendations();

    await this.saveReport();
    this.displayReport();
  }

  async saveReport() {
    const outputDir = path.dirname(this.options.outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(this.options.outputFile, JSON.stringify(this.report, null, 2));
    console.log(chalk.green(`✓ Report saved to: ${this.options.outputFile}`));
  }

  displayReport() {
    console.log(chalk.blue('\n📈 Performance Report Summary'));
    console.log(chalk.gray('='.repeat(50)));

    if (this.report.summary.error) {
      console.log(chalk.red(this.report.summary.error));
      return;
    }

    // Summary table
    const summaryTable = new Table({
      head: ['Metric', 'Value'],
      colWidths: [20, 30]
    });

    summaryTable.push(
      ['Total Samples', this.report.summary.totalSamples],
      ['Time Range', `${this.options.timeRange}`],
      ['Avg CPU', `${this.report.summary.averages.cpu.toFixed(2)}%`],
      ['Avg Memory', `${this.report.summary.averages.memory.toFixed(2)}%`],
      ['Avg Disk', `${this.report.summary.averages.disk.toFixed(2)}%`],
      ['Peak CPU', `${this.report.summary.peaks.cpu.toFixed(2)}%`],
      ['Peak Memory', `${this.report.summary.peaks.memory.toFixed(2)}%`],
      ['Total Alerts', this.report.summary.alerts]
    );

    console.log(summaryTable.toString());

    // Recommendations
    if (this.report.recommendations.length > 0) {
      console.log(chalk.yellow('\n⚠️  Recommendations:'));
      this.report.recommendations.forEach((rec, index) => {
        console.log(chalk.yellow(`${index + 1}. [${rec.severity.toUpperCase()}] ${rec.message}`));
        console.log(chalk.gray(`   Metric: ${rec.metric}`));
      });
    }

    // Alerts summary
    if (this.report.alerts.length > 0) {
      console.log(chalk.red(`\n🚨 Total Alerts: ${this.report.alerts.length}`));
      const alertTypes = this.countOccurrences(this.report.alerts.map(a => a.message));
      Object.entries(alertTypes).forEach(([alert, count]) => {
        console.log(chalk.red(`   ${alert}: ${count} times`));
      });
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--log-file':
        options.logFile = args[++i];
        break;
      case '--output-file':
        options.outputFile = args[++i];
        break;
      case '--time-range':
        options.timeRange = args[++i];
        break;
      case '--format':
        options.format = args[++i];
        break;
      case '--help':
        console.log(`
Performance Report Generator for Emotion Recognition PWA

Usage: node performance-report.js [options]

Options:
  --log-file <path>       Input log file path (default: ./logs/performance.log)
  --output-file <path>    Output report file path (default: ./reports/performance-report.json)
  --time-range <range>    Time range to analyze (1h, 6h, 24h, 7d, 30d) (default: 24h)
  --format <format>       Output format (json, html, markdown) (default: json)
  --help                  Show this help message

Examples:
  node performance-report.js
  node performance-report.js --time-range 7d --output-file ./reports/weekly-report.json
        `);
        process.exit(0);
    }
  }

  const generator = new PerformanceReportGenerator(options);
  generator.generateReport().catch(error => {
    console.error(chalk.red(`Error generating report: ${error.message}`));
    process.exit(1);
  });
}

module.exports = PerformanceReportGenerator;
