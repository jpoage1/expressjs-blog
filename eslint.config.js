import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: [
      ".yarn/",
      "node_modules/",
      "content/.git.bak/",
      "dependency-graph.svg",
      "public/",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
];
