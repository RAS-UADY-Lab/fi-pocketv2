"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTenant } from '@/context/TenantContext';

export default function SideNav() {
  const { modulos, identidad, loadingConfig } = useTenant();
  const pathname = usePathname();

  // Prevenimos que se renderice roto mientras carga la info
  if (loadingConfig) {
    return <aside className="hidden md:flex flex-col w-72 h-full border-r border-slate-200 bg-slate-50 animate-pulse flex-shrink-0 z-40"></aside>;
  }

  // Helper para saber si la ruta está activa
  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname?.startsWith(path);
  };

  // Generador de clases dinámico para mantener el código limpio
  const linkClasses = (path: string) => `
    flex items-center gap-3 p-3.5 rounded-xl transition-all cursor-pointer active:scale-95
    ${isActive(path) 
      ? "bg-primario/10 text-primario font-black" 
      : "text-slate-500 font-bold hover:bg-slate-50 hover:text-slate-800"
    }
  `;

  // Lógica inteligente para la leyenda de desarrollo
  const esInstanciaUADY = identidad.organizacion?.toLowerCase().includes("uady");

  return (
    <aside className="hidden md:flex flex-col w-72 h-full border-r border-slate-200 bg-white flex-shrink-0 z-40 shadow-sm relative">
      
      {/* Cabecera del Sidebar con Logo */}
      <div className="p-6 md:p-8 flex items-center gap-4 flex-shrink-0 border-b border-slate-100/50">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-t from-secundario to-primario flex items-center justify-center text-2xl text-white shadow-lg shadow-slate-200 flex-shrink-0">
          <i className={identidad.logoIcono || "icon-app-logo"}></i>
        </div>
        {/* CAMBIO: Ahora el nombre principal es Nodum */}
        <h2 className="text-2xl font-black text-slate-900 tracking-tight truncate leading-none pt-1">
          Nodum
        </h2>
      </div>

      {/* Menú de Navegación */}
      <nav className="flex-1 px-4 md:px-6 py-6 overflow-y-auto custom-scrollbar space-y-1.5">
        <Link href="/" className={linkClasses('/')}>
          <i className={`icon-home text-xl ${isActive('/') ? "scale-110 transition-transform" : ""}`}></i> Inicio
        </Link>
        
        {modulos.mapa && (
          <Link href="/mapa" className={linkClasses('/mapa')}>
            <i className={`icon-map text-xl ${isActive('/mapa') ? "scale-110 transition-transform" : ""}`}></i> Mapa
          </Link>
        )}
        
        {modulos.directorio && (
          <Link href="/directorio" className={linkClasses('/directorio')}>
            <i className={`icon-directory text-xl ${isActive('/directorio') ? "scale-110 transition-transform" : ""}`}></i> Directorio
          </Link>
        )}
        
        {modulos.archivo && (
          <Link href="/archivo" className={linkClasses('/archivo')}>
            <i className={`icon-archive text-xl ${isActive('/archivo') ? "scale-110 transition-transform" : ""}`}></i> Archivo
          </Link>
        )}
        
        {modulos.portales && (
          <Link href="/portales" className={linkClasses('/portales')}>
            <i className={`icon-laptop text-xl ${isActive('/portales') ? "scale-110 transition-transform" : ""}`}></i> Portales
          </Link>
        )}
        
        {modulos.tienda && (
          <Link href="/tieeenda" className={linkClasses('/tieeenda')}>
            <i className={`icon-store-solid-full text-2xl ${isActive('/tieeenda') ? "scale-110 transition-transform" : ""}`}></i> TIEEEnda
          </Link>
        )}
        
        {modulos.perfil && (
          <Link href="/perfil" className={linkClasses('/perfil')}>
            <i className={`icon-user text-xl ${isActive('/perfil') ? "scale-110 transition-transform" : ""}`}></i> Perfil
          </Link>
        )}
      </nav>
      
      {/* Footer del Sidebar */}
      <div className="p-6 border-t border-slate-100 flex-shrink-0">
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60">
           {/* CAMBIO: Muestra el nombre del campus/facultad */}
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 truncate">
             Nodum • {identidad.nombre}
           </p>
           {/* CAMBIO: Leyenda inteligente */}
           <p className="text-xs font-bold text-slate-600 leading-snug">
             Creado por <span className="text-primario">E-nnova Design</span> 
             {esInstanciaUADY ? " para RAS UADY." : "."}
           </p>
        </div>
      </div>
      
    </aside>
  );
}