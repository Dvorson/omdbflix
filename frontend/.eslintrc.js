module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended'
  ],
  plugins: ['@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  rules: {
    // Enforce stronger type checking
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_' 
    }],
  },
  overrides: [
    {
      files: ['jest.config.js', 'jest.setup.js', '**/*.test.js', '**/*.test.jsx', '**/*.test.ts', '**/*.test.tsx'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'import/no-extraneous-dependencies': 'off',
      },
    },
    // Special handling for Next.js route files
    {
      files: ['**/app/**/page.tsx', '**/app/**/layout.tsx', '**/app/**/route.ts'],
      rules: {
        // Disable some TypeScript checks for Next.js route files due to Next.js-specific type challenges
        '@typescript-eslint/no-explicit-any': 'off'
      }
    }
  ],
}; 