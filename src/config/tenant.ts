// ============================================================================
// 1. INTERFACES DE TIPADO ESTRICTO (El esqueleto de los datos)
// ============================================================================

export type Plataforma = "facebook" | "instagram" | "tiktok" | "sitio" | "x" | "youtube";

export interface Comunidad {
  nombre: string;
  handle: string;
  color: string;
  iconColor: string;
  plataformas: Partial<Record<Plataforma, string>>;
}

export interface Planta {
  nivel: string;
  ubicaciones: string[];
}

export interface Edificio {
  id: string;
  nombre: string;
  tipo: string;
  plantas: Planta[];
}

export interface Documento {
  titulo: string;
  descripcion: string;
  tipo: "PDF" | "WORD" | "EXCEL" | "POWERPOINT";
  peso: string;
  url: string;
}

export interface Portal {
  id: string;
  nombre: string;
  descripcion: string;
  url: string;
  icono: string;
  estilos: {
    fondo: string;
    texto: string;
    boton: string;
  };
}

export interface TenantConfig {
  identidad: {
    nombre: string;
    organizacion: string;
    logoIcono: string;
    colorPrimario: string;
    colorActivo: string;
  };
  modulos: {
    mapa: boolean;
    directorio: boolean;
    archivo: boolean;
    portales: boolean;
    tieeenda: boolean,
    perfil: boolean,
  };
  comunidades: Comunidad[];
  edificios: Record<string, Edificio>;
  documentos: Documento[];
  portales: Portal[];
}

// ============================================================================
// 2. CONFIGURACIÓN DEL CLIENTE ACTUAL (FI Pocket - UADY)
// ============================================================================

