import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options  here */
    async redirects() {
        return [
            {
                source: "/",
                destination: "/meetings",
                permanent: false,
            },
        ];
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            // Handle mermaid's dynamic imports
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                path: false,
                crypto: false,
            };
        } else {
            // For server-side, mark pdf-parse as external to avoid bundling
            config.externals = config.externals || [];
            if (Array.isArray(config.externals)) {
                config.externals.push("pdf-parse");
            }
        }
        return config;
    },
    transpilePackages: ["mermaid"],
};

export default nextConfig;
