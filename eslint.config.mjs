// Lint: ESLint's recommended rules for the game, the build and the tools.
import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/', 'screenshots/', 'data/'] },
  js.configs.recommended,
  { files: ['js/**/*.js'], languageOptions: { sourceType: 'module', globals: globals.browser } },
  { files: ['build/**/*.mjs', 'tools/**/*.mjs', 'tests/**/*.mjs', '*.mjs'], languageOptions: { sourceType: 'module', globals: globals.node } },
  { files: ['tools/**/*.cjs', 'tests/**/*.cjs'], languageOptions: { sourceType: 'commonjs', globals: { ...globals.node, ...globals.browser } } },
  { rules: { 'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }] } },
];
