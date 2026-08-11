export interface PlanningTask {
  id: string;
  tarea: string;
  complejidad: 'Simple' | 'Media' | 'Compleja';
  completada: boolean;
}

export interface Planning {
  id: string;
  fecha: string;
  proyectoId: string;
  descripcion: string;
  tareas: PlanningTask[];
  createdAt: string;
  /** Id del usuario que creó el planning. */
  usuarioId?: string;
}
