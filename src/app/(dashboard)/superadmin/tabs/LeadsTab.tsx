"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export default function LeadsTab() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const cargarLeads = async () => {
      const { data } = await supabase
        .from("leads_ventas")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (data) setLeads(data);
      setLoading(false);
    };

    cargarLeads();
  }, [supabase]);

  if (loading) return <div className="p-10 text-center font-bold text-slate-400 animate-pulse">Cargando prospectos...</div>;

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl border border-emerald-100">
              <i className="icon-user"></i>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leads Totales</p>
              <p className="text-2xl font-black text-slate-900 leading-none mt-1">{leads.length}</p>
            </div>
          </div>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4 text-2xl">
            <i className="icon-envelope"></i>
          </div>
          <h3 className="font-bold text-slate-700">No hay solicitudes nuevas</h3>
          <p className="text-sm text-slate-400">Las solicitudes de demo aparecerán aquí.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {leads.map(lead => (
            <div key={lead.id} className="bg-white border border-slate-200 p-6 rounded-3xl flex flex-col md:flex-row md:justify-between md:items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
              
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center text-xl flex-shrink-0 mt-1">
                   <i className="icon-building"></i>
                </div>
                <div>
                  <p className="text-[10px] font-black text-primario uppercase tracking-widest mb-1 bg-primario/10 w-fit px-2 py-0.5 rounded-md">
                    {lead.rol}
                  </p>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">{lead.nombre_completo}</h3>
                  <p className="text-sm text-slate-600 font-medium">{lead.institucion}</p>
                  
                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500 font-medium">
                     <a href={`mailto:${lead.correo}`} className="flex items-center gap-1 hover:text-primario transition-colors">
                       <i className="icon-envelope"></i> {lead.correo}
                     </a>
                     {lead.telefono && (
                       <a href={`https://wa.me/${lead.telefono.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-emerald-500 transition-colors">
                         <i className="icon-phone"></i> {lead.telefono}
                       </a>
                     )}
                  </div>
                </div>
              </div>

              <div className="text-left md:text-right border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Recibido el</p>
                <p className="text-sm font-bold text-slate-900">
                  {new Date(lead.created_at).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}
                </p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {new Date(lead.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}