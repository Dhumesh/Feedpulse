module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  clearMocks: true,
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
