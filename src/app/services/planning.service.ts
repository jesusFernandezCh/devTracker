import {Injectable, signal} from '@angular/core';
import {Planning, PlanningTask} from '../models/planning.model';

const STORAGE_KEY = 'devtracker-planning';

function fechaHoyLocal(): string {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

@Injectable({providedIn: 'root'})
export class PlanningService {
  private readonly _plannings = signal<Planning[]>([]);
  readonly plannings = this._plannings.asReadonly();

  constructor() {
    this._cargar();
  }

  planningPorId(id: string): Planning | undefined {
    return this._plannings().find((p) => p.id === id);
  }

  crear(data: Omit<Planning, 'id' | 'createdAt'>): void {
    const planning: Planning = {
      ...data,
      tareas: data.tareas ?? [],
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this._plannings.update((list) => [...list, planning]);
    this._guardar();
  }

  actualizar(id: string, data: Partial<Omit<Planning, 'id' | 'createdAt'>>): void {
    this._plannings.update((list) =>
      list.map((p) => (p.id === id ? {...p, ...data} : p)),
    );
    this._guardar();
  }

  eliminar(id: string): void {
    this._plannings.update((list) => list.filter((p) => p.id !== id));
    this._guardar();
  }

  clonar(id: string): void {
    const original = this._plannings().find((p) => p.id === id);
    if (!original) return;
    const tareas: PlanningTask[] = original.tareas.map((t) => ({
      ...t,
      id: crypto.randomUUID(),
      completada: false,
    }));
    this.crear({
      fecha: fechaHoyLocal(),
      proyectoId: original.proyectoId,
      descripcion: `${original.descripcion || 'Planning'} (copia)`,
      tareas,
    });
  }

  agregarTarea(planningId: string, tarea: import('../models/planning.model').PlanningTask): void {
    this._plannings.update((list) =>
      list.map((p) =>
        p.id === planningId ? {...p, tareas: [...p.tareas, tarea]} : p,
      ),
    );
    this._guardar();
  }

  toggleCompletada(planningId: string, tareaId: string): void {
    this._plannings.update((list) =>
      list.map((p) =>
        p.id === planningId
          ? {...p, tareas: p.tareas.map((t) => (t.id === tareaId ? {...t, completada: !t.completada} : t))}
          : p,
      ),
    );
    this._guardar();
  }

  eliminarTarea(planningId: string, tareaId: string): void {
    this._plannings.update((list) =>
      list.map((p) =>
        p.id === planningId
          ? {...p, tareas: p.tareas.filter((t) => t.id !== tareaId)}
          : p,
      ),
    );
    this._guardar();
  }

  private _guardar(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._plannings()));
  }

  private _cargar(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const data = JSON.parse(raw) as Planning[];
        this._plannings.set(data.map(p => ({
          ...p,
          tareas: (p.tareas ?? []).map(t => ({...t, completada: t.completada ?? false})),
        })));
        this._guardar();
        return;
      } catch {
        /* ignorar */
      }
    }
    this._plannings.set([]);
    this._guardar();
  }
}
