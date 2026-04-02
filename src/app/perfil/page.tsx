"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const CARRERAS = [
  "Ingeniería Mecatrónica",
  "Ingeniería en Energías Renovables",
  "Ingeniería Civil",
  "Ingeniería en Alimentos",
  "Ingeniería Física",
  "Ingeniería Mecánica Eléctrica"
];

export default function PerfilPage() {
  const supabase = createClient();
  const router = useRouter();

  const [usuario, setUsuario] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [pedidos, setPedidos] = useState<any[]>([]);

  // Estados para el Modal de Cancelación
  const [modalCancelacion, setModalCancelacion] = useState(false);
  const [pedidoACancelar, setPedidoACancelar] = useState<any>(null);

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
    }
    setLoading(false);
  };

  // --- LÓGICA DE CANCELACIÓN DEL ESTUDIANTE ---
  const solicitarCancelacion = (pedido: any) => {
    setPedidoACancelar(pedido);
    setModalCancelacion(true);
  };

  const ejecutarCancelacion = async () => {
    if (!pedidoACancelar) return;
    setLoading(true);

    try {
      // 1. Cambiamos estado a cancelado
      await supabase.from("pedidos").update({ estado: "cancelado" }).eq("id", pedidoACancelar.id);

      // 2. Liberamos el inventario apartado
      if (pedidoACancelar.articulos && pedidoACancelar.articulos.length > 0) {
        for (const item of pedidoACancelar.articulos) {
          const { data: prodActual } = await supabase
            .from("productos")
            .select("stock, stock_apartado")
            .eq("id", item.id)
            .single();

          if (prodActual) {
            const nuevoStock = prodActual.stock + item.cantidad; // Regresa a la vitrina
            const nuevoApartado = Math.max(0, (prodActual.stock_apartado || 0) - item.cantidad); // Sale del limbo

            await supabase.from("productos").update({
              stock: nuevoStock,
              stock_apartado: nuevoApartado
            }).eq("id", item.id);
          }
        }
      }

      setModalCancelacion(false);
      setPedidoACancelar(null);
      await cargarDatos(); // Recargamos la vista para ver el cambio
    } catch (error) {
      console.error("Error al cancelar pedido:", error);
      alert("Hubo un error al cancelar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !usuario) return <div className="p-8 text-center animate-pulse font-bold text-slate-400">Cargando...</div>;

  const esVerificado = perfil.membresia_estatus === "verificada";

  return (
    <main className="min-h-[100dvh] w-full max-w-2xl mx-auto p-4 md:p-8 overflow-y-auto no-scrollbar pb-32">
      
      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mi Perfil</h1>
        <p className="text-slate-500 text-sm font-medium">Personaliza tu experiencia en FI Pocket.</p>
      </header>

      {/* Tarjeta de Información Personal */}
      <section className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-8 shadow-sm mb-8">
        <div className="flex justify-between items-start mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-3xl shadow-xl shadow-blue-100">
            <i className="icon-user"></i>
          </div>
          <button 
            onClick={() => editando ? guardarPerfil() : setEditando(true)}
            className={`cursor-pointer px-6 py-2.5 rounded-2xl text-xs font-black transition-all ${
              editando ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100 hover:bg-emerald-600" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {editando ? "Guardar Cambios" : "Editar Perfil"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre(s)</label>
            <input 
              disabled={!editando}
              className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-70 disabled:cursor-default transition-all"
              value={perfil.nombre}
              onChange={(e) => setPerfil({...perfil, nombre: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Apellidos</label>
            <input 
              disabled={!editando}
              className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-70 disabled:cursor-default transition-all"
              value={perfil.apellido}
              onChange={(e) => setPerfil({...perfil, apellido: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
            <input 
              disabled={!editando}
              placeholder="9991234567"
              className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-70 disabled:cursor-default transition-all"
              value={perfil.whatsapp}
              onChange={(e) => setPerfil({...perfil, whatsapp: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Carrera</label>
            <select 
              disabled={!editando}
              className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-70 disabled:cursor-default transition-all appearance-none"
              value={perfil.carrera}
              onChange={(e) => setPerfil({...perfil, carrera: e.target.value})}
            >
              <option value="">Selecciona tu carrera</option>
              {CARRERAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Panel de Validación IEEE */}
        <div className="mt-8 pt-8 border-t border-slate-50">
          <div className="flex justify-between items-end mb-4 ml-1">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Validación Institucional</h3>
            {perfil.membresia_estatus === "pendiente" && (
              <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-2 py-1 rounded-lg uppercase tracking-wider">En Revisión</span>
            )}
            {esVerificado && (
              <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1">
                <i className="icon-check"></i> Verificado
              </span>
            )}
          </div>

          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3 mb-5">
            <i className="icon-info text-blue-500 mt-0.5 text-lg"></i>
            <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
              <strong className="block text-blue-900 mb-0.5">¿Eres miembro estudiantil?</strong> 
              Ingresa tu número de IEEE y enciende las insignias de los grupos a los que perteneces. Al guardar, tu perfil entrará en revisión por la directiva para habilitar tus beneficios exclusivos.
            </p>
          </div>

          <div className="space-y-4">
            <input 
              disabled={!editando}
              placeholder="Número de Miembro IEEE (Ej. 98765432)"
              className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-70 disabled:cursor-default transition-all"
              value={perfil.ieee_numero}
              onChange={(e) => setPerfil({...perfil, ieee_numero: e.target.value})}
            />

            <div className="flex flex-wrap gap-3">
              {[
                { id: 'es_miembro_ieee', label: 'IEEE', icon: 'icon-laptop' },
                { id: 'es_miembro_ras', label: 'RAS', icon: 'icon-dove' },
                { id: 'es_miembro_wie', label: 'WIE', icon: 'icon-user' }
              ].map((m) => {
                const activo = perfil[m.id as keyof typeof perfil];
                let colorClases = "bg-white border-slate-100 text-slate-400 grayscale";
                if (activo) {
                  colorClases = esVerificado 
                    ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100" 
                    : "bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-100";
                }
                return (
                  <button
                    key={m.id}
                    disabled={!editando}
                    onClick={() => setPerfil({...perfil, [m.id]: !activo})}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer disabled:cursor-default ${colorClases}`}
                  >
                    <i className={m.icon}></i>
                    {m.label}
                  </button>
                );
              })}
            </div>
            
            {esVerificado && editando && (
              <p className="text-[10px] text-amber-600 font-bold mt-2 ml-1">
                <i className="icon-info mr-1"></i> Modificar estos datos requerirá una nueva verificación.
              </p>
            )}

          </div>
        </div>
      </section>

      {/* Historial de Pedidos */}
      <section className="mb-8">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Historial de TIEEEnda</h3>
        <div className="space-y-4">
          {pedidos.length > 0 ? pedidos.map((pedido) => {
            const esCancelado = pedido.estado === 'cancelado';
            const esPendiente = pedido.estado === 'pendiente';
            
            return (
              <div key={pedido.id} className="bg-white border border-slate-200 rounded-[2rem] p-5 flex flex-col gap-4 shadow-sm">
                
                {/* Cabecera del Pedido */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                      pedido.estado === 'entregado' ? "bg-emerald-50 text-emerald-600" : 
                      esCancelado ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                    }`}>
                      <i className={pedido.estado === 'entregado' ? "icon-check" : esCancelado ? "icon-close" : "icon-cart"}></i>
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

                {/* Desglose de Artículos (Opcional visualmente) */}
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

                {/* Botón de Cancelación (Solo si está pendiente) */}
                {esPendiente && (
                  <button 
                    onClick={() => solicitarCancelacion(pedido)}
                    className="cursor-pointer w-full py-2.5 bg-red-50 text-red-600 font-black rounded-xl text-[10px] uppercase tracking-wider hover:bg-red-100 transition-all border border-red-100 mt-1"
                  >
                    <i className="icon-trash mr-1"></i> Cancelar Pedido
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

      <button 
        onClick={async () => { await supabase.auth.signOut(); router.push("/"); }}
        className="cursor-pointer w-full py-4 bg-slate-100 text-slate-500 font-black rounded-[1.5rem] hover:bg-slate-200 transition-all text-xs uppercase tracking-widest"
      >
        Cerrar Sesión
      </button>

      {/* MODAL DE CONFIRMACIÓN DE CANCELACIÓN */}
      {modalCancelacion && pedidoACancelar && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-6 md:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 text-center">
            
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl mb-4 bg-red-100 text-red-500">
              <i className="icon-trash"></i>
            </div>
            
            <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">
              ¿Cancelar Pedido?
            </h3>
            
            <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
              Tu orden <strong className="text-slate-700">#{pedidoACancelar.id.slice(0, 5).toUpperCase()}</strong> será anulada y los componentes apartados se liberarán en la tienda. Esta acción no se puede deshacer.
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => { setModalCancelacion(false); setPedidoACancelar(null); }} 
                className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-2xl hover:bg-slate-200 transition-all cursor-pointer"
              >
                Volver
              </button>
              <button 
                onClick={ejecutarCancelacion} 
                disabled={loading} 
                className="flex-1 font-bold py-3.5 rounded-2xl text-white transition-all shadow-lg cursor-pointer disabled:opacity-50 bg-red-500 shadow-red-200 hover:bg-red-600"
              >
                {loading ? 'Procesando...' : 'Sí, cancelar'}
              </button>
            </div>

          </div>
        </div>
      )}

    </main>
  );
}