/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  experimental: {
    serverComponentsExternalPackages: ['@tetherto/wdk', '@tetherto/wdk-wallet-evm']
  }
};

export default nextConfig;
