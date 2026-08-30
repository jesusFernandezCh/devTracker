import {Injectable, signal, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {environment} from '../../environments/environment';
import {Planning, PlanningTask} from '../models/planning.model';

function fechaHoyLocal(): string {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

interface PlanningDto {
  id: string;
  fecha: string;
  proyectoId: string;
  descripcion: string | null;
  tareas: PlanningTask[];
  createdAt: string;
  usuarioId?: string | null;
}

function aPlanning(p: PlanningDto): Planning {
  return {
    id: p.id,
    fecha: p.fecha,
    proyectoId: p.proyectoId,
    descripcion: p.descripcion ?? '',
    tareas: (p.tareas ?? []).map(t => ({...t, completada: t.completada ?? false})),
    createdAt: p.createdAt,
    usuarioId: p.usuarioId ?? undefined,
  };
}

@Injectable({providedIn: 'root'})
export class PlanningService {
  private readonly _plannings = signal<Planning[]>([]);
  readonly plannings = this._plannings.asReadonly();
  private readonly http = inject(HttpClient);

  planningPorId(id: string): Planning | undefined {
    return this._plannings().find((p) => p.id === id);
  }

  async cargar(): Promise<void> {
    try {
      const lista = await firstValueFrom(this.http.get<PlanningDto[]>(`${environment.apiUrl}/planings`));
      this._plannings.set((lista ?? []).map(aPlanning));
    } catch {
      /* sin permiso: mantener estado actual */
    }
  }

  async crear(data: Omit<Planning, 'id' | 'createdAt'>): Promise<Planning> {
    const creado = await firstValueFrom(
      this.http.post<PlanningDto>(`${environment.apiUrl}/planings`, {
        fecha: data.fecha,
        proyectoId: data.proyectoId,
        descripcion: data.descripcion,
        tareas: data.tareas ?? [],
      }),
    );
    const planning = aPlanning(creado);
    this._plannings.update((list) => [...list, planning]);
    return planning;
  }

  async actualizar(id: string, data: Partial<Omit<Planning, 'id' | 'createdAt'>>): Promise<Planning> {
    const actualizado = await firstValueFrom(
      this.http.patch<PlanningDto>(`${environment.apiUrl}/planings/${id}`, {
        fecha: data.fecha,
        descripcion: data.descripcion,
        tareas: data.tareas,
      }),
    );
    const planning = aPlanning(actualizado);
    this._plannings.update((list) => list.map((p) => (p.id === id ? planning : p)));
    return planning;
  }

  async eliminar(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${environment.apiUrl}/planings/${id}`));
    this._plannings.update((list) => list.filter((p) => p.id !== id));
  }

  async clonar(id: string): Promise<Planning | undefined> {
    const original = this._plannings().find((p) => p.id === id);
    if (!original) return undefined;
    const clonado = await firstValueFrom(
      this.http.post<PlanningDto>(`${environment.apiUrl}/planings/${id}/clonar`, {fecha: fechaHoyLocal()}),
    );
    const planning = aPlanning(clonado);
    this._plannings.update((list) => [...list, planning]);
    return planning;
  }

  async agregarTarea(planningId: string, tarea: PlanningTask): Promise<Planning> {
    return this.actualizar(planningId, {tareas: [...this._plannings().find(p => p.id === planningId)?.tareas ?? [], tarea]});
  }

  async toggleCompletada(planningId: string, tareaId: string): Promise<Planning> {
    const planning = this._plannings().find((p) => p.id === planningId);
    if (!planning) return Promise.reject(new Error('Planning no encontrado'));
    const tareas = planning.tareas.map((t) =>
      t.id === tareaId ? {...t, completada: !t.completada} : t,
    );
    return this.actualizar(planningId, {tareas});
  }

  async eliminarTarea(planningId: string, tareaId: string): Promise<Planning> {
    const planning = this._plannings().find((p) => p.id === planningId);
    if (!planning) return Promise.reject(new Error('Planning no encontrado'));
    return this.actualizar(planningId, {tareas: planning.tareas.filter((t) => t.id !== tareaId)});
  }

  limpiar(): void {
    this._plannings.set([]);
  }
}
