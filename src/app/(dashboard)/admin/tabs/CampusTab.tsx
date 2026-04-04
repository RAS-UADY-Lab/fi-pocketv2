"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useTenant } from "@/context/TenantContext";

export default function CampusTab() {
  const { edificios, recargarConfiguracion, tenantId } = useTenant();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [edificioEditando, setEdificioEditando] = useState<any>(null);

  const abrirModalEdificio = (edificio?: any) => {
    if (edificio) {
      const formated = {
        ...edificio,
        plantas: edificio.plantas?.map((p: any) => ({
          ...p, ubicacionesInput: p.ubicaciones.join(", ") 
        })) || []
      };
      setEdificioEditando(formated);
    } else {
      setEdificioEditando({ id: "", nombre: "", tipo: "Aulas", plantas: [] });
    }
  };

  const agregarPlanta = () => {
    setEdificioEditando({...edificioEditando, plantas: [...edificioEditando.plantas, { nivel: "Nueva Planta", ubicacionesInput: "" }]});
  };

  const guardarEdificio = async () => {
    setLoading(true);
    try {
      const final = {
        ...edificioEditando,
        plantas: edificioEditando.plantas.map((p: any) => ({
          nivel: p.nivel, ubicaciones: p.ubicacionesInput.split(",").map((u: string) => u.trim()).filter(Boolean)
        }))
      };
      let nuevos = [...edificios];
      const index = nuevos.findIndex(e => e.id === final.id);
      if (index >= 0) nuevos[index] = final; else nuevos.push(final);

      await supabase.from("tenants").update({ edificios: nuevos }).eq("id", tenantId);
      await recargarConfiguracion();
      setEdificioEditando(null);
    } catch (error) { alert("Error al guardar."); }
    finally { setLoading(false); }
  };

  const eliminarEdificio = async (id: string) => {
    if (!confirm("¿Eliminar edificio del mapa?")) return;
    setLoading(true);
    const nuevos = edificios.filter(e => e.id !== id);
    await supabase.from("tenants").update({ edificios: nuevos }).eq("id", tenantId);
    await recargarConfiguracion();
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-900">Edificios y Aulas</h2>
          <p className="text-xs text-slate-500 font-medium">Controla el Mapa y el Directorio.</p>
        </div>
        <button onClick={() => abrirModalEdificio()} className="cursor-pointer bg-gradient-to-t from-secundario to-primario text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-md active:scale-95">
          <i className="icon-plus mr-1"></i> Nuevo Edificio
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {edificios.map((edificio) => (
          <div key={edificio.id} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-4 flex gap-2 translate-x-full opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all">
              {/* CORRECCIÓN: Fondo con opacidad para el icono primario */}
              <button onClick={() => abrirModalEdificio(edificio)} className="w-8 h-8 bg-primario/10 text-primario rounded-full flex items-center justify-center hover:bg-primario/20 cursor-pointer transition-colors"><i className="icon-left-arrow rotate-180 text-xs"></i></button>
              <button onClick={() => eliminarEdificio(edificio.id)} className="w-8 h-8 bg-red-50 text-red-600 rounded-full flex items-center justify-center hover:bg-red-100 cursor-pointer transition-colors"><i className="icon-trash text-xs"></i></button>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 text-2xl"><i className="icon-location-pin"></i></div>
              <div>
                <h3 className="font-black text-lg text-slate-900">{edificio.nombre}</h3>
                <p className="text-xs text-slate-500 font-bold">ID Mapa: <span className="text-primario">{edificio.id}</span></p>
              </div>
            </div>
            <div className="space-y-3">
              {edificio.plantas?.map((planta: any, idx: number) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{planta.nivel}</p>
                  <p className="text-xs text-slate-700 font-medium truncate">{planta.ubicaciones?.length || 0} ubicaciones registradas</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {edificioEditando && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-6 md:p-8 shadow-2xl relative my-8 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <button onClick={() => setEdificioEditando(null)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer z-10"><i className="icon-close font-bold">x</i></button>
            <div className="mb-6 flex-shrink-0">
              <h3 className="text-xl font-black text-slate-900">{edificioEditando.id === "" ? "Nuevo Edificio" : "Editar Edificio"}</h3>
            </div>
            <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 flex-1 pb-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ID SVG *</label>
                  {/* CORRECCIÓN: Arreglado el typo focus:ring-primario0/20 */}
                  <input className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primario/20 transition-all" value={edificioEditando.id} onChange={(e) => setEdificioEditando({...edificioEditando, id: e.target.value})} disabled={edificioEditando.id !== "" && edificios.some(e => e.id === edificioEditando.id)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre *</label>
                  <input className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primario/20 transition-all" value={edificioEditando.nombre} onChange={(e) => setEdificioEditando({...edificioEditando, nombre: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo</label>
                <input className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primario/20 transition-all" value={edificioEditando.tipo} onChange={(e) => setEdificioEditando({...edificioEditando, tipo: e.target.value})} />
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Niveles / Plantas</label>
                  {/* CORRECCIÓN: Uso de opacidad en el botón de agregar nivel */}
                  <button onClick={agregarPlanta} className="text-xs font-bold text-primario bg-primario/10 px-3 py-1.5 rounded-lg hover:bg-primario/20 transition-colors cursor-pointer">+ Añadir Nivel</button>
                </div>
                <div className="space-y-4">
                  {edificioEditando.plantas.map((planta: any, pIdx: number) => (
                    <div key={pIdx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 relative">
                      <button onClick={() => { const n = [...edificioEditando.plantas]; n.splice(pIdx, 1); setEdificioEditando({...edificioEditando, plantas: n}); }} className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-slate-400 hover:text-red-500 cursor-pointer transition-colors"><i className="icon-close">x</i></button>
                      <input className="w-[80%] bg-transparent text-sm font-bold text-slate-800 outline-none mb-2 border-b border-slate-200 pb-1 focus:border-primario transition-colors" value={planta.nivel} onChange={(e) => { const n = [...edificioEditando.plantas]; n[pIdx].nivel = e.target.value; setEdificioEditando({...edificioEditando, plantas: n}); }} />
                      <textarea className="w-full p-2.5 bg-white border border-slate-100 rounded-xl text-xs font-medium outline-none resize-none focus:ring-2 focus:ring-primario/20 transition-all" rows={2} placeholder="Aulas separadas por comas" value={planta.ubicacionesInput} onChange={(e) => { const n = [...edificioEditando.plantas]; n[pIdx].ubicacionesInput = e.target.value; setEdificioEditando({...edificioEditando, plantas: n}); }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="pt-4 flex-shrink-0">
              {/* CORRECCIÓN: Botón principal de guardar con degradado */}
              <button onClick={guardarEdificio} disabled={loading || !edificioEditando.id || !edificioEditando.nombre} className="w-full py-4 bg-gradient-to-t from-secundario to-primario text-white font-black rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all shadow-md cursor-pointer disabled:opacity-50">Guardar Edificio</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}