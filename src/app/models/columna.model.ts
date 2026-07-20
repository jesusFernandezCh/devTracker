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

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function generarId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}
