/**
 * Load Test Processor
 *
 * Custom functions and hooks for Artillery load testing
 */

module.exports = {
  // Generate random string for test data
  randomString: function (context, events, done) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
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

  // Log response times for analysis
  logResponse: function (requestParams, response, context, ee, next) {
    if (response.statusCode >= 400) {
      console.log(`Error response: ${response.statusCode} for ${requestParams.url}`);
    }
    return next();
  },

  // Custom metrics collection
  collectMetrics: function (context, events, done) {
    // Collect custom performance metrics
    const metrics = {
      timestamp: Date.now(),
      memoryUsage: process.memoryUsage(),
      responseTime: context.vars.responseTime || 0,
    };

    // In a real implementation, you might send these to a monitoring system
    context.vars.customMetrics = metrics;
    return done();
  },

  // Validate emotion analysis response
  validateEmotionResponse: function (requestParams, response, context, ee, next) {
    if (response.statusCode === 200) {
      try {
        const body = JSON.parse(response.body);
        if (!body.emotions || !Array.isArray(body.emotions)) {
          ee.emit('error', 'Invalid emotion analysis response format');
        }
      } catch (error) {
        ee.emit('error', 'Failed to parse emotion analysis response');
      }
    }
    return next();
  },

  // Setup phase hook
  beforeScenario: function (context, events, done) {
    // Initialize test context
    context.vars.testStartTime = Date.now();
    context.vars.requestCount = 0;
    return done();
  },

  // Cleanup phase hook
  afterScenario: function (context, events, done) {
    // Log test completion
    const duration = Date.now() - context.vars.testStartTime;
    console.log(`Scenario completed in ${duration}ms with ${context.vars.requestCount} requests`);
    return done();
  },
};
