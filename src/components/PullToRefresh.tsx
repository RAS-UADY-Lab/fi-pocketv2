"use client";

import { useState, useRef } from "react";

export default function PullToRefresh({ children }: { children: React.ReactNode }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Umbral para decidir si recargamos o cancelamos
  const PULL_THRESHOLD = 80;
  // Límite máximo de estiramiento
  const MAX_PULL = 120;

  const onTouchStart = (e: React.TouchEvent) => {
    // Solo permitimos jalar si el usuario está hasta el tope de la pantalla
    if (containerRef.current && containerRef.current.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
    } else {
      startY.current = 0;
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current === 0 || isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    // Solo si el usuario arrastra hacia abajo
    if (diff > 0) {
      // Fricción para que se sienta pesado/elástico
      const distance = Math.min(diff * 0.45, MAX_PULL);
      setPullDistance(distance);
    }
  };

  const onTouchEnd = () => {
    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      
      setTimeout(() => {
        window.location.reload();
      }, 600);
      
    } else {
      // Si soltó antes del límite, regresa a 0
      setPullDistance(0);
    }
    startY.current = 0;
  };

  return (
    <div 
      ref={containerRef}
      className="h-full w-full overflow-y-auto overscroll-y-none relative custom-scrollbar bg-slate-50"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* ✨ INDICADOR MODERNO FLOTANTE */}
      <div 
        className="absolute top-0 left-0 w-full flex justify-center pointer-events-none z-[100] md:hidden"
        style={{
          // Cae desde afuera de la pantalla (-50px) hacia abajo
          transform: `translateY(${isRefreshing ? 24 : pullDistance - 50}px)`,
          opacity: pullDistance > 0 ? 1 : 0,
          // Transición suave SOLO cuando soltamos el dedo o está recargando
          transition: isRefreshing || pullDistance === 0 ? 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s' : 'none',
        }}
      >
        <div 
          className={`w-10 h-10 bg-white rounded-full shadow-lg border border-slate-100 flex items-center justify-center ${
            isRefreshing ? 'animate-spin' : ''
          }`}
          style={{ 
            // Gira en base a cuánto jalas
            transform: `rotate(${pullDistance * 4}deg)`,
            // Cambia al color primario si ya jalaste lo suficiente
            color: pullDistance >= PULL_THRESHOLD || isRefreshing ? 'var(--color-primario, #98002e)' : '#94a3b8'
          }}
        >
          <i className="icon-app-logo text-xl"></i>
        </div>
      </div>

      {/* ✨ EL CONTENIDO DE LA APP (Ahora se mantiene firme) */}
      <div className="min-h-full w-full">
        {children}
      </div>
    </div>
  );
}