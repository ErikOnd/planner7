import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
	...nextCoreWebVitals,
	...nextTypescript,
	{
		rules: {
			"react-hooks/set-state-in-effect": "off",
			"@typescript-eslint/no-explicit-any": "off",
		},
	},
	{
		ignores: [
			".next/**",
			"out/**",
			"build/**",
			"next-env.d.ts",
		],
	},
];

export default eslintConfig;
