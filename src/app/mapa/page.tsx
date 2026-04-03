"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import InteractiveMap from "@/components/InteractiveMap";
import InfoPanel from "@/components/InfoPanel";
import { useTenant } from "@/context/TenantContext";

function MapaContent() {
  const searchParams = useSearchParams();
  const edificioParam = searchParams.get("edificio"); 
  const { edificios } = useTenant();
  const { identidad } = useTenant();
  
  const [edificioActivo, setEdificioActivo] = useState<string | null>(null);

  useEffect(() => {
    if (edificioParam) {
      setEdificioActivo(edificioParam);
    }
  }, [edificioParam]);

  // Buscamos la info del edificio seleccionado
  const infoSeleccionada = edificios.find(e => e.id === edificioActivo) || null;

  return (
    <main className="flex flex-col md:flex-row h-full max-w-7xl mx-auto p-4 md:p-6 gap-6 relative overflow-hidden">
      <div className="flex-1 flex flex-col h-full">
        <header className="mb-4 flex-shrink-0">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Mapa de {identidad.nombre}</h1>
          <p className="text-slate-500 mt-1 font-medium">Selecciona un edificio para ver sus ubicaciones.</p>
        </header>

        <InteractiveMap 
          edificioActivo={edificioActivo} 
          setEdificioActivo={setEdificioActivo} 
        />
      </div>

      <InfoPanel 
        info={infoSeleccionada} 
        onClose={() => setEdificioActivo(null)} 
      />
    </main>
  );
}

export default function MapaPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-[50vh] w-full text-primario/50 gap-4">
        <i className="icon-map text-5xl animate-pulse"></i>
        <span className="text-sm font-bold tracking-widest uppercase animate-pulse">Cargando Mapa...</span>
      </div>
    }>
      <MapaContent />
    </Suspense>
  );
}