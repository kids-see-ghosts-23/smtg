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
        }
        return config;
    },
    transpilePackages: ["mermaid"],
};

export default nextConfig;
