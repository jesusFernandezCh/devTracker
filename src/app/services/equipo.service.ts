import {Injectable, signal, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';

/**
 * Relación N:N proyecto ↔ usuario como `Record<proyectoId, string[]>`.
 * La fuente de verdad es `GET /equipo`; las mutaciones viajan por HTTP y se
 * reflejan localmente de forma optimista (con rollback ante error).
 */
@Injectable({providedIn: 'root'})
export class EquipoService {
  private readonly _porProyecto = signal<Record<string, string[]>>({});
  readonly porProyecto = this._porProyecto.asReadonly();
  private readonly http = inject(HttpClient);

  miembrosDe(proyectoId: string): string[] {
    return this._porProyecto()[proyectoId] ?? [];
  }

  proyectosDe(usuarioId: string): string[] {
    return Object.entries(this._porProyecto())
      .filter(([, ids]) => ids.includes(usuarioId))
      .map(([proyectoId]) => proyectoId);
  }

  async cargar(): Promise<void> {
    try {
      const mapa = await firstValueFrom(this.http.get<Record<string, string[]>>('api/equipo'));
      this._porProyecto.set(mapa ?? {});
    } catch {
      /* sin permiso: mantener estado actual */
    }
  }

  async asignar(proyectoId: string, usuarioId: string): Promise<void> {
    const previo = this._porProyecto();
    this._porProyecto.update((map) => {
      const ids = map[proyectoId] ?? [];
      if (ids.includes(usuarioId)) return map;
      return {...map, [proyectoId]: [...ids, usuarioId]};
    });
    try {
      await firstValueFrom(this.http.post(`api/equipo/proyecto/${proyectoId}/${usuarioId}`, {}));
    } catch {
      this._porProyecto.set(previo);
    }
  }

  async quitar(proyectoId: string, usuarioId: string): Promise<void> {
    const previo = this._porProyecto();
    this._porProyecto.update((map) => {
      const ids = map[proyectoId] ?? [];
      if (!ids.includes(usuarioId)) return map;
      return {...map, [proyectoId]: ids.filter((id) => id !== usuarioId)};
    });
    try {
      await firstValueFrom(this.http.delete(`api/equipo/proyecto/${proyectoId}/${usuarioId}`));
    } catch {
      this._porProyecto.set(previo);
    }
  }

  async establecer(proyectoId: string, usuarioIds: string[]): Promise<void> {
    const previo = this._porProyecto();
    this._porProyecto.update((map) => ({...map, [proyectoId]: [...usuarioIds]}));
    try {
      await firstValueFrom(this.http.put(`api/equipo/proyecto/${proyectoId}`, {usuarioIds}));
    } catch {
      this._porProyecto.set(previo);
    }
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
  }

  limpiar(): void {
    this._porProyecto.set({});
  }
}
