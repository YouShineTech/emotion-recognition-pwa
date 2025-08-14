/**
 * Load Test for 1000+ Concurrent Users
 *
 * Tests Requirement 8: Handle 1000 simultaneous connections without performance degradation
 * Tests Requirement 2: Maintain <500ms end-to-end latency
 */

const io = require('socket.io-client');
const fs = require('fs');
const path = require('path');

const TARGET_URL = process.env.TARGET_URL || 'https://localhost';
const MAX_CONNECTIONS = parseInt(process.env.MAX_CONNECTIONS || '1000');
const RAMP_UP_TIME = parseInt(process.env.RAMP_UP_TIME || '60') * 1000; // Convert to ms
const TEST_DURATION = parseInt(process.env.TEST_DURATION || '300') * 1000; // 5 minutes default

class LoadTester {
  constructor() {
    this.connections = [];
    this.metrics = {
      totalConnections: 0,
      successfulConnections: 0,
      failedConnections: 0,
      averageLatency: 0,
      maxLatency: 0,
      minLatency: Infinity,
      latencies: [],
      errors: [],
      startTime: null,
      endTime: null,
    };
  }

  /**
   * Run the load test
   */
  async runLoadTest() {
    console.log(`Starting load test with ${MAX_CONNECTIONS} connections`);
    console.log(`Target: ${TARGET_URL}`);
    console.log(`Ramp-up time: ${RAMP_UP_TIME / 1000}s`);
    console.log(`Test duration: ${TEST_DURATION / 1000}s`);

    this.metrics.startTime = new Date();

    // Create connections gradually (ramp-up)
    const connectionInterval = RAMP_UP_TIME / MAX_CONNECTIONS;

    for (let i = 0; i < MAX_CONNECTIONS; i++) {
      setTimeout(() => {
        this.createConnection(i);
      }, i * connectionInterval);
    }

    // Wait for test duration
    setTimeout(() => {
      this.endTest();
    }, RAMP_UP_TIME + TEST_DURATION);
  }

  /**
   * Create a single WebSocket connection
   */
  createConnection(connectionId) {
    const startTime = Date.now();

    const socket = io(TARGET_URL, {
      transports: ['websocket'],
      timeout: 10000,
      forceNew: true,
    });

    socket.on('connect', () => {
      const latency = Date.now() - startTime;
      this.recordLatency(latency);
      this.metrics.successfulConnections++;

      console.log(`Connection ${connectionId} established (${latency}ms)`);

      // Simulate emotion recognition session
      this.simulateEmotionSession(socket, connectionId);
    });

    socket.on('connect_error', error => {
      this.metrics.failedConnections++;
      this.metrics.errors.push({
        connectionId,
        error: error.message,
        timestamp: new Date(),
      });

      console.error(`Connection ${connectionId} failed:`, error.message);
    });

    socket.on('disconnect', reason => {
      console.log(`Connection ${connectionId} disconnected:`, reason);
    });

    this.connections.push({
      id: connectionId,
      socket,
      startTime,
    });

    this.metrics.totalConnections++;
  }

