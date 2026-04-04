"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export default function SoporteAppTab() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    cargarTicketsMaster();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarTicketsMaster = async () => {
    setLoading(true);
    // Traemos tickets para el developer, incluyendo info del usuario y del tenant
    const { data } = await supabase
      .from("tickets_mantenimiento")
      .select(`
        *,
        perfiles:usuario_id (nombre, apellido, correo),
        tenants:tenant_id (identidad)
      `)
      .eq("destinatario", "developer")
      .order("created_at", { ascending: false });

    if (data) setTickets(data);
    setLoading(false);
  };

  const actualizarEstado = async (ticketId: string, nuevoEstado: string) => {
    setProcesando(ticketId);
    try {
      const { error } = await supabase
        .from("tickets_mantenimiento")
        .update({ estado: nuevoEstado })
        .eq("id", ticketId);

      if (error) throw error;
      await cargarTicketsMaster();
    } catch (error) {
      alert("Error al actualizar el estado.");
    } finally {
      setProcesando(null);
    }
  };

  const getBadgeClase = (estado: string) => {
    switch (estado) {
      case 'pendiente': return "bg-slate-100 text-slate-600 border-slate-200";
      case 'en_revision': return "bg-amber-50 text-amber-600 border-amber-200";
      case 'resuelto': return "bg-emerald-50 text-emerald-600 border-emerald-200";
      default: return "bg-slate-50 text-slate-400";
    }
  };

  if (loading) return <div className="p-10 text-center font-bold text-slate-400 animate-pulse">Escaneando reportes del sistema...</div>;

  return (
    <div className="space-y-6">
      
      <header className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-xl font-black text-slate-900">Soporte y Sugerencias de la App</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Feedback directo de los usuarios sobre la plataforma Nodum.</p>
        </div>
        <div className="bg-slate-900 text-white px-4 py-2 rounded-xl font-black text-xs border border-slate-800 shadow-sm">
           {tickets.length} Reportes Totales
        </div>
      </header>

      <div className="grid gap-4">
        {tickets.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm">
            <i className="icon-app-logo text-4xl text-slate-200 mb-4 block"></i>
            <p className="text-slate-500 font-bold">No hay mensajes de usuarios por ahora.</p>
          </div>
        ) : (
          tickets.map(ticket => (
            <div key={ticket.id} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all">
              
              <div className="flex flex-col md:flex-row justify-between gap-4">
                
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 mt-1 ${ticket.tipo === 'app_soporte' ? 'bg-primario/10 text-primario' : 'bg-amber-50 text-amber-500'}`}>
                    <i className={ticket.tipo === 'app_soporte' ? 'icon-laptop' : 'icon-star'}></i>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        {ticket.tenants?.identidad?.organizacion || 'Sistema'}
                      </span>
                      <h3 className="font-bold text-slate-900 text-lg">{ticket.titulo}</h3>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${getBadgeClase(ticket.estado)}`}>
                        {ticket.estado.replace("_", " ")}
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 font-medium leading-relaxed mt-2 italic">
                      "{ticket.descripcion}"
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span className="flex items-center gap-1"><i className="icon-user"></i> {ticket.perfiles?.nombre || 'Usuario'}</span>
                      <span className="flex items-center gap-1"><i className="icon-envelope"></i> {ticket.perfiles?.correo || 'Sin correo'}</span>
                      <span>•</span>
                      <span>{new Date(ticket.created_at).toLocaleString('es-MX')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex md:flex-col gap-2 flex-shrink-0">
                  {ticket.estado !== 'resuelto' && (
                    <button 
                      onClick={() => actualizarEstado(ticket.id, 'resuelto')}
                      disabled={procesando === ticket.id}
                      className="flex-1 py-2 px-4 bg-emerald-600 text-white font-black rounded-xl text-[10px] uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-md active:scale-95 disabled:opacity-50"
                    >
                      {procesando === ticket.id ? '...' : 'Marcar Resuelto'}
                    </button>
                  )}
                  {ticket.estado === 'pendiente' && (
                    <button 
                      onClick={() => actualizarEstado(ticket.id, 'en_revision')}
                      disabled={procesando === ticket.id}
                      className="flex-1 py-2 px-4 bg-slate-100 text-slate-600 font-black rounded-xl text-[10px] uppercase tracking-wider hover:bg-slate-200 transition-colors active:scale-95 disabled:opacity-50"
                    >
                      En Revisión
                    </button>
                  )}
                </div>

              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}