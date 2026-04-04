"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useTenant } from "@/context/TenantContext";

export default function ComunidadesTab() {
  const { comunidades, recargarConfiguracion, tenantId } = useTenant();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [comunidadEditando, setComunidadEditando] = useState<any>(null);
  const [comunidadAEliminar, setComunidadAEliminar] = useState<string | null>(null);

  const abrirModal = (com?: any) => {
    if (com) setComunidadEditando({ ...com, plataformas: { facebook: "", instagram: "", tiktok: "", sitio: "", ...com.plataformas } });
    // Usamos los colores por defecto de Nodum si es nueva
    else setComunidadEditando({ nombre: "", handle: "", color: "#98002e", iconColor: "#61116a", plataformas: { facebook: "", instagram: "", tiktok: "", sitio: "" } });
  };

  const guardarComunidad = async () => {
    setLoading(true);
    let nuevas = [...comunidades];
    
    const plataformasLimpias = Object.fromEntries(Object.entries(comunidadEditando.plataformas).filter(([_, v]) => v !== ""));
    const comunidadFinal = { ...comunidadEditando, plataformas: plataformasLimpias };

    const index = nuevas.findIndex(c => c.nombre === comunidadFinal.nombre);
    if (index >= 0) nuevas[index] = comunidadFinal;
    else nuevas.push(comunidadFinal);

    const { error } = await supabase.from("tenants").update({ comunidades: nuevas }).eq("id", tenantId);
    if (!error) {
      await recargarConfiguracion();
      setComunidadEditando(null);
    }
    setLoading(false);
  };

  const ejecutarEliminar = async () => {
    if (!comunidadAEliminar) return;
    setLoading(true);
    try {
      const nuevas = comunidades.filter(c => c.nombre !== comunidadAEliminar);
      await supabase.from("tenants").update({ comunidades: nuevas }).eq("id", tenantId);
      await recargarConfiguracion();
      setComunidadAEliminar(null);
    } catch (error) {
      alert("Error al eliminar la comunidad");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-slate-900">Comunidades Estudiantiles</h2>
        {/* CORRECCIÓN: Hover opacity y scale */}
        <button onClick={() => abrirModal()} className="cursor-pointer bg-gradient-to-t from-secundario to-primario text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase hover:opacity-90 active:scale-95 transition-all shadow-md">
          + Nueva Comunidad
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {comunidades.map((com, idx) => (
          <div key={idx} className="bg-white border rounded-2xl p-5 shadow-sm relative group" style={{ borderColor: com.color }}>
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* CORRECCIÓN: Colores dinámicos con opacidad */}
              <button onClick={() => abrirModal(com)} className="w-8 h-8 rounded-full bg-primario/10 text-primario flex items-center justify-center hover:bg-primario/20 cursor-pointer transition-colors">
                <i className="icon-left-arrow rotate-180 text-xs"></i>
              </button>
              <button onClick={() => setComunidadAEliminar(com.nombre)} className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 cursor-pointer transition-colors">
                <i className="icon-trash text-xs"></i>
              </button>
            </div>
            
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-3xl mb-3 border border-slate-100" style={{ color: com.iconColor }}>
              <i className="icon-user"></i>
            </div>
            <h3 className="font-bold text-slate-800 text-lg leading-tight">{com.nombre}</h3>
            <p className="text-xs text-slate-500">{com.handle}</p>
          </div>
        ))}
      </div>

      {comunidadEditando && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl relative my-8 animate-in zoom-in-95 duration-200">
            <button onClick={() => setComunidadEditando(null)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"><i className="icon-close font-bold">x</i></button>
            <h3 className="font-black text-xl mb-4">Configurar Comunidad</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400">Nombre Oficial</label>
                  <input placeholder="Ej. Capítulo RAS" className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 focus:ring-2 focus:ring-primario/20 transition-all" value={comunidadEditando.nombre} onChange={e => setComunidadEditando({...comunidadEditando, nombre: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400">Handle / Subtítulo</label>
                  <input placeholder="Ej. @rasuady" className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 focus:ring-2 focus:ring-primario/20 transition-all" value={comunidadEditando.handle} onChange={e => setComunidadEditando({...comunidadEditando, handle: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-100 py-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-2">Color del Borde</label>
                  <div className="flex items-center gap-3">
                    <input type="color" className="w-10 h-10 rounded cursor-pointer border-0 p-0" value={comunidadEditando.color || "#98002e"} onChange={e => setComunidadEditando({...comunidadEditando, color: e.target.value})} />
                    <span className="text-xs font-mono text-slate-500 uppercase">{comunidadEditando.color || "#98002e"}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-2">Color del Ícono</label>
                  <div className="flex items-center gap-3">
                    <input type="color" className="w-10 h-10 rounded cursor-pointer border-0 p-0" value={comunidadEditando.iconColor || "#61116a"} onChange={e => setComunidadEditando({...comunidadEditando, iconColor: e.target.value})} />
                    <span className="text-xs font-mono text-slate-500 uppercase">{comunidadEditando.iconColor || "#61116a"}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Redes Sociales (URLs)</p>
                <div className="space-y-2">
                  <input placeholder="Sitio Web (Ej. https://mi-sitio.com)" className="w-full p-3 bg-emerald-50 text-emerald-900 rounded-xl outline-none border border-emerald-100 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all" value={comunidadEditando.plataformas.sitio} onChange={e => setComunidadEditando({...comunidadEditando, plataformas: {...comunidadEditando.plataformas, sitio: e.target.value}})} />
                  {/* CORRECCIÓN: Facebook recuperó sus colores originales */}
                  <input placeholder="URL Facebook" className="w-full p-3 bg-blue-50 text-blue-900 rounded-xl outline-none border border-blue-100 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all" value={comunidadEditando.plataformas.facebook} onChange={e => setComunidadEditando({...comunidadEditando, plataformas: {...comunidadEditando.plataformas, facebook: e.target.value}})} />
                  <input placeholder="URL Instagram" className="w-full p-3 bg-pink-50 text-pink-900 rounded-xl outline-none border border-pink-100 text-sm focus:ring-2 focus:ring-pink-500/20 transition-all" value={comunidadEditando.plataformas.instagram} onChange={e => setComunidadEditando({...comunidadEditando, plataformas: {...comunidadEditando.plataformas, instagram: e.target.value}})} />
                  <input placeholder="URL TikTok" className="w-full p-3 bg-slate-100 text-slate-900 rounded-xl outline-none border border-slate-200 text-sm focus:ring-2 focus:ring-slate-500/20 transition-all" value={comunidadEditando.plataformas.tiktok} onChange={e => setComunidadEditando({...comunidadEditando, plataformas: {...comunidadEditando.plataformas, tiktok: e.target.value}})} />
                </div>
              </div>
            </div>
            
            <button onClick={guardarComunidad} disabled={loading || !comunidadEditando.nombre} className="cursor-pointer w-full mt-6 py-4 bg-gradient-to-t from-secundario to-primario text-white font-black rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-md disabled:opacity-50">
              {loading ? "Guardando..." : "Guardar Comunidad"}
            </button>
          </div>
        </div>
      )}

      {comunidadAEliminar && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-6 md:p-8 shadow-2xl relative text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl mb-4 bg-red-100 text-red-500">
              <i className="icon-trash"></i>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">¿Eliminar Comunidad?</h3>
            <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
              Estás a punto de borrar a <strong className="text-slate-700">{comunidadAEliminar}</strong> del listado en el inicio.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setComunidadAEliminar(null)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-2xl hover:bg-slate-200 transition-all cursor-pointer">Cancelar</button>
              <button onClick={ejecutarEliminar} disabled={loading} className="flex-1 font-bold py-3.5 rounded-2xl text-white transition-all shadow-lg cursor-pointer disabled:opacity-50 bg-red-500 shadow-red-200 hover:bg-red-600">
                {loading ? 'Borrando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}