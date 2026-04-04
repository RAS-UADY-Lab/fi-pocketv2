"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useTenant } from "@/context/TenantContext";

const LISTA_ICONOS = [
  "icon-map", "icon-directory", "icon-laptop", "icon-archive", 
  "icon-store-solid-full", "icon-user", "icon-calendar", 
  "icon-book", "icon-globe", "icon-link" // Puedes añadir más de tu icomoon
];

export default function AccesosRapidosTab() {
  const { identidad, tenantId, recargarConfiguracion } = useTenant();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  
  // Clonamos el estado local para trabajar antes de guardar
  const [accesos, setAccesos] = useState<any[]>(identidad.accesos_rapidos || []);
  
  // Modal de edición
  const [modalAbierto, setModalAbierto] = useState(false);
  const [accesoEditando, setAccesoEditando] = useState<any>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const abrirModal = (index?: number) => {
    if (index !== undefined) {
      setAccesoEditando({ ...accesos[index] });
      setEditIndex(index);
    } else {
      setAccesoEditando({ titulo: "", ruta: "", icono: "icon-link", externo: false });
      setEditIndex(null);
    }
    setModalAbierto(true);
  };

  const guardarAccesoLocal = () => {
    const nuevos = [...accesos];
    if (editIndex !== null) {
      nuevos[editIndex] = accesoEditando;
    } else {
      nuevos.push(accesoEditando);
    }
    setAccesos(nuevos);
    setModalAbierto(false);
  };

  const eliminarAccesoLocal = (index: number) => {
    const nuevos = [...accesos];
    nuevos.splice(index, 1);
    setAccesos(nuevos);
  };

  const subirACambios = async () => {
    setLoading(true);
    
    // Construimos la nueva "identidad" combinando lo viejo con los nuevos accesos
    const nuevaIdentidad = {
      ...identidad,
      accesos_rapidos: accesos
    };

    const { error } = await supabase
      .from("tenants")
      .update({ identidad: nuevaIdentidad })
      .eq("id", tenantId);

    if (!error) {
      await recargarConfiguracion();
      alert("Accesos rápidos actualizados correctamente.");
    } else {
      alert("Error al guardar: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-xl font-black text-slate-900">Accesos Rápidos del Inicio</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Personaliza los botones principales de la pantalla de inicio. Puedes enlazar a herramientas internas o plataformas externas.
          </p>
        </div>
        <button 
          onClick={() => abrirModal()} 
          className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase hover:bg-slate-800 transition-colors shadow-md flex-shrink-0"
        >
          + Agregar Enlace
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accesos.map((acceso, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between group hover:border-slate-300 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                <i className={acceso.icono}></i>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm leading-tight">{acceso.titulo}</h3>
                <p className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">
                  {acceso.ruta}
                </p>
              </div>
            </div>
            
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={() => abrirModal(idx)} className="w-8 h-8 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 flex items-center justify-center transition-colors">
                 <i className="icon-info text-xs"></i>
               </button>
               <button onClick={() => eliminarAccesoLocal(idx)} className="w-8 h-8 rounded-full text-red-400 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors">
                 <i className="icon-trash text-xs"></i>
               </button>
            </div>
          </div>
        ))}

        {accesos.length === 0 && (
          <div className="col-span-full text-center py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-bold text-sm">
            No hay accesos configurados. Los estudiantes no verán esta sección.
          </div>
        )}
      </div>

      {accesos !== identidad.accesos_rapidos && (
         <button 
           onClick={subirACambios} 
           disabled={loading} 
           className="w-full py-4 bg-gradient-to-t from-secundario to-primario text-white font-black rounded-2xl hover:opacity-90 transition-all shadow-lg disabled:opacity-50 mt-6"
         >
           {loading ? "Guardando en el servidor..." : "Guardar todos los cambios"}
         </button>
      )}

      {/* Modal de Edición */}
      {modalAbierto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button onClick={() => setModalAbierto(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold">X</button>
            <h3 className="font-black text-xl mb-4">{editIndex !== null ? 'Editar Enlace' : 'Nuevo Enlace'}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400">Título Corto</label>
                <input 
                  placeholder="Ej. SICEI o Mapa" 
                  className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 font-bold text-slate-800" 
                  value={accesoEditando.titulo} 
                  onChange={e => setAccesoEditando({...accesoEditando, titulo: e.target.value})} 
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 mb-2 block">Selecciona un Ícono</label>
                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                  {LISTA_ICONOS.map(iconClass => (
                    <button 
                      key={iconClass}
                      onClick={() => setAccesoEditando({...accesoEditando, icono: iconClass})}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 border transition-colors ${
                        accesoEditando.icono === iconClass ? "bg-slate-900 border-slate-900 text-white" : "bg-white text-slate-500 border-slate-200"
                      }`}
                    >
                      <i className={iconClass}></i>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400">Ruta (URL) de destino</label>
                <input 
                  placeholder="Ej. /mapa o https://sicei.uady.mx" 
                  className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 font-mono text-xs text-slate-800" 
                  value={accesoEditando.ruta} 
                  onChange={e => setAccesoEditando({...accesoEditando, ruta: e.target.value})} 
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl mt-2">
                <input 
                  type="checkbox" 
                  id="chkExterno"
                  checked={accesoEditando.externo}
                  onChange={e => setAccesoEditando({...accesoEditando, externo: e.target.checked})}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <label htmlFor="chkExterno" className="text-xs font-bold text-blue-800 cursor-pointer">
                  Este es un enlace externo (Se abrirá en otra pestaña)
                </label>
              </div>

            </div>
            
            <button onClick={guardarAccesoLocal} disabled={!accesoEditando.titulo || !accesoEditando.ruta} className="w-full mt-6 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50">
              Añadir a la lista
            </button>
          </div>
        </div>
      )}
    </div>
  );
}