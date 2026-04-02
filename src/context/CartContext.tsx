"use client";

import { createContext, useContext, useState, ReactNode } from "react";

// 1. Definimos exactamente qué forma tiene un producto en el carrito
export type CartItem = {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  stockMaximo: number; // Para evitar que compren más de lo que hay
  categoria: string;
  imagen_url: string;
};

// 2. Definimos las funciones que nuestra "nube" le prestará a la app
type CartContextType = {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, cantidad: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
};

// 3. Creamos el Contexto vacío
const CartContext = createContext<CartContextType | undefined>(undefined);

// 4. Creamos el "Proveedor" que envolverá la aplicación
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Función inteligente para añadir (si ya existe, solo suma la cantidad)
  const addToCart = (newItem: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === newItem.id);
      
      if (existing) {
        // Bloqueamos si intentan agregar más del stock disponible
        if (existing.cantidad >= newItem.stockMaximo) return prev;
        
        return prev.map((item) =>
          item.id === newItem.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      
      // Si no existe, lo agregamos con cantidad 1
      return [...prev, { ...newItem, cantidad: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, cantidad: number) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, cantidad } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Cálculos automáticos en tiempo real
  const totalItems = cart.reduce((acc, item) => acc + item.cantidad, 0);
  const totalPrice = cart.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

  return (
    <CartContext.Provider value={{ 
      cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice 
    }}>
      {children}
    </CartContext.Provider>
  );
}

// 5. Un Hook personalizado para usar el carrito fácilmente en cualquier archivo
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart debe usarse dentro de un CartProvider");
  return context;
};