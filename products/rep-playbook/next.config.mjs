/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // No ESLint config ships with this app; don't let lint gate production builds.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
