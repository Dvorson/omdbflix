import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import path from 'path';
import { fileURLToPath } from 'url';

// ESLint doesn't support 'dirname' in ESM yet
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended
});

export default [
  js.configs.recommended,
  ...compat.extends(
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ),
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
    files: ['src/**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off', 
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Disable the extension checking rule due to module resolution conflicts
      'import/extensions': 'off',
      '@typescript-eslint/naming-convention': 'off',
      // Disable this rule since we're mixing CommonJS and ESM
      'import/no-commonjs': 'off',
      // Suppress explicit extension errors
      '@typescript-eslint/extension-suffix': 'off',
    },
  }
]; 