"use client";

import Link from 'next/link';
import Image from 'next/image'; // <-- NUEVO: Importamos el componente optimizado de imágenes
import { usePathname } from 'next/navigation';
import { useTenant } from '@/context/TenantContext';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

export default function SideNav() {
  const { modulos, identidad, loadingConfig } = useTenant();
  const pathname = usePathname();
  const supabase = createClient();

  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    const verificarSesion = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUsuario(session?.user || null);
    };
    verificarSesion();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(session?.user || null);
    });

    return () => authListener.subscription.unsubscribe();
  }, [supabase]);

  if (loadingConfig) {
    return <aside className="hidden md:flex flex-col w-72 h-full border-r border-slate-200 bg-slate-50 animate-pulse flex-shrink-0 z-40"></aside>;
  }

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname?.startsWith(path);
  };

  const linkClasses = (path: string) => `
    flex items-center gap-3 p-3.5 rounded-xl transition-all cursor-pointer active:scale-95
    ${isActive(path) 
      ? "bg-primario/10 text-primario font-black" 
      : "text-slate-500 font-bold hover:bg-slate-50 hover:text-slate-800"
    }
  `;

  const esInstanciaUADY = identidad.organizacion?.toLowerCase().includes("uady");

  return (
    <aside className="hidden md:flex flex-col w-72 h-full border-r border-slate-200 bg-white flex-shrink-0 z-40 shadow-sm relative">
      
      {/* NUEVA SECCIÓN DEL LOGO OFICIAL */}
      <div className="p-6 md:pl-7 md:p-8 flex items-center justify-start flex-shrink-0 border-b border-slate-100/50">
        <Link href="/" className="cursor-pointer active:scale-95 transition-transform">
          <Image 
            src="/logo-horizontal.svg" // <-- Asegúrate de que el archivo se llame así en la carpeta public
            alt="Nodum Logo" 
            width={180} 
            height={50} 
            priority // <-- Le dice a Next.js que cargue esta imagen de inmediato
            className="w-auto h-10 md:h-12 object-contain" 
          />
        </Link>
      </div>

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
        
        {modulos.archivo && usuario && (
          <Link href="/archivo" className={linkClasses('/archivo')}>
            <i className={`icon-archive text-xl ${isActive('/archivo') ? "scale-110 transition-transform" : ""}`}></i> Archivo
          </Link>
        )}
        
        {modulos.portales && usuario && (
          <Link href="/portales" className={linkClasses('/portales')}>
            <i className={`icon-laptop text-xl ${isActive('/portales') ? "scale-110 transition-transform" : ""}`}></i> Portales
          </Link>
        )}
        
        {modulos.tienda && usuario && (
          <Link href="/tieeenda" className={linkClasses('/tieeenda')}>
            <i className={`icon-store-solid-full text-2xl ${isActive('/tieeenda') ? "scale-110 transition-transform" : ""}`}></i> TIEEEnda
          </Link>
        )}
        
        {modulos.perfil && usuario && (
          <Link href="/perfil" className={linkClasses('/perfil')}>
            <i className={`icon-user text-xl ${isActive('/perfil') ? "scale-110 transition-transform" : ""}`}></i> Perfil
          </Link>
        )}
      </nav>
      
      <div className="p-6 border-t border-slate-100 flex-shrink-0">
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 truncate">
             Nodum • {identidad.nombre}
           </p>
           <p className="text-xs font-bold text-slate-600 leading-snug">
             Creado por <span className="text-primario">E-nnova Design</span> 
             {esInstanciaUADY ? " para RAS UADY." : "."}
           </p>
        </div>
      </div>
      
    </aside>
  );
}