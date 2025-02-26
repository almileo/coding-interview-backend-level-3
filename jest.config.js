module.exports = {
  preset: "@swc/jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/e2e"],
  moduleFileExtensions: ["ts", "js", "json"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testMatch: ["**/e2e/**/*.test.ts"],
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  testTimeout: 10000,
};
