import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import unusedImports from 'eslint-plugin-unused-imports';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Next.js recommended rules (core-web-vitals + TypeScript)
  ...compat.extends('next/core-web-vitals', 'next/typescript'),

  // Import hygiene: ordering + unused-import auto-removal
  {
    plugins: {
      import: importPlugin,
      'unused-imports': unusedImports,
    },
    rules: {
      // ── Import ordering (auto-fixable) ──────────────────────────
      'import/order': [
        'warn',
        {
          groups: [
            'builtin', // node:*
            'external', // react, next, @emotion, zustand …
            'internal', // @/* alias
            ['parent', 'sibling', 'index'], // relative
            'type',
          ],
          pathGroups: [
            // React / Next always first within externals
            { pattern: 'react', group: 'external', position: 'before' },
            { pattern: 'react-dom/**', group: 'external', position: 'before' },
            { pattern: 'next/**', group: 'external', position: 'before' },
            // Our path alias counts as internal
            { pattern: '@/**', group: 'internal' },
          ],
          pathGroupsExcludedImportTypes: ['react'],
          'newlines-between': 'never',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-duplicates': 'warn',

      // ── Unused imports/vars (imports auto-removed on --fix) ─────
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'warn',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
          caughtErrors: 'none',
        },
      ],
    },
  },

  // Turn off stylistic rules that conflict with Prettier (must be last)
  prettierConfig,

  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'next-env.d.ts'],
  },
];

export default eslintConfig;
