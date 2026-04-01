"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import InteractiveMap from "@/components/InteractiveMap";
import InfoPanel from "@/components/InfoPanel";

// 1. Separamos el contenido en un sub-componente
function MapaContent() {
  const searchParams = useSearchParams();
  const edificioParam = searchParams.get("edificio"); // Busca ?edificio=ALGO en la URL
  
  const [edificioActivo, setEdificioActivo] = useState<string | null>(null);

  // 2. Este efecto se ejecuta cuando la página carga o la URL cambia
  useEffect(() => {
    if (edificioParam) {
      // Si llegamos desde el directorio, activamos ese edificio inmediatamente
      setEdificioActivo(edificioParam);
    }
  }, [edificioParam]);

  return (
    <main className="flex flex-col md:flex-row h-full max-w-7xl mx-auto p-4 md:p-6 gap-6 relative overflow-hidden">
      
      {/* Columna Izquierda: Mapa */}
      <div className="flex-1 flex flex-col h-full">
        <header className="mb-4 flex-shrink-0">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Campus</h1>
          <p className="text-slate-500 mt-1">Selecciona un edificio para ver sus ubicaciones.</p>
        </header>

        <InteractiveMap 
          edificioActivo={edificioActivo} 
          setEdificioActivo={setEdificioActivo} 
        />
      </div>

      {/* Columna Derecha / BottomSheet: Panel de Info */}
      <InfoPanel 
        idSeleccionado={edificioActivo} 
        onClose={() => setEdificioActivo(null)} 
      />

    </main>
  );
}

// 3. Exportamos la página envuelta en Suspense (Buenas prácticas de Next.js)
export default function MapaPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full w-full text-slate-400">
        <i className="icon-map text-4xl animate-pulse"></i>
      </div>
    }>
      <MapaContent />
    </Suspense>
  );
}