"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useTenant } from "@/context/TenantContext";

export default function PendientesTab() {
  const { tenantId } = useTenant();
  const supabase = createClient();
  const [pendientes, setPendientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarPendientes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("perfiles")
      .select("*")
      .eq("membresia_estatus", "pendiente")
      .eq("tenant_id", tenantId)
      .order("nombre", { ascending: true });
    
    if (data) setPendientes(data);
    setLoading(false);
  };

  useEffect(() => {
    cargarPendientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actualizarUsuario = async (id: string, membresia_estatus: string, ieee_numero: string = "") => {
    setLoading(true);
    await supabase.from("perfiles").update({ membresia_estatus, ieee_numero }).eq("id", id);
    await cargarPendientes();
  };

  if (loading && pendientes.length === 0) return <div className="py-12 text-center animate-pulse text-slate-400 font-bold">Cargando solicitudes...</div>;

  return (
    <div className="grid grid-cols-1 gap-4">
      {pendientes.length > 0 ? pendientes.map((u) => (
        <div key={u.id} className="bg-white border border-slate-200 hover:border-primario/30 rounded-[2rem] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm transition-colors">
          <div className="flex-1">
            <h3 className="font-black text-slate-900 text-lg">{u.nombre} {u.apellido}</h3>
            <p className="text-xs text-primario font-bold mb-3 flex items-center gap-1.5">
              <i className="icon-envelope"></i> {u.correo_institucional}
            </p>
            <div className="flex gap-4">
              <div className="text-[10px] font-bold text-slate-400">ID IEEE: <span className="text-slate-900">{u.ieee_numero || "N/A"}</span></div>
              <div className="text-[10px] font-bold text-slate-400">GRUPOS: 
                <span className="ml-1 text-slate-900">
                  {[u.es_miembro_ieee && "IEEE", u.es_miembro_ras && "RAS", u.es_miembro_wie && "WIE"].filter(Boolean).join(", ") || "Ninguno"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => actualizarUsuario(u.id, "verificada", u.ieee_numero)} 
              disabled={loading}
              className="cursor-pointer flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-emerald-500 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
            >
              <i className="icon-check text-sm"></i> Aprobar
            </button>
            <button 
              onClick={() => actualizarUsuario(u.id, "inactiva", "")} 
              disabled={loading}
              className="cursor-pointer flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-red-50 text-red-600 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-red-100 transition-all active:scale-95 disabled:opacity-50"
            >
              <i className="icon-close text-sm"></i> Rechazar
            </button>
          </div>
        </div>
      )) : (
        <div className="text-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] text-slate-400 font-bold">
          No hay solicitudes nuevas.
        </div>
      )}
    </div>
  );
}