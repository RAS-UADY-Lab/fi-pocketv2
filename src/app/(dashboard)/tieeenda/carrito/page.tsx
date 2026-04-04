"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CarritoPage() {
  const { cart, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
  const [propina, setPropina] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [perfilCompleto, setPerfilCompleto] = useState<boolean | null>(null);
  const [pedidoExitoso, setPedidoExitoso] = useState<string | null>(null); 
  
  const supabase = createClient();
  const router = useRouter();

  const totalFinal = totalPrice + propina;

  useEffect(() => {
    const verificarPerfil = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data: perfil } = await supabase
        .from("perfiles")
        .select("nombre, apellido, whatsapp, carrera")
        .eq("id", session.user.id)
        .single();

      if (perfil) {
        const estaCompleto = Boolean(
          perfil.nombre?.trim() && 
          perfil.apellido?.trim() && 
          perfil.whatsapp?.trim() && 
          perfil.carrera?.trim()
        );
        setPerfilCompleto(estaCompleto);
      } else {
        setPerfilCompleto(false);
      }
    };

    verificarPerfil();
  }, [supabase, router]);

 const procesarPedido = async () => {
    if (!perfilCompleto) return; 

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No hay sesión activa");

      // 1. Registramos el pedido en la tabla 'pedidos'
      const { data: nuevoPedido, error: errorPedido } = await supabase.from("pedidos").insert({
        usuario_id: session.user.id,
        total: totalFinal,
        propina: propina,
        estado: "pendiente",
        metodo_entrega: "presencial",
        articulos: cart, 
      }).select().single();

      if (errorPedido) throw errorPedido;

      // 2. LOGICA DE INVENTARIO: Apartar los productos
      // Recorremos cada artículo del carrito para actualizar el stock real
      for (const item of cart) {
        // Primero consultamos el estado actual del producto para evitar errores
        const { data: productoActual } = await supabase
          .from("productos")
          .select("stock, stock_apartado")
          .eq("id", item.id)
          .single();

        if (productoActual) {
          await supabase.from("productos").update({
            // Restamos de lo disponible
            stock: productoActual.stock - item.cantidad,
            // Sumamos a lo apartado (lo que está en la "bolsita" del cliente)
            stock_apartado: (productoActual.stock_apartado || 0) + item.cantidad
          }).eq("id", item.id);
        }
      }

      // 3. Limpiamos carrito y mostramos éxito
      clearCart();
      setPedidoExitoso(nuevoPedido.id);

    } catch (error) {
      console.error("Error en inventario:", error);
      alert("Hubo un problema con el stock. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // PANTALLA DE ÉXITO (Reemplaza al carrito si la compra se procesó)
  if (pedidoExitoso) {
    return (
      <main className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-slate-50 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-emerald-100 rounded-[2rem] flex items-center justify-center text-emerald-500 text-5xl mb-6 shadow-inner">
          <i className="icon-check-solid-full"></i>
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight text-center">¡Pedido Registrado!</h2>
        <p className="text-slate-500 text-center mb-6 font-medium max-w-sm">
          Tu orden ha sido enviada a la mesa directiva. El encargado te contactará a tu WhatsApp registrado para coordinar la entrega.
        </p>
        
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-8 w-full max-w-xs text-center shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Número de Orden</p>
          <p className="text-xl font-black text-primario">#{pedidoExitoso.slice(0, 5).toUpperCase()}</p>
        </div>

        <Link href="/perfil" className="w-full max-w-xs py-4 bg-slate-900 text-white text-center font-black rounded-2xl hover:opacity-90 transition-all shadow-lg active:scale-95">
          Ver mis pedidos
        </Link>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="w-24 h-24 bg-primario/10 rounded-full flex items-center justify-center text-primario text-4xl mb-6 shadow-inner">
          <i className="icon-cart-shopping-solid-full"></i>
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Tu carrito está vacío</h2>
        <p className="text-slate-500 text-center mb-8 font-medium max-w-xs">
          Aún no has agregado ningún componente a tu pedido.
        </p>
        {/* CORRECCIÓN: Hover opacity en botón con degradado */}
        <Link href="/tieeenda" className="px-6 py-3 bg-gradient-to-t from-secundario to-primario text-white font-bold rounded-2xl hover:opacity-90 transition-all shadow-md active:scale-95 cursor-pointer">
          Explorar la TIEEEnda
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-col h-full w-full max-w-3xl mx-auto p-4 md:p-8 overflow-y-auto no-scrollbar pb-24">
      
      {/* Cabecera */}
      <div className="flex items-center gap-4 mb-6 md:mb-8">
        <Link href="/tieeenda" className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-primario transition-colors shadow-sm cursor-pointer active:scale-95">
          <i className="icon-left-arrow"></i>
        </Link>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tu Pedido</h1>
      </div>

      {/* Lista de Productos */}
      <div className="bg-white border border-slate-200 rounded-[2rem] p-4 md:p-6 shadow-sm mb-6 space-y-4">
        {cart.map((item) => (
          <div key={item.id} className="flex gap-4 items-center pb-4 border-b border-slate-100 last:border-0 last:pb-0">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100">
              <img src={item.imagen_url} alt={item.nombre} className="w-full h-full object-cover" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-800 text-sm truncate">{item.nombre}</h3>
              <p className="text-primario font-black text-sm">${item.precio}</p>
            </div>

            {/* Controles de Cantidad */}
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-1 border border-slate-200">
              <button 
                onClick={() => item.cantidad > 1 ? updateQuantity(item.id, item.cantidad - 1) : removeFromCart(item.id)}
                className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-white hover:shadow-sm rounded-lg transition-all cursor-pointer active:scale-95"
              >
                <i className={item.cantidad === 1 ? "icon-trash-solid-full text-red-500" : "icon-minus-solid-full"}></i>
              </button>
              <span className="font-bold text-sm w-4 text-center text-slate-900">{item.cantidad}</span>
              <button 
                onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                disabled={item.cantidad >= item.stockMaximo}
                className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-white hover:shadow-sm rounded-lg transition-all disabled:opacity-30 cursor-pointer active:scale-95"
              >
                <i className="icon-plus-solid-full"></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Sección de Propina */}
      <div className="bg-white border border-slate-200 rounded-[2rem] p-5 md:p-6 shadow-sm mb-6">
        <h3 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-2">
          {/* Usamos el ícono del logo como corazón/aportación en lugar del icon-dove */}
          <i className="icon-app-logo text-primario"></i>
          Aportación Voluntaria
        </h3>
        <p className="text-[11px] text-slate-500 font-medium mb-4 leading-relaxed">
          Tu apoyo nos ayuda al mantenimiento de la plataforma y a financiar futuros proyectos de la comunidad estudiantil.
        </p>
        <div className="flex flex-wrap gap-2">
          {[0, 10, 20, 50].map((monto) => (
            <button
              key={monto}
              onClick={() => setPropina(monto)}
              /* CORRECCIÓN: Sombras limpias y degradado estándar Nodum */
              className={`cursor-pointer flex-1 min-w-[70px] py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                propina === monto 
                  ? "bg-gradient-to-t from-secundario to-primario text-white shadow-md" 
                  : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {monto === 0 ? "No, gracias" : `+$${monto}`}
            </button>
          ))}
        </div>
      </div>

      {/* Resumen de Pago */}
      <div className="bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-xl text-white mb-6">
        <div className="space-y-3 mb-4 text-sm font-medium border-b border-slate-800 pb-4">
          <div className="flex justify-between text-slate-400">
            <span>Subtotal ({cart.reduce((acc, item) => acc + item.cantidad, 0)} artículos)</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Aportación Voluntaria</span>
            <span>${propina.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex justify-between items-end">
          <span className="text-slate-300 font-bold">Total a Pagar</span>
          <span className="text-3xl font-black text-emerald-400">${totalFinal.toFixed(2)}</span>
        </div>
      </div>

      {/* Leyenda de Entrega */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex gap-3 items-start">
        <i className="icon-map text-amber-500 text-xl mt-0.5"></i>
        <p className="text-xs text-amber-800 font-semibold leading-relaxed">
          <strong className="block text-amber-900 mb-0.5">Importante sobre tu entrega:</strong>
          Al confirmar tu pedido, la directiva recibirá una notificación. Ellos te escribirán a tu WhatsApp registrado para acordar el pago y la entrega en la facultad.
        </p>
      </div>

      {/* BLOQUE DE ALERTA: PERFIL INCOMPLETO */}
      {perfilCompleto === false && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between animate-in zoom-in-95 duration-300 shadow-sm">
          <div className="flex gap-3 items-start w-full">
            <i className="icon-circle-info-solid-full text-red-500 text-2xl mt-0.5"></i>
            <p className="text-xs text-red-800 font-semibold leading-relaxed">
              <strong className="block text-red-900 mb-0.5">Información Incompleta</strong>
              Para poder entregar tu pedido, necesitamos saber tu nombre completo, WhatsApp de contacto y carrera.
            </p>
          </div>
          {/* CORRECCIÓN: Sombras limpias */}
          <Link href="/perfil" className="w-full md:w-auto text-center whitespace-nowrap bg-red-600 text-white px-5 py-3 rounded-xl text-xs font-bold hover:bg-red-700 transition-all shadow-md active:scale-95 cursor-pointer">
            Completar Perfil
          </Link>
        </div>
      )}

      {/* Botón de Checkout */}
      {/* CORRECCIÓN: Botón principal con hover de opacidad y sombra estándar */}
      <button 
        onClick={procesarPedido}
        disabled={loading || perfilCompleto === false || perfilCompleto === null}
        className="cursor-pointer w-full py-4 bg-gradient-to-t from-secundario to-primario text-white font-black rounded-2xl hover:opacity-90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 active:scale-[0.98]"
      >
        {loading || perfilCompleto === null ? (
          <span className="animate-pulse">Procesando...</span>
        ) : (
          <>
            <i className="icon-check text-xl"></i>
            Confirmar Pedido
          </>
        )}
      </button>

    </main>
  );
}