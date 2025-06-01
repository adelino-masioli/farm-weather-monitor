/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'openweathermap.org',
        pathname: '/img/wn/**',
      },
      {
        protocol: 'http',
        hostname: 'openweathermap.org',
        pathname: '/img/w/**',
      },
    ],
  },
}

module.exports = nextConfig
