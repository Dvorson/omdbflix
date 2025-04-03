import globals from "globals";
import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: {
        // Define Node.js and Jest globals
        ...globals.node, // Includes 'fs', 'process', 'console' etc.
        ...globals.jest, // Includes 'describe', 'it', 'expect' etc.
      }
    },
    rules: {
      // Configure standard JS rule for unused vars
      "no-unused-vars": [
        "warn", // Use warn for now to avoid blocking commits unnecessarily
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_"
        }
      ],
      // Disable no-undef as globals package should handle it
      "no-undef": "off",
      // Explicitly ensure TS rule is off for JS files
      "@typescript-eslint/no-unused-vars": "off",
    }
  }
]; 