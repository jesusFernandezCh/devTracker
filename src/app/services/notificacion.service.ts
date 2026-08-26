import {Injectable, signal, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {Notificacion, TipoNotificacion} from '../models/notificacion.model';

@Injectable({providedIn: 'root'})
export class NotificacionService {
  private readonly _notificaciones = signal<Notificacion[]>([]);
  readonly notificaciones = this._notificaciones.asReadonly();
  private readonly http = inject(HttpClient);

  noLeidas(): number {
    return this._notificaciones().filter((n) => !n.leida).length;
  }

  async cargar(): Promise<void> {
    try {
      const lista = await firstValueFrom(this.http.get<Notificacion[]>('api/notificaciones'));
      this._notificaciones.set(lista ?? []);
    } catch {
      /* sin permiso o no autenticado */
    }
  }

  async notificar(data: {tipo: TipoNotificacion; descripcion: string; url?: string}): Promise<void> {
    try {
      const creada = await firstValueFrom(this.http.post<Notificacion>('api/notificaciones', data));
      this._notificaciones.update((list) => [creada, ...list]);
    } catch {
      /* sin sesión (p. ej. en el login): no notificar */
    }
  }

  async marcarLeida(id: string): Promise<void> {
    try {
      const actualizada = await firstValueFrom(this.http.patch<Notificacion>(`api/notificaciones/${id}/leer`));
      this._notificaciones.update((list) => list.map((n) => (n.id === id ? actualizada : n)));
    } catch {
      /* ignorar */
    }
  }

  async marcarTodasLeidas(): Promise<void> {
    try {
      await firstValueFrom(this.http.patch('api/notificaciones/leer-todas', {}));
      this._notificaciones.update((list) => list.map((n) => ({...n, leida: true})));
    } catch {
      /* ignorar */
    }
  }

  async eliminar(id: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete(`api/notificaciones/${id}`));
      this._notificaciones.update((list) => list.filter((n) => n.id !== id));
    } catch {
      /* ignorar */
    }
  }

  limpiar(): void {
    this._notificaciones.set([]);
  }
}
