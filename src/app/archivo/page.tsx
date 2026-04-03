"use client";

import { useTenant } from "@/context/TenantContext";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ArchivoPage() {
  const { documentos, loadingConfig } = useTenant();
  const supabase = createClient();
  const router = useRouter();
  const [loadingAuth, setLoadingAuth] = useState(true);

  // NUEVO: Candado de seguridad para invitados
  useEffect(() => {
    const verificarAcceso = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }
      setLoadingAuth(false);
    };
    verificarAcceso();
  }, [supabase, router]);

  if (loadingConfig || loadingAuth) {
    return <div className="p-8 text-center animate-pulse text-slate-400 font-bold">Cargando archivo...</div>;
  }

  return (
    <main className="flex flex-col h-full max-w-4xl mx-auto p-4 md:p-8">
      
      <header className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Archivo</h1>
        <p className="text-slate-500">Documentos, formatos y reglamentos importantes a tu alcance.</p>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-6">
        {documentos.length > 0 ? (
          <div className="flex flex-col gap-3">
            {documentos.map((doc, idx) => (
              <a 
                key={idx}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-4 md:p-5 bg-white border border-slate-200 rounded-2xl hover:border-primario/50 hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-colors ${
                    doc.tipo === "PDF" ? "bg-red-50 text-red-500 group-hover:bg-red-100" : 
                    doc.tipo === "WORD" ? "bg-blue-50 text-blue-600 group-hover:bg-blue-100" :
                    "bg-emerald-50 text-emerald-500 group-hover:bg-emerald-100"
                  }`}>
                    <i className={doc.tipo === "PDF" ? "icon-file-pdf" : doc.tipo === "WORD" ? "icon-file-word" : "icon-file"}></i>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-slate-800 group-hover:text-primario transition-colors">
                      {doc.titulo}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                      {doc.descripcion}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {doc.tipo}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {doc.peso}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-gradient-to-t group-hover:from-secundario group-hover:to-primario group-hover:text-white transition-all shadow-sm group-hover:shadow-md flex-shrink-0 ml-4">
                  <i className="icon-download text-lg"></i>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem]">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="icon-archive text-3xl text-slate-400"></i>
            </div>
            <h3 className="text-lg font-bold text-slate-700">No hay documentos</h3>
            <p className="text-slate-500 mt-1">Aún no se han subido archivos a esta sección.</p>
          </div>
        )}
      </div>

    </main>
  );
}