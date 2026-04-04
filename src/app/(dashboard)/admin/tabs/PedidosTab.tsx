"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useTenant } from "@/context/TenantContext";

export default function PedidosTab() {
  const { tenantId } = useTenant();
  const supabase = createClient();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busquedaPedido, setBusquedaPedido] = useState("");
  const [modalConfirmacion, setModalConfirmacion] = useState(false);
  const [accionPendiente, setAccionPendiente] = useState<{pedido: any, estado: "entregado" | "cancelado"} | null>(null);

  const cargarDatos = async () => {
    setLoading(true);
    const [resPedidos, resUsuarios] = await Promise.all([
      supabase.from("pedidos").select("*").eq("tenant_id", tenantId).order("fecha_pedido", { ascending: false }),
      supabase.from("perfiles").select("id, nombre, apellido, correo_institucional, whatsapp").eq("tenant_id", tenantId)
    ]);
    if (resPedidos.data) setPedidos(resPedidos.data);
    if (resUsuarios.data) setUsuarios(resUsuarios.data);
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const solicitarCambioEstado = (pedido: any, nuevoEstado: "entregado" | "cancelado") => {
    setAccionPendiente({ pedido, estado: nuevoEstado });
    setModalConfirmacion(true);
  };

  const ejecutarCambioEstado = async () => {
    if (!accionPendiente) return;
    const { pedido, estado: nuevoEstado } = accionPendiente;
    setLoading(true);
    try {
      await supabase.from("pedidos").update({ estado: nuevoEstado }).eq("id", pedido.id);
      if (pedido.articulos && pedido.articulos.length > 0) {
        for (const item of pedido.articulos) {
          const { data: prodActual } = await supabase.from("productos").select("stock, stock_apartado").eq("id", item.id).single();
          if (prodActual) {
            let nuevoStock = prodActual.stock;
            let nuevoApartado = Math.max(0, (prodActual.stock_apartado || 0) - item.cantidad);
            if (nuevoEstado === "cancelado") nuevoStock = prodActual.stock + item.cantidad;
            await supabase.from("productos").update({ stock: nuevoStock, stock_apartado: nuevoApartado }).eq("id", item.id);
          }
        }
      }
      setModalConfirmacion(false);
      setAccionPendiente(null);
      await cargarDatos(); 
    } catch (error) {
      alert("Hubo un error al actualizar el inventario.");
    } finally {
      setLoading(false);
    }
  };

  const getInfoUsuario = (usuario_id: string) => usuarios.find(u => u.id === usuario_id) || {};

  const filtroBusqueda = (p: any) => {
    if (!busquedaPedido) return true;
    const searchClean = busquedaPedido.toLowerCase().replace("#", ""); 
    const cliente = getInfoUsuario(p.usuario_id);
    const infoCliente = `${cliente.nombre || ""} ${cliente.apellido || ""} ${cliente.correo_institucional || ""}`.toLowerCase();
    return p.id.toLowerCase().includes(searchClean) || infoCliente.includes(searchClean);
  };

  const pedidosPendientes = pedidos.filter(p => p.estado === "pendiente").filter(filtroBusqueda);
  const pedidosHistorial = pedidos.filter(p => p.estado === "entregado" || p.estado === "cancelado").filter(filtroBusqueda);

  if (loading && pedidos.length === 0) return <div className="py-12 text-center animate-pulse text-slate-400 font-bold">Cargando pedidos...</div>;

  return (
    <div className="space-y-8">
      <div className="relative">
        <i className="icon-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
        {/* CORRECCIÓN: focus:ring-primario/20 */}
        <input type="text" placeholder="Buscar por ID, nombre o correo..." className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-primario/20 transition-all shadow-sm" value={busquedaPedido} onChange={(e) => setBusquedaPedido(e.target.value)} />
      </div>

      <div>
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 ml-2 flex items-center gap-2"><i className="icon-cart text-amber-500"></i> Por Entregar</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pedidosPendientes.length > 0 ? pedidosPendientes.map((pedido) => {
            const cliente = getInfoUsuario(pedido.usuario_id);
            return (
              <div key={pedido.id} className="bg-white border border-amber-200 rounded-[2rem] p-5 shadow-sm shadow-amber-100 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest mb-2 inline-block">Pendiente</span>
                    <h3 className="font-black text-slate-900 text-base">Orden #{pedido.id.slice(0, 5).toUpperCase()}</h3>
                    <p className="text-[10px] text-slate-400 font-bold">{new Date(pedido.fecha_pedido).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-emerald-500">${pedido.total}</p>
                  </div>
                </div>
                {pedido.articulos && pedido.articulos.length > 0 && (
                  <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 mb-4">
                    <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-2 border-b border-amber-200 pb-1">Contenido del Pedido</p>
                    <ul className="space-y-1.5">
                      {pedido.articulos.map((item: any, idx: number) => (
                        <li key={idx} className="flex justify-between items-center text-xs font-bold text-amber-900">
                          <span className="flex items-center gap-1.5 truncate pr-2">
                            <span className="bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-md text-[9px]">{item.cantidad}x</span>
                            <span className="truncate">{item.nombre}</span>
                          </span>
                          <span className="flex-shrink-0">${item.precio * item.cantidad}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4 flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cliente</p>
                  <p className="text-sm font-bold text-slate-800">{cliente.nombre ? `${cliente.nombre} ${cliente.apellido}` : cliente.correo_institucional}</p>
                  {cliente.whatsapp && (
                    /* CORRECCIÓN: hover:opacity-80 en lugar de hover:text-primario */
                    <a href={`https://wa.me/52${cliente.whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-primario hover:opacity-80 mt-1 cursor-pointer transition-opacity">
                      <i className="icon-laptop"></i> Contactar: {cliente.whatsapp}
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => solicitarCambioEstado(pedido, "entregado")} disabled={loading} className="cursor-pointer flex-1 bg-slate-900 text-white px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-emerald-500 transition-all active:scale-[0.98]">
                    <i className="icon-check mr-1"></i> Entregar
                  </button>
                  <button onClick={() => solicitarCambioEstado(pedido, "cancelado")} disabled={loading} className="cursor-pointer flex-none bg-red-50 text-red-600 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-red-100 transition-all active:scale-[0.98]" title="Cancelar Pedido">
                    <i className="icon-trash"></i>
                  </button>
                </div>
              </div>
            );
          }) : <div className="col-span-full text-center py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-bold text-sm">No hay pedidos pendientes de entrega.</div>}
        </div>
      </div>

      {pedidosHistorial.length > 0 && (
        <div>
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 ml-2 flex items-center gap-2"><i className="icon-dove text-emerald-500"></i> Historial Reciente</h2>
          <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <tbody className="divide-y divide-slate-50">
                {pedidosHistorial.slice(0, 15).map((pedido) => {
                  const cliente = getInfoUsuario(pedido.usuario_id);
                  const esCancelado = pedido.estado === "cancelado";
                  return (
                    <tr key={pedido.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 pl-6">
                        <p className="font-bold text-slate-900 text-sm">#{pedido.id.slice(0, 5).toUpperCase()}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{new Date(pedido.fecha_pedido).toLocaleDateString()}</p>
                      </td>
                      <td className="p-4"><p className="font-bold text-slate-700 text-xs">{cliente.nombre ? `${cliente.nombre} ${cliente.apellido}` : cliente.correo_institucional}</p></td>
                      <td className="p-4 text-center">
                        <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-tighter ${esCancelado ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>{pedido.estado}</span>
                      </td>
                      <td className={`p-4 text-right pr-6 font-black text-sm ${esCancelado ? "text-slate-400 line-through decoration-red-400" : "text-slate-900"}`}>${pedido.total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalConfirmacion && accionPendiente && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-6 md:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 text-center">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl mb-4 ${accionPendiente.estado === 'cancelado' ? 'bg-red-100 text-red-500' : 'bg-emerald-100 text-emerald-500'}`}>
              <i className={accionPendiente.estado === 'cancelado' ? 'icon-trash' : 'icon-check'}></i>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">{accionPendiente.estado === 'cancelado' ? '¿Cancelar Pedido?' : '¿Marcar como Entregado?'}</h3>
            <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
              {accionPendiente.estado === 'cancelado' ? 'Los artículos apartados regresarán automáticamente al inventario disponible.' : 'Esto confirmará que el estudiante ya recibió sus componentes.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => { setModalConfirmacion(false); setAccionPendiente(null); }} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-2xl hover:bg-slate-200 transition-all cursor-pointer">Volver</button>
              <button onClick={ejecutarCambioEstado} disabled={loading} className={`flex-1 font-bold py-3.5 rounded-2xl text-white transition-all shadow-lg cursor-pointer disabled:opacity-50 ${accionPendiente.estado === 'cancelado' ? 'bg-red-500 shadow-red-200 hover:bg-red-600' : 'bg-emerald-500 shadow-emerald-200 hover:bg-emerald-600'}`}>
                {loading ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}