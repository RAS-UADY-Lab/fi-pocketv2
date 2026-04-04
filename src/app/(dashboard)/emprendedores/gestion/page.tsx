"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useTenant } from "@/context/TenantContext";
import { useRouter } from "next/navigation";

export default function GestionEmprendimientoPage() {
  const supabase = createClient();
  const router = useRouter();
  const { tenantId, colores, loadingConfig } = useTenant();

  const [loading, setLoading] = useState(true);
  const [negocio, setNegocio] = useState<any>(null);
  const [productos, setProductos] = useState<any[]>([]);
  const [usuario, setUsuario] = useState<any>(null);

  // Estados para formularios
  const [editandoInfo, setEditandoInfo] = useState(false);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    verificarUsuarioYNegocio();
  }, []);

  const verificarUsuarioYNegocio = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    setUsuario(session.user);

    // Intentar traer el negocio de este usuario
    const { data: dataNegocio } = await supabase
      .from("emprendimientos")
      .select("*")
      .eq("usuario_id", session.user.id)
      .single();

    if (dataNegocio) {
      setNegocio(dataNegocio);
      // Traer sus productos
      const { data: dataProds } = await supabase
        .from("emprendimiento_productos")
        .select("*")
        .eq("emprendimiento_id", dataNegocio.id)
        .order("created_at", { ascending: false });
      if (dataProds) setProductos(dataProds);
    }
    setLoading(false);
  };

  // --- LÓGICA DE ESTADO EN VIVO ---
  const toggleEstadoVivo = async () => {
    if (!negocio) return;
    const nuevoEstado = negocio.estado_vivo === 'activo' ? 'ausente' : 'activo';
    
    // Si se activa, pedimos ubicación (o usamos una por defecto)
    let nuevaUbicacion = negocio.ubicacion_actual;
    if (nuevoEstado === 'activo') {
      const ub = prompt("¿Dónde te encuentras ahora? (Ej: Cafetería, Aula C2...)", negocio.ubicacion_actual || "");
      if (ub === null) return; // Canceló
      nuevaUbicacion = ub || "En el campus";
    }

    setProcesando(true);
    const { error } = await supabase
      .from("emprendimientos")
      .update({ 
        estado_vivo: nuevoEstado, 
        ubicacion_actual: nuevaUbicacion,
        ultima_actualizacion_estado: new Date().toISOString()
      })
      .eq("id", negocio.id);

    if (!error) {
      setNegocio({ ...negocio, estado_vivo: nuevoEstado, ubicacion_actual: nuevaUbicacion });
    }
    setProcesando(false);
  };

  // --- LÓGICA DE REGISTRO INICIAL ---
  const [formRegistro, setFormRegistro] = useState({ nombre: "", desc: "" });
  const registrarNegocio = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcesando(true);
    const { data, error } = await supabase.from("emprendimientos").insert({
      tenant_id: tenantId,
      usuario_id: usuario.id,
      nombre_negocio: formRegistro.nombre,
      descripcion: formRegistro.desc,
      aprobado: false // Requiere revisión del admin
    }).select().single();

    if (!error) {
      setNegocio(data);
      alert("¡Registro enviado! Podrás subir productos ahora, pero tu negocio será visible para otros una vez que el administrador lo apruebe.");
    }
    setProcesando(false);
  };

  if (loading || loadingConfig) return <div className="p-20 text-center animate-pulse font-black text-slate-400">Cargando tu oficina...</div>;

  // --- VISTA 1: REGISTRO (Si no tiene negocio) ---
  if (!negocio) {
    return (
      <main className="min-h-[100dvh] w-full max-w-xl mx-auto p-6 md:p-8 pb-32">
        <header className="mb-10 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center mx-auto mb-4 text-3xl text-slate-400 border-2 border-dashed border-slate-200">
            <i className="icon-store"></i>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Emprende en Nodum</h1>
          <p className="text-slate-500 font-medium mt-2">Crea tu perfil de vendedor y llega a toda tu facultad.</p>
        </header>

        <form onSubmit={registrarNegocio} className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre de tu Marca</label>
            <input required placeholder="Ej. Cookies & Coffee" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-slate-200 transition-all" value={formRegistro.nombre} onChange={e => setFormRegistro({...formRegistro, nombre: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">¿Qué vendes? (Breve)</label>
            <textarea required placeholder="Ej. Postres caseros y café recién hecho todos los días." rows={3} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-slate-200 transition-all resize-none" value={formRegistro.desc} onChange={e => setFormRegistro({...formRegistro, desc: e.target.value})} />
          </div>
          <button type="submit" disabled={procesando} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-lg active:scale-95 disabled:opacity-50">
            {procesando ? "Creando..." : "Registrar mi Emprendimiento"}
          </button>
        </form>
      </main>
    );
  }

  // --- VISTA 2: DASHBOARD (Si ya tiene negocio) ---
  return (
    <main className="min-h-[100dvh] w-full max-w-3xl mx-auto p-4 md:p-8 pb-32">
      
      {/* Botón Volver */}
      <button onClick={() => router.push("/emprendedores")} className="mb-6 flex items-center gap-2 text-slate-400 font-bold text-xs hover:text-slate-600 transition-colors">
        <i className="icon-left-arrow text-[10px]"></i> Volver al Mercado
      </button>

      {/* Header con Estado Vivo */}
      <section className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-8 shadow-sm mb-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="flex gap-4 items-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl text-slate-400">
               {negocio.logo_url ? <img src={negocio.logo_url} className="w-full h-full object-cover rounded-2xl" /> : <i className="icon-store"></i>}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 leading-tight">{negocio.nombre_negocio}</h2>
              {!negocio.aprobado && (
                <span className="text-[9px] font-black bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md uppercase tracking-wider border border-amber-100">
                  En revisión por la escuela
                </span>
              )}
            </div>
          </div>

          {/* ✨ INTERRUPTOR "EN VIVO" ✨ */}
          <div className={`p-4 rounded-[2rem] border flex items-center gap-4 transition-all ${negocio.estado_vivo === 'activo' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
             <div className="text-right">
                <p className={`text-[10px] font-black uppercase tracking-widest ${negocio.estado_vivo === 'activo' ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {negocio.estado_vivo === 'activo' ? '¡Estás en vivo!' : 'Estás Ausente'}
                </p>
                {negocio.estado_vivo === 'activo' && <p className="text-[11px] font-bold text-emerald-800">En: {negocio.ubicacion_actual}</p>}
             </div>
             <button 
              onClick={toggleEstadoVivo}
              disabled={procesando}
              className={`w-14 h-8 rounded-full relative transition-all duration-300 ${negocio.estado_vivo === 'activo' ? 'bg-emerald-500' : 'bg-slate-300'}`}
             >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${negocio.estado_vivo === 'activo' ? 'left-7' : 'left-1'}`}></div>
             </button>
          </div>
        </div>
      </section>

      {/* Gestión de Catálogo */}
      <section className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-lg font-black text-slate-900">Tu Catálogo</h3>
          <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-md">
            + Nuevo Producto
          </button>
        </div>

        <div className="grid gap-4">
          {productos.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem]">
              <p className="text-slate-400 font-bold text-sm">Aún no tienes productos en preventa o stock.</p>
            </div>
          ) : (
            productos.map(prod => (
              <div key={prod.id} className="bg-white border border-slate-200 rounded-3xl p-4 flex items-center justify-between group shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                    <i className="icon-image text-xl"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{prod.nombre}</h4>
                    <p className="text-[10px] font-black text-primario uppercase">${prod.precio}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                   <button className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors"><i className="icon-info text-[10px]"></i></button>
                   <button className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"><i className="icon-trash text-[10px]"></i></button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}