"use client";

import { motion, AnimatePresence } from "framer-motion";

interface InfoPanelProps {
  info: any | null; 
  onClose: () => void;
}

export default function InfoPanel({ info, onClose }: InfoPanelProps) {
  return (
    <AnimatePresence>
      {info && (
        <motion.aside
          initial={{ y: "100%", opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="absolute inset-x-0 bottom-0 z-50 h-[55dvh] bg-white rounded-t-[2.5rem] shadow-[0_-20px_40px_rgba(0,0,0,0.1)] p-6 md:relative md:h-full md:w-96 md:rounded-[2rem] md:border md:border-slate-200 md:shadow-sm flex flex-col"
        >
          {/* Handle de arrastre para móviles */}
          
          
          <div className="flex justify-between items-start flex-shrink-0 border-b border-slate-100 pb-5 mb-5">
            <div className="flex items-center gap-3">
              {/* CORRECCIÓN: Contenedor con opacidad para el ícono principal */}
              <div className="w-12 h-12 rounded-xl bg-primario/10 text-primario flex items-center justify-center text-2xl flex-shrink-0">
                <i className="icon-location-pin"></i>
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 leading-tight">
                  {info.nombre}
                </h2>
                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">
                  {info.tipo}
                </p>
              </div>
            </div>
            
            <button 
              onClick={onClose} 
              className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors active:scale-95 flex-shrink-0"
            >
              <i className="icon-close font-bold"></i>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar pr-2">
            {info.plantas?.map((planta: any, idx: number) => (
              <div key={idx} className="mb-6 last:mb-0">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  {planta.nivel}
                </h3>
                <ul className="grid grid-cols-1 gap-2">
                  {planta.ubicaciones.map((loc: string, i: number) => (
                    <li 
                      key={i} 
                      /* CORRECCIÓN: Sutil hover premium en los elementos de la lista */
                      className="bg-slate-50 p-3.5 rounded-xl text-slate-700 font-bold border border-slate-100 hover:border-primario/20 hover:bg-white hover:shadow-sm transition-all"
                    >
                      {loc}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            
            {(!info.plantas || info.plantas.length === 0) && (
              <div className="text-center py-10">
                <i className="icon-info text-3xl text-slate-300 mb-2"></i>
                <p className="text-sm font-bold text-slate-500">Sin ubicaciones registradas.</p>
              </div>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}