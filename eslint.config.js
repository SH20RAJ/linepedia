import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const eslintPluginAstro = require("eslint-plugin-astro");
const tsParser = require("@typescript-eslint/parser");

export default [
  {
    ignores: ["dist/**", "node_modules/**", ".astro/**"],
  },
  ...eslintPluginAstro.configs["flat/recommended"],
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tsParser,
      sourceType: "module",
      ecmaVersion: "latest",
    },
  },
];
