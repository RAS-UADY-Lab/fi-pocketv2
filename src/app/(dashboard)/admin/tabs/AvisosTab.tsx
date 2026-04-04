"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useTenant } from "@/context/TenantContext";

const LISTA_ICONOS = [
  "icon-calendar", "icon-bell-solid-full", "icon-circle-info-solid-full", "icon-clock-rotate-left-solid-full", 
  "icon-app-logo", "icon-handshake-solid-full", "icon-store-solid-full", "icon-archive", 
  "icon-career-flag", "icon-directory", "icon-map", "icon-envelope", "icon-file-pdf", "icon-laptop", "icon-location-pin"
];

export default function AvisosTab() {
  const { avisos, recargarConfiguracion, tenantId } = useTenant();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [avisoEditando, setAvisoEditando] = useState<any>(null);
  const [avisoAEliminar, setAvisoAEliminar] = useState<string | null>(null);

  // ✨ NUEVOS ESTADOS PARA FECHAS
  const [expiracionTipo, setExpiracionTipo] = useState<"1d" | "1w" | "1m" | "custom" | "never">("1w");
  const [fechaCustom, setFechaCustom] = useState("");

  const abrirModal = (aviso?: any) => {
    if (aviso) {
      setAvisoEditando(aviso);
      setExpiracionTipo(aviso.mantener_activo ? "never" : "1w"); // Fallback visual simple para edición
    } else {
      setAvisoEditando({ 
        id: "aviso_" + Date.now(), 
        titulo: "", 
        descripcion: "", 
        icono: "icon-calendar",
        mantener_activo: false,
        fecha_creacion: new Date().toISOString(),
        fecha_expiracion: null
      });
      setExpiracionTipo("1w");
    }
  };

  const guardarAviso = async () => {
    setLoading(true);
    
    // ✨ LÓGICA DE CÁLCULO DE EXPIRACIÓN ANTES DE GUARDAR
    let exp = null;
    const mantenerActivo = avisoEditando.mantener_activo || expiracionTipo === "never";

    if (!mantenerActivo) {
      const fecha = new Date();
      if (expiracionTipo === "1d") fecha.setDate(fecha.getDate() + 1);
      if (expiracionTipo === "1w") fecha.setDate(fecha.getDate() + 7);
      if (expiracionTipo === "1m") fecha.setMonth(fecha.getMonth() + 1);
      
      if (expiracionTipo === "custom" && fechaCustom) {
        exp = new Date(fechaCustom).toISOString();
      } else if (expiracionTipo !== "custom") {
        exp = fecha.toISOString();
      } else {
        exp = avisoEditando.fecha_expiracion; // Fallback si olvidaron poner fecha custom
      }
    }

    const avisoFinal = {
      ...avisoEditando,
      mantener_activo: mantenerActivo,
      fecha_expiracion: exp,
      fecha_creacion: avisoEditando.fecha_creacion || new Date().toISOString()
    };

    let nuevos = [...avisos];
    const index = nuevos.findIndex(a => a.id === avisoFinal.id);
    if (index >= 0) nuevos[index] = avisoFinal;
    else nuevos.unshift(avisoFinal);

    const { error } = await supabase.from("tenants").update({ avisos: nuevos }).eq("id", tenantId);
    if (!error) {
      await recargarConfiguracion();
      setAvisoEditando(null);
    }
    setLoading(false);
  };

  const ejecutarEliminar = async () => {
    if (!avisoAEliminar) return;
    setLoading(true);
    try {
      const nuevos = avisos.filter(a => a.id !== avisoAEliminar);
      await supabase.from("tenants").update({ avisos: nuevos }).eq("id", tenantId);
      await recargarConfiguracion();
      setAvisoAEliminar(null);
    } catch (error) {
      alert("Error al eliminar el aviso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-slate-900">Avisos de Inicio</h2>
        <button onClick={() => abrirModal()} className="bg-gradient-to-t from-secundario to-primario text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer">
          + Publicar Aviso
        </button>
      </div>

      <div className="space-y-4">
        {avisos.length > 0 ? avisos.map((aviso) => (
          <div key={aviso.id} className="bg-white border border-slate-200 hover:border-primario/40 rounded-2xl p-5 shadow-sm flex items-start gap-4 relative pr-16 group transition-all">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => abrirModal(aviso)} className="w-8 h-8 rounded-full bg-primario/10 text-primario flex items-center justify-center hover:bg-primario/20 cursor-pointer transition-colors">
                <i className="icon-left-arrow rotate-180 text-xs"></i>
              </button>
              <button onClick={() => setAvisoAEliminar(aviso.id)} className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 cursor-pointer transition-colors">
                <i className="icon-trash text-xs"></i>
              </button>
            </div>

            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0 mt-1 text-xl">
              <i className={aviso.icono}></i>
            </div>
            <div className="w-full">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-bold text-slate-800">{aviso.titulo}</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-2 pr-6">{aviso.descripcion}</p>
              
              {/* ✨ ETIQUETAS INFORMATIVAS DE EXPIRACIÓN PARA EL ADMIN */}
              <div className="flex gap-2">
                <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-md">
                  Creado: {new Date(aviso.fecha_creacion || Date.now()).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                </span>
                {aviso.mantener_activo ? (
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md border border-emerald-100">Permanente</span>
                ) : aviso.fecha_expiracion ? (
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${new Date(aviso.fecha_expiracion) < new Date() ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                    Expira: {new Date(aviso.fecha_expiracion).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                  </span>
                ) : null}
              </div>

            </div>
          </div>
        )) : (
          <div className="text-center py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-bold text-sm">
            No hay avisos publicados en el inicio.
          </div>
        )}
      </div>

      {avisoEditando && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative my-8 animate-in zoom-in-95 duration-200">
            <button onClick={() => setAvisoEditando(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"><i className="icon-close font-bold">x</i></button>
            <h3 className="font-black text-xl mb-4">{avisoEditando.fecha_expiracion ? 'Editar Aviso' : 'Nuevo Aviso'}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400">Título del Aviso</label>
                <input placeholder="Ej. Inicio de Semestre" className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 font-bold text-slate-800 focus:ring-2 focus:ring-primario/20 transition-all" value={avisoEditando.titulo} onChange={e => setAvisoEditando({...avisoEditando, titulo: e.target.value})} />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 mb-2 block">Selecciona un Ícono</label>
                <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto custom-scrollbar p-2 border border-slate-100 rounded-xl bg-slate-50">
                  {LISTA_ICONOS.map(iconClass => (
                    <button 
                      key={iconClass}
                      onClick={() => setAvisoEditando({...avisoEditando, icono: iconClass})}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all cursor-pointer ${
                        avisoEditando.icono === iconClass ? "bg-gradient-to-t from-secundario to-primario text-white shadow-md" : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <i className={iconClass}></i>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400">Cuerpo del mensaje</label>
                <textarea placeholder="Escribe el mensaje..." className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 text-sm resize-none focus:ring-2 focus:ring-primario/20 transition-all" rows={3} value={avisoEditando.descripcion} onChange={e => setAvisoEditando({...avisoEditando, descripcion: e.target.value})} />
              </div>

              {/* ✨ SELECTOR DE TIEMPO INTEGRADO */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 mb-2 block">Tiempo de Visibilidad</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: '1d', label: '24 hrs' },
                    { id: '1w', label: '1 sem' },
                    { id: '1m', label: '1 mes' },
                    { id: 'custom', label: 'Elegir' },
                    { id: 'never', label: 'Fijo' },
                  ].map(tipo => (
                    <button
                      key={tipo.id}
                      onClick={() => setExpiracionTipo(tipo.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                        expiracionTipo === tipo.id 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {tipo.label}
                    </button>
                  ))}
                </div>
              </div>

              {expiracionTipo === "custom" && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <input 
                    type="datetime-local"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primario/20 transition-all"
                    onChange={e => setFechaCustom(e.target.value)}
                  />
                </div>
              )}

            </div>
            
            <button onClick={guardarAviso} disabled={loading || !avisoEditando.titulo || !avisoEditando.descripcion} className="w-full mt-6 py-4 bg-gradient-to-t from-secundario to-primario text-white font-black rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-md disabled:opacity-50 cursor-pointer">
              {loading ? "Publicando..." : "Publicar Aviso"}
            </button>
          </div>
        </div>
      )}

      {avisoAEliminar && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-6 md:p-8 shadow-2xl relative text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl mb-4 bg-red-100 text-red-500">
              <i className="icon-trash"></i>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">¿Eliminar Aviso?</h3>
            <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
              Este aviso se borrará de la pantalla principal de todos los estudiantes.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setAvisoAEliminar(null)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-2xl hover:bg-slate-200 transition-all cursor-pointer">Cancelar</button>
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