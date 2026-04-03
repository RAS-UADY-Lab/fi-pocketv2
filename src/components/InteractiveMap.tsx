"use client";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import MapaSvg from "./MapaSvg";

// Ahora recibe el estado desde la página principal
interface InteractiveMapProps {
  edificioActivo: string | null;
  setEdificioActivo: (id: string | null) => void;
}

export default function InteractiveMap({ edificioActivo, setEdificioActivo }: InteractiveMapProps) {
  
  const handleEdificioClick = (id: string) => {
    setEdificioActivo(edificioActivo === id ? null : id);
  };

  return (
    <div className="w-full h-[60dvh] md:h-full border border-slate-200 rounded-[2rem] overflow-hidden bg-slate-50 shadow-sm flex flex-1 relative">
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        centerOnInit={true}
        wheel={{ step: 0.1 }}
      >
        {/* Usamos el render prop para extraer las funciones de control del mapa */}
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Controles Flotantes Premium */}
            <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2">
              <button 
                onClick={() => zoomIn()} 
                className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-slate-200 flex items-center justify-center text-slate-600 hover:text-primario hover:border-primario/30 active:scale-95 transition-all cursor-pointer"
                title="Acercar"
              >
                <i className="icon-plus-solid-full"></i>
              </button>
              <button 
                onClick={() => zoomOut()} 
                className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-slate-200 flex items-center justify-center text-slate-600 hover:text-primario hover:border-primario/30 active:scale-95 transition-all cursor-pointer"
                title="Alejar"
              >
                <i className="icon-minus-solid-full font-bold"></i>
              </button>
              <button 
                onClick={() => resetTransform()} 
                className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-slate-200 flex items-center justify-center text-slate-600 hover:text-primario hover:border-primario/30 active:scale-95 transition-all cursor-pointer mt-2"
                title="Centrar Mapa"
              >
                <i className="icon-eye text-lg"></i>
              </button>
            </div>

            <TransformComponent 
              wrapperStyle={{ width: "100%", height: "100%" }} 
              contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <MapaSvg 
                edificioActivo={edificioActivo} 
                onEdificioClick={handleEdificioClick} 
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}