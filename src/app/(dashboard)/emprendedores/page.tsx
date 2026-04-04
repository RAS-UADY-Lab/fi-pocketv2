"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useTenant } from "@/context/TenantContext";
import { useRouter } from "next/navigation";

export default function EmprendedoresPage() {
  const supabase = createClient();
  const router = useRouter();
  const { tenantId, modulos, colores, loadingConfig } = useTenant();

  const [loading, setLoading] = useState(true);
  const [negocios, setNegocios] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [soloActivos, setSoloActivos] = useState(false);

  useEffect(() => {
    if (loadingConfig) return;

    // Seguridad: Si el módulo está apagado, redirigir
    if (!modulos.emprendedores) {
      router.push("/");
      return;
    }

    cargarNegocios();
  }, [loadingConfig, modulos.emprendedores]);

  const cargarNegocios = async () => {
    setLoading(true);
    // Traemos los negocios aprobados de esta instancia
    const { data, error } = await supabase
      .from("emprendimientos")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("aprobado", true)
      .order("estado_vivo", { ascending: true }); // 'activo' antes que 'ausente' alfabéticamente

    if (!error && data) {
      setNegocios(data);
    }
    setLoading(false);
  };

  // Filtrado en tiempo real
  const filtrados = negocios.filter((n) => {
    const cumpleBusqueda = n.nombre_negocio.toLowerCase().includes(busqueda.toLowerCase()) || 
                          n.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
    const cumpleEstado = soloActivos ? n.estado_vivo === "activo" : true;
    return cumpleBusqueda && cumpleEstado;
  });

  if (loadingConfig || loading) {
    return <div className="p-10 text-center animate-pulse font-bold text-slate-400">Abriendo el mercado...</div>;
  }

  return (
    <main className="min-h-[100dvh] w-full max-w-5xl mx-auto p-4 md:p-8 overflow-y-auto no-scrollbar pb-32">
      
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Emprendedores</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Apoya el comercio local de tus compañeros de facultad.</p>
        </div>
        <button 
          onClick={() => router.push("/emprendedores/gestion")}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg w-full md:w-auto flex-shrink-0"
        >
          <i className="icon-store-solid-full text-sm"></i> Mi Emprendimiento
        </button>
      </header>

      {/* Barra de Búsqueda y Filtros */}
      <section className="space-y-4 mb-8">
        <div className="relative">
          <i className="icon-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></i>
          <input 
            type="text"
            placeholder="¿Qué se te antoja hoy? Ej: Postres, Electrónica..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-[1.5rem] text-sm font-bold outline-none focus:ring-2 transition-all shadow-sm"
            style={{ "--tw-ring-color": `${colores.primario}20` } as any}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button 
            onClick={() => setSoloActivos(!soloActivos)}
            className={`px-5 py-2 rounded-full text-xs font-black transition-all whitespace-nowrap border flex items-center gap-2 ${
              soloActivos 
                ? "bg-slate-900 text-white border-slate-900 shadow-md" 
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${soloActivos ? "bg-emerald-400 animate-pulse" : "bg-slate-300"}`}></div>
            Activos ahora
          </button>
          
          {/* Aquí podrías añadir categorías más adelante */}
        </div>
      </section>

      {/* Grid de Negocios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtrados.length > 0 ? (
          filtrados.map((negocio) => (
            <div 
              key={negocio.id}
              onClick={() => router.push(`/emprendedores/${negocio.id}`)}
              className="group bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm hover:shadow-xl hover:border-primario/20 transition-all cursor-pointer relative overflow-hidden"
            >
              {/* Indicador de Estado Vivo (Badge flotante) */}
              <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${
                negocio.estado_vivo === 'activo' 
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                  : "bg-slate-50 text-slate-400 border-slate-100"
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${negocio.estado_vivo === 'activo' ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}></div>
                {negocio.estado_vivo === 'activo' ? "En vivo" : "Ausente"}
              </div>

              <div className="flex gap-5 items-start">
                {/* Logo o Inicial */}
                <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
                  {negocio.logo_url ? (
                    <img src={negocio.logo_url} alt={negocio.nombre_negocio} className="w-full h-full object-cover" />
                  ) : (
                    <i className="icon-store-solid-full text-3xl text-slate-200"></i>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-slate-900 text-lg truncate pr-16">{negocio.nombre_negocio}</h3>
                  <p className="text-xs text-slate-500 font-medium line-clamp-2 mt-1 leading-relaxed">
                    {negocio.descripcion || "Sin descripción disponible."}
                  </p>
                  
                  {/* Ubicación Actual (Solo si está activo) */}
                  {negocio.estado_vivo === 'activo' && negocio.ubicacion_actual && (
                    <div className="mt-3 flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase tracking-wider bg-emerald-50 w-fit px-2.5 py-1 rounded-lg border border-emerald-100">
                      <i className="icon-location-pin"></i>
                      En: {negocio.ubicacion_actual}
                    </div>
                  )}

                  {!negocio.estado_vivo || negocio.estado_vivo === 'ausente' && (
                     <p className="mt-3 text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <i className="icon-calendar"></i> {negocio.horario_habitual || "Horario no definido"}
                     </p>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-50 flex justify-between items-center">
                 <div className="flex gap-2">
                    {/* Indicadores rápidos de redes */}
                    {negocio.redes_sociales?.instagram && <i className="icon-instagram text-slate-300 text-sm"></i>}
                    {negocio.redes_sociales?.whatsapp && <i className="icon-whatsapp text-slate-300 text-sm"></i>}
                 </div>
                 <span className="text-[10px] font-black text-primario uppercase flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Ver catálogo <i className="icon-right-arrow text-[8px]"></i>
                 </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem]">
            <i className="icon-store-solid-full text-5xl text-slate-200 mb-4 block"></i>
            <p className="text-slate-500 font-bold">No encontramos negocios con esos filtros.</p>
            <p className="text-sm text-slate-400">¡Sé el primero en registrar tu emprendimiento!</p>
          </div>
        )}
      </div>

    </main>
  );
}