/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // For static export
  },
  // Enable static export for static hosting (Porkbun)
  output: 'export',
  trailingSlash: true,
}

export default nextConfig
