import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import "../icomoon.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lleva Nodum a tu campus | E-nnova Design",
  description: "Digitaliza tu experiencia universitaria con mapas, directorios y TIEEEnda inteligente.",
};

export default function UneteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="scroll-smooth">
      {/* Actualizado a bg-neutral-900 */}
      <body className={`${inter.className} bg-neutral-900 text-slate-100 antialiased`}>
        <div className="w-full min-h-[100dvh]">
          {children}
        </div>
      </body>
    </html>
  );
}