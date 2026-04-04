"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useTenant } from "@/context/TenantContext";

const CARRERAS = [
  "Todos", "Ingeniería Mecatrónica", "Ingeniería en Energías Renovables", "Ingeniería Civil", "Ingeniería en Alimentos", "Ingeniería Física", "Ingeniería Mecánica Eléctrica"
];

export default function DirectorioTab() {
  const { tenantId } = useTenant();
  const supabase = createClient();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState(""); 
  const [filtroCarrera, setFiltroCarrera] = useState("Todos");
  const [usuarioEditando, setUsuarioEditando] = useState<any>(null);

  const cargarUsuarios = async () => {
    setLoading(true);
    const { data } = await supabase.from("perfiles").select("*").eq("tenant_id", tenantId).order("nombre", { ascending: true });
    if (data) setUsuarios(data);
    setLoading(false);
  };

  useEffect(() => {
    cargarUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actualizarRol = async (id: string, rol: string) => {
    setLoading(true);
    await supabase.from("perfiles").update({ rol }).eq("id", id);
    await cargarUsuarios();
  };

  const guardarEdicionMembresia = async () => {
    if (!usuarioEditando) return;
    setLoading(true);
    await supabase.from("perfiles").update({
      ieee_numero: usuarioEditando.ieee_numero,
      membresia_estatus: usuarioEditando.membresia_estatus,
      es_miembro_ieee: usuarioEditando.es_miembro_ieee,
      es_miembro_ras: usuarioEditando.es_miembro_ras,
      es_miembro_wie: usuarioEditando.es_miembro_wie
    }).eq("id", usuarioEditando.id);
    setUsuarioEditando(null);
    await cargarUsuarios(); 
  };

  const directorioFiltrado = usuarios.filter(u => {
    const nombreCompleto = `${u.nombre} ${u.apellido} ${u.correo_institucional}`.toLowerCase();
    return nombreCompleto.includes(busqueda.toLowerCase()) && (filtroCarrera === "Todos" || u.carrera === filtroCarrera);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <i className="icon-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input type="text" placeholder="Buscar por nombre o correo..." className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-primario/20 transition-all shadow-sm" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <select className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none cursor-pointer shadow-sm" value={filtroCarrera} onChange={(e) => setFiltroCarrera(e.target.value)}>
          {CARRERAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-8">Estudiante</th>
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Carrera</th>
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Membresía</th>
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-8">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {directorioFiltrado.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 pl-8">
                  <p className="font-bold text-slate-900 text-sm">{u.nombre} {u.apellido}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{u.correo_institucional}</p>
                </td>
                <td className="p-4"><span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">{u.carrera || "N/A"}</span></td>
                <td className="p-4 text-center">
                  {/* CORRECCIÓN: Colores semánticos restaurados para los estados */}
                  <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-tighter ${u.membresia_estatus === 'verificada' ? 'bg-emerald-100 text-emerald-600' : u.membresia_estatus === 'pendiente' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                    {u.membresia_estatus}
                  </span>
                </td>
                <td className="p-4 text-right pr-8 flex items-center justify-end gap-2 h-[72px]">
                  <button onClick={() => setUsuarioEditando(u)} className="cursor-pointer text-[10px] font-black px-3 py-1.5 rounded-lg bg-mist-100 text-mist-800 hover:bg-mist-300 transition-colors">Editar Info</button>
                  {/* CORRECCIÓN: Morado original restaurado para el botón de Admin */}
                  <button onClick={() => actualizarRol(u.id, u.rol === 'admin' ? 'estudiante' : 'admin')} className={`cursor-pointer text-[10px] font-black px-3 py-1.5 rounded-lg transition-colors ${u.rol === 'admin' ? 'bg-purple-100 text-purple-600 hover:bg-purple-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{u.rol === 'admin' ? '- Admin' : '+ Admin'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {usuarioEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-6 md:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setUsuarioEditando(null)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 cursor-pointer transition-colors"><i className="icon-close font-bold">x</i></button>
            <div className="mb-6"><h3 className="text-xl font-black text-slate-900">Editar Membresía</h3><p className="text-xs font-bold text-slate-500 mt-1">{usuarioEditando.nombre} {usuarioEditando.apellido}</p></div>
            <div className="space-y-4">
              <select className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none cursor-pointer focus:ring-2 focus:ring-primario/20 transition-all" value={usuarioEditando.membresia_estatus} onChange={(e) => setUsuarioEditando({...usuarioEditando, membresia_estatus: e.target.value})}>
                <option value="inactiva">Inactiva (Sin beneficios)</option><option value="pendiente">Pendiente</option><option value="verificada">Verificada</option>
              </select>
              <input className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primario/20 transition-all" value={usuarioEditando.ieee_numero || ""} placeholder="Número IEEE" onChange={(e) => setUsuarioEditando({...usuarioEditando, ieee_numero: e.target.value})}/>
              <div className="pt-2 flex flex-wrap gap-2">
                {[{ id: 'es_miembro_ieee', label: 'IEEE', icon: 'icon-IEEE' }, { id: 'es_miembro_ras', label: 'RAS', icon: 'icon-RAS' }, { id: 'es_miembro_wie', label: 'WIE', icon: 'icon-WIE' }].map((m) => {
                  const activo = usuarioEditando[m.id as keyof typeof usuarioEditando];
                  return <button key={m.id} onClick={() => setUsuarioEditando({...usuarioEditando, [m.id]: !activo})} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 ${activo ? "bg-gradient-to-t from-secundario to-primario text-white shadow-md" : "bg-slate-100 text-slate-400 hover:bg-slate-200"}`}><i className={`${m.icon} text-lg`}></i> {m.label}</button>;
                })}
              </div>
            </div>
            <button onClick={guardarEdicionMembresia} disabled={loading} className="w-full mt-8 py-4 bg-gradient-to-t from-secundario to-primario text-white font-black rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all shadow-md disabled:opacity-50 cursor-pointer">Guardar Cambios</button>
          </div>
        </div>
      )}
    </div>
  );
}