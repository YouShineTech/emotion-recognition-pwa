/**
 * Circuit Breaker Module Tests
 *
 * Tests for fault tolerance and cascade failure prevention
 */

import { CircuitBreakerModule, CircuitState } from './CircuitBreakerModule';

describe('CircuitBreakerModule', () => {
  let circuitBreakerModule: CircuitBreakerModule;

  beforeEach(() => {
    jest.useFakeTimers();
    circuitBreakerModule = new CircuitBreakerModule();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllTimers();
  });

  describe('Basic Circuit Breaker Functionality', () => {
    it('should execute function successfully when circuit is closed', async () => {
      const mockFunction = jest.fn().mockResolvedValue('success');

      const result = await circuitBreakerModule.execute('test-service', mockFunction);

      expect(result).toBe('success');
      expect(mockFunction).toHaveBeenCalledTimes(1);
    });

    it('should track successful executions', async () => {
      const mockFunction = jest.fn().mockResolvedValue('success');

      await circuitBreakerModule.execute('test-service', mockFunction);
      await circuitBreakerModule.execute('test-service', mockFunction);

      const status = circuitBreakerModule.getStatus();
      expect(status['test-service']?.state).toBe(CircuitState.CLOSED);
      expect(status['test-service']?.successes).toBe(2);
      expect(status['test-service']?.failures).toBe(0);
    });

    it('should track failed executions', async () => {
      const mockFunction = jest.fn().mockRejectedValue(new Error('Service error'));

      try {
        await circuitBreakerModule.execute('test-service', mockFunction);
      } catch (error) {
        // Expected to throw
      }

      const status = circuitBreakerModule.getStatus();
      expect(status['test-service']?.failures).toBe(1);
    });
  });

  describe('Circuit Opening Logic', () => {
    it('should open circuit after failure threshold is exceeded', async () => {
      const mockFunction = jest.fn().mockRejectedValue(new Error('Service error'));

      // Execute multiple failures to exceed threshold (default 50%)
      for (let i = 0; i < 10; i++) {
        try {
          await circuitBreakerModule.execute('failing-service', mockFunction);
        } catch (error) {
          // Expected to throw
        }
      }

      const status = circuitBreakerModule.getStatus();
      expect(status['failing-service']?.state).toBe(CircuitState.OPEN);
    });

    it('should reject requests immediately when circuit is open', async () => {
      const mockFunction = jest.fn().mockRejectedValue(new Error('Service error'));

      // Force circuit to open
      for (let i = 0; i < 10; i++) {
        try {
          await circuitBreakerModule.execute('failing-service', mockFunction);
        } catch (error) {
          // Expected to throw
        }
      }

      // Reset mock to track new calls
      mockFunction.mockClear();

      // Try to execute - should be rejected without calling function
      await expect(circuitBreakerModule.execute('failing-service', mockFunction)).rejects.toThrow(
        'Circuit breaker failing-service is OPEN'
      );

      expect(mockFunction).not.toHaveBeenCalled();
    });
  });

  describe('Circuit Recovery Logic', () => {
    it('should transition to half-open after recovery timeout', async () => {
      const mockFunction = jest.fn().mockRejectedValue(new Error('Service error'));

      // Create circuit breaker with short recovery timeout
      const config = {
        failureThreshold: 1,
        recoveryTimeout: 100, // 100ms
        monitoringPeriod: 60000,
      };

      // Force failure to open circuit
      try {
        await circuitBreakerModule.execute('recovery-service', mockFunction, config);
      } catch (error) {
        // Expected
      }

      // Verify circuit is open
      let status = circuitBreakerModule.getStatus();
      expect(status['recovery-service']?.state).toBe(CircuitState.OPEN);

      // Fast-forward past recovery timeout
      jest.advanceTimersByTime(150);

      // Mock function to succeed on next call
      mockFunction.mockResolvedValueOnce('recovered');

      // Next call should transition to half-open and succeed
      const recoveryResult = await circuitBreakerModule.execute('recovery-service', mockFunction);
      expect(recoveryResult).toBe('recovered');
    });

    it('should close circuit after successful recovery', async () => {
      const mockFunction = jest.fn().mockResolvedValue('success');

      // Create and open circuit with low threshold
      const failingFunction = jest.fn().mockRejectedValue(new Error('Error'));
      const config = {
        failureThreshold: 1,
        recoveryTimeout: 50,
        monitoringPeriod: 60000,
      };

      try {
        await circuitBreakerModule.execute('recovery-service', failingFunction, config);
      } catch (error) {
        // Expected
      }

      // Verify circuit is open
      let status = circuitBreakerModule.getStatus();
      expect(status['recovery-service']?.state).toBe(CircuitState.OPEN);

      // Fast-forward past recovery timeout
      jest.advanceTimersByTime(100);

      // Execute successful calls to close circuit
      await circuitBreakerModule.execute('recovery-service', mockFunction);
      await circuitBreakerModule.execute('recovery-service', mockFunction);
      await circuitBreakerModule.execute('recovery-service', mockFunction);

      status = circuitBreakerModule.getStatus();
      expect(status['recovery-service']?.state).toBe(CircuitState.CLOSED);
    });
  });

  describe('Configuration Options', () => {
    it('should use custom failure threshold', async () => {
      const mockFunction = jest.fn().mockRejectedValue(new Error('Service error'));

      // Use 80% failure threshold
      for (let i = 0; i < 10; i++) {
        try {
          await circuitBreakerModule.execute('custom-service', mockFunction, {
            failureThreshold: 80,
          });
        } catch (error) {
          // Expected
        }
      }

      const status = circuitBreakerModule.getStatus();
      expect(status['custom-service']?.state).toBe(CircuitState.OPEN);
    });

    it('should ignore expected errors', async () => {
      const mockFunction = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      // Execute with expected error - should not count as failure
      try {
        await circuitBreakerModule.execute('tolerant-service', mockFunction, {
          expectedErrors: ['ECONNREFUSED'],
        });
      } catch (error) {
        // Expected to throw but not count as failure
      }

      const status = circuitBreakerModule.getStatus();
      expect(status['tolerant-service']?.state).toBe(CircuitState.CLOSED);
      expect(status['tolerant-service']?.failures).toBe(0);
    });
  });

  describe('Management Operations', () => {
    it('should reset circuit breaker manually', async () => {
      const mockFunction = jest.fn().mockRejectedValue(new Error('Service error'));

      // Force circuit to open
      for (let i = 0; i < 10; i++) {
        try {
          await circuitBreakerModule.execute('reset-service', mockFunction);
        } catch (error) {
          // Expected
        }
      }

      // Reset circuit
      const resetResult = circuitBreakerModule.reset('reset-service');
      expect(resetResult).toBe(true);

      const status = circuitBreakerModule.getStatus();
      expect(status['reset-service']?.state).toBe(CircuitState.CLOSED);
      expect(status['reset-service']?.failures).toBe(0);
      expect(status['reset-service']?.successes).toBe(0);
    });

    it('should reset all circuit breakers', async () => {
      const mockFunction = jest.fn().mockRejectedValue(new Error('Service error'));

      // Create multiple failing services
      for (const service of ['service1', 'service2', 'service3']) {
        for (let i = 0; i < 10; i++) {
          try {
            await circuitBreakerModule.execute(service, mockFunction);
          } catch (error) {
            // Expected
          }
        }
      }

      // Reset all
      circuitBreakerModule.resetAll();

      const status = circuitBreakerModule.getStatus();
      expect(status['service1']?.state).toBe(CircuitState.CLOSED);
      expect(status['service2']?.state).toBe(CircuitState.CLOSED);
      expect(status['service3']?.state).toBe(CircuitState.CLOSED);
    });

    it('should get all circuit breaker names', async () => {
      const mockFunction = jest.fn().mockResolvedValue('success');

      await circuitBreakerModule.execute('service1', mockFunction);
      await circuitBreakerModule.execute('service2', mockFunction);
      await circuitBreakerModule.execute('service3', mockFunction);

      const names = circuitBreakerModule.getNames();
      expect(names).toContain('service1');
      expect(names).toContain('service2');
      expect(names).toContain('service3');
      expect(names).toHaveLength(3);
    });

    it('should remove circuit breaker', async () => {
      const mockFunction = jest.fn().mockResolvedValue('success');

      await circuitBreakerModule.execute('removable-service', mockFunction);

      const removeResult = circuitBreakerModule.remove('removable-service');
      expect(removeResult).toBe(true);

      const names = circuitBreakerModule.getNames();
      expect(names).not.toContain('removable-service');
    });
  });

  describe('High Load Scenarios', () => {
    it('should handle concurrent executions correctly', async () => {
      const mockFunction = jest.fn().mockResolvedValue('success');

      // Execute 100 concurrent operations
      const operations = Array.from({ length: 100 }, () =>
        circuitBreakerModule.execute('concurrent-service', mockFunction)
      );

      const results = await Promise.all(operations);

      expect(results).toHaveLength(100);
      expect(results.every(result => result === 'success')).toBe(true);
      expect(mockFunction).toHaveBeenCalledTimes(100);

      const status = circuitBreakerModule.getStatus();
      expect(status['concurrent-service']?.successes).toBe(100);
    });

    it('should maintain circuit state under high failure load', async () => {
      const mockFunction = jest.fn().mockRejectedValue(new Error('High load error'));

      // Execute many concurrent failures
      const operations = Array.from({ length: 50 }, () =>
        circuitBreakerModule.execute('high-load-service', mockFunction).catch(() => 'failed')
      );

      await Promise.all(operations);

      const status = circuitBreakerModule.getStatus();
      expect(status['high-load-service']?.state).toBe(CircuitState.OPEN);
      expect(status['high-load-service']?.failures).toBe(50);
    });
  });

  describe('Edge Cases', () => {
    it('should handle function that throws synchronously', async () => {
      const mockFunction = jest.fn().mockImplementation(() => {
        throw new Error('Synchronous error');
      });

      await expect(
        circuitBreakerModule.execute('sync-error-service', mockFunction)
      ).rejects.toThrow('Synchronous error');

      const status = circuitBreakerModule.getStatus();
      expect(status['sync-error-service']?.failures).toBe(1);
    });

    it('should handle undefined/null return values', async () => {
      const mockFunction = jest.fn().mockResolvedValue(undefined);

      const result = await circuitBreakerModule.execute('undefined-service', mockFunction);

      expect(result).toBeUndefined();

      const status = circuitBreakerModule.getStatus();
      expect(status['undefined-service']?.successes).toBe(1);
    });

    it('should return false when trying to reset non-existent circuit', () => {
      const result = circuitBreakerModule.reset('non-existent-service');
      expect(result).toBe(false);
    });
  });
});
