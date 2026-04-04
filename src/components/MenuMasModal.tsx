"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface MenuMasProps {
  isOpen: boolean;
  onClose: () => void;
  enlacesExtra: { href: string; label: string; icon: string }[];
  iconGradientStyle: React.CSSProperties; // ✨ Recibe el degradado inteligente
}

export default function MenuMasModal({ isOpen, onClose, enlacesExtra, iconGradientStyle }: MenuMasProps) {
  const [render, setRender] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (isOpen) setRender(true);
  }, [isOpen]);

  const handleAnimationEnd = () => {
    if (!isOpen) setRender(false);
  };

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname?.startsWith(path);
  };

  if (!render) return null;

  return (
    <>
      <div 
        className={`fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      ></div>

      <div 
        onTransitionEnd={handleAnimationEnd}
        className={`fixed bottom-0 left-0 w-full z-[70] bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-transform duration-300 pb-safe ${isOpen ? "translate-y-0" : "translate-y-full"}`}
      >
        {/* ✨ Eliminamos la "barrita" (pill) superior engañosa, añadimos un poco más de padding arriba */}
        <div className="p-6 pt-8">
          
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Más opciones</h3>
            <button onClick={onClose} className="w-8 h-8 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center active:scale-95 transition-transform">
              <i className="icon-close text-xs font-bold"></i>
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {enlacesExtra.map((link) => (
              <Link 
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={`flex flex-col items-center justify-center p-4 transition-all active:scale-95 group rounded-[1.5rem] border ${
                  isActive(link.href) ? "bg-slate-50 border-slate-200 shadow-sm" : "bg-white border-slate-100 hover:bg-slate-50"
                }`}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110 bg-slate-100/50">
                  {/* ✨ Aplicamos la lógica de degradado de Nodum */}
                  <i 
                    className={`${link.icon} text-2xl transition-all ${isActive(link.href) ? "scale-110" : "opacity-80 group-hover:opacity-100"}`}
                    style={iconGradientStyle}
                  ></i>
                </div>
                <span className={`text-xs text-center leading-tight ${isActive(link.href) ? "font-black text-slate-900" : "font-bold text-slate-600"}`}>
                  {link.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}