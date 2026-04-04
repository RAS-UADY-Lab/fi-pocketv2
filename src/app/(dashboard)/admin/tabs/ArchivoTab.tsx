"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useTenant } from "@/context/TenantContext";

export default function ArchivoTab() {
  const { documentos, recargarConfiguracion, tenantId } = useTenant();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [docEditando, setDocEditando] = useState<any>(null);

  const abrirModal = (doc?: any) => {
    if (doc) setDocEditando(doc);
    else setDocEditando({ titulo: "", descripcion: "", tipo: "PDF", peso: "1 MB", url: "" });
  };

  const guardarDoc = async () => {
    setLoading(true);
    let nuevosDocs = [...documentos];
    
    const index = nuevosDocs.findIndex(d => d.url === docEditando.url && d.titulo === docEditando.titulo);
    if (index >= 0) nuevosDocs[index] = docEditando;
    else nuevosDocs.push(docEditando);

    const { error } = await supabase.from("tenants").update({ documentos: nuevosDocs }).eq("id", tenantId);
    if (!error) {
      await recargarConfiguracion();
      setDocEditando(null);
    }
    setLoading(false);
  };

  const eliminarDoc = async (index: number) => {
    if(!confirm("¿Borrar documento?")) return;
    setLoading(true);
    let nuevosDocs = [...documentos];
    nuevosDocs.splice(index, 1);
    await supabase.from("tenants").update({ documentos: nuevosDocs }).eq("id", tenantId);
    await recargarConfiguracion();
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-900">Repositorio de Documentos</h2>
        </div>
        <button onClick={() => abrirModal()} className="cursor-pointer bg-gradient-to-t from-secundario to-primario text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase hover:opacity-90 transition-all shadow-md active:scale-95">
          + Subir Documento
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {documentos.map((doc: any, idx: number) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm">
            <div>
              <h3 className="font-bold text-slate-800">{doc.titulo}</h3>
              <p className="text-xs text-slate-500">{doc.tipo} • {doc.peso}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => eliminarDoc(idx)} className="cursor-pointer w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"><i className="icon-trash"></i></button>
            </div>
          </div>
        ))}
      </div>

      {docEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setDocEditando(null)} className="cursor-pointer absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"><i className="icon-close font-bold">x</i></button>
            <h3 className="font-black text-lg mb-4">Información del Documento</h3>
            
            <div className="space-y-3">
              <input placeholder="Título (Ej. Reglamento)" className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 focus:ring-2 focus:ring-primario/20 transition-all" value={docEditando.titulo} onChange={e => setDocEditando({...docEditando, titulo: e.target.value})} />
              <input placeholder="Descripción breve" className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 focus:ring-2 focus:ring-primario/20 transition-all" value={docEditando.descripcion} onChange={e => setDocEditando({...docEditando, descripcion: e.target.value})} />
              <input placeholder="URL del archivo (Drive, Dropbox, etc)" className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 focus:ring-2 focus:ring-primario/20 transition-all" value={docEditando.url} onChange={e => setDocEditando({...docEditando, url: e.target.value})} />
              
              <div className="flex gap-3">
                <select className="cursor-pointer w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 focus:ring-2 focus:ring-primario/20 transition-all" value={docEditando.tipo} onChange={e => setDocEditando({...docEditando, tipo: e.target.value})}>
                  <option value="PDF">PDF</option>
                  <option value="WORD">WORD</option>
                  <option value="EXCEL">EXCEL</option>
                </select>
                <input placeholder="Peso (Ej. 2 MB)" className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 focus:ring-2 focus:ring-primario/20 transition-all" value={docEditando.peso} onChange={e => setDocEditando({...docEditando, peso: e.target.value})} />
              </div>
            </div>
            <button onClick={guardarDoc} disabled={loading} className="cursor-pointer w-full mt-6 py-3.5 bg-gradient-to-t from-secundario to-primario text-white font-black rounded-xl hover:opacity-90 transition-all shadow-md disabled:opacity-50 active:scale-[0.98]">
              {loading ? "Guardando..." : "Guardar Documento"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}