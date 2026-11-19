// Mientras el portal real no está listo, el login y el panel muestran la maqueta (/demo).
// Para volver al portal real con Supabase, cambiar a false.
const PORTAL_EN_MAQUETA = true;

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["tesseract.js", "pdf-parse"],
  },
  async redirects() {
    if (!PORTAL_EN_MAQUETA) return [];
    return [
      { source: "/auth/login", destination: "/demo", permanent: false },
      { source: "/dashboard", destination: "/demo", permanent: false },
      { source: "/dashboard/:path*", destination: "/demo", permanent: false },
    ];
  },
};

module.exports = nextConfig;
