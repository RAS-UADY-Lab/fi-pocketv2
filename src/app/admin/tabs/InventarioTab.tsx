"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useTenant } from "@/context/TenantContext";

const CATEGORIAS_PRODUCTO = [
  "Microcontroladores", "Sensores", "Actuadores", "Herramientas", "Módulos", "Componentes Pasivos", "Otros"
];

export default function InventarioTab() {
  const { tenantId } = useTenant();
  const supabase = createClient();
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busquedaInventario, setBusquedaInventario] = useState("");
  const [productoEditando, setProductoEditando] = useState<any>(null);
  const [modalEliminarProd, setModalEliminarProd] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState<any>(null);

  const cargarProductos = async () => {
    setLoading(true);
    const { data } = await supabase.from("productos").select("*").eq("tenant_id", tenantId).order("categoria", { ascending: true });
    if (data) setProductos(data);
    setLoading(false);
  };

  useEffect(() => {
    cargarProductos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const abrirModalNuevo = () => setProductoEditando({ nombre: "", precio: 0, stock: 0, stock_apartado: 0, categoria: "Otros", imagen_url: "" });

  const guardarProducto = async () => {
    if (!productoEditando) return;
    setLoading(true);
    try {
      if (productoEditando.id) {
        await supabase.from("productos").update({ 
          nombre: productoEditando.nombre, precio: productoEditando.precio, stock: productoEditando.stock, categoria: productoEditando.categoria, imagen_url: productoEditando.imagen_url 
        }).eq("id", productoEditando.id);
      } else {
        await supabase.from("productos").insert({ 
          nombre: productoEditando.nombre, precio: productoEditando.precio, stock: productoEditando.stock, stock_apartado: 0, categoria: productoEditando.categoria, imagen_url: productoEditando.imagen_url, tenant_id: tenantId 
        });
      }
      setProductoEditando(null);
      await cargarProductos();
    } catch (error) {
      alert("Hubo un error al guardar el producto.");
    } finally {
      setLoading(false);
    }
  };

  const solicitarEliminar = (producto: any) => {
    setProductoAEliminar(producto);
    setModalEliminarProd(true);
  };

  const ejecutarEliminar = async () => {
    if (!productoAEliminar) return;
    setLoading(true);
    try {
      await supabase.from("productos").delete().eq("id", productoAEliminar.id);
      setModalEliminarProd(false);
      setProductoAEliminar(null);
      await cargarProductos();
    } catch (error) {
      alert("No se pudo eliminar el producto.");
    } finally {
      setLoading(false);
    }
  };

  const inventarioFiltrado = productos.filter(p => p.nombre.toLowerCase().includes(busquedaInventario.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-start md:items-center">
        <div className="relative flex-1 w-full">
          <i className="icon-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          {/* CORRECCIÓN: focus:ring-primario/20 en lugar de primario0 */}
          <input type="text" placeholder="Buscar componente..." className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-primario/20 transition-all shadow-sm" value={busquedaInventario} onChange={(e) => setBusquedaInventario(e.target.value)} />
        </div>
        {/* CORRECCIÓN: Botón principal usa hover:opacity-90 y shadow-sm/30 */}
        <button onClick={abrirModalNuevo} className="cursor-pointer flex-shrink-0 w-full md:w-auto bg-gradient-to-t from-secundario to-primario text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-lg shadow-sm active:scale-95">
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
                    {prod.imagen_url ? <img src={prod.imagen_url} alt={prod.nombre} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400"><i className="icon-laptop"></i></div>}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm truncate max-w-[200px]">{prod.nombre}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{prod.categoria}</p>
                  </div>
                </td>
                <td className="p-4 font-black text-primario text-sm">${prod.precio}</td>
                <td className="p-4 text-center"><span className={`text-[11px] font-black px-2 py-1 rounded-lg ${prod.stock <= 2 ? 'bg-red-100 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>{prod.stock}</span></td>
                <td className="p-4 text-center"><span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">{prod.stock_apartado || 0}</span></td>
                <td className="p-4 text-right pr-6 flex items-center justify-end gap-2 h-[72px]">
                  {/* CORRECCIÓN: bg-primario/10 text-primario hover:bg-primario/20 */}
                  <button onClick={() => setProductoEditando(prod)} className="cursor-pointer w-8 h-8 flex items-center justify-center bg-primario/10 text-primario rounded-lg hover:bg-primario/20 transition-colors"><i className="icon-left-arrow rotate-180 text-[10px]"></i></button>
                  <button onClick={() => solicitarEliminar(prod)} className="cursor-pointer w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"><i className="icon-trash text-[10px]"></i></button>
                </td>
              </tr>
            )) : <tr><td colSpan={5} className="text-center py-12 text-slate-400 font-bold text-sm bg-slate-50 border-2 border-dashed border-slate-200 rounded-b-[2.5rem]">No hay productos.</td></tr>}
          </tbody>
        </table>
      </div>

      {productoEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-6 md:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 my-8">
            <button onClick={() => setProductoEditando(null)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"><i className="icon-close font-bold">x</i></button>
            <div className="mb-6">
              <h3 className="text-xl font-black text-slate-900">{productoEditando.id ? "Editar Producto" : "Nuevo Producto"}</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
                {/* CORRECCIÓN: focus:ring añadidos */}
                <input className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primario/20 transition-all" value={productoEditando.nombre} onChange={(e) => setProductoEditando({...productoEditando, nombre: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Precio</label>
                  <input type="number" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primario/20 transition-all" value={productoEditando.precio} onChange={(e) => setProductoEditando({...productoEditando, precio: Number(e.target.value)})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock</label>
                  <input type="number" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primario/20 transition-all" value={productoEditando.stock} onChange={(e) => setProductoEditando({...productoEditando, stock: Number(e.target.value)})} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoría</label>
                <select className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none cursor-pointer focus:ring-2 focus:ring-primario/20 transition-all" value={productoEditando.categoria} onChange={(e) => setProductoEditando({...productoEditando, categoria: e.target.value})}>
                  {CATEGORIAS_PRODUCTO.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL de Imagen</label>
                <input className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primario/20 transition-all" value={productoEditando.imagen_url} onChange={(e) => setProductoEditando({...productoEditando, imagen_url: e.target.value})} />
              </div>
            </div>
            {/* CORRECCIÓN: Botón principal */}
            <button onClick={guardarProducto} disabled={loading || !productoEditando.nombre} className="w-full mt-8 py-4 bg-gradient-to-t from-secundario to-primario text-white font-black rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-sm disabled:opacity-50 cursor-pointer active:scale-[0.98]">
              {loading ? "Guardando..." : "Guardar Producto"}
            </button>
          </div>
        </div>
      )}

      {modalEliminarProd && productoAEliminar && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-6 md:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl mb-4 bg-red-100 text-red-500"><i className="icon-trash"></i></div>
            <h3 className="text-xl font-black text-slate-900 mb-2">¿Eliminar Producto?</h3>
            <p className="text-sm text-slate-500 mb-8">{productoAEliminar.nombre}</p>
            <div className="flex gap-3">
              <button onClick={() => { setModalEliminarProd(false); setProductoAEliminar(null); }} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-2xl hover:bg-slate-200 cursor-pointer transition-colors">Cancelar</button>
              <button onClick={ejecutarEliminar} disabled={loading} className="flex-1 font-bold py-3.5 rounded-2xl text-white bg-red-500 shadow-red-200 hover:bg-red-600 cursor-pointer transition-colors">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}