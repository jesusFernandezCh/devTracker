import {Injectable, signal} from '@angular/core';
import {Notificacion, TipoNotificacion} from '../models/notificacion.model';

const STORAGE_KEY = 'devtracker-notificaciones';
const MAX_NOTIFICACIONES = 100;

@Injectable({providedIn: 'root'})
export class NotificacionService {
  private readonly _notificaciones = signal<Notificacion[]>([]);
  readonly notificaciones = this._notificaciones.asReadonly();

  constructor() {
    this._cargar();
    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEY) this._cargar();
    });
  }

  noLeidas(): number {
    return this._notificaciones().filter((n) => !n.leida).length;
  }

  notificar(data: {tipo: TipoNotificacion; descripcion: string; url?: string}): void {
    const notificacion: Notificacion = {
      id: crypto.randomUUID(),
      tipo: data.tipo,
      descripcion: data.descripcion,
      fecha: new Date().toISOString(),
      leida: false,
      url: data.url,
    };
    this._notificaciones.update((list) =>
      [notificacion, ...list].slice(0, MAX_NOTIFICACIONES),
    );
    this._guardar();
  }

  marcarLeida(id: string): void {
    this._marcar((n) => n.id === id);
  }

  marcarTodasLeidas(): void {
    this._marcar(() => true);
  }

  eliminar(id: string): void {
    this._notificaciones.update((list) => list.filter((n) => n.id !== id));
    this._guardar();
  }

  limpiar(): void {
    this._notificaciones.set([]);
    this._guardar();
  }

  private _marcar(predicado: (n: Notificacion) => boolean): void {
    if (!this._notificaciones().some(predicado)) return;
    this._notificaciones.update((list) =>
      list.map((n) => (predicado(n) ? {...n, leida: true} : n)),
    );
    this._guardar();
  }

  private _cargar(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      this._notificaciones.set(JSON.parse(raw) as Notificacion[]);
    } catch {
      /* ignorar */
    }
  }

  private _guardar(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._notificaciones()));
  }
}
