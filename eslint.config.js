import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        // Bibliothèques chargées depuis le CDN (index.html)
        maplibregl: 'readonly',
        turf: 'readonly',
        d3: 'readonly',
        Papa: 'readonly',
      },
    },
  },
];
