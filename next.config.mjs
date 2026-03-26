/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
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
      '**/.mfa-work/**',
      '**/.tmp/**',
      '**/podcast-upload/**',
      '**/podcast-output/**',
      '**/staging/**',
      '**/exams-backup/**',
      '**/exams/**',
      '**/exams-backup/**',
      '**/public/topic-teacher-audio/**',
      '**/questionsGPT_answerability_report.tsv',
      '**/topic-content-v4 copy/**',
      '**/homepage-full.png',
      '**/tsconfig.tsbuildinfo',
      '**/public/hero-background.mp4',
      '**/public/hero-backgroundmobile.mp4',
      '**/public/images/yael-dror.png',
      '**/public/downloads/animations/**',
      '**/public/animations/continuous-loop-adapts.mp4',
    ],
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}

export default nextConfig
