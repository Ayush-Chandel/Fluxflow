import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // `public/` holds MSW's generated service worker — not source.
  globalIgnores(['dist', 'public']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    // VENDORED SOURCE — shadcn primitives and the ReUI filter component (§2).
    // We own these files but do not author them: the discipline is to configure
    // them from the call site and re-apply a short, documented patch list after
    // an upstream update. Linting them as our own code produced ~18 of the
    // suite's findings and none of them were actionable — "fix" here means
    // editing upstream's lines, which is what turns a small delta into a fork
    // that can never take an update. Silencing them is what lets the ~45 real
    // findings in our own code be visible at all (build order 18).
    files: ['src/components/ui/**', 'src/components/reui/**'],
    rules: {
      'react-refresh/only-export-components': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
    },
  },
  {
    // Every export here IS a component — they are just built by the local
    // createIcon() factory, and the rule only recognises a component when it can
    // see the function literal. Fast refresh works fine; the 30 findings were
    // all false positives.
    files: ['src/components/icons.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    // Node scripts, not browser code: the emulator rules suite.
    files: ['test/**/*.mjs'],
    languageOptions: { globals: globals.node },
  },
])
