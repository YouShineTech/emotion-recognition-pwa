// Jest configuration for integration tests
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Different setup for integration tests
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],

  // Module resolution
  moduleNameMapper: {
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
  verbose: true,

  // Longer timeout for integration tests
  testTimeout: 30000,

  // Run tests serially for integration tests
  maxWorkers: 1,

  // Global setup/teardown for integration tests
  globalSetup: '<rootDir>/tests/integration/setup.ts',
  globalTeardown: '<rootDir>/tests/integration/teardown.ts',
};
