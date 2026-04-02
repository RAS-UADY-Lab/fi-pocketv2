"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CARRERAS = [
  "Todos",
  "Ingeniería Mecatrónica",
  "Ingeniería en Energías Renovables",
  "Ingeniería Civil",
  "Ingeniería en Alimentos",
  "Ingeniería Física",
  "Ingeniería Mecánica Eléctrica"
];

const CATEGORIAS_PRODUCTO = [
  "Microcontroladores",
  "Sensores",
  "Actuadores",
  "Herramientas",
  "Módulos",
  "Componentes Pasivos",
  "Otros"
];

export default function AdminPage() {
  const supabase = createClient();
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Añadimos la pestaña de "inventario"
  const [tabActiva, setTabActiva] = useState<"pendientes" | "directorio" | "pedidos" | "inventario">("pendientes");
  
  // Estados para datos
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]); // <--- Nuevo estado para el inventario
  
  // Estados de Búsqueda
  const [busqueda, setBusqueda] = useState(""); 
  const [busquedaPedido, setBusquedaPedido] = useState(""); 
  const [busquedaInventario, setBusquedaInventario] = useState(""); 
  const [filtroCarrera, setFiltroCarrera] = useState("Todos");
  
  // Estados de Modales (Usuarios y Pedidos)
  const [usuarioEditando, setUsuarioEditando] = useState<any>(null);
  const [modalConfirmacion, setModalConfirmacion] = useState(false);
  const [accionPendiente, setAccionPendiente] = useState<{pedido: any, estado: "entregado" | "cancelado"} | null>(null);

  // Estados de Modales (Inventario)
  const [productoEditando, setProductoEditando] = useState<any>(null);
  const [modalEliminarProd, setModalEliminarProd] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState<any>(null);

  useEffect(() => {
    const verificarAcceso = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data: perfil } = await supabase
        .from("perfiles")
        .select("rol")
        .eq("id", session.user.id)
        .single();

      if (perfil?.rol !== "admin") {
        router.push("/");
        return;
      }

      setIsAdmin(true);
      cargarDatos();
    };

    verificarAcceso();
  }, [supabase, router]);

  // Cargamos usuarios, pedidos Y PRODUCTOS al mismo tiempo
  const cargarDatos = async () => {
    setLoading(true);
    const [resUsuarios, resPedidos, resProductos] = await Promise.all([
      supabase.from("perfiles").select("*").order("nombre", { ascending: true }),
      supabase.from("pedidos").select("*").order("fecha_pedido", { ascending: false }),
      supabase.from("productos").select("*").order("categoria", { ascending: true }) // <--- Cargamos el inventario
    ]);
    
    if (resUsuarios.data) setUsuarios(resUsuarios.data);
    if (resPedidos.data) setPedidos(resPedidos.data);
    if (resProductos.data) setProductos(resProductos.data);
    
    setLoading(false);
  };

  // --- LÓGICA DE USUARIOS ---
  const actualizarUsuario = async (id: string, campos: any) => {
    setLoading(true);
    await supabase.from("perfiles").update(campos).eq("id", id);
    await cargarDatos();
  };

  const guardarEdicionMembresia = async () => {
    if (!usuarioEditando) return;
    setLoading(true);
    await supabase.from("perfiles").update({
      ieee_numero: usuarioEditando.ieee_numero,
      membresia_estatus: usuarioEditando.membresia_estatus,
      es_miembro_ieee: usuarioEditando.es_miembro_ieee,
      es_miembro_ras: usuarioEditando.es_miembro_ras,
      es_miembro_wie: usuarioEditando.es_miembro_wie
    }).eq("id", usuarioEditando.id);
    setUsuarioEditando(null);
    await cargarDatos(); 
  };

  // --- LÓGICA DE PEDIDOS E INVENTARIO (APARTADOS) ---
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
          const { data: prodActual } = await supabase
            .from("productos")
            .select("stock, stock_apartado")
            .eq("id", item.id)
            .single();

          if (prodActual) {
            let nuevoStock = prodActual.stock;
            let nuevoApartado = Math.max(0, (prodActual.stock_apartado || 0) - item.cantidad);

            if (nuevoEstado === "cancelado") {
              nuevoStock = prodActual.stock + item.cantidad;
            }

            await supabase.from("productos").update({
              stock: nuevoStock,
              stock_apartado: nuevoApartado
            }).eq("id", item.id);
          }
        }
      }

      setModalConfirmacion(false);
      setAccionPendiente(null);
      await cargarDatos(); 
    } catch (error) {
      console.error("Error procesando pedido:", error);
      alert("Hubo un error al actualizar el inventario.");
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA CRUD DE INVENTARIO (NUEVA) ---
  const abrirModalNuevoProducto = () => {
    setProductoEditando({
      nombre: "",
      precio: 0,
      stock: 0,
      stock_apartado: 0,
      categoria: "Otros",
      imagen_url: ""
    });
  };

  const guardarProducto = async () => {
    if (!productoEditando) return;
    setLoading(true);
    try {
      if (productoEditando.id) {
        // ACTUALIZAR EXISTENTE
        await supabase.from("productos").update({
          nombre: productoEditando.nombre,
          precio: productoEditando.precio,
          stock: productoEditando.stock,
          categoria: productoEditando.categoria,
          imagen_url: productoEditando.imagen_url
        }).eq("id", productoEditando.id);
      } else {
        // CREAR NUEVO
        await supabase.from("productos").insert({
          nombre: productoEditando.nombre,
          precio: productoEditando.precio,
          stock: productoEditando.stock,
          stock_apartado: 0,
          categoria: productoEditando.categoria,
          imagen_url: productoEditando.imagen_url
        });
      }
      setProductoEditando(null);
      await cargarDatos();
    } catch (error) {
      console.error("Error al guardar producto:", error);
      alert("Hubo un error al guardar el producto.");
    } finally {
      setLoading(false);
    }
  };

  const solicitarEliminarProducto = (producto: any) => {
    setProductoAEliminar(producto);
    setModalEliminarProd(true);
  };

  const ejecutarEliminarProducto = async () => {
    if (!productoAEliminar) return;
    setLoading(true);
    try {
      await supabase.from("productos").delete().eq("id", productoAEliminar.id);
      setModalEliminarProd(false);
      setProductoAEliminar(null);
      await cargarDatos();
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      alert("No se pudo eliminar el producto. Verifica tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  // --- AYUDANTES Y FILTROS ---
  const getInfoUsuario = (usuario_id: string) => {
    return usuarios.find(u => u.id === usuario_id) || {};
  };

  const solicitudesPendientes = usuarios.filter(u => u.membresia_estatus === "pendiente");
  
  const directorioFiltrado = usuarios.filter(u => {
    const nombreCompleto = `${u.nombre} ${u.apellido} ${u.correo_institucional}`.toLowerCase();
    const coincideBusqueda = nombreCompleto.includes(busqueda.toLowerCase());
    const coincideCarrera = filtroCarrera === "Todos" || u.carrera === filtroCarrera;
    return coincideBusqueda && coincideCarrera;
  });

  const filtroBusquedaPedidos = (p: any) => {
    if (!busquedaPedido) return true;
    const searchClean = busquedaPedido.toLowerCase().replace("#", ""); 
    const cliente = getInfoUsuario(p.usuario_id);
    const infoCliente = `${cliente.nombre || ""} ${cliente.apellido || ""} ${cliente.correo_institucional || ""}`.toLowerCase();
    return p.id.toLowerCase().includes(searchClean) || infoCliente.includes(searchClean);
  };

  const pedidosPendientes = pedidos.filter(p => p.estado === "pendiente").filter(filtroBusquedaPedidos);
  const pedidosHistorial = pedidos.filter(p => p.estado === "entregado" || p.estado === "cancelado").filter(filtroBusquedaPedidos);

  // Filtro de inventario
  const inventarioFiltrado = productos.filter(p => p.nombre.toLowerCase().includes(busquedaInventario.toLowerCase()));

  // --- RENDERIZADO ---
  if (loading && !isAdmin && usuarios.length === 0) return <div className="p-20 text-center font-bold text-slate-400 animate-pulse">Cargando panel...</div>;
  if (!isAdmin) return null;

  return (
    <main className="min-h-[100dvh] w-full max-w-5xl mx-auto p-4 md:p-8 overflow-y-auto no-scrollbar pb-32">
      
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/" className="cursor-pointer w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors shadow-sm">
            <i className="icon-left-arrow text-xs"></i>
          </Link>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Panel Administrativo</h1>
        </div>
        <p className="text-slate-500 text-sm font-medium ml-11">Gestión de comunidad, ventas e inventario IEEE UADY.</p>
      </header>

      <nav className="flex gap-2 mb-8 bg-slate-100 p-1.5 rounded-2xl w-fit overflow-x-auto max-w-full">
        <button 
          onClick={() => setTabActiva("pendientes")}
          className={`cursor-pointer px-4 md:px-6 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${tabActiva === "pendientes" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          Solicitudes ({solicitudesPendientes.length})
        </button>
        <button 
          onClick={() => setTabActiva("pedidos")}
          className={`cursor-pointer px-4 md:px-6 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${tabActiva === "pedidos" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          Pedidos TIEEEnda ({pedidos.filter(p => p.estado === "pendiente").length})
        </button>
        <button 
          onClick={() => setTabActiva("inventario")}
          className={`cursor-pointer px-4 md:px-6 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${tabActiva === "inventario" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          Inventario
        </button>
        <button 
          onClick={() => setTabActiva("directorio")}
          className={`cursor-pointer px-4 md:px-6 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${tabActiva === "directorio" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          Directorio Maestro
        </button>
      </nav>

      {/* =========================================
          VISTA 1: SOLICITUDES PENDIENTES 
      ============================================= */}
      {tabActiva === "pendientes" && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 gap-4">
            {solicitudesPendientes.length > 0 ? solicitudesPendientes.map((u) => (
              <div key={u.id} className="bg-white border border-slate-200 rounded-[2rem] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
                <div className="flex-1">
                  <h3 className="font-black text-slate-900 text-lg">{u.nombre} {u.apellido}</h3>
                  <p className="text-xs text-blue-600 font-bold mb-3">{u.correo_institucional}</p>
                  <div className="flex gap-4">
                    <div className="text-[10px] font-bold text-slate-400">ID IEEE: <span className="text-slate-900">{u.ieee_numero}</span></div>
                    <div className="text-[10px] font-bold text-slate-400">GRUPOS: 
                      <span className="ml-1 text-slate-900">
                        {[u.es_miembro_ieee && "IEEE", u.es_miembro_ras && "RAS", u.es_miembro_wie && "WIE"].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => actualizarUsuario(u.id, { membresia_estatus: "verificada" })} className="cursor-pointer flex-1 md:flex-none bg-emerald-500 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-emerald-600 transition-all">Aprobar</button>
                  <button onClick={() => actualizarUsuario(u.id, { membresia_estatus: "inactiva", ieee_numero: "" })} className="cursor-pointer flex-1 md:flex-none bg-red-50 text-red-600 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-red-100 transition-all">Rechazar</button>
                </div>
              </div>
            )) : (
              <div className="text-center py-20 bg-white border border-slate-100 rounded-[3rem] text-slate-400 font-bold">
                No hay solicitudes nuevas.
              </div>
            )}
          </div>
        </section>
      )}

      {/* =========================================
          VISTA 2: PEDIDOS TIEEENDA 
      ============================================= */}
      {tabActiva === "pedidos" && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
          
          <div className="relative">
            <i className="icon-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="Buscar por ID (Ej. #A1B2C), nombre o correo..." 
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
              value={busquedaPedido}
              onChange={(e) => setBusquedaPedido(e.target.value)}
            />
          </div>

          <div>
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 ml-2 flex items-center gap-2">
              <i className="icon-cart text-amber-500"></i> Por Entregar
            </h2>
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
                        <a href={`https://wa.me/52${cliente.whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 mt-1 cursor-pointer">
                          <i className="icon-laptop"></i> Contactar: {cliente.whatsapp}
                        </a>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => solicitarCambioEstado(pedido, "entregado")}
                        disabled={loading}
                        className="cursor-pointer flex-1 bg-slate-900 text-white px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-emerald-500 transition-all active:scale-[0.98]"
                      >
                        <i className="icon-check mr-1"></i> Entregar
                      </button>
                      <button 
                        onClick={() => solicitarCambioEstado(pedido, "cancelado")}
                        disabled={loading}
                        className="cursor-pointer flex-none bg-red-50 text-red-600 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-red-100 transition-all active:scale-[0.98]"
                        title="Cancelar Pedido"
                      >
                        <i className="icon-trash"></i>
                      </button>
                    </div>
                  </div>
                );
              }) : (
                <div className="col-span-full text-center py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-bold text-sm">
                  {busquedaPedido ? "No hay pedidos pendientes que coincidan." : "No hay pedidos pendientes de entrega."}
                </div>
              )}
            </div>
          </div>

          {pedidosHistorial.length > 0 && (
            <div>
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 ml-2 flex items-center gap-2">
                <i className="icon-dove text-emerald-500"></i> Historial Reciente
              </h2>
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
                          <td className="p-4">
                            <p className="font-bold text-slate-700 text-xs">{cliente.nombre ? `${cliente.nombre} ${cliente.apellido}` : cliente.correo_institucional}</p>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-tighter ${esCancelado ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
                              {pedido.estado}
                            </span>
                          </td>
                          <td className={`p-4 text-right pr-6 font-black text-sm ${esCancelado ? "text-slate-400 line-through decoration-red-400" : "text-slate-900"}`}>
                            ${pedido.total}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* =========================================
          VISTA 3: INVENTARIO (NUEVO MÓDULO)
      ============================================= */}
      {tabActiva === "inventario" && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-start md:items-center">
            <div className="relative flex-1 w-full">
              <i className="icon-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input 
                type="text" 
                placeholder="Buscar componente en inventario..." 
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                value={busquedaInventario}
                onChange={(e) => setBusquedaInventario(e.target.value)}
              />
            </div>
            <button 
              onClick={abrirModalNuevoProducto}
              className="cursor-pointer flex-shrink-0 w-full md:w-auto bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
            >
              <i className="icon-plus mr-2"></i> Nuevo Producto
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-6">Componente</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Precio</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Disponible</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Apartado</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-6">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {inventarioFiltrado.length > 0 ? inventarioFiltrado.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 pl-6 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                        {prod.imagen_url ? (
                          <img src={prod.imagen_url} alt={prod.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400"><i className="icon-laptop"></i></div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm truncate max-w-[200px]">{prod.nombre}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{prod.categoria}</p>
                      </div>
                    </td>
                    <td className="p-4 font-black text-blue-600 text-sm">
                      ${prod.precio}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-[11px] font-black px-2 py-1 rounded-lg ${prod.stock <= 2 ? 'bg-red-100 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {prod.stock}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                        {prod.stock_apartado || 0}
                      </span>
                    </td>
                    <td className="p-4 text-right pr-6 flex items-center justify-end gap-2 h-[72px]">
                      <button 
                        onClick={() => setProductoEditando(prod)}
                        className="cursor-pointer w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        title="Editar"
                      >
                        <i className="icon-left-arrow rotate-180 text-[10px]"></i> {/* Usando un ícono de flecha o edición */}
                      </button>
                      <button 
                        onClick={() => solicitarEliminarProducto(prod)}
                        className="cursor-pointer w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        title="Eliminar"
                      >
                        <i className="icon-trash text-[10px]"></i>
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400 font-bold text-sm bg-slate-50 border-2 border-dashed border-slate-200 rounded-b-[2.5rem]">
                      No hay productos en el inventario.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* =========================================
          VISTA 4: DIRECTORIO MAESTRO 
      ============================================= */}
      {tabActiva === "directorio" && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <i className="icon-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input 
                type="text" 
                placeholder="Buscar por nombre o correo..." 
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <select 
              className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none cursor-pointer"
              value={filtroCarrera}
              onChange={(e) => setFiltroCarrera(e.target.value)}
            >
              {CARRERAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-8">Estudiante</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Carrera</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Membresía</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-8">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {directorioFiltrado.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 pl-8">
                      <p className="font-bold text-slate-900 text-sm">{u.nombre} {u.apellido}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{u.correo_institucional}</p>
                    </td>
                    <td className="p-4">
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">{u.carrera || "N/A"}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-tighter ${
                        u.membresia_estatus === 'verificada' ? 'bg-blue-100 text-blue-600' : 
                        u.membresia_estatus === 'pendiente' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {u.membresia_estatus}
                      </span>
                    </td>
                    <td className="p-4 text-right pr-8 flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setUsuarioEditando(u)}
                        className="cursor-pointer text-[10px] font-black px-3 py-1.5 rounded-lg transition-all bg-blue-50 text-blue-600 hover:bg-blue-100"
                      >
                        Editar Info
                      </button>
                      <button 
                        onClick={() => actualizarUsuario(u.id, { rol: u.rol === 'admin' ? 'estudiante' : 'admin' })}
                        className={`cursor-pointer text-[10px] font-black px-3 py-1.5 rounded-lg transition-all ${
                          u.rol === 'admin' ? 'bg-purple-100 text-purple-600 hover:bg-purple-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {u.rol === 'admin' ? '- Admin' : '+ Admin'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* =========================================
          ZONA DE MODALES
      ============================================= */}

      {/* MODAL: EDITAR USUARIO */}
      {usuarioEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-6 md:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setUsuarioEditando(null)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"><i className="icon-close font-bold">x</i></button>
            <div className="mb-6">
              <h3 className="text-xl font-black text-slate-900">Editar Membresía</h3>
              <p className="text-xs font-bold text-slate-500 mt-1">{usuarioEditando.nombre} {usuarioEditando.apellido}</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estatus del Estudiante</label>
                <select className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none cursor-pointer" value={usuarioEditando.membresia_estatus} onChange={(e) => setUsuarioEditando({...usuarioEditando, membresia_estatus: e.target.value})}>
                  <option value="inactiva">Inactiva (Sin beneficios)</option>
                  <option value="pendiente">Pendiente (En revisión)</option>
                  <option value="verificada">Verificada (Activa)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número IEEE</label>
                <input className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" value={usuarioEditando.ieee_numero || ""} placeholder="Ej. 98765432" onChange={(e) => setUsuarioEditando({...usuarioEditando, ieee_numero: e.target.value})}/>
              </div>
              <div className="pt-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Forzar Insignias</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'es_miembro_ieee', label: 'IEEE', icon: 'icon-laptop' },
                    { id: 'es_miembro_ras', label: 'RAS', icon: 'icon-dove' },
                    { id: 'es_miembro_wie', label: 'WIE', icon: 'icon-user' }
                  ].map((m) => {
                    const activo = usuarioEditando[m.id as keyof typeof usuarioEditando];
                    return (
                      <button key={m.id} onClick={() => setUsuarioEditando({...usuarioEditando, [m.id]: !activo})} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activo ? "bg-blue-600 text-white shadow-md" : "bg-slate-100 text-slate-400 hover:bg-slate-200"}`}><i className={m.icon}></i> {m.label}</button>
                    );
                  })}
                </div>
              </div>
            </div>
            <button onClick={guardarEdicionMembresia} disabled={loading} className="w-full mt-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-slate-200 disabled:opacity-50 cursor-pointer">
              {loading ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR PEDIDO */}
      {modalConfirmacion && accionPendiente && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-6 md:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 text-center">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl mb-4 ${accionPendiente.estado === 'cancelado' ? 'bg-red-100 text-red-500' : 'bg-emerald-100 text-emerald-500'}`}>
              <i className={accionPendiente.estado === 'cancelado' ? 'icon-trash' : 'icon-check'}></i>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">{accionPendiente.estado === 'cancelado' ? '¿Cancelar Pedido?' : '¿Marcar como Entregado?'}</h3>
            <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
              {accionPendiente.estado === 'cancelado' ? 'Los artículos apartados regresarán automáticamente al inventario disponible.' : 'Esto confirmará que el estudiante ya recibió sus componentes en la facultad.'}
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

      {/* MODAL: AÑADIR/EDITAR PRODUCTO (NUEVO) */}
      {productoEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-6 md:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 my-8">
            <button onClick={() => setProductoEditando(null)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"><i className="icon-close font-bold">x</i></button>
            
            <div className="mb-6">
              <h3 className="text-xl font-black text-slate-900">{productoEditando.id ? "Editar Producto" : "Nuevo Producto"}</h3>
              <p className="text-xs font-bold text-slate-500 mt-1">Gestión del catálogo de TIEEEnda</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre del Componente *</label>
                <input className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" placeholder="Ej. Arduino Uno R3" value={productoEditando.nombre} onChange={(e) => setProductoEditando({...productoEditando, nombre: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Precio ($) *</label>
                  <input type="number" min="0" step="0.5" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" value={productoEditando.precio} onChange={(e) => setProductoEditando({...productoEditando, precio: Number(e.target.value)})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock Disponible *</label>
                  <input type="number" min="0" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" value={productoEditando.stock} onChange={(e) => setProductoEditando({...productoEditando, stock: Number(e.target.value)})} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoría *</label>
                <select className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none cursor-pointer" value={productoEditando.categoria} onChange={(e) => setProductoEditando({...productoEditando, categoria: e.target.value})}>
                  {CATEGORIAS_PRODUCTO.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL de la Imagen</label>
                <input className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" placeholder="https://..." value={productoEditando.imagen_url} onChange={(e) => setProductoEditando({...productoEditando, imagen_url: e.target.value})} />
                <p className="text-[9px] text-slate-400 font-medium ml-1">Sube la imagen a un host externo (como Imgur o tu propio storage) y pega el enlace directo aquí.</p>
              </div>
            </div>

            <button onClick={guardarProducto} disabled={loading || !productoEditando.nombre} className="w-full mt-8 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 cursor-pointer">
              {loading ? "Guardando..." : "Guardar Producto"}
            </button>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR ELIMINAR PRODUCTO (NUEVO) */}
      {modalEliminarProd && productoAEliminar && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-6 md:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl mb-4 bg-red-100 text-red-500">
              <i className="icon-trash"></i>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">¿Eliminar Producto?</h3>
            <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
              Estás a punto de borrar permanentemente <strong className="text-slate-700">{productoAEliminar.nombre}</strong> del catálogo. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button onClick={() => { setModalEliminarProd(false); setProductoAEliminar(null); }} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-2xl hover:bg-slate-200 transition-all cursor-pointer">Cancelar</button>
              <button onClick={ejecutarEliminarProducto} disabled={loading} className="flex-1 font-bold py-3.5 rounded-2xl text-white transition-all shadow-lg cursor-pointer disabled:opacity-50 bg-red-500 shadow-red-200 hover:bg-red-600">
                {loading ? 'Borrando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}