"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useTenant } from "@/context/TenantContext";

export default function PerfilPage() {
  const supabase = createClient();
  const router = useRouter();
  const { modulos, identidad, tenantId } = useTenant(); 

  const carrerasDisponibles = identidad.carreras || [];

  const [usuario, setUsuario] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [pedidos, setPedidos] = useState<any[]>([]);

  // Estados para modales y legal
  const [modalCancelacion, setModalCancelacion] = useState(false);
  const [pedidoACancelar, setPedidoACancelar] = useState<any>(null);
  const [modalPrivacidad, setModalPrivacidad] = useState(false);
  const [aceptoPrivacidad, setAceptoPrivacidad] = useState(false);
  const [intentoGuardar, setIntentoGuardar] = useState(false); 
  
  const privacidadRef = useRef<HTMLDivElement>(null);
  
  // Estados para Eliminar Cuenta
  const [modalEliminarCuenta, setModalEliminarCuenta] = useState(false);
  const [textoConfirmacion, setTextoConfirmacion] = useState("");

  // ✨ NUEVO: Estados para el Módulo de Soporte / Mantenimiento
  const [modalSoporte, setModalSoporte] = useState(false);
  const [tipoTicket, setTipoTicket] = useState<"app_soporte" | "app_sugerencia">("app_soporte");
  const [textoTicket, setTextoTicket] = useState("");
  const [tituloTicket, setTituloTicket] = useState("");
  const [loadingTicket, setLoadingTicket] = useState(false);

  const [perfilOriginal, setPerfilOriginal] = useState<any>(null);

  const [perfil, setPerfil] = useState({
    nombre: "",
    apellido: "",
    whatsapp: "",
    carrera: "",
    ieee_numero: "",
    membresia_estatus: "inactiva",
    es_miembro_ieee: false,
    es_miembro_ras: false,
    es_miembro_wie: false
  });

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, router]);

  const cargarDatos = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    setUsuario(session.user);

    const { data: dataPerfil } = await supabase
      .from("perfiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    
    if (dataPerfil) {
      const datosCargados = {
        nombre: dataPerfil.nombre || "",
        apellido: dataPerfil.apellido || "",
        whatsapp: dataPerfil.whatsapp || "",
        carrera: dataPerfil.carrera || "",
        ieee_numero: dataPerfil.ieee_numero || "",
        membresia_estatus: dataPerfil.membresia_estatus || "inactiva",
        es_miembro_ieee: dataPerfil.es_miembro_ieee || false,
        es_miembro_ras: dataPerfil.es_miembro_ras || false,
        es_miembro_wie: dataPerfil.es_miembro_wie || false
      };
      setPerfil(datosCargados);
      setPerfilOriginal(datosCargados);
    }

    const { data: dataPedidos } = await supabase
      .from("pedidos")
      .select("*")
      .eq("usuario_id", session.user.id)
      .order("fecha_pedido", { ascending: false });
    
    if (dataPedidos) setPedidos(dataPedidos);
    setLoading(false);
  };

  const guardarPerfil = async () => {
    if (!aceptoPrivacidad) return;

    setLoading(true);
    let nuevoEstatus = perfil.membresia_estatus;

    const ieeeAlterado = 
      perfil.ieee_numero !== perfilOriginal.ieee_numero ||
      perfil.es_miembro_ieee !== perfilOriginal.es_miembro_ieee ||
      perfil.es_miembro_ras !== perfilOriginal.es_miembro_ras ||
      perfil.es_miembro_wie !== perfilOriginal.es_miembro_wie;

    if (ieeeAlterado) {
      if (perfil.ieee_numero) {
        nuevoEstatus = "pendiente"; 
      } else {
        nuevoEstatus = "inactiva"; 
        perfil.es_miembro_ieee = false;
        perfil.es_miembro_ras = false;
        perfil.es_miembro_wie = false;
      }
    }

    const perfilActualizado = { ...perfil, membresia_estatus: nuevoEstatus };

    const { error } = await supabase
      .from("perfiles")
      .update(perfilActualizado)
      .eq("id", usuario.id);
    
    if (!error) {
      setPerfil(perfilActualizado);
      setPerfilOriginal(perfilActualizado); 
      setEditando(false);
      setAceptoPrivacidad(false);
      setIntentoGuardar(false); 
    }
    setLoading(false);
  };

  const ejecutarCancelacion = async () => {
    if (!pedidoACancelar) return;
    setLoading(true);

    try {
      await supabase.from("pedidos").update({ estado: "cancelado" }).eq("id", pedidoACancelar.id);

      if (pedidoACancelar.articulos && pedidoACancelar.articulos.length > 0) {
        for (const item of pedidoACancelar.articulos) {
          const { data: prodActual } = await supabase
            .from("productos")
            .select("stock, stock_apartado")
            .eq("id", item.id)
            .single();

          if (prodActual) {
            const nuevoStock = prodActual.stock + item.cantidad; 
            const nuevoApartado = Math.max(0, (prodActual.stock_apartado || 0) - item.cantidad); 

            await supabase.from("productos").update({
              stock: nuevoStock,
              stock_apartado: nuevoApartado
            }).eq("id", item.id);
          }
        }
      }

      setModalCancelacion(false);
      setPedidoACancelar(null);
      await cargarDatos(); 
    } catch (error) {
      console.error("Error al cancelar pedido:", error);
      alert("Hubo un error al cancelar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const solicitarCancelacion = (pedido: any) => {
    setPedidoACancelar(pedido);
    setModalCancelacion(true);
  };

  const ejecutarEliminacionCuenta = async () => {
    if (textoConfirmacion !== "ELIMINAR") return;
    setLoading(true);

    try {
      await supabase.from("perfiles").delete().eq("id", usuario.id);
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Error al eliminar cuenta:", error);
      alert("Ocurrió un error al procesar tu solicitud.");
    } finally {
      setLoading(false);
      setModalEliminarCuenta(false);
    }
  };

  // ✨ NUEVO: Función para enviar el ticket de soporte
  const enviarTicket = async () => {
    if (!tituloTicket || !textoTicket) return;
    setLoadingTicket(true);

    // Lógica inteligente de destinatario
    // Si es un problema físico de la escuela, le llega al admin de la facultad.
    // Si es sobre la App Nodum, te llega a ti (developer).
    const destinatarioFinal = "developer";

    try {
      const { error } = await supabase.from("tickets_mantenimiento").insert({
        tenant_id: tenantId,
        usuario_id: usuario.id,
        tipo: tipoTicket,
        titulo: tituloTicket,
        descripcion: textoTicket,
        destinatario: destinatarioFinal,
        estado: 'pendiente'
      });

      if (error) throw error;
      
      alert("¡Reporte enviado exitosamente! Nuestro equipo lo revisará pronto.");
      setModalSoporte(false);
      setTituloTicket("");
      setTextoTicket("");
      setTipoTicket("app_soporte");
    } catch (error) {
      console.error("Error enviando ticket:", error);
      alert("Hubo un problema al enviar tu reporte. Intenta más tarde.");
    } finally {
      setLoadingTicket(false);
    }
  };

  if (loading && !usuario) return <div className="p-8 text-center animate-pulse font-bold text-slate-400">Cargando...</div>;

  const esVerificado = perfil.membresia_estatus === "verificada";

  return (
    <main className="min-h-[100dvh] w-full max-w-2xl mx-auto p-4 md:p-8 overflow-y-auto no-scrollbar pb-32">
      
      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mi Perfil</h1>
        <p className="text-slate-500 text-sm font-medium">Personaliza tu experiencia en Nodum.</p>
      </header>

      {/* Tarjeta de Información Personal */}
      <section className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-8 shadow-sm mb-8">
        <div className="flex justify-between items-start mb-8">
          <div className="w-20 h-20 bg-gradient-to-t from-secundario to-primario rounded-3xl flex items-center justify-center text-white text-4xl shadow-xl shadow-slate-200">
            {perfil.nombre ? perfil.nombre.charAt(0).toUpperCase() : <i className="icon-user"></i>}
          </div>
          <button 
            onClick={() => {
              if (editando) {
                if (!aceptoPrivacidad) {
                  setIntentoGuardar(true);
                  privacidadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  return;
                }
                guardarPerfil();
              } else {
                setEditando(true);
              }
            }}
            disabled={loading}
            className={`cursor-pointer px-6 py-3 rounded-2xl text-xs font-black transition-all active:scale-95 disabled:opacity-50 ${
              editando 
                ? "bg-gradient-to-t from-secundario to-primario text-white shadow-lg shadow-slate-200 hover:opacity-90"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {loading ? "Cargando..." : editando ? "Guardar Cambios" : "Editar Perfil"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre(s)</label>
            <input 
              disabled={!editando}
              className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primario/20 disabled:opacity-70 disabled:cursor-default transition-all"
              value={perfil.nombre}
              onChange={(e) => setPerfil({...perfil, nombre: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Apellidos</label>
            <input 
              disabled={!editando}
              className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primario/20 disabled:opacity-70 disabled:cursor-default transition-all"
              value={perfil.apellido}
              onChange={(e) => setPerfil({...perfil, apellido: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
            <input 
              disabled={!editando}
              placeholder="9991234567"
              className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primario/20 disabled:opacity-70 disabled:cursor-default transition-all"
              value={perfil.whatsapp}
              onChange={(e) => setPerfil({...perfil, whatsapp: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Carrera</label>
            <select 
              disabled={!editando}
              className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primario/20 disabled:opacity-70 disabled:cursor-default transition-all appearance-none"
              value={perfil.carrera}
              onChange={(e) => setPerfil({...perfil, carrera: e.target.value})}
            >
              <option value="">Selecciona tu carrera</option>
              {carrerasDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Panel de Validación IEEE */}
        {modulos.ieee && (
          <div className="mt-8 pt-8 border-t border-slate-50">
            <div className="flex justify-between items-end mb-4 ml-1">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Validación Institucional</h3>
              {perfil.membresia_estatus === "pendiente" && (
                <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-2 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1">
                  <i className="icon-magnifying-glass"></i> En Revisión
                </span>
              )}
              {esVerificado && (
                <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1">
                  <i className="icon-check-solid-full"></i> Verificado
                </span>
              )}
            </div>

            <div className="bg-primario/10 p-4 rounded-2xl border border-primario/20 flex items-start gap-3 mb-5">
              <i className="icon-circle-info-solid-full text-primario mt-0.5 text-xl"></i>
              <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                <strong className="block text-primario mb-0.5">¿Eres miembro estudiantil?</strong> 
                Ingresa tu número de IEEE y enciende las insignias de los grupos a los que perteneces. Al guardar, tu perfil entrará en revisión por la directiva para habilitar tus beneficios exclusivos.
              </p>
            </div>

            <div className="space-y-4">
              <input 
                disabled={!editando}
                placeholder="Número de Miembro IEEE (Ej. 98765432)"
                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primario/20 disabled:opacity-70 disabled:cursor-default transition-all"
                value={perfil.ieee_numero}
                onChange={(e) => setPerfil({...perfil, ieee_numero: e.target.value})}
              />

              <div className="flex flex-wrap gap-3">
                {[
                  { id: 'es_miembro_ieee', label: 'IEEE', icon: 'icon-IEEE' },
                  { id: 'es_miembro_ras', label: 'RAS', icon: 'icon-RAS' },
                  { id: 'es_miembro_wie', label: 'WIE', icon: 'icon-WIE' }
                ].map((m) => {
                  const activo = perfil[m.id as keyof typeof perfil];
                  let colorClases = "bg-white border-slate-200 text-slate-400 grayscale hover:bg-slate-50";
                  if (activo) {
                    colorClases = esVerificado 
                      ? "bg-gradient-to-t from-secundario to-primario border-transparent text-white shadow-md shadow-slate-200" 
                      : "bg-amber-500 border-amber-500 text-white shadow-md shadow-slate-200";
                  }
                  return (
                    <button
                      key={m.id}
                      disabled={!editando}
                      onClick={() => setPerfil({...perfil, [m.id]: !activo})}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer disabled:cursor-default active:scale-95 ${colorClases}`}
                    >
                      <i className={`${m.icon} text-lg`}></i>
                      {m.label}
                    </button>
                  );
                })}
              </div>
              
              {esVerificado && editando && (
                <p className="text-[10px] text-amber-600 font-bold mt-2 ml-1">
                  <i className="icon-circle-info-solid-full mr-1"></i> Modificar estos datos requerirá una nueva verificación.
                </p>
              )}

            </div>
          </div>
        )}

        {/* CHECKBOX DE AVISO DE PRIVACIDAD */}
        {editando && (
          <div ref={privacidadRef} className={`mt-8 pt-6 border-t border-slate-100 transition-all duration-300 ${intentoGuardar && !aceptoPrivacidad ? "bg-red-50 p-4 rounded-2xl border-transparent" : ""}`}>
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => {
                  setAceptoPrivacidad(!aceptoPrivacidad);
                  if (intentoGuardar) setIntentoGuardar(false); 
                }}
                className={`w-6 h-6 mt-0.5 rounded-lg flex items-center justify-center border transition-all flex-shrink-0 cursor-pointer active:scale-95 ${
                  aceptoPrivacidad ? "bg-primario border-primario text-white shadow-sm" : 
                  intentoGuardar && !aceptoPrivacidad ? "bg-white border-red-400 ring-2 ring-red-500/20" : "bg-slate-50 border-slate-300 hover:border-primario/50"
                }`}
              >
                {aceptoPrivacidad && <i className="icon-check-solid-full text-xs"></i>}
              </button>
              <div>
                <p className={`text-xs font-medium leading-relaxed ${intentoGuardar && !aceptoPrivacidad ? "text-red-700" : "text-slate-500"}`}>
                  He leído y acepto el <button type="button" onClick={() => setModalPrivacidad(true)} className={`${intentoGuardar && !aceptoPrivacidad ? "text-red-600" : "text-primario"} font-bold hover:underline cursor-pointer`}>Aviso de Privacidad</button>. Entiendo que mis datos serán tratados por la plataforma y la administración de la institución.
                </p>
                {intentoGuardar && !aceptoPrivacidad && (
                  <p className="text-[10px] text-red-500 font-bold mt-1.5 animate-in slide-in-from-top-1">
                    Debes aceptar el aviso para guardar los cambios.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Historial de Pedidos */}
      {modulos.tienda && (
        <section className="mb-8">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Historial de TIEEEnda</h3>
          <div className="space-y-4">
            {pedidos.length > 0 ? pedidos.map((pedido) => {
              const esCancelado = pedido.estado === 'cancelado';
              const esPendiente = pedido.estado === 'pendiente';
              
              return (
                <div key={pedido.id} className="bg-white border border-slate-200 rounded-[2rem] p-5 flex flex-col gap-4 shadow-sm">
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                        pedido.estado === 'entregado' ? "bg-emerald-50 text-emerald-600" : 
                        esCancelado ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                      }`}>
                        <i className={pedido.estado === 'entregado' ? "icon-check-solid-full" : esCancelado ? "icon-close" : "icon-cart-shopping-solid-full"}></i>
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">Orden #{pedido.id.slice(0, 5).toUpperCase()}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1.5 mt-0.5">
                          {new Date(pedido.fecha_pedido).toLocaleDateString()} • 
                          <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                            pedido.estado === 'entregado' ? "bg-emerald-100 text-emerald-700" : 
                            esCancelado ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                          }`}>
                            {pedido.estado}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right pr-2">
                      <p className={`text-sm font-black ${esCancelado ? "text-slate-400 line-through decoration-red-400" : "text-slate-900"}`}>
                        ${pedido.total}
                      </p>
                    </div>
                  </div>

                  {pedido.articulos && (
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <ul className="space-y-1">
                        {pedido.articulos.map((item: any, idx: number) => (
                          <li key={idx} className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                            <span className="truncate pr-2">{item.cantidad}x {item.nombre}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {esPendiente && (
                    <button 
                      onClick={() => solicitarCancelacion(pedido)}
                      className="cursor-pointer w-full py-3 bg-red-50 text-red-600 font-black rounded-xl text-[10px] uppercase tracking-wider hover:bg-red-100 transition-all border border-red-100 mt-1 active:scale-[0.98] flex justify-center items-center"
                    >
                      <i className="icon-trash-solid-full mr-1 text-sm"></i> Cancelar Pedido
                    </button>
                  )}

                </div>
              );
            }) : (
              <div className="text-center py-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                <p className="text-sm font-bold text-slate-400">Sin pedidos registrados.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Botones de Zona de Peligro y Soporte */}
      <div className="flex flex-col gap-3">
        
        {/* ✨ NUEVO: BOTÓN DE SOPORTE UNIVERSAL */}
        <button 
          onClick={() => setModalSoporte(true)}
          className="cursor-pointer w-full py-4 bg-white border border-slate-200 text-slate-700 font-black rounded-[1.5rem] hover:bg-slate-50 hover:border-primario/30 transition-all text-xs uppercase tracking-widest active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
        >
          <i className="icon-circle-info-solid-full text-primario text-lg"></i> Centro de Ayuda Nodum
        </button>

        <button 
          onClick={async () => { await supabase.auth.signOut(); router.push("/"); }}
          className="cursor-pointer w-full py-4 bg-slate-100 text-slate-500 font-black rounded-[1.5rem] hover:bg-slate-200 transition-all text-xs uppercase tracking-widest active:scale-[0.98] mt-4"
        >
          Cerrar Sesión
        </button>
        
        <button 
          onClick={() => setModalEliminarCuenta(true)}
          className="cursor-pointer w-full py-3 text-red-400 font-bold rounded-[1.5rem] hover:bg-red-50 hover:text-red-600 transition-all text-[10px] uppercase tracking-widest active:scale-[0.98]"
        >
          Eliminar mi cuenta
        </button>
      </div>

      {/* ✨ NUEVO: MODAL DE SOPORTE / MANTENIMIENTO */}
      {modalSoporte && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-6 md:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Centro de Ayuda</h3>
              <button onClick={() => setModalSoporte(false)} className="cursor-pointer w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex justify-center items-center transition-colors active:scale-95">
                <i className="icon-close font-bold"></i>
              </button>
            </div>

            <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">
              ¿Encontraste un problema o tienes una sugerencia para mejorar la aplicación? Te escuchamos.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">¿Qué deseas reportar?</label>
                <div className="grid grid-cols-1 gap-2">
                  <button 
                    onClick={() => setTipoTicket("app_soporte")}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${tipoTicket === 'app_soporte' ? 'bg-primario/5 border-primario shadow-sm' : 'bg-white border-slate-200 opacity-60 hover:opacity-100'}`}
                  >
                    <i className={`icon-laptop text-xl ${tipoTicket === 'app_soporte' ? 'text-primario' : 'text-slate-400'}`}></i>
                    <div>
                      <p className={`text-sm font-bold ${tipoTicket === 'app_soporte' ? 'text-primario' : 'text-slate-600'}`}>Soporte de la App</p>
                      <p className="text-[10px] font-medium text-slate-400">Problemas técnicos, errores al cargar o iniciar sesión.</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => setTipoTicket("app_sugerencia")}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${tipoTicket === 'app_sugerencia' ? 'bg-amber-50 border-amber-500 shadow-sm' : 'bg-white border-slate-200 opacity-60 hover:opacity-100'}`}
                  >
                    <i className={`icon-star text-xl ${tipoTicket === 'app_sugerencia' ? 'text-amber-500' : 'text-slate-400'}`}></i>
                    <div>
                      <p className={`text-sm font-bold ${tipoTicket === 'app_sugerencia' ? 'text-amber-600' : 'text-slate-600'}`}>Sugerencia Nodum</p>
                      <p className="text-[10px] font-medium text-slate-400">Ideas o nuevas funciones que te gustaría ver en Nodum.</p>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">Asunto breve</label>
                <input 
                  placeholder="Ej. Error al ver mi perfil"
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primario/20 transition-all"
                  value={tituloTicket}
                  onChange={(e) => setTituloTicket(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">Descripción detallada</label>
                <textarea 
                  rows={3}
                  placeholder="Explica el error o tu idea para la app..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primario/20 transition-all resize-none custom-scrollbar"
                  value={textoTicket}
                  onChange={(e) => setTextoTicket(e.target.value)}
                />
              </div>

              <button 
                onClick={enviarTicket}
                disabled={loadingTicket || !tituloTicket || !textoTicket}
                className="w-full py-4 mt-2 bg-gradient-to-t from-secundario to-primario text-white font-black rounded-2xl hover:opacity-90 transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                {loadingTicket ? 'Enviando...' : 'Enviar Reporte'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cancelación de Pedidos */}
      {modalCancelacion && pedidoACancelar && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-6 md:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl mb-4 bg-red-100 text-red-500">
              <i className="icon-trash-solid-full"></i>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">¿Cancelar Pedido?</h3>
            <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
              Tu orden <strong className="text-slate-700">#{pedidoACancelar.id.slice(0, 5).toUpperCase()}</strong> será anulada y los componentes apartados se liberarán en la tienda. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button onClick={() => { setModalCancelacion(false); setPedidoACancelar(null); }} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-2xl hover:bg-slate-200 transition-all cursor-pointer">Volver</button>
              <button onClick={ejecutarCancelacion} disabled={loading} className="flex-1 font-bold py-3.5 rounded-2xl text-white transition-all shadow-lg shadow-slate-200 cursor-pointer disabled:opacity-50 bg-red-500 hover:bg-red-600 active:scale-95">
                {loading ? 'Procesando...' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar Cuenta */}
      {modalEliminarCuenta && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-6 md:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl mb-4 bg-red-50 border border-red-100 text-red-500">
              <i className="icon-close font-bold"></i>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Zona de Peligro</h3>
            <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">
              Estás a punto de borrar tu cuenta permanentemente. Perderás tu historial, perfil y cualquier validación institucional obtenida. <strong className="text-red-500">Esta acción es irreversible.</strong>
            </p>
            
            <div className="text-left mb-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Escribe "ELIMINAR" para confirmar</label>
              <input 
                type="text"
                placeholder="ELIMINAR"
                className="w-full mt-1.5 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-center outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all uppercase placeholder-slate-300"
                value={textoConfirmacion}
                onChange={(e) => setTextoConfirmacion(e.target.value.toUpperCase())}
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => { setModalEliminarCuenta(false); setTextoConfirmacion(""); }} 
                className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-2xl hover:bg-slate-200 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={ejecutarEliminacionCuenta} 
                disabled={loading || textoConfirmacion !== "ELIMINAR"} 
                className="flex-1 font-bold py-3.5 rounded-2xl text-white transition-all shadow-lg cursor-pointer disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none bg-red-600 hover:bg-red-700 active:scale-95"
              >
                {loading ? 'Borrando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Aviso de Privacidad */}
      {modalPrivacidad && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-lg p-6 md:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Aviso de Privacidad</h3>
              <button onClick={() => setModalPrivacidad(false)} className="w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex justify-center items-center transition-colors cursor-pointer">
                <i className="icon-close font-bold"></i>
              </button>
            </div>
            
            <div className="overflow-y-auto custom-scrollbar pr-2 space-y-4 text-xs md:text-sm text-slate-600 font-medium leading-relaxed pb-4 flex-1">
              <p>
                <strong>Nodum</strong>, plataforma desarrollada por <strong>E-nnova Design</strong> con sede en Mérida, Yucatán, en conjunto con <strong>{identidad.organizacion}</strong> y su entidad administrativa local (<strong>{identidad.nombre}</strong>), son corresponsables del uso y protección de sus datos personales.
              </p>
              
              <h4 className="font-bold text-slate-800 text-sm mt-4">1. Datos Recabados</h4>
              <p>
                Para brindarle los servicios de la plataforma, recabamos los siguientes datos personales: nombre(s), apellidos, correo electrónico institucional, número de teléfono (WhatsApp), programa educativo (carrera) e información de membresías institucionales (ej. número de miembro IEEE), así como su historial de transacciones dentro de la plataforma.
              </p>

              <h4 className="font-bold text-slate-800 text-sm mt-4">2. Finalidad del Tratamiento</h4>
              <p>
                Su información será utilizada exclusivamente para las siguientes finalidades esenciales:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Creación y gestión de su perfil de usuario.</li>
                <li>Validación de identidad para acceso a beneficios institucionales y de comunidades.</li>
                <li>Gestión, apartado y coordinación logística de entrega de pedidos realizados en la tienda.</li>
                <li>Contacto directo vía WhatsApp por parte de la mesa directiva o administradores para seguimiento escolar o de inventario.</li>
              </ul>

              <h4 className="font-bold text-slate-800 text-sm mt-4">3. Transferencia de Datos</h4>
              <p>
                Sus datos personales no serán vendidos, cedidos ni transferidos a terceros ajenos a <strong>E-nnova Design</strong> y la administración activa de <strong>{identidad.nombre}</strong>, salvo por requerimientos de las autoridades competentes.
              </p>

              <h4 className="font-bold text-slate-800 text-sm mt-4">4. Derechos ARCO</h4>
              <p>
                Usted tiene derecho a conocer qué datos personales tenemos de usted, para qué los utilizamos y las condiciones del uso que les damos (Acceso). Asimismo, es su derecho solicitar la corrección de su información personal en caso de que esté desactualizada, sea inexacta o incompleta (Rectificación); que la eliminemos de nuestros registros (Cancelación); así como oponerse al uso de sus datos para fines específicos (Oposición). Para el ejercicio de estos derechos, podrá hacerlo directamente editando su perfil, eliminando su cuenta desde la plataforma o contactando al administrador del sistema en su institución.
              </p>
            </div>
            
            <div className="pt-4 mt-4 border-t border-slate-100 flex-shrink-0">
              <button 
                onClick={() => setModalPrivacidad(false)} 
                className="w-full py-3.5 bg-slate-900 text-white font-black rounded-2xl hover:bg-primario transition-all shadow-md cursor-pointer active:scale-95"
              >
                Entendido
              </button>
            </div>

          </div>
        </div>
      )}

    </main>
  );
}