import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";
import storybook from "eslint-plugin-storybook";

export default [
  {
    ignores: [
      "node_modules/**",
      "**/dist/**",
      "**/storybook-static/**",
      "pnpm-lock.yaml"
    ]
  },
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true
      },
      globals: {
        Blob: "readonly",
        console: "readonly",
        document: "readonly",
        process: "readonly",
        Request: "readonly",
        Storage: "readonly",
        URL: "readonly",
        window: "readonly"
      }
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "react-hooks": reactHooks,
      storybook
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_"
        }
      ]
    }
  },
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["packages/tokens/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          "selector": "Literal[value=/^#[0-9A-Fa-f]{3,8}$/]",
          "message": "Raw hex colors belong in @bidayax/tokens only."
        }
      ]
    }
  }
];
