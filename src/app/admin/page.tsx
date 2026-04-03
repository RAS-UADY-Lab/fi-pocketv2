"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useTenant } from "@/context/TenantContext";

import ConfiguracionTab from "./tabs/ConfiguracionTab";
import ArchivoTab from "./tabs/ArchivoTab";
import PortalesTab from "./tabs/PortalesTab";
import PendientesTab from "./tabs/PendientesTab";
import PedidosTab from "./tabs/PedidosTab";
import InventarioTab from "./tabs/InventarioTab";
import CampusTab from "./tabs/CampusTab";
import DirectorioTab from "./tabs/DirectorioTab";
import ComunidadesTab from "./tabs/ComunidadesTab";
import AvisosTab from "./tabs/AvisosTab";

type TabType = "pendientes" | "directorio" | "pedidos" | "inventario" | "campus" | "archivo" | "portales" | "comunidades" | "avisos" | "configuracion";

export default function AdminPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const { modulos, tenantId, recargarConfiguracion } = useTenant();

  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false); // <-- Estado para el selector master
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [tabActiva, setTabActiva] = useState<TabType>("configuracion");

  // Estados para el selector de SuperAdmin
  const [listaTenants, setListaTenants] = useState<any[]>([]);
  const [cambiandoTenant, setCambiandoTenant] = useState(false);

  useEffect(() => {
    const verificarAcceso = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", session.user.id).single();
      
      // Permitimos acceso a admins Y superadmins
      if (perfil?.rol !== "admin" && perfil?.rol !== "superadmin") {
        router.push("/");
        return;
      }

      setIsAdmin(true);

      // Si es SuperAdmin, cargamos la lista de todos los tenants para el selector
      if (perfil?.rol === "superadmin") {
        setIsSuperAdmin(true);
        const { data: tenantsData } = await supabase.from("tenants").select("id, identidad").order("id", { ascending: true });
        if (tenantsData) setListaTenants(tenantsData);
      }

      setLoadingAuth(false);
    };
    verificarAcceso();
  }, [supabase, router]);

  // Función exclusiva para el SuperAdmin: Cambiar de instancia "en caliente"
  const handleCambiarTenant = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoTenantId = parseInt(e.target.value);
    setCambiandoTenant(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 1. Actualizamos el perfil del superadmin para que ahora apunte al nuevo tenant
      await supabase.from("perfiles").update({ tenant_id: nuevoTenantId }).eq("id", session.user.id);
      
      // 2. Le decimos al contexto que vuelva a cargar todo con el nuevo ID
      await recargarConfiguracion();
      
      // 3. Opcional: Reiniciar la pestaña a Configuración por seguridad
      setTabActiva("configuracion");

    } catch (error) {
      console.error("Error al cambiar de instancia:", error);
      alert("Hubo un problema al cambiar de instancia.");
    } finally {
      setCambiandoTenant(false);
    }
  };

  if (loadingAuth) return <div className="p-20 text-center font-bold text-slate-400 animate-pulse">Verificando credenciales...</div>;
  if (!isAdmin) return null;

  const tabClasses = (tab: TabType) => `
    cursor-pointer px-4 md:px-6 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap active:scale-95
    ${tabActiva === tab ? "bg-white text-primario shadow-sm" : "text-slate-500 hover:text-slate-700"}
  `;

  return (
    <main className="min-h-[100dvh] w-full max-w-6xl mx-auto p-4 md:p-8 overflow-y-auto no-scrollbar pb-32">
      
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Panel Administrativo</h1>
        </div>
        <p className="text-slate-500 text-sm font-medium">Centro de control de Nodum.</p>

        {/* SELECTOR DE INSTANCIA (Exclusivo para SuperAdmin) */}
        {isSuperAdmin && (
          <div className="mt-6 flex items-center gap-4 bg-slate-900 p-4 rounded-2xl shadow-lg border border-slate-800 animate-in fade-in slide-in-from-top-4">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 flex-shrink-0 border border-slate-700">
              <i className="icon-laptop text-xl"></i>
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Modo Master • Administrando Instancia</label>
              <select
                disabled={cambiandoTenant}
                value={tenantId || ""}
                onChange={handleCambiarTenant}
                className="w-full bg-transparent text-sm font-bold text-white outline-none cursor-pointer disabled:opacity-50 appearance-none"
              >
                {listaTenants.map((t) => (
                  <option key={t.id} value={t.id} className="text-slate-900">
                    {t.identidad?.organizacion} - {t.identidad?.nombre} (ID: {t.id})
                  </option>
                ))}
              </select>
            </div>
            {cambiandoTenant ? (
              <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
            ) : (
              <i className="icon-right-arrow text-slate-500 text-sm flex-shrink-0 transform rotate-90"></i>
            )}
          </div>
        )}
      </header>

      {/* Menú de Navegación Deslizable Dinámico */}
      <nav className={`flex gap-2 mb-8 bg-slate-100 p-1.5 rounded-2xl w-full overflow-x-auto custom-scrollbar transition-opacity duration-300 ${cambiandoTenant ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
        {modulos.ieee && (
          <button onClick={() => setTabActiva("pendientes")} className={tabClasses("pendientes")}>Solicitudes</button>
        )}
        
        {modulos.tienda && (
          <>
            <button onClick={() => setTabActiva("pedidos")} className={tabClasses("pedidos")}>Pedidos</button>
            <button onClick={() => setTabActiva("inventario")} className={tabClasses("inventario")}>Inventario</button>
          </>
        )}
        
        {modulos.mapa && (
          <button onClick={() => setTabActiva("campus")} className={tabClasses("campus")}>Campus</button>
        )}
        
        {modulos.directorio && (
          <button onClick={() => setTabActiva("directorio")} className={tabClasses("directorio")}>Miembros</button>
        )}

        <button onClick={() => setTabActiva("comunidades")} className={tabClasses("comunidades")}>Comunidades</button>
        <button onClick={() => setTabActiva("avisos")} className={tabClasses("avisos")}>Avisos</button>

        {modulos.archivo && (
          <button onClick={() => setTabActiva("archivo")} className={tabClasses("archivo")}>Archivo</button>
        )}
        
        {modulos.portales && (
          <button onClick={() => setTabActiva("portales")} className={tabClasses("portales")}>Portales</button>
        )}

        <button onClick={() => setTabActiva("configuracion")} className={tabClasses("configuracion")}>
          Configuración
        </button>
      </nav>

      {/* Renderizado Dinámico de Pestañas */}
      <div className={`animate-in fade-in slide-in-from-bottom-4 duration-500 transition-opacity ${cambiandoTenant ? "opacity-30 pointer-events-none" : "opacity-100"}`}>
        {tabActiva === "configuracion" && <ConfiguracionTab />}
        {tabActiva === "archivo" && <ArchivoTab />}
        {tabActiva === "portales" && <PortalesTab />}
        {tabActiva === "comunidades" && <ComunidadesTab />}
        {tabActiva === "avisos" && <AvisosTab />}
        {tabActiva === "pendientes" && <PendientesTab />}
        {tabActiva === "pedidos" && <PedidosTab />}
        {tabActiva === "inventario" && <InventarioTab />}
        {tabActiva === "campus" && <CampusTab />}
        {tabActiva === "directorio" && <DirectorioTab />}
      </div>

    </main>
  );
}