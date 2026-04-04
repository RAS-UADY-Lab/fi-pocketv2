"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useTenant } from "@/context/TenantContext";

export default function MantenimientoTab() {
  const supabase = createClient();
  const { tenantId } = useTenant();
  
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<string>("pendientes");
  const [procesando, setProcesando] = useState<string | null>(null);

  useEffect(() => {
    cargarTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarTickets = async () => {
    setLoading(true);
    // Solo cargamos los que son para el administrador de esta escuela
    const { data } = await supabase
      .from("tickets_mantenimiento")
      .select(`
        *,
        perfiles:usuario_id (nombre, apellido, carrera)
      `)
      .eq("tenant_id", tenantId)
      .eq("destinatario", "admin")
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
      await cargarTickets();
    } catch (error) {
      alert("Error al actualizar el estado del reporte.");
    } finally {
      setProcesando(null);
    }
  };

  const enviarPorWhatsApp = (ticket: any) => {
    const ubicacion = ticket.ubicacion ? `📍 *Ubicación:* ${ticket.ubicacion}\n` : '';
    const alumno = ticket.perfiles?.nombre ? `👤 *Reporta:* ${ticket.perfiles.nombre} ${ticket.perfiles.apellido}\n` : '';
    
    const mensaje = `🚨 *NUEVO REPORTE DE MANTENIMIENTO*\n\n` +
      `*Asunto:* ${ticket.titulo}\n` +
      ubicacion +
      alumno +
      `📝 *Detalles:* ${ticket.descripcion}\n\n` +
      `_Enviado desde Nodum_`;

    // Abre WhatsApp Web o la App nativa para seleccionar al contacto (el intendente)
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const imprimirReportes = () => {
    window.print();
  };

  // Lógica de filtrado
  const ticketsFiltrados = tickets.filter(t => {
    if (filtroEstado === "pendientes") return t.estado === "pendiente" || t.estado === "en_revision";
    if (filtroEstado === "resueltos") return t.estado === "resuelto";
    return true; // Todos
  });

  if (loading) return <div className="p-10 text-center font-bold text-slate-400 animate-pulse">Cargando reportes de campus...</div>;

  return (
    <div className="space-y-6">
      
      {/* ✨ SECCIÓN QUE SE OCULTA AL IMPRIMIR (print:hidden) */}
      <div className="print:hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">Reportes de Infraestructura</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Gestiona las fallas físicas reportadas por los estudiantes.
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={imprimirReportes}
              className="flex-1 md:flex-none bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-colors shadow-md flex items-center justify-center gap-2 active:scale-95"
            >
              <i className="icon-document"></i> Generar PDF / Imprimir
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6 bg-slate-100 p-1.5 rounded-2xl w-fit">
          <button 
            onClick={() => setFiltroEstado("pendientes")} 
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${filtroEstado === "pendientes" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Activos
          </button>
          <button 
            onClick={() => setFiltroEstado("resueltos")} 
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${filtroEstado === "resueltos" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Resueltos
          </button>
          <button 
            onClick={() => setFiltroEstado("todos")} 
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${filtroEstado === "todos" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Historial Completo
          </button>
        </div>
      </div>

      {/* ✨ ENCABEZADO EXCLUSIVO PARA IMPRESIÓN (hidden print:block) */}
      <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-4">
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Hoja de Ruta - Mantenimiento</h1>
        <p className="text-slate-500 font-bold mt-1">Generado el: {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="grid gap-4 print:gap-6">
        {ticketsFiltrados.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] print:hidden">
            <i className="icon-check-solid-full text-4xl text-slate-300 mb-3 block"></i>
            <p className="text-sm font-bold text-slate-500">No hay reportes en esta categoría.</p>
          </div>
        ) : (
          ticketsFiltrados.map(ticket => (
            <div key={ticket.id} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col md:flex-row gap-6 justify-between print:border-2 print:border-slate-800 print:shadow-none print:break-inside-avoid">
              
              {/* Información del Ticket */}
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl flex-shrink-0 mt-1 border border-blue-100 print:hidden">
                  <i className="icon-building"></i>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 text-lg leading-tight">{ticket.titulo}</h3>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border print:border-slate-400 print:text-slate-800 ${
                      ticket.estado === 'pendiente' ? "bg-slate-100 text-slate-600 border-slate-200" :
                      ticket.estado === 'en_revision' ? "bg-amber-100 text-amber-700 border-amber-200" :
                      ticket.estado === 'resuelto' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                      "bg-red-100 text-red-700 border-red-200"
                    }`}>
                      {ticket.estado.replace("_", " ")}
                    </span>
                  </div>
                  
                  {ticket.ubicacion && (
                    <p className="text-xs font-black text-slate-500 mt-1 flex items-center gap-1 bg-slate-50 w-fit px-2 py-1 rounded-md print:bg-transparent print:px-0">
                      <i className="icon-location-pin text-blue-500"></i> Ubicación: {ticket.ubicacion}
                    </p>
                  )}
                  
                  <p className="text-sm text-slate-700 font-medium mt-3 leading-relaxed max-w-xl">
                    "{ticket.descripcion}"
                  </p>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Reportado por: <span className="text-slate-600">{ticket.perfiles?.nombre || 'Estudiante'} {ticket.perfiles?.apellido || ''}</span></span>
                    <span>•</span>
                    <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* ✨ ACCIONES (Ocultas al imprimir) */}
              <div className="flex flex-row md:flex-col gap-2 flex-shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 print:hidden">
                
                {/* Botón WhatsApp */}
                <button 
                  onClick={() => enviarPorWhatsApp(ticket)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 py-2 px-4 bg-emerald-50 text-emerald-600 font-black rounded-xl text-[10px] uppercase tracking-wider hover:bg-emerald-100 transition-colors border border-emerald-200 active:scale-95"
                >
                  <i className="icon-phone text-sm"></i> WhatsApp
                </button>

                {/* Acciones de Estado */}
                {ticket.estado === 'pendiente' && (
                  <button 
                    onClick={() => actualizarEstado(ticket.id, 'en_revision')}
                    disabled={procesando === ticket.id}
                    className="flex-1 md:flex-none py-2 px-4 bg-amber-50 text-amber-600 font-black rounded-xl text-[10px] uppercase tracking-wider hover:bg-amber-100 transition-colors border border-amber-200 active:scale-95 disabled:opacity-50"
                  >
                    Marcar en Revisión
                  </button>
                )}

                {(ticket.estado === 'pendiente' || ticket.estado === 'en_revision') && (
                  <button 
                    onClick={() => actualizarEstado(ticket.id, 'resuelto')}
                    disabled={procesando === ticket.id}
                    className="flex-1 md:flex-none py-2 px-4 bg-slate-900 text-white font-black rounded-xl text-[10px] uppercase tracking-wider hover:bg-slate-800 transition-colors shadow-md active:scale-95 disabled:opacity-50 mt-auto"
                  >
                    Marcar Resuelto
                  </button>
                )}
                
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}