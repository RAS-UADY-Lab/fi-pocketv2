import { tenantConfig } from "@/config/tenant";

export default function ArchivoPage() {
  const { documentos } = tenantConfig;

  return (
    <main className="flex flex-col h-full max-w-4xl mx-auto p-4 md:p-8">
      
      <header className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Archivo</h1>
        <p className="text-slate-500">Documentos, formatos y reglamentos importantes a tu alcance.</p>
      </header>

      {/* Aplicamos custom-scrollbar aquí */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-6">
        {documentos.length > 0 ? (
          <div className="flex flex-col gap-3">
            {documentos.map((doc, idx) => (
              <a 
                key={idx}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-4 md:p-5 bg-white border border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  {/* Ícono dinámico dependiendo del tipo */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                    doc.tipo === "PDF" ? "bg-red-50 text-red-500" : 
                    doc.tipo === "WORD" ? "bg-blue-50 text-blue-500" :
                    "bg-emerald-50 text-emerald-500" // Por si a futuro agregas EXCEL u otros
                  }`}>
                    <i className={doc.tipo === "PDF" ? "icon-file-pdf" : doc.tipo === "WORD" ? "icon-file-word" : "icon-file"}></i>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
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

                {/* Botón de descarga */}
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors flex-shrink-0 ml-4">
                  <i className="icon-download text-lg"></i>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
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