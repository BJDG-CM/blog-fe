module.exports = {
  root: true,
  ignorePatterns: ['dist', '.astro', 'src/env.d.ts'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'astro'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:astro/recommended',
    'prettier'
  ],
  overrides: [
    {
      files: ['*.astro'],
      parser: 'astro-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser'
      },
      rules: {
        // Astro 템플릿은 JSX가 아니다. React를 스코프에 둘 필요가 없고
        // 속성도 `class` / `for` 를 그대로 쓴다.
        'react/react-in-jsx-scope': 'off',
        'react/jsx-key': 'off',
        'react/no-unknown-property': 'off',
        'react/jsx-no-undef': 'off',
        'react/no-unescaped-entities': 'off'
      }
    },
    {
      files: ['*.tsx'],
      rules: {
        // React 17+ 자동 런타임을 쓰므로 import React가 필요 없다.
        'react/react-in-jsx-scope': 'off'
      }
    }
  ],
  settings: {
    react: {
      version: 'detect'
    }
  }
};
