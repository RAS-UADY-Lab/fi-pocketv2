"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTenant } from '@/context/TenantContext';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

export default function SideNav() {
  // Añadimos tenantId
  const { tenantId, modulos, identidad, colores, loadingConfig } = useTenant();
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

  // ✨ REGLA DE BRANDING
  const esInstanciaDefaultUADY = tenantId === 1 || identidad.organizacion?.toLowerCase().includes("uady");
  
  // ✨ ESTILO DEL DEGRADADO INTELIGENTE PARA ÍCONO Y TEXTO
  const activeGradientStyle = { 
    background: esInstanciaDefaultUADY && colores.secundario
      ? `linear-gradient(135deg, ${colores.primario}, ${colores.secundario})`
      : `linear-gradient(135deg, ${colores.primario}, ${colores.primario}CC)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    color: 'transparent'
  };

  const linkClasses = (path: string) => `
    group relative flex items-center gap-3 p-3.5 pl-7 transition-all cursor-pointer active:scale-95
    ${isActive(path) 
      ? "font-black" 
      : "text-slate-500 font-bold hover:bg-slate-50 hover:text-slate-800"
    }
  `;

  return (
    <aside className="hidden md:flex flex-col w-72 h-full border-r border-slate-200 bg-white flex-shrink-0 z-40 shadow-sm relative">
      
      <div className="p-6 md:pl-7 md:p-8 flex items-center justify-start flex-shrink-0 border-b border-slate-100/50">
        <Link href="/" className="cursor-pointer active:scale-95 transition-transform">
          <Image src="/logo-horizontal.svg" alt="Nodum Logo" width={180} height={50} priority className="w-auto h-10 md:h-12 object-contain" />
        </Link>
      </div>

      <nav className="print:hidden flex-1 px-4 md:px-5 py-6 overflow-y-auto custom-scrollbar space-y-1">
        
        {[
          { href: '/', label: 'Inicio', icon: 'icon-home', show: true },
          { href: '/mapa', label: 'Mapa', icon: 'icon-map', show: modulos.mapa },
          { href: '/directorio', label: 'Directorio', icon: 'icon-directory', show: modulos.directorio },
          { href: '/archivo', label: 'Archivo', icon: 'icon-archive', show: modulos.archivo && usuario },
          { href: '/portales', label: 'Portales', icon: 'icon-laptop', show: modulos.portales && usuario },
          { href: '/tieeenda', label: esInstanciaDefaultUADY ? "TIEEEnda" : "Tienda", icon: 'icon-store-solid-full', show: modulos.tienda && usuario },
          { href: '/mantenimiento', label: 'Centro de Ayuda', icon: 'icon-circle-info-solid-full', show: modulos.mantenimiento && usuario },
          { href: '/perfil', label: 'Perfil', icon: 'icon-user', show: modulos.perfil && usuario },
        ].filter(link => link.show).map(link => (
          <Link key={link.href} href={link.href} className={linkClasses(link.href)}>
            
            {/* ✨ INDICADOR VERTICAL MINIMALISTA */}
            {isActive(link.href) && (
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                style={{ backgroundColor: colores.primario }}
              ></div>
            )}

            {/* ✨ ÍCONO Y TEXTO CON DEGRADADO */}
            <i 
              className={`${link.icon} text-xl transition-transform ${isActive(link.href) ? "scale-110" : ""}`}
              style={isActive(link.href) ? activeGradientStyle : {}}
            ></i>
            <span style={isActive(link.href) ? activeGradientStyle : {}}>
              {link.label}
            </span>
          </Link>
        ))}

      </nav>
      
      <div className="p-6 border-t border-slate-100 flex-shrink-0">
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 truncate">Nodum • {identidad.nombre}</p>
           <p className="text-xs font-bold text-slate-600 leading-snug">
             Creado por <span className="font-black" style={{ color: colores.primario }}>E-nnova Design</span> 
             {esInstanciaDefaultUADY ? " para RAS UADY." : "."}
           </p>
        </div>
      </div>
      
    </aside>
  );
}