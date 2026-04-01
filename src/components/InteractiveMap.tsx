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
    <div className="w-full h-[60dvh] md:h-full border-2 border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm flex flex-1">
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        centerOnInit={true}
        wheel={{ step: 0.1 }}
      >
        <TransformComponent 
          wrapperStyle={{ width: "100%", height: "100%" }} 
          contentStyle={{ width: "100%", height: "100%" }}
        >
          <MapaSvg 
            edificioActivo={edificioActivo} 
            onEdificioClick={handleEdificioClick} 
          />
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}