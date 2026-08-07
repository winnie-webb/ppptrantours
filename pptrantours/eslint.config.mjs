import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

/**
 * Flat config — required by ESLint 9. Next 16 dropped `next lint`, so the
 * `lint` script calls the ESLint CLI directly.
 */
const config = [
  {
    ignores: [".next/**", "out/**", "build/**", "node_modules/**", "next-env.d.ts"],
  },
  ...nextCoreWebVitals,
];

export default config;
