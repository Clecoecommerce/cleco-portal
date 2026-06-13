/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["tesseract.js", "pdf-parse"],
  },
};

module.exports = nextConfig;
