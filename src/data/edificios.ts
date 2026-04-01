// 1. DEFINICIÓN DE TIPOS (Interfaces)
// Esto le dice a TypeScript exactamente qué forma deben tener nuestros datos.

export interface Planta {
  nivel: string;       // Ej: "Planta Baja", "Primer Piso"
  ubicaciones: string[]; // Lista de salones, laboratorios, etc.
}

export interface Edificio {
  id: string;          // El mismo ID que usas en el SVG (Ej: "C", "Z", "A1")
  nombre: string;      // El nombre amigable para el usuario
  tipo: string;        // Categoría para darle contexto visual (Ej: "Aulas", "Biblioteca")
  plantas: Planta[];   // Un arreglo con la información separada por niveles
}

// 2. BASE DE DATOS LOCAL
// Usamos Record<string, Edificio> para crear un "Diccionario". 
// Esto permite que buscar la info de un edificio sea instantáneo O(1) al hacer infoEdificios["C"].

export const infoEdificios: Record<string, Edificio> = {
  "Z": {
    id: "Z",
    nombre: "Edificio Z",
    tipo: "Biblioteca y Centro de Información",
    plantas: [
      {
        nivel: "Planta Única",
        ubicaciones: [
          "Área de Acervo General",
          "Mesas de Trabajo y Lectura",
          "Cubículos de Estudio Grupales",
          "Área de Computadoras",
          "Baños"
        ]
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
        ubicaciones: [
          "Aula C1",
          "Aula C2",
          "Baños Hombres / Mujeres"
        ]
      },
      {
        nivel: "Planta Alta",
        ubicaciones: [
          "Aula C3",
          "Aula C4"
        ]
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
        ubicaciones: [
          "Aula A1-1",
          "Aula A1-2"
        ]
      },
      {
        nivel: "Planta Alta",
        ubicaciones: [
          "Aula A1-3",
          "Aula A1-4",
          "Cubículos de Maestros"
        ]
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
        ubicaciones: [
          "Explanada Principal",
          "Área de Eventos Estudiantiles"
        ]
      }
    ]
  }
  // Para agregar más edificios, solo tienes que copiar la estructura de uno de estos
  // y rellenar los datos usando el ID exacto de tu archivo SVG.
};