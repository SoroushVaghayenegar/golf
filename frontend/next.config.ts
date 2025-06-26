import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    APP_VERSION: process.env.npm_package_version || '0.1.0',
    BUILD_TIME: new Date().getTime().toString(),
  },
};

export default nextConfig;
