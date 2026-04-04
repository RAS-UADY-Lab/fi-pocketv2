"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
// NUEVO: Importamos el cliente de Supabase
import { createClient } from "@/lib/supabase"; 

export default function UnetePage() {
  const correoVentas = "contacto@e-nnovadesign.com";
  const asunto = encodeURIComponent("Iniciativa Nodum: Digitalización de nuestro campus");
  const cuerpo = encodeURIComponent("Hola equipo de E-nnova Design,\n\nSoy estudiante y considero que mi institución necesita actualizar su ecosistema digital. Me gustaría que nuestra escuela cuente con los servicios de Nodum.\n\nDetalles de mi institución:\n- Nombre de la escuela: [Escribe aquí tu escuela]\n- Mi nombre: [Opcional]");

  const [faqActivo, setFaqActivo] = useState<number | null>(0);
  const [formStatus, setFormStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // NUEVO: Estados para los campos del formulario
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [institucion, setInstitucion] = useState("");
  const [rol, setRol] = useState("estudiante");

  const supabase = createClient();

  // NUEVO: Lógica real de envío a base de datos
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus("loading");
    setErrorMsg("");

    try {
      const { error } = await supabase
        .from('leads_ventas')
        .insert([
          { 
            nombre_completo: nombreCompleto, 
            institucion: institucion, 
            rol: rol 
          }
        ]);

      if (error) throw error;

      setFormStatus("success");
    } catch (error: any) {
      console.error("Error guardando el lead:", error);
      setErrorMsg("Hubo un problema al enviar tu solicitud. Intenta de nuevo.");
      setFormStatus("error");
    }
  };

  const caracteristicas = [
    { titulo: "Directorio Inteligente", desc: "Localiza al instante cubículos de docentes, laboratorios y departamentos administrativos de tu facultad.", icono: "icon-directory", color: "from-[#98002e] to-[#61116a]" },
    { titulo: "TIEEEnda Universitaria", desc: "Aparta material de laboratorio, componentes electrónicos o uniformes desde tu celular, sin filas ni esperas.", icono: "icon-store-solid-full", color: "from-[#61116a] to-[#98002e]" },
    { titulo: "Mapa Interactivo", desc: "Navegación detallada por todos los edificios, aulas y puntos de interés de la institución.", icono: "icon-map", color: "from-slate-800 to-slate-950" },
    { titulo: "Portales Centralizados", desc: "Accesos directos unificados a los sistemas de control escolar y plataformas de la escuela.", icono: "icon-laptop", color: "from-[#98002e] to-[#b31445]" },
    { titulo: "Archivo y Reglamentos", desc: "Consulta en cualquier momento los planes de estudio, reglamentos internos y formatos en PDF.", icono: "icon-archive", color: "from-[#61116a] to-purple-900" }
  ];

  const caracteristicasInfinitas = [...caracteristicas, ...caracteristicas];

  const faqs = [
    { q: "¿Cómo se manejan los datos de los estudiantes?", a: "La seguridad es nuestra prioridad. Nodum utiliza bases de datos encriptadas con políticas de seguridad a nivel de fila (RLS). Tu institución es la única dueña de su información." },
    { q: "¿Cuánto tiempo toma implementar Nodum?", a: "Gracias a nuestra arquitectura Multi-Tenant, podemos desplegar una instancia completamente funcional y personalizada con los colores de tu escuela en menos de 24 horas." },
    { q: "¿Necesitamos correos institucionales forzosamente?", a: "No. Aunque soportamos dominios oficiales, también contamos con un sistema de Códigos de Invitación seguros para estudiantes de nuevo ingreso." }
  ];

  return (
    <main className="min-h-screen w-full flex flex-col bg-white text-slate-900 font-sans selection:bg-[#98002e]/10 selection:text-[#98002e] overflow-x-hidden">
      
      {/* 1. HEADER */}
      <header className="w-full p-6 md:px-12 flex justify-between items-center max-w-7xl mx-auto flex-shrink-0">
        <Image src="/logo-horizontal.svg" alt="Nodum Logo" width={150} height={44} priority className="h-9 md:h-10 w-auto object-contain" />
        <Link href="/login" className="text-xs font-bold text-slate-600 hover:text-[#98002e] transition-all cursor-pointer flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 hover:border-[#98002e]/20 hover:bg-[#98002e]/5">
          <i className="icon-user"></i> Portal de Acceso
        </Link>
      </header>

      {/* 2. HERO SECTION */}
      <section className="w-full flex flex-col items-center text-center pt-12 md:pt-20 px-6 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-7xl font-black text-slate-950 tracking-tighter leading-[1.1] mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          Lleva tu campus <br className="hidden md:block"/> a la era <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#98002e] to-[#61116a]">digital.</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-600 font-medium max-w-2xl mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
          Nodum centraliza mapas, directorios y servicios en una sola plataforma premium. Únete a la revolución de la gestión escolar.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <a href="#solicitar" className="px-8 py-4 bg-slate-950 text-white font-black rounded-2xl hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-slate-950/10">
            Solicitar una Demo
          </a>
        </div>
      </section>

      {/* 3. SOCIAL PROOF */}
      <section className="w-full max-w-5xl mx-auto mt-16 mb-20 px-6 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 flex flex-col items-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6 text-center">Potenciando a la próxima generación de ingenieros en</p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
          <span className="text-xl font-black text-slate-400">FI UADY</span>
          <span className="text-xl font-black text-slate-400">IEEE RAS</span>
          <span className="text-xl font-black text-slate-400">E-nnova</span>
        </div>
      </section>

      {/* 4. INFINITE MARQUEE */}
      <section className="w-full relative max-w-[100vw] overflow-hidden py-4 mb-28">
        <div className="max-w-7xl mx-auto px-6 md:px-12 mb-8">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Todo lo que necesitas.</h2>
        </div>
        <div className="absolute top-0 bottom-0 left-0 w-16 md:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
        <div className="absolute top-0 bottom-0 right-0 w-16 md:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
        <div className="flex w-fit gap-6 animate-marquee hover:[animation-play-state:paused] px-6">
          {caracteristicasInfinitas.map((item, index) => (
            <div key={index} className="w-[280px] md:w-[320px] bg-white border border-slate-100 p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-[#98002e]/5 hover:border-[#98002e]/20 transition-all duration-300 flex flex-col text-left flex-shrink-0 cursor-default">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-6 shadow-md transition-transform duration-300 hover:scale-110`}>
                <i className={`${item.icono} text-2xl`}></i>
              </div>
              <h3 className="text-xl font-black text-slate-950 mb-3">{item.titulo}</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. LEAD GEN + FAQ */}
      <section id="solicitar" className="w-full max-w-7xl mx-auto px-6 md:px-12 mb-24 grid grid-cols-1 md:grid-cols-2 gap-16">
        
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Inicia la digitalización.</h2>
          <p className="text-slate-500 font-medium mb-8">Déjanos tus datos o los de tu institución y nuestro equipo se pondrá en contacto contigo para agendar una demostración.</p>
          
          <form onSubmit={handleLeadSubmit} className="space-y-4 bg-slate-50 border border-slate-100 p-6 md:p-8 rounded-[2.5rem]">
            {formStatus === "success" ? (
              <div className="text-center py-10 animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                  <i className="icon-check-solid-full"></i>
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">¡Solicitud Enviada!</h3>
                <p className="text-sm text-slate-500 font-medium mb-6">Nos pondremos en contacto muy pronto.</p>
                <button 
                  type="button" 
                  onClick={() => setFormStatus("idle")} 
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 underline"
                >
                  Enviar otra solicitud
                </button>
              </div>
            ) : (
              <>
                {formStatus === "error" && (
                  <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 text-center">
                    {errorMsg}
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Nombre Completo</label>
                  <input 
                    required 
                    value={nombreCompleto}
                    onChange={(e) => setNombreCompleto(e.target.value)}
                    placeholder="Ej. Eduardo Chan" 
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#98002e]/20 focus:border-[#98002e] transition-all" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Institución Académica</label>
                  <input 
                    required 
                    value={institucion}
                    onChange={(e) => setInstitucion(e.target.value)}
                    placeholder="Ej. Universidad Autónoma de Yucatán" 
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#98002e]/20 focus:border-[#98002e] transition-all" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Mi rol en la escuela</label>
                  <select 
                    value={rol}
                    onChange={(e) => setRol(e.target.value)}
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#98002e]/20 focus:border-[#98002e] transition-all text-slate-700"
                  >
                    <option value="estudiante">Estudiante / Mesa Directiva</option>
                    <option value="profesor">Profesor / Académico</option>
                    <option value="directivo">Directivo / Administrativo</option>
                  </select>
                </div>
                <button 
                  type="submit" 
                  disabled={formStatus === "loading"}
                  className="w-full py-4 mt-2 bg-gradient-to-r from-[#98002e] to-[#61116a] text-white font-black rounded-2xl hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center cursor-pointer"
                >
                  {formStatus === "loading" ? "Procesando..." : "Solicitar Demostración"}
                </button>
              </>
            )}
          </form>
        </div>

        <div className="pt-2">
          <h2 className="text-[10px] font-black text-[#98002e] uppercase tracking-widest mb-6 block">Preguntas Frecuentes</h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden bg-white transition-all duration-300">
                <button onClick={() => setFaqActivo(faqActivo === idx ? null : idx)} className="w-full text-left p-5 flex justify-between items-center font-bold text-slate-900 cursor-pointer hover:bg-slate-50">
                  {faq.q}
                  <i className={`icon-right-arrow text-slate-400 transition-transform duration-300 ${faqActivo === idx ? "rotate-90" : ""}`}></i>
                </button>
                <div className={`px-5 text-sm font-medium text-slate-500 overflow-hidden transition-all duration-300 ease-in-out ${faqActivo === idx ? "max-h-40 pb-5 opacity-100" : "max-h-0 opacity-0"}`}>
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* 6. FOOTER */}
      <footer className="w-full p-8 flex-shrink-0 border-t border-slate-100 mt-auto bg-slate-50/50">
        <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <Image src="/logo-horizontal.svg" alt="Nodum Logo" width={90} height={26} className="h-6 w-auto grayscale opacity-50" />
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
            Un desarrollo de E-nnova Design © {new Date().getFullYear()}
          </p>
        </div>
      </footer>

      {/* CSS PARA MARQUEE */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(calc(-50% - 12px)); }
        }
        .animate-marquee {
          animation: marquee 35s linear infinite;
        }
      `}} />
    </main>
  );
}