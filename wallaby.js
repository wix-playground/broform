module.exports = function (wallaby) {
  return {
    files: [
      'tsconfig.json',
      'src/**/*.ts',
      'src/**/*.tsx',
      'test/**/*.ts'
    ],
    tests: [
      'src/**/*.spec.ts',
      'src/**/*.spec.tsx'
    ],
    env: {
      type: 'node',
      runner: 'node'
    },
    testFramework: 'jest'
  };
};