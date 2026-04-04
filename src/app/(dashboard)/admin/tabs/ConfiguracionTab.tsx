"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useTenant } from "@/context/TenantContext";

export default function ConfiguracionTab() {
  const { identidad, modulos, colores, recargarConfiguracion, tenantId } = useTenant();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const [configEditando, setConfigEditando] = useState({
    identidad: identidad,
    modulos: modulos,
    colores: colores
  });

  // NUEVO: Sistema de Notificaciones (Toasts)
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'success' | 'error' } | null>(null);

  const mostrarToast = (mensaje: string, tipo: 'success' | 'error') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 4000); // Desaparece después de 4 segundos
  };

  // Estados para el Código de Invitación
  const [codigoAcceso, setCodigoAcceso] = useState("");
  const [codigoActivo, setCodigoActivo] = useState(false);
  const [cargandoCodigo, setCargandoCodigo] = useState(true);

  useEffect(() => {
    setConfigEditando({ identidad, modulos, colores });
  }, [identidad, modulos, colores]);

  // Cargar el código de acceso directamente de la tabla tenants
  useEffect(() => {
    const fetchCodigo = async () => {
      if (!tenantId) return;
      const { data, error } = await supabase
        .from("tenants")
        .select("codigo_acceso, codigo_activo")
        .eq("id", tenantId)
        .single();

      if (data && !error) {
        setCodigoAcceso(data.codigo_acceso || "");
        setCodigoActivo(data.codigo_activo || false);
      }
      setCargandoCodigo(false);
    };
    fetchCodigo();
  }, [tenantId, supabase]);

  const agregarCarrera = () => {
    const nuevasCarreras = [...(configEditando.identidad.carreras || []), ""];
    setConfigEditando({
      ...configEditando,
      identidad: { ...configEditando.identidad, carreras: nuevasCarreras }
    });
  };

  const actualizarCarrera = (index: number, valor: string) => {
    const nuevasCarreras = [...(configEditando.identidad.carreras || [])];
    nuevasCarreras[index] = valor;
    setConfigEditando({
      ...configEditando,
      identidad: { ...configEditando.identidad, carreras: nuevasCarreras }
    });
  };

  const eliminarCarrera = (index: number) => {
    const nuevasCarreras = [...(configEditando.identidad.carreras || [])];
    nuevasCarreras.splice(index, 1);
    setConfigEditando({
      ...configEditando,
      identidad: { ...configEditando.identidad, carreras: nuevasCarreras }
    });
  };

  const generarCodigoAleatorio = () => {
    const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let nuevoCodigo = "";
    for (let i = 0; i < 8; i++) {
      nuevoCodigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    setCodigoAcceso(nuevoCodigo);
  };

  const guardarConfiguracionTenant = async () => {
    const carrerasLimpias = (configEditando.identidad.carreras || []).filter(c => c.trim() !== "");
    const configListaParaGuardar = {
      ...configEditando,
      identidad: { ...configEditando.identidad, carreras: carrerasLimpias }
    };

    setLoading(true);
    try {
      const { error } = await supabase
        .from("tenants")
        .update({
          identidad: configListaParaGuardar.identidad,
          modulos: configListaParaGuardar.modulos,
          colores: configListaParaGuardar.colores,
          codigo_acceso: codigoAcceso.trim().toUpperCase(), 
          codigo_activo: codigoActivo
        })
        .eq("id", tenantId);
        
      if (error) throw error;
      await recargarConfiguracion(); 
      mostrarToast("¡Configuración de la instancia actualizada!", "success");
    } catch (error: any) {
      console.error("Error al actualizar tenant:", error);
      mostrarToast(error.message || "Error al actualizar la configuración.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 relative">

      {/* COMPONENTE TOAST FLOTANTE */}
      {toast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-2xl shadow-2xl z-[200] animate-in slide-in-from-bottom-5 fade-in duration-300 font-bold text-sm flex items-center gap-3 whitespace-nowrap ${
          toast.tipo === 'success' ? 'bg-slate-900 text-white' : 'bg-red-500 text-white'
        }`}>
          <i className={toast.tipo === 'success' ? 'icon-check-solid-full' : 'icon-close text-lg'}></i>
          {toast.mensaje}
        </div>
      )}
      
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
          <i className="icon-circle-info-solid-full text-primario"></i> Identidad de la Instancia
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Institución Perteneciente</label>
            <input 
              className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primario/20 transition-all"
              value={configEditando.identidad.organizacion}
              onChange={(e) => setConfigEditando({...configEditando, identidad: { ...configEditando.identidad, organizacion: e.target.value }})}
              placeholder="Ej. UADY"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre del Campus / Facultad</label>
            <input 
              className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primario/20 transition-all"
              value={configEditando.identidad.nombre}
              onChange={(e) => setConfigEditando({...configEditando, identidad: { ...configEditando.identidad, nombre: e.target.value }})}
              placeholder="Ej. Facultad de Ingeniería"
            />
            <p className="text-[9px] text-slate-400 ml-1 italic">* Aparecerá como Nodum • {configEditando.identidad.nombre || 'Nombre'}</p>
          </div>
        </div>

        {/* Oferta Académica */}
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mt-8 mb-3 border-t border-slate-100 pt-6">Oferta Académica (Carreras)</h3>
        <div className="space-y-3">
          {(configEditando.identidad.carreras || []).map((carrera, index) => (
            <div key={index} className="flex items-center gap-2">
              <input 
                className="flex-1 p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primario/20 transition-all"
                value={carrera}
                onChange={(e) => actualizarCarrera(index, e.target.value)}
                placeholder="Ej. Licenciatura en Diseño"
              />
              <button 
                onClick={() => eliminarCarrera(index)}
                className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-100 transition-colors flex-shrink-0 cursor-pointer active:scale-95"
              >
                <i className="icon-close font-bold"></i>
              </button>
            </div>
          ))}
          <button 
            onClick={agregarCarrera}
            className="w-full py-3 bg-slate-100 text-slate-500 font-bold rounded-2xl text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors cursor-pointer active:scale-95 border-2 border-dashed border-slate-300"
          >
            + Agregar Carrera
          </button>
        </div>

        {/* Paleta de Colores */}
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mt-8 mb-3 border-t border-slate-100 pt-6">Paleta de Colores de la Instancia</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 ml-1">Color Primario</label>
            <div className="flex items-center gap-3">
              <input type="color" className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0 overflow-hidden" value={configEditando.colores?.primario || "#98002e"} onChange={(e) => setConfigEditando({...configEditando, colores: { ...configEditando.colores, primario: e.target.value }})} />
              <span className="text-xs font-mono text-slate-500 uppercase">{configEditando.colores?.primario || "#98002e"}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 ml-1">Color Secundario</label>
            <div className="flex items-center gap-3">
              <input type="color" className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0 overflow-hidden" value={configEditando.colores?.secundario || "#61116a"} onChange={(e) => setConfigEditando({...configEditando, colores: { ...configEditando.colores, secundario: e.target.value }})} />
              <span className="text-xs font-mono text-slate-500 uppercase">{configEditando.colores?.secundario || "#61116a"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* NUEVA SECCIÓN: Seguridad y Registro */}
      {!cargandoCodigo && (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-2">
            <i className="icon-lock-solid-full text-primario"></i> Seguridad y Registro
          </h2>
          <p className="text-sm text-slate-500 font-medium mb-6">Gestiona cómo acceden los usuarios sin correo institucional oficial a tu sede.</p>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-2xl gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-slate-800 text-sm">Habilitar Código de Invitación</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                Permite que estudiantes externos o de nuevo ingreso (sin correo <strong>@tu-universidad</strong>) se registren usando un código secreto.
              </p>
            </div>
            <button 
              onClick={() => setCodigoActivo(!codigoActivo)}
              className={`cursor-pointer w-14 h-7 rounded-full relative transition-colors duration-300 focus:outline-none flex-shrink-0 ${codigoActivo ? "bg-emerald-500 shadow-inner shadow-emerald-700/20" : "bg-slate-300 shadow-inner shadow-slate-400/20"}`}
            >
              <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all duration-300 shadow-sm ${codigoActivo ? "left-8" : "left-1"}`} />
            </button>
          </div>

          {codigoActivo && (
            <div className="mt-5 animate-in slide-in-from-top-2 fade-in duration-300 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Código Actual</label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  className="flex-1 p-4 bg-white border border-slate-200 rounded-2xl text-base font-black tracking-widest text-slate-800 outline-none focus:ring-2 focus:ring-primario/20 transition-all uppercase"
                  value={codigoAcceso}
                  onChange={(e) => setCodigoAcceso(e.target.value.toUpperCase())}
                  placeholder="Ej. OTOÑO2026"
                />
                <button 
                  onClick={generarCodigoAleatorio}
                  title="Generar código seguro"
                  className="w-14 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer active:scale-95 border border-slate-200"
                >
                  <i className="icon-id font-bold"></i>
                </button>
              </div>
              <p className="text-[10px] text-amber-600 font-bold ml-1 flex items-center gap-1">
                <i className="icon-circle-info-solid-full"></i> Comparte este código únicamente por canales oficiales.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Módulos Habilitados */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
          <i className="icon-laptop text-secundario"></i> Módulos Habilitados para el Campus
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(configEditando.modulos).map(([moduloKey, activo]) => (
            <div key={moduloKey} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="font-bold text-slate-700 capitalize text-sm">{moduloKey}</span>
              <button 
                onClick={() => setConfigEditando({...configEditando, modulos: { ...configEditando.modulos, [moduloKey]: !activo }})}
                className={`cursor-pointer w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none ${activo ? "bg-emerald-500" : "bg-slate-300"}`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm ${activo ? "left-7" : "left-1"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button onClick={guardarConfiguracionTenant} disabled={loading} className="cursor-pointer w-full py-4 bg-gradient-to-t from-secundario to-primario text-white font-black rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all shadow-lg disabled:opacity-50">
        {loading ? "Guardando..." : "Guardar y Publicar Cambios"}
      </button>

    </div>
  );
}