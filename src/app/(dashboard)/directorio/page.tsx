"use client";

import { useState, useMemo } from "react";
import { useTenant } from "@/context/TenantContext"; // <-- Extraemos de la BD
import Link from "next/link";

export default function DirectorioPage() {
  const { edificios, identidad, loadingConfig } = useTenant(); 
  const [busqueda, setBusqueda] = useState("");

  const listaDirectorio = useMemo(() => {
    const lista: any[] = [];
    
    // Recorremos el arreglo de edificios que viene de Supabase
    edificios.forEach((edificio) => {
      lista.push({
        id: edificio.id, // Debe existir en el JSON de Supabase
        nombre: edificio.nombre,
        tipo: `Edificio - ${edificio.tipo}`,
        ubicacion: identidad.nombre 
      });

      if (edificio.plantas) {
        edificio.plantas.forEach((planta: any) => {
          planta.ubicaciones.forEach((ubicacion: string) => {
            lista.push({
              id: edificio.id, 
              nombre: ubicacion,
              tipo: "Aula / Servicio",
              ubicacion: `${edificio.nombre} (${planta.nivel})`
            });
          });
        });
      }
    });
    
    return lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [edificios, identidad.nombre]); 

  const resultados = listaDirectorio.filter((item) =>
    item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    item.tipo.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (loadingConfig) {
    return <div className="p-8 text-center animate-pulse text-slate-400 font-bold">Cargando directorio...</div>;
  }

  return (
    <main className="flex flex-col h-full max-w-4xl mx-auto p-4 md:p-8">
      <header className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-4">Directorio</h1>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <i className="icon-magnifying-glass text-slate-400 text-lg"></i>
          </div>
          {/* CORRECCIÓN: Arreglado el typo focus:ring-primario0 y agregada la opacidad */}
          <input
            type="text"
            placeholder="Buscar aulas, edificios, servicios..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-primario/20 focus:border-primario transition-all shadow-sm font-medium"
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-6">
        {resultados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {resultados.map((item, index) => (
              <Link 
                href={`/mapa?edificio=${item.id}`} 
                key={index}
                /* CORRECCIÓN: Hover border con opacidad y active:scale para mejor UX */
                className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-primario/50 hover:shadow-md transition-all group active:scale-[0.98]"
              >
                <div>
                  <h3 className="font-bold text-slate-800 group-hover:text-primario transition-colors text-base">
                    {item.nombre}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    <span className="font-bold text-primario">{item.tipo}</span> • {item.ubicacion}
                  </p>
                </div>
                {/* CORRECCIÓN: El botón ahora usa el degradado Nodum y el ícono es blanco en hover */}
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-gradient-to-t group-hover:from-secundario group-hover:to-primario group-hover:text-white transition-all shadow-sm group-hover:shadow-md flex-shrink-0 ml-4">
                  <i className="icon-right-arrow text-sm"></i>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {/* Actualizado a un ícono de lupa tachada o genérico de búsqueda */}
              <i className="icon-magnifying-glass text-3xl text-slate-300"></i>
            </div>
            <h3 className="text-lg font-bold text-slate-700">No hay resultados</h3>
            <p className="text-slate-500 mt-1 font-medium">Intenta buscar con otras palabras.</p>
          </div>
        )}
      </div>
    </main>
  );
}