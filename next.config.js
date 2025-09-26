/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  // Explicitly set the outputFileTracingRoot to avoid workspace root detection issues
  outputFileTracingRoot: __dirname,
  /* config options here */
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/menu',
        destination: '/restaurant',
        permanent: true,
      },
      {
        source: '/orders',
        destination: '/pos',
        permanent: true,
      }
    ]
  },
  // Enable React Server Components by default
};

module.exports = nextConfig;