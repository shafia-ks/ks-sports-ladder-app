import withPWA from 'next-pwa';

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development' || process.env.GITHUB_ACTIONS === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  // These routes have useSearchParams and should not be prerendered
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
};

export default pwaConfig(nextConfig);
