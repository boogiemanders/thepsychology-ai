/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  outputFileTracingExcludes: {
    '*': [
      '**/.next/cache/**',
      '**/.git/**',
      '**/.pnpm-store/**',
      '**/archive/**',
    ],
  },
}

export default nextConfig
