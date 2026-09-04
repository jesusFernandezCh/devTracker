export interface EventoCalendario {
  id: string;
  titulo: string;
  descripcion?: string;
  fechaInicio: string;
  fechaFin: string;
  todoElDia: boolean;
  categoria: string;
  color?: string;
  usuarioId: string;
  createdAt: string;
}
