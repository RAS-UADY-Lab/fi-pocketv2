"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plataforma } from "@/context/TenantContext";
import { createClient } from "@/lib/supabase"; 
import { useTenant } from "@/context/TenantContext";

const filtrosPlataforma: { id: Plataforma; etiqueta: string }[] = [
  { id: "facebook", etiqueta: "Facebook" },
  { id: "instagram", etiqueta: "Instagram" },
  { id: "tiktok", etiqueta: "TikTok" },
  { id: "sitio", etiqueta: "Web" },
];

export default function HomePage() {
  const { identidad, modulos, comunidades, avisos, loadingConfig } = useTenant();
  const [plataformaActiva, setPlataformaActiva] = useState<Plataforma>("facebook");
  
  const [usuario, setUsuario] = useState<any>(null);
  const [perfil, setPerfil] = useState<any>(null); 
  const supabase = createClient();

  useEffect(() => {
    const cargarUsuarioYPerfil = async (sessionUser: any) => {
      setUsuario(sessionUser);
      if (sessionUser) {
        const { data: perfilData } = await supabase
          .from("perfiles")
          .select("nombre, apellido, rol")
          .eq("id", sessionUser.id)
          .single();
        setPerfil(perfilData);
      } else {
        setPerfil(null);
      }
    };

    const iniciarCarga = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await cargarUsuarioYPerfil(session?.user || null);
    };

    iniciarCarga();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      cargarUsuarioYPerfil(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
  };

  const obtenerIcono = (nombre: string) => {
    const nombreLower = nombre.toLowerCase();
    if (nombreLower.includes("ras")) return "icon-RAS";
    if (nombreLower.includes("wie")) return "icon-WIE";
    if (nombreLower.includes("ieee")) return "icon-IEEE";
    return "icon-user"; 
  };

  if (loadingConfig) {
    return (
      <main className="min-h-[100dvh] flex flex-col justify-center items-center p-6 bg-slate-50">
        <div className="w-16 h-16 rounded-2xl bg-slate-200 animate-pulse mb-4"></div>
        <div className="w-32 h-4 bg-slate-200 rounded-full animate-pulse"></div>
      </main>
    );
  }

  const arrayComunidades = comunidades || [];
  const arrayAvisos = avisos || [];

  const comunidadesFiltradas = arrayComunidades.filter(
    (comunidad) => comunidad.plataformas && comunidad.plataformas[plataformaActiva as keyof typeof comunidad.plataformas]
  );

  return (
    <main className="flex flex-col h-full max-w-5xl mx-auto p-4 md:p-8 overflow-y-auto custom-scrollbar pb-24 md:pb-8">
      
      {/* --- BARRA DE ESTADO DEL USUARIO --- */}
      <div className="flex justify-between items-center mb-6 flex-shrink-0 bg-white border border-slate-200 p-3 md:p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primario/10 text-primario rounded-full flex items-center justify-center font-black text-lg border border-primario/20 flex-shrink-0">
            {perfil?.nombre ? perfil.nombre.charAt(0).toUpperCase() : <i className="icon-user"></i>}
          </div>
          <div className="flex flex-col justify-center min-w-0">
            {usuario ? (
              <>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sesión Iniciada</p>
                  
                  {/* Etiqueta dinámica de rol */}
                  {perfil?.rol === 'superadmin' ? (
                    <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm">
                      Master
                    </span>
                  ) : perfil?.rol === 'admin' ? (
                    <span className="bg-purple-100 text-purple-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm">
                      Admin
                    </span>
                  ) : null}
                </div>
                
                {perfil?.nombre ? (
                  <p className="text-sm font-black text-slate-800 truncate max-w-[120px] md:max-w-xs leading-none">
                    {perfil.nombre} {perfil.apellido}
                  </p>
                ) : (
                  <>
                    <p className="text-sm font-bold text-slate-800 truncate max-w-[120px] md:max-w-xs leading-none">
                      {usuario.email}
                    </p>
                    <Link href="/perfil" className="mt-1.5 inline-flex items-center gap-1 w-fit bg-amber-50 text-amber-600 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-amber-100 transition-colors cursor-pointer border border-amber-100 active:scale-95">
                      <i className="icon-info"></i> Completar Perfil
                    </Link>
                  </>
                )}
              </>
            ) : (
              <>
                <p className="text-sm font-black text-slate-800 leading-none mb-1">Modo Invitado</p>
                <p className="text-[10px] font-bold text-slate-400 leading-tight">Regístrate para usar la TIEEEnda</p>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          
          {/* BOTÓN MASTER (Solo para ti) */}
          {perfil?.rol === 'superadmin' && (
            <>
              <Link href="/superadmin" className="hidden md:flex items-center gap-1 px-4 py-2 bg-emerald-600 text-white font-black text-[11px] uppercase tracking-wider rounded-xl hover:bg-emerald-700 shadow-sm transition-all cursor-pointer active:scale-95">
                <i className="icon-laptop"></i> Master
              </Link>
              <Link href="/superadmin" className="md:hidden flex items-center justify-center w-9 h-9 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-sm transition-all cursor-pointer active:scale-95">
                <i className="icon-laptop"></i>
              </Link>
            </>
          )}

          {/* BOTÓN ADMIN (Para administradores de instancia y para ti) */}
          {(perfil?.rol === 'admin' || perfil?.rol === 'superadmin') && (
            <>
              <Link href="/admin" className="hidden md:flex items-center gap-1 px-4 py-2 bg-purple-600 text-white font-black text-[11px] uppercase tracking-wider rounded-xl hover:bg-purple-700 shadow-sm transition-all cursor-pointer active:scale-95">
                <i className="icon-laptop"></i> Panel
              </Link>
              <Link href="/admin" className="md:hidden flex items-center justify-center w-9 h-9 bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow-sm transition-all cursor-pointer active:scale-95">
                <i className="icon-laptop"></i>
              </Link>
            </>
          )}

          {usuario ? (
            <button onClick={cerrarSesion} className="px-4 py-2 bg-red-50 text-red-600 font-black text-[11px] uppercase tracking-wider rounded-xl hover:bg-red-100 transition-colors cursor-pointer h-9 md:h-auto active:scale-95">
              Salir
            </button>
          ) : (
            <Link href="/login" className="px-5 py-2.5 bg-gradient-to-t from-secundario to-primario text-white font-black text-xs uppercase tracking-wider rounded-xl hover:opacity-90 shadow-md transition-all cursor-pointer active:scale-95">
              Ingresar
            </Link>
          )}
        </div>
      </div>

      <header className="mb-8 bg-gradient-to-t from-secundario to-primario text-white rounded-[2rem] p-6 md:p-10 shadow-lg relative overflow-hidden flex-shrink-0">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
            ¡Bienvenido a Nodum • {identidad.nombre}!
          </h1>
          <p className="text-white opacity-90 font-medium max-w-lg text-sm md:text-base mt-2">
            Tu folleto informativo de bolsillo. Encuentra tus aulas, consulta el directorio y accede a tus servicios escolares de forma rápida.
          </p>
        </div>
        <i className={`${identidad.logoIcono || 'icon-app-logo'} absolute -bottom-6 -right-4 text-9xl text-white opacity-20 transform -rotate-12 pointer-events-none`}></i>
      </header>

      {/* Accesos Rápidos */}
      <section className="mb-10 flex-shrink-0">
        <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">Accesos Rápidos</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {modulos.mapa && (
            <Link href="/mapa" className="flex flex-col items-center justify-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-primario/30 hover:shadow-md transition-all group cursor-pointer active:scale-95">
              <div className="w-14 h-14 bg-primario/10 rounded-full flex items-center justify-center text-primario mb-3 group-hover:scale-110 transition-transform"><i className="icon-map text-2xl"></i></div>
              <span className="font-bold text-slate-700 text-sm">Mapa del Campus</span>
            </Link>
          )}
          {modulos.directorio && (
            <Link href="/directorio" className="flex flex-col items-center justify-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-primario/30 hover:shadow-md transition-all group cursor-pointer active:scale-95">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-3 group-hover:scale-110 transition-transform"><i className="icon-directory text-2xl"></i></div>
              <span className="font-bold text-slate-700 text-sm">Directorio</span>
            </Link>
          )}
          {modulos.portales && (
            <Link href="/portales" className="flex flex-col items-center justify-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-primario/30 hover:shadow-md transition-all group cursor-pointer active:scale-95">
              <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 mb-3 group-hover:scale-110 transition-transform"><i className="icon-laptop text-2xl"></i></div>
              <span className="font-bold text-slate-700 text-sm">Portales</span>
            </Link>
          )}
          {modulos.archivo && (
            <Link href="/archivo" className="flex flex-col items-center justify-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-primario/30 hover:shadow-md transition-all group cursor-pointer active:scale-95">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-3 group-hover:scale-110 transition-transform"><i className="icon-archive text-2xl"></i></div>
              <span className="font-bold text-slate-700 text-sm">Documentos</span>
            </Link>
          )}
          {modulos.tienda && (
            <Link href="/tieeenda" className="flex flex-col items-center justify-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-primario/30 hover:shadow-md transition-all group cursor-pointer active:scale-95 md:hidden">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-3 group-hover:scale-110 transition-transform"><i className="icon-cart text-2xl"></i></div>
              <span className="font-bold text-slate-700 text-sm">TIEEEnda</span>
            </Link>
          )}
        </div>
      </section>

      {/* Carrusel de Comunidades Interactivo */}
      <section className="mb-10 flex-shrink-0">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-4 px-1 gap-4">
          <h2 className="text-lg font-bold text-slate-800">Comunidades y Noticias</h2>
          
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {filtrosPlataforma.map((filtro) => (
              <button
                key={filtro.id}
                onClick={() => setPlataformaActiva(filtro.id)}
                className={`cursor-pointer px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                  plataformaActiva === filtro.id 
                    ? "bg-slate-800 text-white shadow-sm" 
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {filtro.etiqueta}
              </button>
            ))}
          </div>
        </div>
        
        {comunidadesFiltradas.length > 0 ? (
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
            {comunidadesFiltradas.map((page, index) => (
              <a 
                key={index}
                href={page.plataformas[plataformaActiva as keyof typeof page.plataformas] || "#"} 
                target="_blank"
                rel="noopener noreferrer"
                style={{ borderColor: page.color || '#e2e8f0', borderWidth: '1px' }}
                className={`cursor-pointer flex flex-col min-w-[220px] max-w-[240px] flex-shrink-0 snap-center p-5 rounded-[2rem] bg-white hover:shadow-md transition-all shadow-sm active:scale-[0.98]`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div 
                    className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm"
                    style={{ color: page.iconColor || 'var(--color-primario)' }}
                  >
                    <i className={`${obtenerIcono(page.nombre)} text-3xl`}></i>
                  </div>
                  <i className="icon-right-arrow text-slate-300 text-sm mt-1"></i>
                </div>
                <h3 className="font-extrabold text-slate-800 text-base leading-tight mb-1">{page.nombre}</h3>
                <p className="text-xs font-semibold opacity-80 text-slate-500">{page.handle}</p>
              </a>
            ))}
          </div>
        ) : (
          <div className="w-full bg-slate-50 border border-slate-200 border-dashed rounded-[2rem] p-8 text-center">
            <p className="text-slate-400 text-sm font-bold">Aún no hay comunidades registradas en esta plataforma.</p>
          </div>
        )}
      </section>

      {/* Avisos Rápidos Dinámicos */}
      {arrayAvisos.length > 0 && (
        <section className="flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">Avisos de {identidad.organizacion}</h2>
          <div className="space-y-4">
            {arrayAvisos.map((aviso: any) => (
              <div key={aviso.id} className="relative bg-white border border-slate-200 rounded-[2rem] p-5 pr-20 shadow-sm flex items-start gap-4 hover:border-primario/50 hover:shadow-md transition-all group">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 flex-shrink-0 mt-1 border border-slate-100 group-hover:bg-primario/10 group-hover:text-primario transition-colors">
                  <i className={`${aviso.icono || 'icon-info'} text-xl`}></i>
                </div>
                <div className="w-full">
                  <h3 className="font-bold text-slate-800 mb-1.5 pr-4 leading-tight">{aviso.titulo}</h3>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    {aviso.descripcion}
                  </p>
                </div>
                <span className="absolute top-5 right-5 text-[10px] font-bold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-md whitespace-nowrap">
                  {aviso.tiempo}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
      
    </main>
  );
}