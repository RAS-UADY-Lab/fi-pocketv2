"use client";

import { useTenant } from "@/context/TenantContext";

export default function PortalesPage() {
  const { portales, loadingConfig } = useTenant();

  if (loadingConfig) {
    return <div className="p-8 text-center animate-pulse text-slate-400 font-bold">Cargando portales...</div>;
  }

  return (
    <main className="flex flex-col h-full max-w-4xl mx-auto p-4 md:p-8">
      <header className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Portales Oficiales</h1>
        <p className="text-slate-500 font-medium">Tus accesos directos a los sistemas de la institución.</p>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-6 space-y-6">
        
        {portales.length > 0 ? portales.map((portal: any) => (
          <div key={portal.id} className={`${portal.estilos?.fondo || 'bg-slate-800'} rounded-[2rem] p-6 md:p-8 text-white shadow-lg relative overflow-hidden group`}>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-black mb-2 tracking-tight">{portal.nombre}</h2>
                <p className={`${portal.estilos?.texto || 'text-slate-200'} text-sm max-w-sm mb-6 font-medium leading-relaxed`}>
                  {portal.descripcion}
                </p>
                <a 
                  href={portal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 bg-white font-black px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-1 active:scale-95 ${portal.estilos?.boton || 'text-slate-900'}`}
                >
                  <i className={portal.icono || 'icon-laptop'}></i>
                  Abrir {portal.nombre}
                </a>
              </div>
              
              {/* Contenedor del ícono decorativo responsivo */}
              <div className="absolute -bottom-4 -right-2 md:static md:w-32 md:h-32 md:flex md:items-center md:justify-center md:bg-white/10 md:rounded-full md:shadow-inner md:flex-shrink-0">
                <i className={`${portal.icono || 'icon-laptop'} text-8xl opacity-20 transform -rotate-12 md:rotate-0 md:opacity-100 md:text-6xl md:text-white transition-transform duration-500 group-hover:scale-110`}></i>
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center py-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem]">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="icon-laptop text-3xl text-slate-300"></i>
            </div>
            <h3 className="text-lg font-bold text-slate-700">No hay portales configurados</h3>
            <p className="text-slate-500 mt-1 font-medium">Aún no se han agregado accesos directos a la plataforma.</p>
          </div>
        )}

      </div>
    </main>
  );
}