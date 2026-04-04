"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

// Importación de las pestañas
import InstanciasTab from "./tabs/InstanciasTab";
import LeadsTab from "./tabs/LeadsTab";
import SoporteAppTab from "./tabs/SoporteAppTab";

type SuperAdminTab = "instancias" | "leads" | "soporte";

export default function SuperAdminPage() {
  const supabase = createClient();
  const router = useRouter();

  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [tabActiva, setTabActiva] = useState<SuperAdminTab>("instancias");

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

      if (perfil?.rol !== "superadmin") {
        router.push("/");
        return;
      }

      setIsSuperAdmin(true);
      setLoadingAuth(false);
    };

    verificarAcceso();
  }, [supabase, router]);

  if (loadingAuth) return <div className="p-20 text-center font-bold text-slate-400 animate-pulse">Verificando credenciales maestras...</div>;
  if (!isSuperAdmin) return null;

  const tabClasses = (tab: SuperAdminTab) => `
    cursor-pointer px-4 md:px-6 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap active:scale-95
    ${tabActiva === tab ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"}
  `;

  return (
    <main className="min-h-[100dvh] w-full bg-slate-50 text-slate-900 p-4 md:p-8 overflow-y-auto pb-32 font-sans relative">
      
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest mb-3 shadow-sm">
            <i className="icon-laptop"></i> E-nnova Design Master
          </div>
          <h1 className="text-3xl font-black tracking-tight">Centro de Control Global</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Administración maestra de Nodum SaaS.</p>
        </header>

        {/* Menú Ordenado por Relevancia */}
        <nav className="flex gap-2 mb-8 bg-slate-100 p-1.5 rounded-2xl w-full overflow-x-auto custom-scrollbar">
          <button onClick={() => setTabActiva("instancias")} className={tabClasses("instancias")}>Gestión de Clientes</button>
          <button onClick={() => setTabActiva("soporte")} className={tabClasses("soporte")}>Soporte App</button>
          <button onClick={() => setTabActiva("leads")} className={tabClasses("leads")}>Prospectos Comerciales</button>
        </nav>

        {/* Renderizado Dinámico */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {tabActiva === "instancias" && <InstanciasTab />}
          {tabActiva === "leads" && <LeadsTab />}
          {tabActiva === "soporte" && <SoporteAppTab />}
        </div>
      </div>

    </main>
  );
}