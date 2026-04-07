{
  "extends": [
    "astro/recommended",
    "plugin:astro/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecVersion": "latest",
    "sourceType": "module"
  },
  "plugins": ["@typescript-eslint"],
  "rules": {
    "astro/no-sr-only-content": "off",
    "astro/valid-compile": "error",
    "astro/valid-name": "error"
  },
  "ignorePatterns": [
    "dist/",
    "node_modules/",
    ".astro/"
  ],
  "settings": {
    "astro": {
      "version": "latest"
    }
  }
}