export const tenantConfig: TenantConfig = {
  // --- IDENTIDAD VISUAL ---
  identidad: {
    nombre: "FI Pocket",
    organizacion: "Capítulo RAS UADY",
    logoIcono: "icon-app-logo",
    colorPrimario: "#98002e", // Cyan UADY (Color base para edificios estáticos)
    colorActivo: "#61116a",   // Azul oscuro (Color cuando se selecciona un edificio)
  },

  // --- INTERRUPTORES DE MÓDULOS ---
  // Cambia a 'false' si un cliente no quiere alguna de estas pestañas
  modulos: {
    mapa: true,
    directorio: true,
    archivo: true,
    portales: true,
    tieeenda: true,
    perfil:true,
  },

  // --- COMUNIDADES Y REDES SOCIALES (Dashboard) ---
  comunidades: [
    { 
      nombre: "Ingeniería UADY", 
      handle: "@ingenieria.uady.mx", 
      color: "bg-red-50 text-red-600 border-red-100",
      iconColor: "text-red-500",
      plataformas: { 
        facebook: "https://www.facebook.com/ingenieria.uady.mx",
        instagram: "https://www.instagram.com/ingenieria.uady"
      }
    },
    { 
      nombre: "IEEE RAS UADY", 
      handle: "@RAS.UADY", 
      color: "bg-primario text-primario border-primario",
      iconColor: "text-primario",
      plataformas: { 
        facebook: "https://www.facebook.com/RAS.UADY",
        instagram: "https://www.instagram.com/ras_uady" 
      }
    },
    { 
      nombre: "IEEE UADY", 
      handle: "@IEEEUADY", 
      color: "bg-sky-50 text-sky-600 border-sky-100",
      iconColor: "text-sky-500",
      plataformas: { 
        facebook: "https://www.facebook.com/IEEEUADY" 
      }
    },
    { 
      nombre: "FACE UADY", 
      handle: "@face.uady", 
      color: "bg-orange-50 text-orange-600 border-orange-100",
      iconColor: "text-orange-500",
      plataformas: { 
        facebook: "https://www.facebook.com/face.uady" 
      }
    },
    { 
      nombre: "Comunidad FI", 
      handle: "Página Estudiantil", 
      color: "bg-indigo-50 text-indigo-600 border-indigo-100",
      iconColor: "text-indigo-500",
      plataformas: { 
        facebook: "https://www.facebook.com/profile.php?id=61572180451258" 
      }
    },
  ],

  // --- BASE DE DATOS LOCAL: MAPA Y DIRECTORIO ---
  edificios: {
    "Z": {
      id: "Z",
      nombre: "Edificio Z",
      tipo: "Biblioteca y Centro de Información",
      plantas: [
        {
          nivel: "Planta Única",
          ubicaciones: ["Área de Acervo General", "Mesas de Trabajo y Lectura", "Área de Computadoras", "Baños"]
        }
      ]
    },
    "C": {
      id: "C",
      nombre: "Edificio C",
      tipo: "Aulas Teóricas",
      plantas: [
        {
          nivel: "Planta Baja",
          ubicaciones: ["Aula C1", "Aula C2", "Baños Hombres / Mujeres"]
        },
        {
          nivel: "Planta Alta",
          ubicaciones: ["Aula C3", "Aula C4"]
        }
      ]
    },
    "A1": {
      id: "A1",
      nombre: "Edificio A1",
      tipo: "Aulas Teóricas",
      plantas: [
        {
          nivel: "Planta Baja",
          ubicaciones: ["Aula A1-1", "Aula A1-2"]
        },
        {
          nivel: "Planta Alta",
          ubicaciones: ["Aula A1-3", "Aula A1-4", "Cubículos de Maestros"]
        }
      ]
    },
    "PC": {
      id: "PC",
      nombre: "Plaza Cívica",
      tipo: "Área Común",
      plantas: [
        {
          nivel: "Planta Baja",
          ubicaciones: ["Explanada Principal", "Área de Eventos Estudiantiles"]
        }
      ]
    }
  },

  // --- BASE DE DATOS LOCAL: ARCHIVO DE DOCUMENTOS ---
  documentos: [
    {
      titulo: "Calendario Escolar UADY 2026",
      descripcion: "Fechas de inicio, cierre y días inhábiles.",
      tipo: "PDF",
      peso: "1.2 MB",
      url: "/docs/calendario_2026.pdf" // Ruta a tu carpeta public/docs (por crear a futuro)
    },
    {
      titulo: "Retícula Mecatrónica",
      descripcion: "Mapa curricular y asignaturas por semestre.",
      tipo: "PDF",
      peso: "850 KB",
      url: "/docs/reticula_mecatronica.pdf"
    },
    {
      titulo: "Reglamento General de Inscripciones",
      descripcion: "Lineamientos oficiales para procesos administrativos.",
      tipo: "PDF",
      peso: "2.4 MB",
      url: "/docs/reglamento_inscripciones.pdf"
    },
    {
      titulo: "Formato de Servicio Social",
      descripcion: "Documento requerido para el registro de horas.",
      tipo: "WORD",
      peso: "45 KB",
      url: "/docs/formato_servicio.docx"
    }
  ],

  // --- PORTALES EXTERNOS ---
  portales: [
    {
      id: "sicei",
      nombre: "SICEI",
      descripcion: "Consulta calificaciones, carga horaria, kárdex y realiza tu proceso de inscripción en el portal oficial.",
      url: "https://www.sicei.uady.mx/",
      icono: "icon-laptop",
      estilos: {
        fondo: "bg-gradient-to-br from-amber-500 to-amber-600",
        texto: "text-amber-100",
        boton: "text-amber-600 hover:bg-amber-50"
      }
    },
    {
      id: "uady-virtual",
      nombre: "UADY Virtual",
      descripcion: "Accede a tus asignaturas en línea, entrega de tareas y material didáctico.",
      url: "https://es.uadyvirtual.uady.mx/",
      icono: "icon-laptop",
      estilos: {
        fondo: "bg-gradient-to-br from-primario to-primario",
        texto: "text-primario",
        boton: "text-primario hover:bg-primario"
      }
    }
  ]
};