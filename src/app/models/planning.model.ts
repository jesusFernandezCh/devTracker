export interface Planning {
  id: string;
  fecha: string;
  proyectoId: string;
  tarea: string;
  complejidad: 'Simple' | 'Media' | 'Amplia';
  diasDesarrollo: number;
  tiempoEstimado: number;
  createdAt: string;
}
