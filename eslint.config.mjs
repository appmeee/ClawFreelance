import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'coverage/**',
    // CLI package build output
    'packages/cli/dist/**',
  ]),
  // Import sorting plugin
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
  // Base rules for all files
  {
    rules: {
      // Allow underscore-prefixed variables to indicate intentionally unused
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'max-depth': ['error', 5],
    },
  },
  // Complexity rules for lib code (strict)
  {
    files: ['src/lib/**/*.ts'],
    ignores: ['**/*.test.ts'],
    rules: {
      complexity: ['error', 20],
      'max-lines-per-function': ['error', { max: 150, skipBlankLines: true, skipComments: true }],
    },
  },
  // Complexity rules for API routes (moderate)
  {
    files: ['src/app/api/**/*.ts'],
    rules: {
      complexity: ['error', 30],
      'max-lines-per-function': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
    },
  },
  // Relaxed rules for page components (JSX inflates line counts)
  {
    files: ['src/app/**/page.tsx', 'src/app/**/layout.tsx', 'src/components/**/*.tsx'],
    rules: {
      complexity: ['error', 20],
      'max-lines-per-function': ['error', { max: 500, skipBlankLines: true, skipComments: true }],
    },
  },
  // No complexity rules for test files
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      complexity: 'off',
      'max-lines-per-function': 'off',
    },
  },
]);

export default eslintConfig;
