import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	experimental: {
		serverActions: {
			bodySizeLimit: "10mb",
		},
	},
	webpack(config) {
		const fileLoaderRule = config.module.rules.find((rule: any) => rule.test?.test?.(".svg"));
		if (fileLoaderRule) {
			fileLoaderRule.exclude = /\.svg$/;
		}

		config.module.rules.push({
			test: /\.svg$/,
			use: ["@svgr/webpack"],
		});

		return config;
	},
};

export default nextConfig;
