// Global teardown for integration tests
// This runs once after all integration tests

export default async (): Promise<void> => {
  console.log('🧹 Cleaning up integration test environment...');

  try {
    // Force close any remaining connections
    if (global.gc) {
      global.gc();
    }

    // Clear all timers
    const timers = (global as any).__timers__;
    if (timers) {
      timers.forEach((timer: any) => {
        try {
          clearTimeout(timer);
          clearInterval(timer);
        } catch (e) {
          // Ignore errors
        }
      });
    }

    // Give a moment for cleanup
    await new Promise(resolve => setTimeout(resolve, 100));
  } catch (error) {
    // Ignore cleanup errors
  }

  console.log('✅ Integration test cleanup complete');
};
