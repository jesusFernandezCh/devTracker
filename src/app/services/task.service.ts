import {Injectable, signal, computed} from '@angular/core';
import {Task, TaskStatus} from '../models/task.model';

const STORAGE_KEY = 'dev-tracker-tasks';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly _tasks = signal<Task[]>([]);

  readonly tasks = this._tasks.asReadonly();

  readonly tareasDesarrollo = computed(() =>
    this._tasks().filter((t) => t.estado === 'desarrollo'),
  );

  readonly tareasCalidad = computed(() =>
    this._tasks().filter((t) => t.estado === 'calidad'),
  );

  readonly tareasProduccion = computed(() =>
    this._tasks().filter((t) => t.estado === 'produccion'),
  );

  constructor() {
    this._loadFromStorage();
  }

  private _saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._tasks()));
  }

  private _loadFromStorage(): void {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        const parsed: Task[] = JSON.parse(data);
        this._tasks.set(
          parsed.map((t) => ({
            ...t,
            fechaCreacion: new Date(t.fechaCreacion),
            fechaVencimiento: t.fechaVencimiento ? new Date(t.fechaVencimiento) : null,
            comentarios: t.comentarios.map((c) => ({...c, fecha: new Date(c.fecha)})),
          })),
        );
      } catch {
        this._tasks.set([]);
      }
    }
  }

  agregarTarea(tarea: Task): void {
    this._tasks.update((tasks) => [...tasks, tarea]);
    this._saveToStorage();
  }

  actualizarTarea(id: string, cambios: Partial<Task>): void {
    this._tasks.update((tasks) =>
      tasks.map((t) => (t.id === id ? {...t, ...cambios} : t)),
    );
    this._saveToStorage();
  }

  moverTarea(id: string, nuevoEstado: TaskStatus): void {
    this.actualizarTarea(id, {estado: nuevoEstado});
  }

  eliminarTarea(id: string): void {
    this._tasks.update((tasks) => tasks.filter((t) => t.id !== id));
    this._saveToStorage();
  }

  obtenerTareaPorId(id: string): Task | undefined {
    return this._tasks().find((t) => t.id === id);
  }
}
