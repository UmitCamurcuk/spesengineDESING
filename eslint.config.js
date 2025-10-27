import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default (async () => {
  let tsPlugin = null;
  let tsParser = null;

  try {
    const pluginModule = await import('@typescript-eslint/eslint-plugin');
    const parserModule = await import('@typescript-eslint/parser');
    tsPlugin = pluginModule.default ?? pluginModule;
    tsParser = parserModule.default ?? parserModule;
  } catch {
    // Optional dependency: if unavailable we fall back to JS-only linting.
  }

  const baseRules = {
    ...js.configs.recommended.rules,
    ...reactHooks.configs.recommended.rules,
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  };

  const configs = [
    {
      ignores: ['dist'],
    },
  ];

  if (tsPlugin && tsParser) {
    configs.push({
      files: ['**/*.{ts,tsx,js,jsx}'],
      languageOptions: {
        parser: tsParser,
        parserOptions: {
          ecmaVersion: 2020,
          sourceType: 'module',
          ecmaFeatures: {
            jsx: true,
          },
        },
        globals: {
          ...globals.browser,
        },
      },
      plugins: {
        '@typescript-eslint': tsPlugin,
        'react-hooks': reactHooks,
        'react-refresh': reactRefresh,
      },
      rules: {
        ...baseRules,
        ...tsPlugin.configs.recommended.rules,
      },
    });
  } else {
    configs.push({
      files: ['**/*.{js,jsx}'],
      languageOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        globals: {
          ...globals.browser,
        },
        parserOptions: {
          ecmaFeatures: {
            jsx: true,
          },
        },
      },
      plugins: {
        'react-hooks': reactHooks,
        'react-refresh': reactRefresh,
      },
      rules: baseRules,
    });
    configs.push({
      ignores: ['**/*.ts', '**/*.tsx'],
    });
  }

  return configs;
})();
