"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { tenantConfig } from "@/config/tenant";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const { identidad } = tenantConfig;

  // Estados del formulario
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  // Reemplaza SOLO la función handleAuth en src/app/login/page.tsx

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMensaje(null);

    // CANDADO ESTRICTO: Solo correos institucionales para registro
    if (!isLogin && !email.endsWith("@alumnos.uady.mx")) {
      setError("Solo se permiten correos institucionales de la UADY (@alumnos.uady.mx).");
      setLoading(false);
      return; // Detenemos la ejecución aquí mismo
    }

    try {
      if (isLogin) {
        // --- INICIO DE SESIÓN ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // Lo mandamos al inicio tras loguearse
        router.push("/"); 
        router.refresh(); 

      } else {
        // --- REGISTRO ---
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        setMensaje("¡Registro exitoso! Revisa la bandeja de tu correo institucional para confirmar tu cuenta.");
        setIsLogin(true); 
        setPassword("");
      }
    } catch (err: any) {
      // Manejo de errores amigable
      if (err.message === "Email not confirmed") {
        setError("Debes confirmar tu correo electrónico antes de iniciar sesión.");
      } else {
        setError(err.message === "Invalid login credentials" ? "Correo o contraseña incorrectos." : err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100dvh-6rem)] flex flex-col h-full max-w-md mx-auto p-4 md:p-8 justify-center overflow-y-auto no-scrollbar md:pb-8">

      {/* Tarjeta del Formulario */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-lg">
        
        {/* Encabezado */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl text-blue-600 mx-auto mb-4 shadow-inner">
            <i className={identidad.logoIcono}></i>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            {isLogin 
              ? `Accede a información personalizable y a la TIEEEnda` 
              : "Regístrate con tu correo institucional @alumnos.uady.mx"}
          </p>
        </div>

        {/* Mensajes de Alerta */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold text-center">
            {error === "Invalid login credentials" ? "Correo o contraseña incorrectos." : error}
          </div>
        )}
        {mensaje && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-semibold text-center">
            {mensaje}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Correo Electrónico</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className="icon-envelope text-slate-400"></i>
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@alumnos.uady.mx"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Contraseña</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className="icon-lock text-slate-400"></i>
              </div>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 hover:shadow-md focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
          >
            {loading ? (
              <span className="animate-pulse">Procesando...</span>
            ) : (
              isLogin ? "Iniciar Sesión" : "Registrarme"
            )}
          </button>
        </form>

        {/* Toggle Login/Register */}
        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <p className="text-sm text-slate-600 font-medium">
            {isLogin ? "¿No tienes cuenta en FI Pocket?" : "¿Ya tienes una cuenta?"}
          </p>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setMensaje(null);
            }}
            className="mt-2 text-blue-600 font-bold hover:text-blue-800 transition-colors"
          >
            {isLogin ? "Crear una cuenta nueva" : "Iniciar sesión"}
          </button>
        </div>

      </div>
    </main>
  );
}