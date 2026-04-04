"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useTenant } from "@/context/TenantContext";

export default function ModulosTab() {
  const { modulos, recargarConfiguracion, tenantId, colores } = useTenant();
  const supabase = createClient();
  const [loading, setLoading] = useState<string | null>(null); 
  const [modulosLocal, setModulosLocal] = useState(modulos);

  useEffect(() => {
    setModulosLocal(modulos);
  }, [modulos]);

  const toggleModulo = async (key: keyof typeof modulos) => {
    setLoading(key);
    
    const nuevosModulos = { ...modulosLocal, [key]: !modulosLocal[key] };
    setModulosLocal(nuevosModulos);

    const { error } = await supabase
      .from("tenants")
      .update({ modulos: nuevosModulos })
      .eq("id", tenantId);

    if (!error) {
      await recargarConfiguracion();
    } else {
      alert("Error al actualizar el módulo: " + error.message);
      setModulosLocal(modulos); 
    }
    
    setLoading(null);
  };

  // ✨ NUEVO: Mantenimiento agregado a la lista visual
  const listaModulos = [
    { key: "mapa", titulo: "Mapa del Campus", desc: "Plano interactivo con edificios y aulas.", icono: "icon-map" },
    { key: "directorio", titulo: "Directorio", desc: "Contactos de profesores y departamentos.", icono: "icon-directory" },
    { key: "portales", titulo: "Portales Web", desc: "Enlaces a plataformas académicas externas.", icono: "icon-laptop" },
    { key: "archivo", titulo: "Archivo Institucional", desc: "Repositorio de documentos y formatos.", icono: "icon-archive" },
    { key: "tienda", titulo: "Módulo de Tienda", desc: "Comercio de productos para estudiantes.", icono: "icon-store-solid-full" },
    { key: "mantenimiento", titulo: "Mantenimiento", desc: "Sistema de tickets para reportar fallas en el campus.", icono: "icon-building" },
    { key: "emprendedores", titulo: "Marketplace Estudiantil", desc: "Directorio de negocios de alumnos y ventas en vivo.", icono: "icon-store" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-xl font-black text-slate-900">Accesos y Módulos</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Enciende o apaga las herramientas de tu facultad. Al apagar un módulo, desaparecerá del inicio y de los menús para todos los alumnos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {listaModulos.map((modulo) => {
          const mKey = modulo.key as keyof typeof modulos;
          const estaActivo = modulosLocal[mKey];
          const isProcessing = loading === mKey;

          return (
            <div 
              key={modulo.key} 
              className={`bg-white border p-5 rounded-3xl flex items-center justify-between transition-all shadow-sm ${
                estaActivo ? "border-slate-200" : "border-slate-100 opacity-75"
              }`}
            >
              <div className="flex items-center gap-4">
                <div 
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-colors ${
                    estaActivo ? "bg-primario/10 text-primario" : "bg-slate-100 text-slate-400"
                  }`}
                  style={estaActivo ? { backgroundColor: `${colores.primario}15`, color: colores.primario } : {}}
                >
                  <i className={modulo.icono}></i>
                </div>
                <div>
                  <h3 className={`font-bold transition-colors ${estaActivo ? "text-slate-800" : "text-slate-500"}`}>
                    {modulo.titulo}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium line-clamp-1">{modulo.desc}</p>
                </div>
              </div>

              <button 
                onClick={() => toggleModulo(mKey)}
                disabled={isProcessing}
                className={`relative w-14 h-8 rounded-full transition-colors duration-300 flex items-center cursor-pointer disabled:opacity-50 flex-shrink-0 ${
                  estaActivo ? "bg-emerald-500" : "bg-slate-200"
                }`}
              >
                <div 
                  className={`absolute w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                    estaActivo ? "translate-x-7" : "translate-x-1"
                  } ${isProcessing ? "animate-pulse" : ""}`}
                ></div>
              </button>

            </div>
          );
        })}
      </div>
    </div>
  );
}