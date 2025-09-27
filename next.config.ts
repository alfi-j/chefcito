import type {NextConfig} from 'next';
import { join } from 'path';

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingRoot: join(__dirname, '.'),
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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
};

export default nextConfig;
