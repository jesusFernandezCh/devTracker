export type TaskStatus = string;

export type TaskPriority = 'baja' | 'media' | 'alta' | 'critica';

export interface Comentario {
  id: string;
  autor: string;
  texto: string;
  fecha: Date;
}

export interface Task {
  id: string;
  titulo: string;
  descripcion: string;
  estado: TaskStatus;
  prioridad: TaskPriority;
  asignadoA: string;
  proyecto: string;
  fechaCreacion: Date;
  fechaVencimiento: Date | null;
  etiquetas: string[];
  comentarios: Comentario[];
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  critica: 'Crítica',
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  baja: 'badge-priority-baja',
  media: 'badge-priority-media',
  alta: 'badge-priority-alta',
  critica: 'badge-priority-critica',
};
