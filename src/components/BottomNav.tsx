import Link from 'next/link';
import { tenantConfig } from '@/config/tenant';

export default function BottomNav() {
  const { modulos } = tenantConfig;

  return (
    <nav className="w-full border-t border-slate-200 bg-white pb-safe">
      <ul className="flex justify-around p-3 text-[10px] font-medium text-slate-500">
        
        {/* El botón de Inicio siempre es fijo */}
        <li>
          <Link href="/" className="flex flex-col items-center gap-1 hover:text-blue-600 transition-colors">
            <i className="icon-home text-xl"></i>
            <span>Inicio</span>
          </Link>
        </li>

        {/* Los demás botones son dinámicos según el tenant.ts */}
        {modulos.mapa && (
          <li>
            <Link href="/mapa" className="flex flex-col items-center gap-1 hover:text-blue-600 transition-colors">
              <i className="icon-map text-xl"></i>
              <span>Mapa</span>
            </Link>
          </li>
        )}

        {modulos.directorio && (
          <li>
            <Link href="/directorio" className="flex flex-col items-center gap-1 hover:text-blue-600 transition-colors">
              <i className="icon-directory text-xl"></i>
              <span>Directorio</span>
            </Link>
          </li>
        )}

        {modulos.archivo && (
          <li>
            <Link href="/archivo" className="flex flex-col items-center gap-1 hover:text-blue-600 transition-colors">
              <i className="icon-archive text-xl"></i>
              <span>Archivo</span>
            </Link>
          </li>
        )}

        {modulos.portales && (
          <li>
            <Link href="/portales" className="flex flex-col items-center gap-1 hover:text-blue-600 transition-colors">
              <i className="icon-laptop text-xl"></i>
              <span>Portales</span>
            </Link>
          </li>
        )}

        {modulos.tieeenda && (
          <li>
            <Link href="/tieeenda" className="flex flex-col items-center gap-1 hover:text-blue-600 transition-colors">
              <i className="icon-dove text-xl"></i>
              <span>TIEEEnda</span>
            </Link>
          </li>
        )}

        {modulos.perfil && (
          <li>
            <Link href="/perfil" className="flex flex-col items-center gap-1 hover:text-blue-600 transition-colors">
              <i className="icon-user text-xl"></i>
              <span>Perfil</span>
            </Link>
          </li>
        )}
        
      </ul>
    </nav>
  );
}