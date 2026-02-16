// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/?(*.)+(spec|test).ts?(x)'],
  // Cambiamos la ruta para que apunte dentro de /test
  setupFilesAfterEnv: ['<rootDir>/test/jest.setup.ts'], 
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        target: 'es2020',
        lib: ['es2020'],
        esModuleInterop: true,
        resolveJsonModule: true,
        declaration: false
      }
    }]
  },
  moduleNameMapper: {
    '^discord\\.js$': '<rootDir>/__mocks__/discord.js',
    '^../src/config/database$': '<rootDir>/test/mocks/database.ts'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts'
  ]
};