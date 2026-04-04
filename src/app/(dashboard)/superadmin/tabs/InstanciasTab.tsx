"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useTenant } from "@/context/TenantContext";

export default function InstanciasTab() {
  const supabase = createClient();
  const router = useRouter();
  const { recargarConfiguracion } = useTenant();
  
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'success' | 'error' } | null>(null);

  const [modalNuevo, setModalNuevo] = useState(false);
  const [nuevoTenant, setNuevoTenant] = useState({ organizacion: "", nombre: "" });
  const [creando, setCreando] = useState(false);

  const [modalOpciones, setModalOpciones] = useState(false);
  const [tenantActivo, setTenantActivo] = useState<any>(null);
  const [procesando, setProcesando] = useState(false);
  const [textoEliminar, setTextoEliminar] = useState("");

  const mostrarToast = (mensaje: string, tipo: 'success' | 'error') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 4000); 
  };

  useEffect(() => {
    cargarTenants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarTenants = async () => {
    setLoading(true);
    const { data: dataTenants } = await supabase
      .from("tenants")
      .select("*")
      .order("id", { ascending: true });

    if (dataTenants) setTenants(dataTenants);
    setLoading(false);
  };

  const crearTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreando(true);

    const identidadBase = {
      organizacion: nuevoTenant.organizacion,
      nombre: nuevoTenant.nombre,
      logoIcono: "icon-app-logo",
      carreras: []
    };

    const modulosBase = {
      mapa: false, directorio: true, portales: true, archivo: false, 
      tienda: false, perfil: true, ieee: false 
    };

    const coloresBase = { primario: "#0f172a", secundario: "#334155" };

    try {
      const { error } = await supabase.from("tenants").insert({
        identidad: identidadBase, modulos: modulosBase, colores: coloresBase,
        comunidades: [], edificios: [], documentos: [], portales: [], avisos: []
      });

      if (error) throw new Error(error.message);

      setModalNuevo(false);
      setNuevoTenant({ organizacion: "", nombre: "" });
      await cargarTenants(); 
      mostrarToast("¡Nueva instancia creada con éxito!", "success");
    } catch (error: any) {
      mostrarToast(error.message || "Hubo un error al crear la instancia.", "error");
    } finally {
      setCreando(false);
    }
  };

  const abrirOpciones = (tenant: any) => {
    setTenantActivo(JSON.parse(JSON.stringify(tenant))); 
    setTextoEliminar("");
    setModalOpciones(true);
  };

  const guardarEdicionRapida = async () => {
    setProcesando(true);
    try {
      const { error } = await supabase
        .from("tenants")
        .update({ identidad: tenantActivo.identidad })
        .eq("id", tenantActivo.id);

      if (error) throw error;
      setModalOpciones(false);
      await cargarTenants();
      mostrarToast("Nombres actualizados correctamente.", "success");
    } catch (error: any) {
      mostrarToast(error.message || "Error al actualizar la instancia.", "error");
    } finally {
      setProcesando(false);
    }
  };

  const eliminarInstancia = async () => {
    if (textoEliminar !== "ELIMINAR") return;
    setProcesando(true);
    try {
      const { error } = await supabase.from("tenants").delete().eq("id", tenantActivo.id);
      if (error) throw error;
      setModalOpciones(false);
      await cargarTenants();
      mostrarToast("Instancia eliminada permanentemente.", "success");
    } catch (error: any) {
      mostrarToast(error.message || "Error al eliminar. Revisa que no tenga usuarios ligados.", "error");
    } finally {
      setProcesando(false);
    }
  };

  const administrarComoMaster = async () => {
    setProcesando(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await supabase.from("perfiles").update({ tenant_id: tenantActivo.id }).eq("id", session.user.id);
      await recargarConfiguracion();
      router.push("/admin");
    } catch (error) {
      mostrarToast("Error al intentar redirigir.", "error");
      setProcesando(false);
    }
  };

  const tenantsFiltrados = tenants.filter(t => {
    const termino = busqueda.toLowerCase();
    const org = (t.identidad?.organizacion || "").toLowerCase();
    const nom = (t.identidad?.nombre || "").toLowerCase();
    return org.includes(termino) || nom.includes(termino) || t.id.toString().includes(termino);
  });

  return (
    <div className="space-y-6 relative">
      
      {toast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-2xl shadow-2xl z-[200] animate-in slide-in-from-bottom-5 fade-in duration-300 font-bold text-sm flex items-center gap-3 whitespace-nowrap ${
          toast.tipo === 'success' ? 'bg-slate-900 text-white' : 'bg-red-500 text-white'
        }`}>
          <i className={toast.tipo === 'success' ? 'icon-check-solid-full' : 'icon-close text-lg'}></i>
          {toast.mensaje}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl border border-blue-100">
              <i className="icon-directory"></i>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Instancias</p>
              <p className="text-2xl font-black text-slate-900 leading-none mt-1">{loading ? "-" : tenants.length}</p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setModalNuevo(true)}
          className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-600/30 active:scale-95 flex items-center gap-2"
        >
          <i className="icon-plus"></i> Nueva Instancia
        </button>
      </div>

      <div className="relative">
        <i className="icon-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></i>
        <input 
          type="text"
          placeholder="Buscar por ID, Institución o Campus..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-widest text-slate-500">
                <th className="p-5 font-black">ID</th>
                <th className="p-5 font-black">Institución</th>
                <th className="p-5 font-black">Campus / Sede</th>
                <th className="p-5 font-black">Módulos Activos</th>
                <th className="p-5 font-black text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                 <tr>
                   <td colSpan={5} className="p-10 text-center text-slate-400 font-bold animate-pulse">Cargando instancias...</td>
                 </tr>
              ) : tenantsFiltrados.map((tenant) => {
                const activeModules = Object.keys(tenant.modulos || {}).filter(k => tenant.modulos[k]).length;
                const totalModules = Object.keys(tenant.modulos || {}).length;
                
                return (
                  <tr key={tenant.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                    <td className="p-5 font-mono font-bold text-slate-400">#{tenant.id}</td>
                    <td className="p-5 font-bold text-slate-900">{tenant.identidad?.organizacion || "Sin Organización"}</td>
                    <td className="p-5 font-medium text-slate-600">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: tenant.colores?.primario || '#cbd5e1' }}></div>
                        {tenant.identidad?.nombre || "Sin Nombre"}
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-100">
                        {activeModules} / {totalModules} ON
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <button onClick={() => abrirOpciones(tenant)} className="cursor-pointer w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors ml-auto active:scale-95">
                        <i className="icon-right-arrow"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!loading && tenants.length > 0 && tenantsFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <p className="text-slate-600 font-bold">No se encontraron clientes</p>
                    <p className="text-slate-400 text-sm mt-1">Intenta con otro término de búsqueda.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalNuevo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-6 md:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Nueva Instancia</h3>
              <button onClick={() => setModalNuevo(false)} className="cursor-pointer w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex justify-center items-center transition-colors active:scale-95">
                <i className="icon-close font-bold"></i>
              </button>
            </div>
            <form onSubmit={crearTenant} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Institución (Cliente)</label>
                <input required placeholder="Ej. UADY, Anáhuac" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={nuevoTenant.organizacion} onChange={(e) => setNuevoTenant({...nuevoTenant, organizacion: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Campus / Facultad</label>
                <input required placeholder="Ej. Facultad de Arquitectura" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={nuevoTenant.nombre} onChange={(e) => setNuevoTenant({...nuevoTenant, nombre: e.target.value})} />
              </div>
              <button type="submit" disabled={creando} className="cursor-pointer w-full py-4 mt-2 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 active:scale-95">
                {creando ? 'Creando...' : 'Crear y Guardar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {modalOpciones && tenantActivo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-6 md:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Opciones del Cliente</h3>
              <button onClick={() => setModalOpciones(false)} className="cursor-pointer w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex justify-center items-center transition-colors active:scale-95">
                <i className="icon-close font-bold"></i>
              </button>
            </div>
            <div className="mb-6 pb-6 border-b border-slate-100">
              <button onClick={administrarComoMaster} disabled={procesando} className="cursor-pointer w-full py-3.5 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 flex justify-center items-center gap-2 active:scale-95 disabled:opacity-50">
                <i className="icon-laptop"></i> Entrar al Panel de esta Instancia
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Editar Institución</label>
                <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={tenantActivo.identidad.organizacion} onChange={(e) => setTenantActivo({...tenantActivo, identidad: {...tenantActivo.identidad, organizacion: e.target.value}})} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Editar Campus</label>
                <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={tenantActivo.identidad.nombre} onChange={(e) => setTenantActivo({...tenantActivo, identidad: {...tenantActivo.identidad, nombre: e.target.value}})} />
              </div>
              <button onClick={guardarEdicionRapida} disabled={procesando} className="cursor-pointer w-full py-3 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest active:scale-95 disabled:opacity-50">
                Actualizar Nombres
              </button>
            </div>
            <div className="pt-6 border-t border-slate-100">
              <label className="text-[10px] font-black text-red-400 uppercase tracking-widest ml-1">Eliminar Cliente Definitivamente</label>
              <div className="flex gap-2 mt-1.5">
                <input placeholder="Escribe ELIMINAR" className="w-full p-3 bg-red-50 border border-red-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-red-900 placeholder-red-300 uppercase" value={textoEliminar} onChange={(e) => setTextoEliminar(e.target.value.toUpperCase())} />
                <button onClick={eliminarInstancia} disabled={procesando || textoEliminar !== "ELIMINAR"} className="cursor-pointer px-4 bg-red-500 text-white font-black rounded-xl hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95">
                  <i className="icon-trash-solid-full"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}