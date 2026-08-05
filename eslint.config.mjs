import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "build/**",
      "coverage/**",
      "public/**",
      "scripts/**",
      "src/__tests__/asdasdsa.js",
    ],
  },
  ...nextVitals,
  ...nextTs,
];

export default eslintConfig;