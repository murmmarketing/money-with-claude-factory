/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // No ESLint config ships with this app; don't let lint gate production builds.
  eslint: { ignoreDuringBuilds: true },
  images: {
    // QC photos live in Supabase Storage; allow rendering them via <img>.
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }],
  },
};

export default nextConfig;
