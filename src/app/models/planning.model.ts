export interface PlanningTask {
  id: string;
  tarea: string;
  complejidad: 'Simple' | 'Media' | 'Compleja';
}

export interface Planning {
  id: string;
  fecha: string;
  proyectoId: string;
  descripcion: string;
  tareas: PlanningTask[];
  createdAt: string;
}
