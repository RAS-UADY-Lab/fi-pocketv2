"use client";
import { motion, AnimatePresence } from "framer-motion";
import { infoEdificios } from "@/data/edificios";

interface InfoPanelProps {
  idSeleccionado: string | null;
  onClose: () => void;
}

export default function InfoPanel({ idSeleccionado, onClose }: InfoPanelProps) {
  const info = idSeleccionado ? infoEdificios[idSeleccionado] : null;

  return (
    <AnimatePresence>
      {info && (
        <motion.aside
          initial={{ y: "100%", opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          // Clases combinadas: absolute/bottom para móvil, relative/side para PC
          className="absolute inset-x-0 bottom-0 z-50 h-[55dvh] bg-white rounded-t-3xl shadow-[0_-20px_40px_rgba(0,0,0,0.1)] p-6 
                     md:relative md:h-full md:w-96 md:rounded-2xl md:border md:border-slate-200 md:shadow-sm flex flex-col"
        >
          {/* Barrita de arrastre solo para móvil */}
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 md:hidden flex-shrink-0" />
          
          {/* Cabecera del Panel */}
          <div className="flex justify-between items-start flex-shrink-0 border-b border-slate-100 pb-4 mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <i className="icon-location-pin text-blue-600"></i> {/* Tu ícono de IcoMoon */}
                {info.nombre}
              </h2>
              <p className="text-slate-500 font-medium text-sm mt-1">{info.tipo}</p>
            </div>
            
            <button 
              onClick={onClose} 
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
            >
              <i className="icon-xmark"></i> {/* Tu ícono de IcoMoon */}
            </button>
          </div>

          {/* Contenido con Scroll Interno */}
          <div className="flex-1 overflow-y-auto no-scrollbar pr-2">
            {info.plantas.map((planta: any, idx: number) => (
              <div key={idx} className="mb-6 last:mb-0">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                  {planta.nivel}
                </h3>
                <ul className="grid grid-cols-1 gap-2">
                  {planta.ubicaciones.map((loc: string, i: number) => (
                    <li key={i} className="bg-slate-50 p-3 rounded-xl text-slate-700 font-medium border border-slate-100/50">
                      {loc}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}