import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

// 1. Configuramos el plugin PWA (solo con las propiedades permitidas)
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // Se desactiva en modo dev
});

// 2. Tu configuración original de Next.js
const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.0.0.15'],
  turbopack: {},
};

// 3. Exportamos tu configuración envuelta en el motor PWA
export default withPWA(nextConfig);