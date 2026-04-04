"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@/lib/supabase";

export type Plataforma = "facebook" | "instagram" | "tiktok" | "sitio";

interface AccesoRapido { titulo: string; icono: string; ruta: string; externo:boolean; }
interface Identidad { nombre: string; organizacion: string; logoIcono: string; carreras: string[]; accesos_rapidos?: AccesoRapido[] }
// ✨ NUEVO: Añadido "mantenimiento" a la interfaz de Módulos
interface Modulos { mapa: boolean; directorio: boolean; portales: boolean; archivo: boolean; tienda: boolean; perfil: boolean; ieee: boolean; mantenimiento: boolean; emprendedores: boolean}
interface Comunidad { nombre: string; handle: string; color: string; iconColor: string; plataformas: Partial<Record<Plataforma, string>>; }
interface Colores { primario: string; secundario: string; }
export interface Aviso { id: string; titulo: string; descripcion: string; icono: string; fecha_creacion: string; fecha_expiracion: string | null; mantener_activo: boolean; }

interface TenantContextType {
  tenantId: number; 
  identidad: Identidad; modulos: Modulos; comunidades: Comunidad[];
  colores: Colores; edificios: any[]; documentos: any[]; portales: any[];
  avisos: Aviso[];
  loadingConfig: boolean;
  recargarConfiguracion: () => Promise<void>;
}

const defaultContext: TenantContextType = {
  tenantId: 1, 
  identidad: { nombre: "Cargando...", organizacion: "Cargando...", logoIcono: "icon-app-logo", carreras: [] },
  // ✨ NUEVO: Estado por defecto del módulo de mantenimiento (apagado por seguridad)
  modulos: { mapa: false, directorio: false, portales: false, archivo: false, tienda: false, perfil: true, ieee: true, mantenimiento: false, emprendedores: false},
  comunidades: [], colores: { primario: "#98002e", secundario: "#61116a" }, 
  edificios: [], documentos: [], portales: [], avisos: [],
  loadingConfig: true, recargarConfiguracion: async () => {},
}

const TenantContext = createContext<TenantContextType>(defaultContext);

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const [tenantId, setTenantId] = useState<number>(defaultContext.tenantId);
  const [identidad, setIdentidad] = useState<Identidad>(defaultContext.identidad);
  const [modulos, setModulos] = useState<Modulos>(defaultContext.modulos);
  const [comunidades, setComunidades] = useState<Comunidad[]>(defaultContext.comunidades);
  const [colores, setColores] = useState<Colores>(defaultContext.colores);
  const [edificios, setEdificios] = useState<any[]>(defaultContext.edificios);
  const [documentos, setDocumentos] = useState<any[]>(defaultContext.documentos);
  const [portales, setPortales] = useState<any[]>(defaultContext.portales);
  const [avisos, setAvisos] = useState<Aviso[]>(defaultContext.avisos);
  const [loadingConfig, setLoadingConfig] = useState(true);
  
  const supabase = createClient();

  const cargarConfiguracion = async () => {
    setLoadingConfig(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      let currentTenantId = 1; 

      if (session) {
        const { data: perfil } = await supabase
          .from("perfiles")
          .select("tenant_id")
          .eq("id", session.user.id)
          .single();
          
        if (perfil?.tenant_id) {
          currentTenantId = perfil.tenant_id;
        }
      }

      setTenantId(currentTenantId);

      const { data, error } = await supabase.rpc('get_tenant_public_config', { 
        p_tenant_id: currentTenantId 
      });

      if (data && !error) {
        const dataIdentidad = data.identidad || {};
        setIdentidad({ ...defaultContext.identidad, ...dataIdentidad, carreras: dataIdentidad.carreras || [] });
        setModulos({ ...defaultContext.modulos, ...(data.modulos || {}) });
        setColores({ ...defaultContext.colores, ...(data.colores || {}) });
        setComunidades(data.comunidades || []);
        setEdificios(data.edificios || []);
        setDocumentos(data.documentos || []);
        setPortales(data.portales || []);
        setAvisos(data.avisos || []);
      }
    } catch (error) {
      console.error("Error cargando configuración del tenant:", error);
    } finally {
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    cargarConfiguracion();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        cargarConfiguracion();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TenantContext.Provider value={{ 
      tenantId, identidad, modulos, comunidades, colores, edificios, 
      documentos, portales, avisos, loadingConfig, recargarConfiguracion: cargarConfiguracion 
    }}>
      <div 
        className="contents" 
        style={{
          "--color-primario": colores.primario,
          "--color-secundario": colores.secundario,
        } as React.CSSProperties}
      >
        {children}
      </div>
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);