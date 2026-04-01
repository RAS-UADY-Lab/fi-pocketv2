import { tenantConfig } from "@/config/tenant";

export default function PortalesPage() {
  return (
    <main className="flex flex-col h-full max-w-4xl mx-auto p-4 md:p-8">
      <header className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Portales Oficiales</h1>
        <p className="text-slate-500">Tus accesos directos a los sistemas de la institución.</p>
      </header>

      {/* Usamos custom-scrollbar aquí */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-6 space-y-6">
        
        {tenantConfig.portales.map((portal) => (
          <div key={portal.id} className={`${portal.estilos.fondo} rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden`}>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">{portal.nombre}</h2>
                <p className={`${portal.estilos.texto} text-sm max-w-sm mb-4`}>
                  {portal.descripcion}
                </p>
                <a 
                  href={portal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 bg-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm ${portal.estilos.boton} hover:scale-105`}
                >
                  <i className={portal.icono}></i>
                  Abrir {portal.nombre}
                </a>
              </div>
              <i className={`${portal.icono} text-8xl opacity-20 transform rotate-12 absolute -bottom-4 -right-2 md:static md:opacity-100 md:rotate-0 md:bg-white/20 md:w-32 md:h-32 md:flex md:items-center md:justify-center md:rounded-full md:shadow-inner`}></i>
            </div>
          </div>
        ))}

      </div>
    </main>
  );
}