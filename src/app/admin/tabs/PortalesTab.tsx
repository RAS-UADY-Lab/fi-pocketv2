"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useTenant } from "@/context/TenantContext";

export default function PortalesTab() {
  const { portales, recargarConfiguracion, tenantId } = useTenant();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [portalEditando, setPortalEditando] = useState<any>(null);

  const abrirModal = () => {
    setPortalEditando({ 
      id: "portal_" + Date.now(), nombre: "", descripcion: "", url: "", icono: "icon-laptop", 
      estilos: { fondo: "bg-slate-800", texto: "text-slate-200", boton: "text-slate-900" } 
    });
  };

  const guardarPortal = async () => {
    setLoading(true);
    let nuevos = [...portales];
    const index = nuevos.findIndex(p => p.id === portalEditando.id);
    if (index >= 0) nuevos[index] = portalEditando;
    else nuevos.push(portalEditando);

    const { error } = await supabase.from("tenants").update({ portales: nuevos }).eq("id", tenantId);
    if (!error) {
      await recargarConfiguracion();
      setPortalEditando(null);
    }
    setLoading(false);
  };

  const eliminarPortal = async (id: string) => {
    if(!confirm("¿Borrar portal?")) return;
    setLoading(true);
    const nuevos = portales.filter((p: any) => p.id !== id);
    await supabase.from("tenants").update({ portales: nuevos }).eq("id", tenantId);
    await recargarConfiguracion();
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-slate-900">Accesos a Portales</h2>
        {/* CORRECCIÓN: Botón principal */}
        <button onClick={abrirModal} className="cursor-pointer bg-gradient-to-t from-secundario to-primario text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase hover:opacity-90 active:scale-95 transition-all shadow-md">
          + Agregar Portal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {portales.map((portal: any) => (
          <div key={portal.id} className={`${portal.estilos?.fondo || 'bg-slate-800'} rounded-2xl p-6 text-white relative group transition-transform hover:scale-[1.02]`}>
            {/* CORRECCIÓN: Botón de eliminar con transición suave en el hover del grupo */}
            <button onClick={() => eliminarPortal(portal.id)} className="cursor-pointer absolute top-4 right-4 bg-red-500/20 text-red-100 hover:bg-red-500 w-8 h-8 rounded-full flex justify-center items-center transition-colors opacity-0 group-hover:opacity-100"><i className="icon-trash"></i></button>
            <h3 className="font-bold text-xl mb-1">{portal.nombre}</h3>
            <p className="text-xs opacity-80 mb-3">{portal.descripcion}</p>
            <span className="text-[10px] font-mono bg-black/20 px-2.5 py-1 rounded-md">{portal.url}</span>
          </div>
        ))}
      </div>

      {portalEditando && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-6 md:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            {/* CORRECCIÓN: Botón de cerrar estandarizado */}
            <button onClick={() => setPortalEditando(null)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"><i className="icon-close font-bold">x</i></button>
            <h3 className="font-black text-xl mb-6">Configurar Portal</h3>
            
            <div className="space-y-4">
              {/* CORRECCIÓN: Anillos de enfoque agregados */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
                <input placeholder="Ej. SICEI" className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 focus:ring-2 focus:ring-primario/20 transition-all font-bold" value={portalEditando.nombre} onChange={e => setPortalEditando({...portalEditando, nombre: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción</label>
                <input placeholder="Breve descripción del portal" className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 focus:ring-2 focus:ring-primario/20 transition-all" value={portalEditando.descripcion} onChange={e => setPortalEditando({...portalEditando, descripcion: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Enlace Web (URL)</label>
                <input placeholder="https://..." className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 focus:ring-2 focus:ring-primario/20 transition-all text-sm" value={portalEditando.url} onChange={e => setPortalEditando({...portalEditando, url: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Color Fondo</label>
                  <input placeholder="Ej. bg-primario" className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 focus:ring-2 focus:ring-primario/20 transition-all text-sm font-mono" value={portalEditando.estilos.fondo} onChange={e => setPortalEditando({...portalEditando, estilos: {...portalEditando.estilos, fondo: e.target.value}})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Color Botón</label>
                  <input placeholder="Ej. text-primario" className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 focus:ring-2 focus:ring-primario/20 transition-all text-sm font-mono" value={portalEditando.estilos.boton} onChange={e => setPortalEditando({...portalEditando, estilos: {...portalEditando.estilos, boton: e.target.value}})} />
                </div>
              </div>
            </div>
            
            {/* CORRECCIÓN: Botón principal */}
            <button onClick={guardarPortal} disabled={loading || !portalEditando.nombre} className="cursor-pointer w-full mt-8 py-4 bg-gradient-to-t from-secundario to-primario text-white font-black rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all shadow-md disabled:opacity-50">
              {loading ? "Guardando..." : "Guardar Portal"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}