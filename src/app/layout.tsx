import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./icomoon.css";
import BottomNav from "@/components/BottomNav";
import SideNav from "@/components/SideNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FI Pocket",
  description: "Tu campus en tu bolsillo",
  manifest: "/manifest.json", // <-- ¡Clave para la PWA!
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FI Pocket",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Evita que se haga zoom feo al tocar botones rápido
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      {/* h-[100dvh] garantiza que ocupe exactamente la pantalla visible, ni un pixel más */}
      <body className={`${inter.className} bg-slate-50 text-slate-900 overflow-hidden flex flex-col md:flex-row h-[100dvh] w-full`}>
        
        <SideNav />

        {/* El contenedor principal ahora maneja su propio scroll internamente */}
        <div className="flex-1 overflow-y-auto relative">
          {children}
        </div>

        {/* Al no ser fixed, siempre empujará desde abajo y será visible */}
        <div className="md:hidden flex-shrink-0">
          <BottomNav />
        </div>
      </body>
    </html>
  );
}