import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    ignores: [
      'js/ui.js',
      'js/ui.js.map',
      'js/features/shell/bootstrap.js',
      'js/features/monsters/bootstrap.js'
    ], // Ignore generated files and IIFE files
  },
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        MutationObserver: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        navigator: 'readonly',
        history: 'readonly',
        location: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        Blob: 'readonly',
        FileReader: 'readonly',
        FormData: 'readonly',
        Headers: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        Worker: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        // Additional globals that might be needed
        monstersVisibleUnits: 'writable',
        gsap: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Downgrade to warn
      'no-console': 'off',
      'no-undef': 'off',
      'no-empty': 'off', // Allow empty catch blocks
      'no-dupe-keys': 'warn', // Downgrade to warn
      'no-redeclare': 'warn', // Downgrade to warn
      'no-irregular-whitespace': 'warn', // Downgrade to warn
      'no-unreachable': 'warn', // Downgrade to warn
      'no-global-assign': 'off' // Allow assigning to globals
    }
  }
];
