"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SuperAdminPage() {
  const supabase = createClient();
  const router = useRouter();

  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<any[]>([]);
  
  // Estado para el Buscador
  const [busqueda, setBusqueda] = useState("");

  // NUEVO: Sistema de Notificaciones (Toasts)
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'success' | 'error' } | null>(null);

  const mostrarToast = (mensaje: string, tipo: 'success' | 'error') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 4000); // Desaparece después de 4 segundos
  };

  // Estados para el Modal de Nuevo Tenant
  const [modalNuevo, setModalNuevo] = useState(false);
  const [nuevoTenant, setNuevoTenant] = useState({
    organizacion: "",
    nombre: "",
  });
  const [creando, setCreando] = useState(false);

  // Estados para el Modal de Opciones
  const [modalOpciones, setModalOpciones] = useState(false);
  const [tenantActivo, setTenantActivo] = useState<any>(null);
  const [procesando, setProcesando] = useState(false);
  const [textoEliminar, setTextoEliminar] = useState("");

  useEffect(() => {
    verificarYCargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verificarYCargar = async () => {
    setLoading(true);
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

    if (perfil?.rol !== "superadmin") {
      router.push("/");
      return;
    }

    setIsSuperAdmin(true);

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

    const coloresBase = {
      primario: "#0f172a", 
      secundario: "#334155" 
    };

    try {
      const { data, error } = await supabase.from("tenants").insert({
        identidad: identidadBase, modulos: modulosBase, colores: coloresBase,
        comunidades: [], edificios: [], documentos: [], portales: [], avisos: []
      }).select();

      if (error) {
        console.error("Error detallado de Supabase:", error);
        throw new Error(error.message || "Error de permisos en la base de datos");
      }

      setModalNuevo(false);
      setNuevoTenant({ organizacion: "", nombre: "" });
      await verificarYCargar(); 
      mostrarToast("¡Nueva instancia creada con éxito!", "success");
    } catch (error: any) {
      console.error("Catch error:", error);
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
      await verificarYCargar();
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
      await verificarYCargar();
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
      router.push("/admin");
    } catch (error) {
      mostrarToast("Error al intentar redirigir.", "error");
      setProcesando(false);
    }
  };

  // Filtrado Dinámico de Clientes
  const tenantsFiltrados = tenants.filter(t => {
    const termino = busqueda.toLowerCase();
    const org = (t.identidad?.organizacion || "").toLowerCase();
    const nom = (t.identidad?.nombre || "").toLowerCase();
    const idStr = t.id.toString();
    
    return org.includes(termino) || nom.includes(termino) || idStr.includes(termino);
  });

  if (loading && !isSuperAdmin) return <div className="p-20 text-center font-bold text-slate-400 animate-pulse">Verificando credenciales maestras...</div>;
  if (!isSuperAdmin) return null;

  return (
    <main className="min-h-[100dvh] w-full bg-slate-50 text-slate-900 p-4 md:p-8 overflow-y-auto pb-32 font-sans relative">
      
      {/* COMPONENTE TOAST FLOTANTE */}
      {toast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-2xl shadow-2xl z-[200] animate-in slide-in-from-bottom-5 fade-in duration-300 font-bold text-sm flex items-center gap-3 whitespace-nowrap ${
          toast.tipo === 'success' ? 'bg-slate-900 text-white' : 'bg-red-500 text-white'
        }`}>
          <i className={toast.tipo === 'success' ? 'icon-check-solid-full' : 'icon-close text-lg'}></i>
          {toast.mensaje}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest mb-3 shadow-sm">
              <i className="icon-laptop"></i> E-nnova Design Master
            </div>
            <h1 className="text-3xl font-black tracking-tight">Gestión de Clientes (SaaS)</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Administra las instancias de Nodum activas.</p>
          </div>
          <button 
            onClick={() => setModalNuevo(true)}
            className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-600/30 active:scale-95 flex items-center gap-2"
          >
            <i className="icon-plus"></i> Nueva Instancia
          </button>
        </header>

        {/* Tarjetas de Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl border border-blue-100">
              <i className="icon-directory"></i>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Instancias</p>
              <p className="text-3xl font-black text-slate-900 leading-none mt-1">{tenants.length}</p>
            </div>
          </div>
        </div>

        {/* Buscador de Instancias */}
        <div className="mb-6 relative">
          <i className="icon-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></i>
          <input 
            type="text"
            placeholder="Buscar por ID, Institución o Campus..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {/* Tabla de Tenants */}
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
                {tenantsFiltrados.map((tenant) => {
                  const activeModules = Object.keys(tenant.modulos || {}).filter(k => tenant.modulos[k]).length;
                  const totalModules = Object.keys(tenant.modulos || {}).length;
                  
                  return (
                    <tr key={tenant.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                      <td className="p-5 font-mono font-bold text-slate-400">#{tenant.id}</td>
                      <td className="p-5 font-bold text-slate-900">{tenant.identidad?.organizacion || "Sin Organización"}</td>
                      <td className="p-5 font-medium text-slate-600">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full shadow-sm" 
                            style={{ backgroundColor: tenant.colores?.primario || '#cbd5e1' }}
                          ></div>
                          {tenant.identidad?.nombre || "Sin Nombre"}
                        </div>
                      </td>
                      <td className="p-5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-100">
                          {activeModules} / {totalModules} ON
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        <button 
                          onClick={() => abrirOpciones(tenant)}
                          className="cursor-pointer w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors ml-auto active:scale-95"
                        >
                          <i className="icon-right-arrow"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {tenants.length > 0 && tenantsFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                        <i className="icon-magnifying-glass text-2xl text-slate-300"></i>
                      </div>
                      <p className="text-slate-600 font-bold">No se encontraron clientes</p>
                      <p className="text-slate-400 text-sm mt-1">Intenta con otro término de búsqueda.</p>
                    </td>
                  </tr>
                )}
                {tenants.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-slate-500 font-medium">
                      No hay instancias registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL DE NUEVA INSTANCIA */}
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

      {/* MODAL DE OPCIONES DE INSTANCIA (Editar/Administrar/Eliminar) */}
      {modalOpciones && tenantActivo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-6 md:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Opciones del Cliente</h3>
              <button onClick={() => setModalOpciones(false)} className="cursor-pointer w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex justify-center items-center transition-colors active:scale-95">
                <i className="icon-close font-bold"></i>
              </button>
            </div>

            {/* Acceso Directo */}
            <div className="mb-6 pb-6 border-b border-slate-100">
              <button 
                onClick={administrarComoMaster}
                disabled={procesando}
                className="cursor-pointer w-full py-3.5 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 flex justify-center items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <i className="icon-laptop"></i> Entrar al Panel de esta Instancia
              </button>
            </div>

            {/* Edición Rápida */}
            <div className="space-y-4 mb-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Editar Institución</label>
                <input 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={tenantActivo.identidad.organizacion}
                  onChange={(e) => setTenantActivo({...tenantActivo, identidad: {...tenantActivo.identidad, organizacion: e.target.value}})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Editar Campus</label>
                <input 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={tenantActivo.identidad.nombre}
                  onChange={(e) => setTenantActivo({...tenantActivo, identidad: {...tenantActivo.identidad, nombre: e.target.value}})}
                />
              </div>
              <button 
                onClick={guardarEdicionRapida}
                disabled={procesando}
                className="cursor-pointer w-full py-3 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest active:scale-95 disabled:opacity-50"
              >
                Actualizar Nombres
              </button>
            </div>

            {/* Zona de Peligro */}
            <div className="pt-6 border-t border-slate-100">
              <label className="text-[10px] font-black text-red-400 uppercase tracking-widest ml-1">Eliminar Cliente Definitivamente</label>
              <div className="flex gap-2 mt-1.5">
                <input 
                  placeholder="Escribe ELIMINAR"
                  className="w-full p-3 bg-red-50 border border-red-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-red-900 placeholder-red-300 uppercase"
                  value={textoEliminar}
                  onChange={(e) => setTextoEliminar(e.target.value.toUpperCase())}
                />
                <button 
                  onClick={eliminarInstancia}
                  disabled={procesando || textoEliminar !== "ELIMINAR"}
                  className="cursor-pointer px-4 bg-red-500 text-white font-black rounded-xl hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  <i className="icon-trash-solid-full"></i>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </main>
  );
}