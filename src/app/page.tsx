"use client";

import { useState } from "react";
import Link from "next/link";
import { tenantConfig, Plataforma } from "@/config/tenant";

// Filtros de plataformas soportadas
const filtrosPlataforma: { id: Plataforma; etiqueta: string }[] = [
  { id: "facebook", etiqueta: "Facebook" },
  { id: "instagram", etiqueta: "Instagram" },
  { id: "tiktok", etiqueta: "TikTok" },
  { id: "sitio", etiqueta: "Web" },
];

export default function HomePage() {
  const { identidad, modulos, comunidades } = tenantConfig;
  const [plataformaActiva, setPlataformaActiva] = useState<Plataforma>("facebook");

  // Filtramos dinámicamente las comunidades según la red seleccionada
  const comunidadesFiltradas = comunidades.filter(
    (comunidad) => comunidad.plataformas[plataformaActiva]
  );

  return (
    // Agregamos custom-scrollbar al contenedor principal
    <main className="flex flex-col h-full max-w-5xl mx-auto p-4 md:p-8 overflow-y-auto custom-scrollbar pb-24 md:pb-8">
      
      {/* Tarjeta de Bienvenida Dinámica */}
      <header className="mb-8 bg-blue-600 text-white rounded-3xl p-6 md:p-10 shadow-lg relative overflow-hidden flex-shrink-0">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
            ¡Bienvenido a {identidad.nombre}!
          </h1>
          <p className="text-blue-100 font-medium max-w-lg text-sm md:text-base mt-2">
            Tu folleto informativo de bolsillo. Encuentra tus aulas, consulta el directorio y accede a tus servicios escolares de forma rápida.
          </p>
        </div>
        <i className={`${identidad.logoIcono} absolute -bottom-6 -right-4 text-9xl text-blue-500 opacity-40 transform -rotate-12 pointer-events-none`}></i>
      </header>

      {/* Accesos Rápidos (Condicionados por tenantConfig.modulos) */}
      <section className="mb-10 flex-shrink-0">
        <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">Accesos Rápidos</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {modulos.mapa && (
            <Link href="/mapa" className="flex flex-col items-center justify-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-3 group-hover:scale-110 transition-transform">
                <i className="icon-map text-2xl"></i>
              </div>
              <span className="font-bold text-slate-700 text-sm">Mapa del Campus</span>
            </Link>
          )}

          {modulos.directorio && (
            <Link href="/directorio" className="flex flex-col items-center justify-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-3 group-hover:scale-110 transition-transform">
                <i className="icon-directory text-2xl"></i>
              </div>
              <span className="font-bold text-slate-700 text-sm">Directorio</span>
            </Link>
          )}

          {modulos.portales && (
            <Link href="/portales" className="flex flex-col items-center justify-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group">
              <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 mb-3 group-hover:scale-110 transition-transform">
                <i className="icon-career text-2xl"></i>
              </div>
              <span className="font-bold text-slate-700 text-sm">Portales</span>
            </Link>
          )}

          {modulos.archivo && (
            <Link href="/archivo" className="flex flex-col items-center justify-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group">
              <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 mb-3 group-hover:scale-110 transition-transform">
                <i className="icon-archive text-2xl"></i>
              </div>
              <span className="font-bold text-slate-700 text-sm">Documentos</span>
            </Link>
          )}

        </div>
      </section>

      {/* Carrusel de Comunidades Interactivo */}
      <section className="mb-10 flex-shrink-0">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-4 px-1 gap-4">
          <h2 className="text-lg font-bold text-slate-800">Comunidades y Noticias</h2>
          
          {/* Mantenemos no-scrollbar en el horizontal para sentir que es táctil nativo */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {filtrosPlataforma.map((filtro) => (
              <button
                key={filtro.id}
                onClick={() => setPlataformaActiva(filtro.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
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
                href={page.plataformas[plataformaActiva]} 
                target="_blank"
                rel="noopener noreferrer"
                className={`flex flex-col min-w-[220px] max-w-[240px] flex-shrink-0 snap-center p-5 rounded-2xl border ${page.color} bg-opacity-30 hover:bg-opacity-50 transition-all shadow-sm`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm ${page.iconColor}`}>
                    <i className="icon-user text-lg"></i>
                  </div>
                  <i className="icon-right-arrow text-slate-400 text-sm opacity-50"></i>
                </div>
                <h3 className="font-extrabold text-slate-800 text-base leading-tight mb-1">{page.nombre}</h3>
                <p className="text-xs font-semibold opacity-80">{page.handle}</p>
              </a>
            ))}
          </div>
        ) : (
          <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center">
            <p className="text-slate-500 text-sm font-medium">Aún no hay comunidades registradas en esta plataforma.</p>
          </div>
        )}
      </section>

      {/* Avisos Rápidos Dinámicos */}
      <section className="flex-shrink-0">
        <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">Avisos de {identidad.organizacion}</h2>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-start gap-4 hover:border-blue-200 transition-colors">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0 mt-1">
            <i className="icon-calendar text-xl"></i>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-bold text-slate-800">Inicio de Semestre</h3>
              <span className="text-xs font-medium text-slate-400">Hace 2 días</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              No olvides revisar tu carga horaria y ubicar tus salones con anticipación utilizando el mapa interactivo.
            </p>
          </div>
        </div>
      </section>

    </main>
  );
}