/**
 * Circuit Breaker Module
 *
 * Implements circuit breaker pattern to prevent cascade failures
 * Supports Requirement 27 (Circuit Breaker Pattern Implementation)
 */

import logger from '../../utils/logger';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  expectedErrors?: string[];
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  nextAttempt?: Date;
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private successes = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private nextAttempt?: Date;

  constructor(
    private name: string,
    private config: CircuitBreakerConfig
  ) {}

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        logger.info(`Circuit breaker ${this.name} transitioning to HALF_OPEN`);
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.successes++;
    this.lastSuccessTime = new Date();

    if (this.state === CircuitState.HALF_OPEN) {
      // After 3 consecutive successes in HALF_OPEN, close the circuit
      if (this.successes >= 3) {
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        this.successes = 0;
        logger.info(`Circuit breaker ${this.name} closed after successful recovery`);
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success in CLOSED state
      this.failures = 0;
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(error: Error): void {
    // Check if error should be ignored
    if (
      this.config.expectedErrors?.some(
        expectedError => error.message.includes(expectedError) || error.name === expectedError
      )
    ) {
      return;
    }

    this.failures++;
    this.lastFailureTime = new Date();

    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in HALF_OPEN state opens the circuit
      this.state = CircuitState.OPEN;
      this.nextAttempt = new Date(Date.now() + this.config.recoveryTimeout);
      logger.warn(`Circuit breaker ${this.name} opened after failure in HALF_OPEN state`);
    } else if (this.state === CircuitState.CLOSED) {
      // Check if failure threshold is exceeded
      const failureRate = this.getFailureRate();
      if (failureRate >= this.config.failureThreshold) {
        this.state = CircuitState.OPEN;
        this.nextAttempt = new Date(Date.now() + this.config.recoveryTimeout);
        logger.warn(`Circuit breaker ${this.name} opened due to failure rate: ${failureRate}%`);
      }
    }
  }

  /**
   * Check if circuit should attempt reset
   */
  private shouldAttemptReset(): boolean {
    return this.nextAttempt ? new Date() >= this.nextAttempt : false;
  }

  /**
   * Get current failure rate
   */
  private getFailureRate(): number {
    const total = this.failures + this.successes;
    if (total === 0) return 0;
    return (this.failures / total) * 100;
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      nextAttempt: this.nextAttempt,
    };
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = undefined;
    this.lastSuccessTime = undefined;
    this.nextAttempt = undefined;
    logger.info(`Circuit breaker ${this.name} manually reset`);
  }
}

export class CircuitBreakerModule {
  private circuitBreakers = new Map<string, CircuitBreaker>();
  private defaultConfig: CircuitBreakerConfig = {
    failureThreshold: 50, // 50% failure rate
    recoveryTimeout: 30000, // 30 seconds
    monitoringPeriod: 60000, // 1 minute
    expectedErrors: ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'],
  };

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(
    name: string,
    fn: () => Promise<T>,
    config?: Partial<CircuitBreakerConfig>
  ): Promise<T> {
    const circuitBreaker = this.getOrCreateCircuitBreaker(name, config);
    return circuitBreaker.execute(fn);
  }

  /**
   * Get or create circuit breaker
   */
  private getOrCreateCircuitBreaker(
    name: string,
    config?: Partial<CircuitBreakerConfig>
  ): CircuitBreaker {
    if (!this.circuitBreakers.has(name)) {
      const finalConfig = { ...this.defaultConfig, ...config };
      this.circuitBreakers.set(name, new CircuitBreaker(name, finalConfig));
    }
    return this.circuitBreakers.get(name)!;
  }

  /**
   * Get status of all circuit breakers
   */
  getStatus(): Record<string, CircuitBreakerStats> {
    const status: Record<string, CircuitBreakerStats> = {};

    for (const [name, circuitBreaker] of this.circuitBreakers) {
      status[name] = circuitBreaker.getStats();
    }

    return status;
  }

  /**
   * Reset specific circuit breaker
   */
  reset(name: string): boolean {
    const circuitBreaker = this.circuitBreakers.get(name);
    if (circuitBreaker) {
      circuitBreaker.reset();
      return true;
    }
    return false;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const circuitBreaker of this.circuitBreakers.values()) {
      circuitBreaker.reset();
    }
    logger.info('All circuit breakers reset');
  }

  /**
   * Get circuit breaker by name
   */
  getCircuitBreaker(name: string): CircuitBreaker | undefined {
    return this.circuitBreakers.get(name);
  }

  /**
   * Remove circuit breaker
   */
  remove(name: string): boolean {
    return this.circuitBreakers.delete(name);
  }

  /**
   * Get all circuit breaker names
   */
  getNames(): string[] {
    return Array.from(this.circuitBreakers.keys());
  }
}
