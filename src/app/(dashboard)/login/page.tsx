"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<1 | 2>(1); 
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [codigoAcceso, setCodigoAcceso] = useState("");
  // NUEVO: Estado para alternar visibilidad de contraseña
  const [showPassword, setShowPassword] = useState(false);
  
  const [orgMatched, setOrgMatched] = useState<any>(null);
  const [campusList, setCampusList] = useState<any[]>([]);
  const [tenantSeleccionado, setTenantSeleccionado] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMensaje(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      router.push("/"); 
      // El router.refresh() ya no es estrictamente necesario por nuestro listener, 
      // pero dejarlo es buena práctica de Next.js
      router.refresh(); 
    } catch (err: any) {
      if (err.message === "Email not confirmed") {
        setError("Debes confirmar tu correo electrónico antes de iniciar sesión.");
      } else {
        setError(err.message === "Invalid login credentials" ? "Correo o contraseña incorrectos." : err.message);
      }
      setLoading(false);
    }
  };

  const avanzarRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const dominio = email.split("@")[1];
      if (!dominio) throw new Error("Formato de correo inválido");

      const { data: orgs, error: errOrg } = await supabase.from("organizaciones").select("*");
      if (errOrg) throw errOrg;

      const orgEncontrada = orgs?.find(o => o.dominio_correo && email.endsWith(o.dominio_correo));

      if (orgEncontrada) {
        const { data: campus, error: errCampus } = await supabase
          .from("tenants")
          .select("id, nombre")
          .eq("organizacion_id", orgEncontrada.id);

        if (errCampus) throw errCampus;

        setOrgMatched(orgEncontrada);
        setCampusList(campus || []);
        if (campus && campus.length > 0) {
          setTenantSeleccionado(campus[0].id);
        }
      } else {
        setOrgMatched(null);
      }

      setStep(2);
    } catch (err: any) {
      setError("Error al validar el correo. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const completarRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let finalTenantId = null;

      if (orgMatched) {
        finalTenantId = tenantSeleccionado;
      } else {
        // ✨ NUEVO Y SEGURO: Llamada a la Función RPC (Caja Negra)
        const { data: tId, error: errT } = await supabase.rpc('verificar_codigo_registro', { 
          codigo_ingresado: codigoAcceso 
        });

        if (errT || !tId) {
          throw new Error("El código de institución es inválido o ha expirado.");
        }
        finalTenantId = tId;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            tenant_id: finalTenantId,
            rol: 'estudiante' 
          } 
        }
      });
      if (error) throw error;

      if (data.user) {
        await supabase.from("perfiles").update({ 
          tenant_id: finalTenantId,
          rol: 'estudiante' 
        }).eq("id", data.user.id);
      }
      
      setMensaje("¡Registro exitoso! Revisa la bandeja de tu correo para confirmar tu cuenta.");
      setStep(1);
      setIsLogin(true); 
      setPassword("");
      setCodigoAcceso("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100dvh-4.25rem)] md:min-h-[100dvh] flex flex-col justify-center items-center p-4 md:p-8 bg-slate-50 relative overflow-hidden">
      
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-secundario to-primario opacity-10 pointer-events-none"></div>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-md p-6 md:p-10 shadow-2xl relative z-10">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-t from-secundario to-primario rounded-2xl flex items-center justify-center text-3xl text-white mx-auto mb-4 shadow-lg">
            <i className="icon-app-logo"></i>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isLogin ? "Iniciar Sesión" : step === 1 ? "Crear Cuenta" : "Configurar Perfil"}
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            {isLogin 
              ? "Accede a tu campus centralizado en Nodum" 
              : step === 1 
                ? "Utiliza tu correo institucional oficial si cuentas con uno."
                : orgMatched 
                  ? "Selecciona tu campus o facultad." 
                  : "Ingresa el código proporcionado por tu institución."}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold text-center flex items-center justify-center">
            <i className="icon-circle-info-solid-full text-2xl mr-2"></i>
            {error}
          </div>
        )}
        {mensaje && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-bold text-center">
            {mensaje}
          </div>
        )}

        <form onSubmit={isLogin ? handleLogin : step === 1 ? avanzarRegistro : completarRegistro} className="space-y-5">
          
          {(isLogin || step === 1) && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Correo Electrónico</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="icon-envelope text-slate-400"></i>
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@correo.edu.mx"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-primario/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="icon-lock-solid-full text-slate-400"></i>
                  </div>
                  <input
                    // ✨ NUEVO: Tipo dinámico basado en el estado
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-primario/20 transition-all"
                  />
                  {/* ✨ NUEVO: Botón alternador de visibilidad */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-primario transition-colors cursor-pointer"
                  >
                    {/* Sustituye icon-eye por el icono que tengas disponible en icomoon si este no existe */}
                    <i className={showPassword ? "icon-eye-slash" : "icon-eye"}></i>
                  </button>
                </div>
              </div>
            </div>
          )}

          {!isLogin && step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-5">
              
              {orgMatched ? (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <p className="text-xs font-bold text-emerald-600 mb-3 text-center">
                    ¡Dominio <span className="text-emerald-800">@{email.split("@")[1]}</span> verificado!
                  </p>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Selecciona tu Facultad</label>
                  <select 
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    value={tenantSeleccionado}
                    onChange={(e) => setTenantSeleccionado(e.target.value)}
                    required
                  >
                    {campusList.map(campus => (
                      <option key={campus.id} value={campus.id}>{campus.nombre}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                  <p className="text-xs font-bold text-amber-700 mb-3 text-center">
                    Dominio no registrado. Se requiere un código de invitación oficial.
                  </p>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Código de Acceso</label>
                  <input
                    type="text"
                    required
                    value={codigoAcceso}
                    onChange={(e) => setCodigoAcceso(e.target.value.toUpperCase())}
                    placeholder="Ej. NODUM2026"
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-800 text-center uppercase tracking-widest outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                  />
                </div>
              )}

              <button 
                type="button" 
                onClick={() => setStep(1)} 
                className="cursor-pointer w-full text-xs font-bold text-slate-400 hover:text-slate-600 text-center transition-colors"
              >
                Volver
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-t from-secundario to-primario text-white font-black rounded-2xl hover:opacity-90 hover:shadow-lg focus:ring-4 focus:ring-primario/20 transition-all disabled:opacity-70 flex justify-center items-center cursor-pointer active:scale-[0.98]"
          >
            {loading ? "Procesando..." : isLogin ? "Iniciar Sesión" : step === 1 ? "Continuar" : "Finalizar Registro"}
          </button>
        </form>

        {step === 1 && (
          <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <p className="text-sm text-slate-600 font-medium">
              {isLogin ? "¿Nuevo en Nodum?" : "¿Ya tienes cuenta?"}
            </p>
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setMensaje(null);
                setStep(1);
              }}
              className="mt-2 text-primario font-black hover:text-secundario transition-colors cursor-pointer"
            >
              {isLogin ? "Crear una cuenta nueva" : "Inicia sesión aquí"}
            </button>
          </div>
        )}

      </div>
    </main>
  );
}