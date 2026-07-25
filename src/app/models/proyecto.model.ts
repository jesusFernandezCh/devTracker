import {Planning, PlanningTask} from './planning.model';

export interface Proyecto {
  id: string;
  nombre: string;
  descripcion: string;
  cliente: string;
  status: string;
  columnaId: string;
  fechaDesde: string;
  fechaHasta: string;
  documentacion: string;
  createdAt: string;
}

export interface ProyectoConDatos {
  proyecto: Proyecto;
  plannings: Planning[];
  tareas: PlanningTask[];
}