  /**
   * Simulate emotion recognition session
   */
  simulateEmotionSession(socket, connectionId) {
    // Create a session
    fetch(`${TARGET_URL}/api/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId: `client_${connectionId}`,
      }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          console.log(`Session created for connection ${connectionId}: ${data.data.sessionId}`);

          // Simulate WebRTC signaling
          this.simulateWebRTCSignaling(socket, connectionId);
        }
      })
      .catch(error => {
        console.error(`Failed to create session for connection ${connectionId}:`, error);
      });
  }

  /**
   * Simulate WebRTC signaling messages
   */
  simulateWebRTCSignaling(socket, connectionId) {
    // Send periodic signaling messages to simulate real usage
    const signalingInterval = setInterval(() => {
      // Simulate offer/answer exchange
      socket.emit('offer', {
        sdp: 'mock-sdp-offer',
        type: 'offer',
        connectionId,
      });

      // Simulate ICE candidates
      socket.emit('ice-candidate', {
        candidate: 'mock-ice-candidate',
        sdpMLineIndex: 0,
        connectionId,
      });
    }, 5000); // Every 5 seconds

    // Stop signaling after test duration
    setTimeout(() => {
      clearInterval(signalingInterval);
    }, TEST_DURATION);
  }

  /**
   * Record latency measurement
   */
  recordLatency(latency) {
    this.metrics.latencies.push(latency);

    if (latency > this.metrics.maxLatency) {
      this.metrics.maxLatency = latency;
    }

    if (latency < this.metrics.minLatency) {
      this.metrics.minLatency = latency;
    }

    // Calculate running average
    const sum = this.metrics.latencies.reduce((a, b) => a + b, 0);
    this.metrics.averageLatency = sum / this.metrics.latencies.length;
  }

  /**
   * End the test and generate report
   */
  endTest() {
    this.metrics.endTime = new Date();

    console.log('\n=== LOAD TEST COMPLETED ===');
    console.log(`Test duration: ${(this.metrics.endTime - this.metrics.startTime) / 1000}s`);
    console.log(`Total connections attempted: ${this.metrics.totalConnections}`);
    console.log(`Successful connections: ${this.metrics.successfulConnections}`);
    console.log(`Failed connections: ${this.metrics.failedConnections}`);
    console.log(
      `Success rate: ${((this.metrics.successfulConnections / this.metrics.totalConnections) * 100).toFixed(2)}%`
    );
    console.log(`Average latency: ${this.metrics.averageLatency.toFixed(2)}ms`);
    console.log(`Min latency: ${this.metrics.minLatency}ms`);
    console.log(`Max latency: ${this.metrics.maxLatency}ms`);

    // Check if requirements are met
    const requirementsMet = this.checkRequirements();

    // Generate detailed report
    this.generateReport(requirementsMet);

    // Close all connections
    this.connections.forEach(conn => {
      if (conn.socket.connected) {
        conn.socket.disconnect();
      }
    });

    process.exit(requirementsMet ? 0 : 1);
  }

  /**
   * Check if requirements are met
   */
  checkRequirements() {
    const successRate = (this.metrics.successfulConnections / this.metrics.totalConnections) * 100;
    const latencyRequirement = this.metrics.averageLatency < 500; // <500ms requirement
    const scalabilityRequirement = this.metrics.successfulConnections >= MAX_CONNECTIONS * 0.95; // 95% success rate

    console.log('\n=== REQUIREMENTS CHECK ===');
    console.log(`Requirement 8 (1000+ users): ${scalabilityRequirement ? 'PASS' : 'FAIL'}`);
    console.log(`Requirement 2 (<500ms latency): ${latencyRequirement ? 'PASS' : 'FAIL'}`);
    console.log(`Overall success rate: ${successRate.toFixed(2)}% (target: 95%)`);

    return latencyRequirement && scalabilityRequirement;
  }

  /**
   * Generate detailed test report
   */
  generateReport(requirementsMet) {
    const report = {
      testConfig: {
        targetUrl: TARGET_URL,
        maxConnections: MAX_CONNECTIONS,
        rampUpTime: RAMP_UP_TIME / 1000,
        testDuration: TEST_DURATION / 1000,
      },
      results: {
        ...this.metrics,
        requirementsMet,
        testPassed: requirementsMet,
      },
      latencyDistribution: this.calculateLatencyDistribution(),
      recommendations: this.generateRecommendations(),
    };

    // Save report to file
    const reportPath = path.join(__dirname, 'reports', `load-test-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\nDetailed report saved to: ${reportPath}`);
  }

  /**
   * Calculate latency distribution
   */
  calculateLatencyDistribution() {
    const sorted = this.metrics.latencies.sort((a, b) => a - b);
    const len = sorted.length;

    return {
      p50: sorted[Math.floor(len * 0.5)],
      p75: sorted[Math.floor(len * 0.75)],
      p90: sorted[Math.floor(len * 0.9)],
      p95: sorted[Math.floor(len * 0.95)],
      p99: sorted[Math.floor(len * 0.99)],
    };
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    if (this.metrics.averageLatency > 500) {
      recommendations.push(
        'Average latency exceeds 500ms requirement. Consider optimizing server response times.'
      );
    }

    if (this.metrics.failedConnections > MAX_CONNECTIONS * 0.05) {
      recommendations.push(
        'High connection failure rate. Check server capacity and network configuration.'
      );
    }

    if (this.metrics.maxLatency > 2000) {
      recommendations.push('Maximum latency is very high. Investigate server bottlenecks.');
    }

    return recommendations;
  }
}

// Run the load test
const tester = new LoadTester();
tester.runLoadTest().catch(console.error);
