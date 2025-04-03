/** @type {import('jest').Config} */
export default {
  // Indicates that the root directory is the one containing this config file
  rootDir: '.',

  // A list of paths to directories that Jest should use to search for files in
  roots: [
    '<rootDir>'
  ],

  // The test environment that will be used for testing
  testEnvironment: 'node',

  // Add setup files for ESM compatibility
  setupFilesAfterEnv: ['./jest.setup.mjs'],

  // Tell Jest to transform JS files using babel-jest
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },

  // Module file extensions for importing
  moduleFileExtensions: [
    'js',
    'mjs',
    'cjs',
    'jsx',
    'ts',
    'tsx',
    'json',
    'node'
  ],

  // Where to search for tests
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],

  // Automatically clear mock calls, instances and results before every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js', // Usually exclude the main server entry point
    '!src/utils/logger.js', // Exclude logger setup
    '!src/config/**', // Exclude config files
    '!**/__tests__/**', // Exclude test files themselves
    '!**/node_modules/**'
  ],

  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: [
    'json',
    'text',
    'lcov',
    'clover'
  ],
}; 