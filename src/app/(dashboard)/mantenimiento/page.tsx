"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useTenant } from "@/context/TenantContext";

export default function MantenimientoPage() {
  const supabase = createClient();
  const router = useRouter();
  // ✨ Extraemos loadingConfig del contexto
  const { tenantId, modulos, loadingConfig } = useTenant();

  const [usuario, setUsuario] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);

  // Estados del Formulario
  const [modalNuevo, setModalNuevo] = useState(false);
  const [tipoTicket, setTipoTicket] = useState<"infraestructura" | "app_soporte" | "app_sugerencia">("infraestructura");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [ubicacion, setUbicacion] = useState(""); // Exclusivo para infraestructura
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    // ✨ REGLA DE ORO: Esperamos a que la configuración termine de cargar
    if (loadingConfig) return;

    const verificarAcceso = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      // Si el módulo está apagado, lo sacamos de aquí
      if (modulos && !modulos.mantenimiento) {
        router.push("/");
        return;
      }
      setUsuario(session.user);
      cargarTickets(session.user.id);
    };

    verificarAcceso();
  }, [supabase, router, modulos, loadingConfig]);

  const cargarTickets = async (userId: string) => {
    const { data } = await supabase
      .from("tickets_mantenimiento")
      .select("*")
      .eq("usuario_id", userId)
      .order("created_at", { ascending: false });

    if (data) setTickets(data);
    setLoading(false);
  };

  const enviarTicket = async () => {
    if (!titulo || !descripcion) return;
    setEnviando(true);

    const destinatarioFinal = tipoTicket === "infraestructura" ? "admin" : "developer";
    const ubicacionFinal = tipoTicket === "infraestructura" ? ubicacion : null;

    try {
      const { error } = await supabase.from("tickets_mantenimiento").insert({
        tenant_id: tenantId,
        usuario_id: usuario.id,
        tipo: tipoTicket,
        titulo: titulo,
        descripcion: descripcion,
        ubicacion: ubicacionFinal,
        destinatario: destinatarioFinal,
        estado: 'pendiente'
      });

      if (error) throw error;
      
      setModalNuevo(false);
      setTitulo("");
      setDescripcion("");
      setUbicacion("");
      setTipoTicket("infraestructura");
      await cargarTickets(usuario.id);
    } catch (error) {
      console.error("Error enviando ticket:", error);
      alert("Hubo un problema al enviar tu reporte.");
    } finally {
      setEnviando(false);
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente': return <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider">Pendiente</span>;
      case 'en_revision': return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider">En Revisión</span>;
      case 'resuelto': return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider">Resuelto</span>;
      case 'rechazado': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider">Rechazado</span>;
      default: return null;
    }
  };

  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'infraestructura': return <i className="icon-building text-blue-500 bg-blue-50 w-10 h-10 rounded-xl flex items-center justify-center text-xl"></i>;
      case 'app_soporte': return <i className="icon-laptop text-primario bg-primario/10 w-10 h-10 rounded-xl flex items-center justify-center text-xl"></i>;
      case 'app_sugerencia': return <i className="icon-star text-amber-500 bg-amber-50 w-10 h-10 rounded-xl flex items-center justify-center text-xl"></i>;
      default: return null;
    }
  };

  // ✨ Actualizamos el loader visual para que también respete el loadingConfig
  if (loadingConfig || loading) return <div className="p-8 text-center animate-pulse font-bold text-slate-400">Cargando reportes...</div>;

  return (
    <main className="min-h-[100dvh] w-full max-w-3xl mx-auto p-4 md:p-8 overflow-y-auto no-scrollbar pb-32">
      
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Centro de Ayuda</h1>
          <p className="text-slate-500 text-sm font-medium">Reporta fallas en el campus o en la plataforma.</p>
        </div>
        <button 
          onClick={() => setModalNuevo(true)}
          className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-colors active:scale-95"
        >
          + Nuevo Reporte
        </button>
      </header>

      {/* Historial de Tickets del Usuario */}
      <div className="space-y-4">
        {tickets.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4 text-2xl border border-slate-100">
              <i className="icon-check-solid-full"></i>
            </div>
            <h3 className="font-bold text-slate-700">Todo en orden</h3>
            <p className="text-sm text-slate-400">No has enviado ningún reporte aún.</p>
          </div>
        ) : (
          tickets.map(ticket => (
            <div key={ticket.id} className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm flex flex-col md:flex-row gap-4 md:items-center justify-between hover:border-slate-300 transition-colors">
              <div className="flex gap-4 items-start">
                {getIconoTipo(ticket.tipo)}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 leading-tight">{ticket.titulo}</h3>
                    {getStatusBadge(ticket.estado)}
                  </div>
                  <p className="text-xs text-slate-500 font-medium line-clamp-1">{ticket.descripcion}</p>
                  {ticket.ubicacion && (
                    <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                      <i className="icon-location-pin"></i> {ticket.ubicacion}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enviado el</p>
                <p className="text-xs font-bold text-slate-700">{new Date(ticket.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL CREAR REPORTE */}
      {modalNuevo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-6 md:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Crear Reporte</h3>
              <button onClick={() => setModalNuevo(false)} className="w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex justify-center items-center transition-colors active:scale-95">
                <i className="icon-close font-bold"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Tipo de Reporte</label>
                <div className="grid grid-cols-1 gap-2">
                  <button 
                    onClick={() => setTipoTicket("infraestructura")}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${tipoTicket === 'infraestructura' ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-slate-200 opacity-60 hover:opacity-100'}`}
                  >
                    <i className={`icon-building text-xl ${tipoTicket === 'infraestructura' ? 'text-blue-600' : 'text-slate-400'}`}></i>
                    <div>
                      <p className={`text-sm font-bold ${tipoTicket === 'infraestructura' ? 'text-blue-700' : 'text-slate-600'}`}>Falla en Campus</p>
                      <p className="text-[10px] font-medium text-slate-400">Proyectores rotos, fugas, falta de limpieza...</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => setTipoTicket("app_soporte")}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${tipoTicket === 'app_soporte' ? 'bg-primario/5 border-primario shadow-sm' : 'bg-white border-slate-200 opacity-60 hover:opacity-100'}`}
                  >
                    <i className={`icon-laptop text-xl ${tipoTicket === 'app_soporte' ? 'text-primario' : 'text-slate-400'}`}></i>
                    <div>
                      <p className={`text-sm font-bold ${tipoTicket === 'app_soporte' ? 'text-primario' : 'text-slate-600'}`}>Problema en la App</p>
                      <p className="text-[10px] font-medium text-slate-400">Errores, bugs o fallos al cargar Nodum.</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => setTipoTicket("app_sugerencia")}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${tipoTicket === 'app_sugerencia' ? 'bg-amber-50 border-amber-500 shadow-sm' : 'bg-white border-slate-200 opacity-60 hover:opacity-100'}`}
                  >
                    <i className={`icon-star text-xl ${tipoTicket === 'app_sugerencia' ? 'text-amber-500' : 'text-slate-400'}`}></i>
                    <div>
                      <p className={`text-sm font-bold ${tipoTicket === 'app_sugerencia' ? 'text-amber-600' : 'text-slate-600'}`}>Sugerencia para Nodum</p>
                      <p className="text-[10px] font-medium text-slate-400">Ideas para mejorar la aplicación.</p>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">Asunto breve</label>
                <input 
                  placeholder={tipoTicket === 'infraestructura' ? "Ej. Aire acondicionado sin enfriar" : "Ej. No carga mi código QR"} 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>

              {tipoTicket === 'infraestructura' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">Ubicación Exacta</label>
                  <input 
                    placeholder="Ej. Edificio A, Aula A-12" 
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={ubicacion}
                    onChange={(e) => setUbicacion(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">Descripción detallada</label>
                <textarea 
                  rows={3}
                  placeholder="Detalla qué ocurre para que el personal pueda atenderlo rápido..." 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none custom-scrollbar"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              <button 
                onClick={enviarTicket}
                disabled={enviando || !titulo || !descripcion || (tipoTicket === 'infraestructura' && !ubicacion)}
                className="w-full py-4 mt-2 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                {enviando ? 'Enviando...' : 'Enviar Reporte'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}