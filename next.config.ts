import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	experimental: {
		serverActions: {
			bodySizeLimit: "10mb",
		},
	},
	webpack(config) {
		// Find Next.js's default SVG loader and exclude SVG files
		const fileLoaderRule = config.module.rules.find((rule: any) => rule.test?.test?.(".svg"));
		if (fileLoaderRule) {
			fileLoaderRule.exclude = /\.svg$/;
		}

		// Add @svgr/webpack to handle SVG imports as React components
		config.module.rules.push({
			test: /\.svg$/,
			use: ["@svgr/webpack"],
		});

		return config;
	},
};

export default nextConfig;
