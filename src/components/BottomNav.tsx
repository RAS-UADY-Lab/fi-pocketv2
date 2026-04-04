"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTenant } from '@/context/TenantContext';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import MenuMasModal from './MenuMasModal';

// ✨ SOLUCIÓN TYPESCRIPT: Definimos la estructura exacta para que TS no se queje
type NavItem = {
  href: string;
  label: string;
  icon: string;
  show?: any;
  prioridad?: number;
  esBotonMas?: boolean;
};

export default function BottomNav() {
  const { tenantId, modulos, identidad, colores, loadingConfig } = useTenant();
  const pathname = usePathname();
  const supabase = createClient();

  const [usuario, setUsuario] = useState<any>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);

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
    return <nav className="w-full h-16 border-t border-slate-200 bg-slate-50 animate-pulse pb-safe flex-shrink-0 z-50"></nav>;
  }

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname?.startsWith(path);
  };

  const esInstanciaDefaultUADY = tenantId === 1 || identidad.organizacion?.toLowerCase().includes("uady");

  const iconGradientStyle = {
    background: esInstanciaDefaultUADY && colores.secundario
      ? `linear-gradient(135deg, ${colores.primario}, ${colores.secundario})` 
      : `linear-gradient(135deg, ${colores.primario}, ${colores.primario}CC)`, 
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    color: 'transparent'
  };

  const todosLosModulos: NavItem[] = [
    { href: '/', label: 'Inicio', icon: 'icon-home', show: true, prioridad: 1 },
    { href: '/mapa', label: 'Mapa', icon: 'icon-map', show: modulos.mapa, prioridad: 1 },
    { href: '/directorio', label: 'Directorio', icon: 'icon-directory', show: modulos.directorio, prioridad: 1 },
    { href: '/perfil', label: 'Perfil', icon: 'icon-user', show: modulos.perfil && usuario, prioridad: 1 },
    
    // Módulos secundarios (Van al menú "Más" si hay varios)
    { href: '/tieeenda', label: esInstanciaDefaultUADY ? "TIEEEnda" : "Tienda", icon: 'icon-store-solid-full', show: modulos.tienda && usuario, prioridad: 2 },
    { href: '/archivo', label: 'Archivo', icon: 'icon-archive', show: modulos.archivo && usuario, prioridad: 2 },
    { href: '/portales', label: 'Portales', icon: 'icon-laptop', show: modulos.portales && usuario, prioridad: 2 },
    { href: '/mantenimiento', label: 'Ayuda', icon: 'icon-circle-info-solid-full', show: modulos.mantenimiento && usuario, prioridad: 2 },
  ];

  const modulosActivos = todosLosModulos.filter(item => item.show);
  const fijos = modulosActivos.filter(item => item.prioridad === 1);
  const secundarios = modulosActivos.filter(item => item.prioridad === 2);

  let navItemsParaBarra: NavItem[] = [...fijos];
  let navItemsExtra: NavItem[] = [];

  // ✨ SOLUCIÓN UI: Calculamos la mitad exacta para que la barra siempre sea simétrica
  const mitadExacta = Math.ceil(fijos.length / 2); 

  if (secundarios.length === 1) {
    // Si solo hay un módulo extra, lo ponemos justo en el medio
    navItemsParaBarra.splice(mitadExacta, 0, secundarios[0]);
  } else if (secundarios.length > 1) {
    // Si hay varios, el botón "Más" va exactamente en el medio
    navItemsExtra = secundarios;
    navItemsParaBarra.splice(mitadExacta, 0, {
      href: '#mas',
      label: 'Más',
      icon: 'icon-plus-solid-full', 
      esBotonMas: true
    });
  }

  return (
    <>
      <nav className="print:hidden w-full border-t border-slate-200 bg-white pb-safe flex-shrink-0 z-50">
        <ul className="flex justify-around items-center p-2 text-[10px]">
          {navItemsParaBarra.map(item => (
            <li key={item.label} className="flex-1 flex justify-center">
              
              {item.esBotonMas ? (
                <button 
                  onClick={() => setMenuAbierto(true)}
                  className={`flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl transition-all cursor-pointer active:scale-95 ${menuAbierto ? "font-bold" : "font-medium"}`}
                >
                  <i 
                    className={`${item.icon} text-xl transition-all ${menuAbierto ? "scale-110" : "text-slate-400"}`}
                    style={menuAbierto ? iconGradientStyle : {}}
                  ></i>
                  <span className={`truncate ${menuAbierto ? "text-slate-950 font-black" : "text-slate-500"}`}>
                    {item.label}
                  </span>
                </button>
              ) : (
                <Link 
                  href={item.href} 
                  className={`flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl transition-all cursor-pointer active:scale-95 ${isActive(item.href) ? "font-bold" : "font-medium"}`}
                >
                  <i 
                    className={`${item.icon} text-xl transition-all ${isActive(item.href) ? "scale-110" : "text-slate-400"}`}
                    style={isActive(item.href) ? iconGradientStyle : {}}
                  ></i>
                  <span className={`truncate ${isActive(item.href) ? "text-slate-950 font-black" : "text-slate-500"}`}>
                    {item.label}
                  </span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {navItemsExtra.length > 0 && (
        <MenuMasModal 
          isOpen={menuAbierto} 
          onClose={() => setMenuAbierto(false)} 
          enlacesExtra={navItemsExtra} 
          iconGradientStyle={iconGradientStyle}
        />
      )}
    </>
  );
}