import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import unicorn from 'eslint-plugin-unicorn';
import importPlugin from 'eslint-plugin-import';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  unicorn.configs['flat/recommended'],
  importPlugin.flatConfigs.recommended,
  {
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.ts'],
        },
        typescript: {},
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'eqeqeq': ['error', 'always'],
      'import/no-unresolved': 'off',
      'no-await-in-loop': 'off',
      'unicorn/prefer-module': 'error',
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/prevent-abbreviations': ['error', {
        'ignore': ['e2e']
      }],
    },
  },
);
