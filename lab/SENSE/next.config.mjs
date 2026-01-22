/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/SENSE',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
