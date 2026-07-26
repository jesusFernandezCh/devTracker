export interface Columna {
  id: string;
  nombre: string;
  orden: number;
  color: string;
}

export const COLUMNAS_DEFAULT: Columna[] = [
  { id: 'desarrollo', nombre: 'Desarrollo', orden: 0, color: '#EAB308' },
  { id: 'calidad', nombre: 'Calidad', orden: 1, color: '#3B82F6' },
  { id: 'produccion', nombre: 'Producción', orden: 2, color: '#22C55E' },
];


