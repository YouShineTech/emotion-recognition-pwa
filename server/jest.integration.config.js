// Jest configuration for integration tests
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Different setup for integration tests
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],

  // Module resolution
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/shared/(.*)$': '<rootDir>/../shared/$1',
  },

  // Integration test file patterns
  testMatch: [
    '<rootDir>/src/**/*.integration.(test|spec).(ts|js)',
    '<rootDir>/tests/integration/**/*.(test|spec).(ts|js)',
  ],

  // File extensions to consider
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Transform files
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },

  // No coverage for integration tests (focus on functionality)
  collectCoverage: false,

  // Ignore patterns
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: false, // Reduce noise

  // Longer timeout for integration tests
  testTimeout: 15000, // Reduced timeout

  // Run tests serially for integration tests
  maxWorkers: 1,

  // Pass when no tests are found (for now)
  passWithNoTests: true,

  // Force exit after tests complete
  forceExit: true,

  // Detect open handles to help debug hanging tests
  detectOpenHandles: false, // Disable to reduce noise

  // Exit immediately on first test failure to prevent hanging
  bail: true, // Stop on first failure

  // Global setup/teardown for integration tests
  globalSetup: '<rootDir>/tests/integration/setup.ts',
  globalTeardown: '<rootDir>/tests/integration/teardown.ts',

  // Additional Jest options for better cleanup
  resetMocks: true,
  restoreMocks: true,
  clearMocks: true,
};
