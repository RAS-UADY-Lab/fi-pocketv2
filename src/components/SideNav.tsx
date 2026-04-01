import Link from 'next/link';
import { tenantConfig } from '@/config/tenant';

export default function SideNav() {
  const { modulos, identidad } = tenantConfig;

  return (
    <aside className="hidden md:flex flex-col w-64 h-full border-r border-slate-200 bg-white flex-shrink-0">
      <div className="p-6 border-b border-slate-100 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl shadow-sm">
          <i className={identidad.logoIcono}></i>
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{identidad.nombre}</h2>
      </div>

      <nav className="flex-1 p-4">
        <ul className="flex flex-col gap-2 text-sm font-medium text-slate-600">
          <li><Link href="/" className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50"><i className="icon-home text-lg"></i> Inicio</Link></li>
          {modulos.mapa && <li><Link href="/mapa" className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50"><i className="icon-map text-lg"></i> Mapa</Link></li>}
          {modulos.directorio && <li><Link href="/directorio" className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50"><i className="icon-directory text-lg"></i> Directorio</Link></li>}
          {modulos.archivo && <li><Link href="/archivo" className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50"><i className="icon-archive text-lg"></i> Archivo</Link></li>}
          {modulos.portales && <li><Link href="/portales" className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50"><i className="icon-laptop text-lg"></i> Portales</Link></li>}
        </ul>
      </nav>
    </aside>
  );
}