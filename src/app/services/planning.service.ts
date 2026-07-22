import {Injectable, signal, computed} from '@angular/core';
import {Planning} from '../models/planning.model';

const STORAGE_KEY = 'devtracker-planning';

@Injectable({providedIn: 'root'})
export class PlanningService {
  private readonly _plannings = signal<Planning[]>([]);
  readonly plannings = this._plannings.asReadonly();

  constructor() {
    this._cargar();
  }

  planningPorId(id: string) {
    return computed(() => this._plannings().find((p) => p.id === id));
  }

  crear(data: Omit<Planning, 'id' | 'createdAt'>): void {
    const planning: Planning = {
      ...data,
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

  private _guardar(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._plannings()));
  }

  private _cargar(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        this._plannings.set(JSON.parse(raw));
        return;
      } catch {
        /* ignorar */
      }
    }
    this._plannings.set([]);
    this._guardar();
  }
}
