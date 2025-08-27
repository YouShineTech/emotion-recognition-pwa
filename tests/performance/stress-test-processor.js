/**
 * Stress Test Processor
 *
 * Custom functions and hooks for Artillery stress testing
 */

module.exports = {
  // Generate random string for test data
  randomString: function (context, events, done) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 64; i++) {
      // Longer strings for stress testing
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    context.vars.randomString = result;
    return done();
  },

  // Generate timestamp
  timestamp: function (context, events, done) {
    context.vars.timestamp = Date.now();
    return done();
  },

  // Generate large payload for stress testing
  generateLargePayload: function (context, events, done) {
    const payload = {
      data: Array(1000)
        .fill(0)
        .map(() => Math.random().toString(36)),
      timestamp: Date.now(),
      metadata: {
        testType: 'stress',
        payloadSize: 'large',
        iteration: Math.floor(Math.random() * 10000),
      },
    };
    context.vars.largePayload = payload;
    return done();
  },

  // Monitor resource usage during stress test
  monitorResources: function (context, events, done) {
    const usage = process.resourceUsage();
    const memory = process.memoryUsage();

    context.vars.resourceMetrics = {
      userCPUTime: usage.userCPUTime,
      systemCPUTime: usage.systemCPUTime,
      rss: memory.rss,
      heapTotal: memory.heapTotal,
      heapUsed: memory.heapUsed,
      external: memory.external,
    };

    return done();
  },

  // Handle high error rates during stress testing
  handleStressErrors: function (requestParams, response, context, ee, next) {
    if (response.statusCode >= 500) {
      // Log server errors but don't fail the test immediately
      console.log(
        `Server error during stress test: ${response.statusCode} for ${requestParams.url}`
      );
      context.vars.serverErrors = (context.vars.serverErrors || 0) + 1;
    } else if (response.statusCode >= 400) {
      // Log client errors
      context.vars.clientErrors = (context.vars.clientErrors || 0) + 1;
    }

    return next();
  },

  // Validate system behavior under stress
  validateStressResponse: function (requestParams, response, context, ee, next) {
    const responseTime = response.timings?.response || 0;

    // Track response times
    context.vars.responseTimes = context.vars.responseTimes || [];
    context.vars.responseTimes.push(responseTime);

    // Alert on extremely slow responses (>5 seconds)
    if (responseTime > 5000) {
      console.log(`Extremely slow response: ${responseTime}ms for ${requestParams.url}`);
    }

    return next();
  },

  // Setup stress test scenario
  beforeStressScenario: function (context, events, done) {
    context.vars.stressTestStartTime = Date.now();
    context.vars.requestCount = 0;
    context.vars.errorCount = 0;
    context.vars.responseTimes = [];

    // Set aggressive timeouts for stress testing
    context.vars.timeout = 10000; // 10 second timeout

    return done();
  },

  // Cleanup and report stress test results
  afterStressScenario: function (context, events, done) {
    const duration = Date.now() - context.vars.stressTestStartTime;
    const avgResponseTime =
      context.vars.responseTimes.length > 0
        ? context.vars.responseTimes.reduce((a, b) => a + b, 0) / context.vars.responseTimes.length
        : 0;

    console.log(`Stress scenario completed:`);
    console.log(`  Duration: ${duration}ms`);
    console.log(`  Requests: ${context.vars.requestCount}`);
    console.log(`  Errors: ${context.vars.errorCount}`);
    console.log(`  Avg Response Time: ${avgResponseTime.toFixed(2)}ms`);

    return done();
  },

  // Simulate connection drops during stress
  simulateConnectionIssues: function (context, events, done) {
    // Randomly simulate connection issues (5% chance)
    if (Math.random() < 0.05) {
      context.vars.simulateTimeout = true;
    }
    return done();
  },
};
