import {Injectable, signal} from '@angular/core';

const STORAGE_KEY = 'devtracker-equipo-proyecto';

@Injectable({providedIn: 'root'})
export class EquipoService {
  private readonly _porProyecto = signal<Record<string, string[]>>({});
  readonly porProyecto = this._porProyecto.asReadonly();

  constructor() {
    this._cargar();
  }

  miembrosDe(proyectoId: string): string[] {
    return this._porProyecto()[proyectoId] ?? [];
  }

  proyectosDe(usuarioId: string): string[] {
    return Object.entries(this._porProyecto())
      .filter(([, ids]) => ids.includes(usuarioId))
      .map(([proyectoId]) => proyectoId);
  }

  asignar(proyectoId: string, usuarioId: string): void {
    this._porProyecto.update((map) => {
      const ids = map[proyectoId] ?? [];
      if (ids.includes(usuarioId)) return map;
      return {...map, [proyectoId]: [...ids, usuarioId]};
    });
    this._guardar();
  }

  quitar(proyectoId: string, usuarioId: string): void {
    this._porProyecto.update((map) => {
      const ids = map[proyectoId] ?? [];
      if (!ids.includes(usuarioId)) return map;
      return {...map, [proyectoId]: ids.filter((id) => id !== usuarioId)};
    });
    this._guardar();
  }

  establecer(proyectoId: string, usuarioIds: string[]): void {
    this._porProyecto.update((map) => ({...map, [proyectoId]: [...usuarioIds]}));
    this._guardar();
  }

  eliminarUsuarioDeTodos(usuarioId: string): void {
    this._porProyecto.update((map) => {
      const next: Record<string, string[]> = {};
      for (const [proyectoId, ids] of Object.entries(map)) {
        const filtrados = ids.filter((id) => id !== usuarioId);
        if (filtrados.length > 0) next[proyectoId] = filtrados;
      }
      return next;
    });
    this._guardar();
  }

  private _cargar(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        this._porProyecto.set(JSON.parse(raw) as Record<string, string[]>);
        return;
      } catch {
        /* ignorar */
      }
    }
    this._porProyecto.set({});
    this._guardar();
  }

  private _guardar(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._porProyecto()));
  }
}
