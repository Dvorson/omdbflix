// @ts-check
import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig: Config = {
  // Explicitly define the roots Jest should scan for tests within the frontend directory
  roots: ['<rootDir>/app', '<rootDir>/tests'], // Adjust if tests are elsewhere
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // if using TypeScript with a baseUrl set to the root directory then you need the below for alias to work
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testEnvironment: 'jest-environment-jsdom',
  // Map the shared types package alias
  moduleNameMapper: {
    '^@repo/types(.*)$': '<rootDir>/../packages/types/src$1',
    // Add other mappings here if needed, e.g., for "@/*"
    '^@/(.*)$': '<rootDir>/$1', // Map '@/*' to the frontend root
  },
  // Ignore node_modules, e2e tests, AND the root packages dir during scan
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/tests/e2e/',
    '<rootDir>/../packages/'
  ],
  // Collect coverage
  collectCoverage: true,
  collectCoverageFrom: [
    'app/components/**/*.{js,jsx,ts,tsx}',
    'app/services/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      statements: 5,
      branches: 5,
      functions: 5,
      lines: 5,
    },
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig); 