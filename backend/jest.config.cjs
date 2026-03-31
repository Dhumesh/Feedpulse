module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  clearMocks: true,
  setupFiles: ["<rootDir>/src/__tests__/setupEnv.ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.jest.json"
      }
    ]
  },
  collectCoverageFrom: [
    "src/utils/**/*.ts",
    "src/middleware/**/*.ts",
    "!src/**/*.d.ts"
  ]
};
