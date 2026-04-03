"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation"; 
import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function TIEEEndaPage() {
  const supabase = createClient();
  const router = useRouter(); 
  const { addToCart, totalItems } = useCart();

  const [productos, setProductos] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSel, setCategoriaSel] = useState("Todos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verificarYContenido = async () => {
      // 1. Verificamos si hay una sesión activa
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Si no hay sesión, lo mandamos directo al login
      if (!session) {
        router.push("/login");
        return;
      }

      // 2. Si sí hay sesión, cargamos los productos
      const { data, error } = await supabase.from("productos").select("*");
      if (!error) setProductos(data);
      setLoading(false);
    };

    verificarYContenido();
  }, [supabase, router]);

  // 2. Filtrado dinámico
  const productosFiltrados = productos.filter((p) => {
    const coincideBusqueda = p.nombre
      .toLowerCase()
      .includes(busqueda.toLowerCase());
    const coincideCat =
      categoriaSel === "Todos" || p.categoria === categoriaSel;
    return coincideBusqueda && coincideCat;
  });

  const categorias = ["Todos", ...new Set(productos.map((p) => p.categoria))];

  return (
    <main className="flex flex-col h-full max-w-6xl mx-auto p-4 md:p-8 overflow-y-auto custom-scrollbar pb-24">
      <header className="mb-8">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
          TIEEEnda
        </h1>
        <p className="text-slate-500 font-medium">
          Recursos y componentes para la comunidad.
        </p>
      </header>

      {/* Buscador y Filtros */}
      <section className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <i className="icon-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          {/* CORRECCIÓN: Arreglado el typo focus:ring-primario0 y agregada la opacidad */}
          <input
            type="text"
            placeholder="¿Qué componente buscas?"
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primario/20 outline-none shadow-sm transition-all font-medium"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaSel(cat)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap active:scale-95 cursor-pointer ${
                categoriaSel === cat
                  ? "bg-gradient-to-t from-secundario to-primario text-white shadow-md"
                  : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Galería de Productos */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 animate-pulse">
          <i className="icon-store-solid-full text-5xl mb-4"></i>
          <p className="font-bold">Cargando inventario...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {productosFiltrados.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl transition-all group flex flex-col hover:border-primario/30"
            >
              <div className="aspect-square bg-slate-50 relative overflow-hidden flex-shrink-0">
                <img
                  src={prod.imagen_url}
                  alt={prod.nombre}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Etiquetas Condicionales */}
                {prod.stock <= 5 && prod.stock > 0 && (
                  <span className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-black px-2 py-1 rounded-lg uppercase shadow-sm">
                    Últimas {prod.stock} piezas
                  </span>
                )}
                
                {prod.stock === 0 && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="text-white font-black text-xs uppercase tracking-widest border-2 border-white px-3 py-1 rotate-[-15deg] shadow-lg">
                      Agotado
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <p className="text-[10px] font-bold text-primario uppercase mb-1 tracking-wider">
                  {prod.categoria}
                </p>
                <h3 className="font-bold text-slate-800 text-sm md:text-base leading-tight mb-4 flex-1">
                  {prod.nombre}
                </h3>

                <div className="flex items-end justify-between mt-auto">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      Precio
                    </p>
                    <p className="text-lg font-black text-slate-900 leading-none mt-1">
                      ${prod.precio}
                    </p>
                  </div>
                  {/* CORRECCIÓN: Uso de icon-cart y mejora en la transición del hover */}
                  <button
                    disabled={prod.stock === 0}
                    onClick={() =>
                      addToCart({
                        id: prod.id,
                        nombre: prod.nombre,
                        precio: prod.precio,
                        cantidad: 1,
                        stockMaximo: prod.stock,
                        categoria: prod.categoria,
                        imagen_url: prod.imagen_url,
                      })
                    }
                    className="cursor-pointer w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:opacity-90 disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 flex-shrink-0"
                    title={prod.stock === 0 ? "Agotado" : "Agregar al carrito"}
                  >
                    <i className="icon-plus-solid-full text-lg"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {productosFiltrados.length === 0 && (
            <div className="col-span-full py-16 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                <i className="icon-magnifying-glass text-3xl text-slate-300"></i>
              </div>
              <h3 className="text-lg font-bold text-slate-700">Sin resultados</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">No encontramos componentes que coincidan con tu búsqueda.</p>
            </div>
          )}
        </div>
      )}

      {/* FAB del Carrito */}
      {/* CORRECCIÓN: Uso de icon-cart en el FAB */}
      <Link
        href="/tieeenda/carrito"
        className="fixed bottom-24 right-6 bg-gradient-to-t from-secundario to-primario text-white w-16 h-16 rounded-full shadow-xl shadow-sm/30 flex items-center justify-center hover:-translate-y-1 hover:shadow-2xl transition-all active:scale-95 z-50 cursor-pointer"
      >
        <div className="relative flex ">
          <i className="icon-cart-shopping-solid-full text-2xl"></i>
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] font-bold w-[22px] h-[22px] rounded-full flex items-center justify-center border-[3px] border-white animate-in zoom-in shadow-sm">
              {totalItems}
            </span>
          )}
        </div>
      </Link>
    </main>
  );
}