"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTenant } from '@/context/TenantContext';

export default function BottomNav() {
  const { modulos, loadingConfig } = useTenant();
  const pathname = usePathname();

  if (loadingConfig) {
    return <nav className="w-full h-16 border-t border-slate-200 bg-slate-50 animate-pulse pb-safe flex-shrink-0"></nav>;
  }

  // Función para determinar si la ruta actual coincide con el enlace
  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname?.startsWith(path);
  };

  return (
    <nav className="w-full border-t border-slate-200 bg-white pb-safe flex-shrink-0 z-50">
      <ul className="flex justify-around items-center p-2 text-[10px]">
        
        <li className="flex-1">
          <Link 
            href="/" 
            className={`flex flex-col items-center justify-center gap-1 py-1 transition-all active:scale-95 ${
              isActive('/') ? "text-primario font-black" : "text-slate-400 font-medium hover:text-slate-600"
            }`}
          >
            <i className={`icon-home text-xl ${isActive('/') ? "scale-110" : ""}`}></i>
            <span className="truncate">Inicio</span>
          </Link>
        </li>

        {modulos.mapa && (
          <li className="flex-1">
            <Link 
              href="/mapa" 
              className={`flex flex-col items-center justify-center gap-1 py-1 transition-all active:scale-95 ${
                isActive('/mapa') ? "text-primario font-black" : "text-slate-400 font-medium hover:text-slate-600"
              }`}
            >
              <i className={`icon-map text-xl ${isActive('/mapa') ? "scale-110" : ""}`}></i>
              <span className="truncate">Mapa</span>
            </Link>
          </li>
        )}

        {modulos.directorio && (
          <li className="flex-1">
            <Link 
              href="/directorio" 
              className={`flex flex-col items-center justify-center gap-1 py-1 transition-all active:scale-95 ${
                isActive('/directorio') ? "text-primario font-black" : "text-slate-400 font-medium hover:text-slate-600"
              }`}
            >
              <i className={`icon-directory text-xl ${isActive('/directorio') ? "scale-110" : ""}`}></i>
              <span className="truncate">Directorio</span>
            </Link>
          </li>
        )}

        {modulos.archivo && (
          <li className="flex-1">
            <Link 
              href="/archivo" 
              className={`flex flex-col items-center justify-center gap-1 py-1 transition-all active:scale-95 ${
                isActive('/archivo') ? "text-primario font-black" : "text-slate-400 font-medium hover:text-slate-600"
              }`}
            >
              <i className={`icon-archive text-xl ${isActive('/archivo') ? "scale-110" : ""}`}></i>
              <span className="truncate">Archivo</span>
            </Link>
          </li>
        )}

        {modulos.portales && (
          <li className="flex-1">
            <Link 
              href="/portales" 
              className={`flex flex-col items-center justify-center gap-1 py-1 transition-all active:scale-95 ${
                isActive('/portales') ? "text-primario font-black" : "text-slate-400 font-medium hover:text-slate-600"
              }`}
            >
              <i className={`icon-laptop text-xl ${isActive('/portales') ? "scale-110" : ""}`}></i>
              <span className="truncate">Portales</span>
            </Link>
          </li>
        )}

        {modulos.tienda && (
          <li className="flex-1">
            <Link 
              href="/tieeenda" 
              className={`flex flex-col items-center justify-center gap-1 py-1 transition-all active:scale-95 ${
                isActive('/tieeenda') ? "text-primario font-black" : "text-slate-400 font-medium hover:text-slate-600"
              }`}
            >
              <i className={`icon-store-solid-full text-2xl ${isActive('/tieeenda') ? "scale-110" : ""}`}></i>
              <span className="truncate">TIEEEnda</span>
            </Link>
          </li>
        )}

        {modulos.perfil && (
          <li className="flex-1">
            <Link 
              href="/perfil" 
              className={`flex flex-col items-center justify-center gap-1 py-1 transition-all active:scale-95 ${
                isActive('/perfil') ? "text-primario font-black" : "text-slate-400 font-medium hover:text-slate-600"
              }`}
            >
              <i className={`icon-user text-xl ${isActive('/perfil') ? "scale-110" : ""}`}></i>
              <span className="truncate">Perfil</span>
            </Link>
          </li>
        )}

      </ul>
    </nav>
  );
}