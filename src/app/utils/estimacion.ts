import type {PlanningTask} from '../models/planning.model';

export function complejidadEstilo(comp: string): {text: string; bg: string} {
  switch (comp) {
    case 'Simple': return {text: '#059669', bg: '#d1fae5'};
    case 'Media': return {text: '#b45309', bg: '#fef3c7'};
    case 'Compleja': return {text: '#dc2626', bg: '#fee2e2'};
    default: return {text: '#6b7280', bg: '#f3f4f6'};
  }
}

export function estimacionTotal(tareas: PlanningTask[]): number {
  const valores: Record<string, number> = {Simple: 1, Media: 3, Compleja: 5};
  return tareas.reduce((sum, t) => sum + (valores[t.complejidad] ?? 0), 0);
}

export function statusColor(status: string): {text: string; bg: string} {
  switch (status) {
    case 'Activo': return {text: '#059669', bg: '#d1fae5'};
    case 'Pausa': return {text: '#b45309', bg: '#fef3c7'};
    case 'Inactivo': return {text: '#dc2626', bg: '#fee2e2'};
    default: return {text: '#6b7280', bg: '#f3f4f6'};
  }
}
