/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // 💡 unoptimized: true가 켜져 있어도, 안전하게 도메인을 명시해 주는 것이 좋습니다.
    unoptimized: true, 
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/**',
      },
      // 🔥 Firebase Storage 도메인 추가
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig