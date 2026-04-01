"use client";

import { useState, useMemo } from "react";
import { tenantConfig } from "@/config/tenant";
import Link from "next/link";

export default function DirectorioPage() {
  const [busqueda, setBusqueda] = useState("");

  // Transformamos la estructura jerárquica de edificios (del tenant) en una lista plana
  const listaDirectorio = useMemo(() => {
    const lista = [];
    
    // Recorremos cada edificio de nuestra base de datos central (tenantConfig)
    for (const [idEdificio, edificio] of Object.entries(tenantConfig.edificios)) {
      
      // 1. Agregamos el edificio principal a la lista
      lista.push({
        id: idEdificio,
        nombre: edificio.nombre,
        tipo: `Edificio - ${edificio.tipo}`,
        ubicacion: tenantConfig.identidad.nombre // Usa el nombre de la app (ej. "FI Pocket")
      });

      // 2. Recorremos sus plantas y agregamos cada aula/servicio
      edificio.plantas.forEach((planta) => {
        planta.ubicaciones.forEach((ubicacion) => {
          lista.push({
            id: idEdificio, // Guardamos el ID para mandar al usuario al lugar correcto en el mapa
            nombre: ubicacion,
            tipo: "Aula / Servicio",
            ubicacion: `${edificio.nombre} (${planta.nivel})`
          });
        });
      });
    }
    
    // Ordenamos alfabéticamente por nombre
    return lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, []); // Se calcula una sola vez gracias a useMemo

  // Filtramos la lista en tiempo real según lo que el usuario escriba
  const resultados = listaDirectorio.filter((item) =>
    item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    item.tipo.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <main className="flex flex-col h-full max-w-4xl mx-auto p-4 md:p-8">
      
      {/* Encabezado y Buscador */}
      <header className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-4">Directorio</h1>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <i className="icon-magnifying-glass text-slate-400 text-lg"></i>
          </div>
          <input
            type="text"
            placeholder="Buscar aulas, edificios, servicios..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
          />
        </div>
      </header>

      {/* Lista de Resultados con SCROLLBAR PERSONALIZADA */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-6">
        {resultados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {resultados.map((item, index) => (
              <Link 
                href={`/mapa?edificio=${item.id}`} 
                key={index}
                className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div>
                  <h3 className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                    {item.nombre}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    <span className="font-medium text-blue-600">{item.tipo}</span> • {item.ubicacion}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors flex-shrink-0 ml-4">
                  <i className="icon-right-arrow"></i>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="icon-question text-3xl text-slate-400"></i>
            </div>
            <h3 className="text-lg font-bold text-slate-700">No hay resultados</h3>
            <p className="text-slate-500 mt-1">Intenta buscar con otras palabras.</p>
          </div>
        )}
      </div>

    </main>
  );
}