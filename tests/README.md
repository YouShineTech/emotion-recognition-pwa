# Load Testing Suite

This directory contains load testing configurations for the Emotion Recognition PWA using Artillery.

## Files

- `load/small-load.yml` - Small load test (10 concurrent users)
- `load/medium-load.yml` - Medium load test (100 concurrent users)
- `load/stress-test.yml` - Stress test (1000+ concurrent users)
- `load/load-test-functions.js` - Helper functions for load testing

## Usage

### Prerequisites

Install Artillery globally:

```bash
npm install -g artillery
```

### Running Tests

```bash
# Small load test (10 users for 1 minute)
npm run test:load:small

# Medium load test (100 users with ramp-up)
npm run test:load:medium

# Stress test (1000+ users to find breaking point)
npm run test:stress
```

### Custom Load Tests

You can run Artillery tests directly:

```bash
# Run a specific test file
artillery run tests/load/small-load.yml

# Run with custom target
artillery run tests/load/small-load.yml --target http://localhost:3001

# Run with output file
artillery run tests/load/small-load.yml --output results.json
```

## Test Scenarios

### Basic API Health Check

- Tests `/health` endpoint
- Verifies response structure
- Checks for 200 status code

### WebRTC Connection Test

- Tests WebRTC session creation
- Tests SDP offer/answer exchange
- Simulates real-time connection setup

### Emotion Analysis Pipeline

- Tests emotion analysis endpoint
- Sends mock frame and audio data
- Validates response structure

### Session Management

- Tests concurrent session handling
- Validates session state management
- Checks resource cleanup

## Configuration

### Environment Variables

Set these environment variables for custom testing:

```bash
export ARTILLERY_TARGET=http://localhost:3001
export ARTILLERY_WORKERS=4
export ARTILLERY_TIMEOUT=30000
```

### Custom Test Data

Modify `load-test-functions.js` to customize:

- Mock frame data generation
- Mock audio data generation
- SDP offer generation
- Session ID generation

## Performance Metrics

The tests collect the following metrics:

- Response times (p50, p90, p95, p99)
- Request rates (requests per second)
- Error rates
- Concurrent connections
- Memory usage
- CPU usage

## Results Analysis

After running tests, analyze results:

```bash
# Generate HTML report
artillery report results.json -o report.html

# View summary
artillery report results.json --format summary
```

## Troubleshooting

### Common Issues

1. **Port already in use**: Kill processes on ports 3000, 3001
2. **Memory issues**: Reduce concurrent users or increase system memory
3. **Network timeouts**: Check firewall settings and network connectivity
4. **Server overload**: Monitor server resources during testing

### Debug Mode

Run tests with verbose output:

```bash
artillery run tests/load/small-load.yml --verbose
```

## Integration with CI/CD

Add load testing to your CI pipeline:

```yaml
# GitHub Actions example
- name: Load Test
  run: |
    npm run test:load:small
    npm run test:load:medium
```

## Performance Targets

Based on requirements specification:

- **Latency**: < 500ms end-to-end
- **Concurrent Users**: 1000+ simultaneous connections
- **Error Rate**: < 1%
- **Response Time**: p95 < 1000ms

## Monitoring

During load tests, monitor:

- Server CPU and memory usage
- Network bandwidth
- Database connection pool
- WebRTC connection stability
- Emotion analysis processing time
