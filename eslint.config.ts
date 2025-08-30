import globals from "globals";
import tseslint from "typescript-eslint";

export default [
    {
        files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
        languageOptions: {
            globals: globals.node,
            parser: tseslint.parser,
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: "module",
                project: "./tsconfig.json",
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: {
            "@typescript-eslint": tseslint.plugin,
        },
        rules: {
            ...tseslint.configs.recommended.rules,
        },
    },
    {
        files: ["tests/**/*.ts"],
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
        },
    },
];
