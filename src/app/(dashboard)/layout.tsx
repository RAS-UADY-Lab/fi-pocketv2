import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import "../icomoon.css";
import BottomNav from "@/components/BottomNav";
import SideNav from "@/components/SideNav";
import { CartProvider } from "@/context/CartContext";
import { TenantProvider } from "@/context/TenantContext";
import PullToRefresh from "@/components/PullToRefresh";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nodum",
  description: "Tu campus en tu bolsillo",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nodum",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      {/* 1. El body ya no es flex, solo controla el fondo y previene scroll global */}
      <body className={`${inter.className} bg-slate-50 text-slate-900 overflow-hidden antialiased`}>
        <TenantProvider>
          <CartProvider>
            
            {/* ✨ 2. EL CONTENEDOR MÁGICO: Este div blinda la estructura de la app */}
            <div className="flex flex-col md:flex-row h-[100dvh] w-full">
              
              <SideNav />

              {/* 3. El contenido principal */}
              <main className="flex-1 overflow-hidden relative bg-slate-50">
                <PullToRefresh>
                  {children}
                </PullToRefresh>
              </main>

              {/* 4. Navegación móvil */}
              <div className="md:hidden flex-shrink-0 z-50">
                <BottomNav />
              </div>

            </div>

          </CartProvider>
        </TenantProvider>
      </body>
    </html>
  );
}