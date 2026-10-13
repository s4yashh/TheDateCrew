import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores([".next/**", "node_modules/**", "coverage/**"]),
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
]);
