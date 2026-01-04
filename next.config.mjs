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

export default nextConfig;
