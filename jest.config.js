/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  collectCoverageFrom: [
    'src/workers/**/*.ts',
    '!src/workers/**/*.d.ts',
    '!src/workers/**/index.ts',
    '!src/workers/capability-integration-example.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70
    },
    './src/workers/session.ts': {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    },
    './src/workers/everything-workers.ts': {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    }
  }
};
