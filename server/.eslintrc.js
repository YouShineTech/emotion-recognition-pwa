module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  env: {
    node: true,
    es2020: true,
    jest: true,
  },
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',

    // General rules
    'no-console': 'off', // Allow console.log for debugging
    'prefer-const': 'error',
    'no-var': 'error',

    // Prettier integration
    'prettier/prettier': 'error',

    // Modular import validation rules
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['**/index', '**/index.ts', '**/index.js'],
            message:
              'Importing from index files is not allowed. Use explicit interface imports instead.',
          },
          {
            group: ['../../shared/interfaces/index*'],
            message:
              'Central export hubs are not allowed. Import directly from specific interface files.',
          },
          {
            group: ['@/shared/interfaces/index*'],
            message:
              'Central export hubs are not allowed. Import directly from specific interface files.',
          },
        ],
        paths: [
          {
            name: '@/shared/interfaces',
            message: 'Import from specific interface files, not the interfaces directory.',
          },
          {
            name: '../../shared/interfaces',
            message: 'Import from specific interface files, not the interfaces directory.',
          },
        ],
      },
    ],
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
    },
  },
  ignorePatterns: ['dist/', 'node_modules/', 'coverage/', '*.config.js', 'logs/'],
};
