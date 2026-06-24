import js from "@eslint/js"; // ⬅️ ESLint core JavaScript rules
import globals from "globals"; // ⬅️ Provides global variables for various environments
import reactHooks from "eslint-plugin-react-hooks"; // ⬅️ React Hooks plugin for ESLint
import reactRefresh from "eslint-plugin-react-refresh"; // ⬅️ React Refresh plugin for ESLint
import tseslint from "typescript-eslint"; // ⬅️ TypeScript ESLint plugin
import prettier from "eslint-plugin-prettier"; // ⬅️ Integrates Prettier as an ESLint plugin
import prettierConfig from "eslint-config-prettier"; // ⬅️ Disables ESLint rules that conflict with Prettier
import { defineConfig, globalIgnores } from "eslint/config"; // ⬅️ ESLint configuration helpers

export default defineConfig([
  globalIgnores(["dist"]),

  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      prettierConfig, // ⬅️ Turns off ESLint rules that conflict with Prettier
    ],
    plugins: {
      prettier, // ⬅️ Activate Prettier within ESLint
    },
    rules: {
      "prettier/prettier": "error", // ⬅️ ESLint will now follow Prettier.
      "no-unexpected-multiline": "off", // ⬅️ Disabled due to conflicts with Prettier formatting
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },

  // Design-system primitives (shadcn/ui) intentionally co-export variant helpers
  // (e.g. buttonVariants) alongside the component — standard pattern, not a fast-refresh concern.
  {
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
]);
