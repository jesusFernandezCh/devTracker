import {Injectable, signal} from '@angular/core';
import {Mensaje, CanalChat} from '../models/mensaje.model';

const STORAGE_KEY = 'devtracker-chat';

@Injectable({providedIn: 'root'})
export class ChatService {
  private readonly _mensajes = signal<Mensaje[]>([]);
  readonly mensajes = this._mensajes.asReadonly();

  readonly abierto = signal(false);

  constructor() {
    this._cargar();
    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEY) this._cargar();
    });
  }

  noLeidosTotal(yoId: string): number {
    return this._mensajes().filter((m) => m.autorId !== yoId && !m.leido).length;
  }

  noLeidosEn(yoId: string, canal: CanalChat, destinoId?: string, proyectoId?: string): number {
    return this._mensajes().filter(
      (m) =>
        m.autorId !== yoId &&
        !m.leido &&
        m.canal === canal &&
        (canal !== 'privado' || this._mismaPareja(m, yoId, destinoId ?? '')) &&
        (canal !== 'grupo' || m.proyectoId === proyectoId),
    ).length;
  }

  mensajesGeneral(yoId: string): Mensaje[] {
    return this._mensajes()
      .filter((m) => m.canal === 'general')
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  mensajesPrivados(yoId: string, otroId: string): Mensaje[] {
    return this._mensajes()
      .filter((m) => m.canal === 'privado' && this._mismaPareja(m, yoId, otroId))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  mensajesGrupo(yoId: string, proyectoId: string): Mensaje[] {
    return this._mensajes()
      .filter((m) => m.canal === 'grupo' && m.proyectoId === proyectoId)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  enviarGeneral(autorId: string, texto: string): void {
    this._agregar({canal: 'general', autorId, texto});
  }

  enviarPrivado(autorId: string, destinoId: string, texto: string): void {
    this._agregar({canal: 'privado', autorId, destinoId, texto});
  }

  enviarGrupo(autorId: string, proyectoId: string, texto: string): void {
    this._agregar({canal: 'grupo', autorId, proyectoId, texto});
  }

  marcarLeidosGeneral(yoId: string): void {
    this._marcar((m) => m.canal === 'general' && m.autorId !== yoId);
  }

  marcarLeidosPrivados(yoId: string, otroId: string): void {
    this._marcar((m) => m.canal === 'privado' && this._mismaPareja(m, yoId, otroId) && m.autorId !== yoId);
  }

  marcarLeidosGrupo(yoId: string, proyectoId: string): void {
    this._marcar((m) => m.canal === 'grupo' && m.proyectoId === proyectoId && m.autorId !== yoId);
  }

  toggle(): void {
    this.abierto.update((v) => !v);
  }

  abrir(): void {
    this.abierto.set(true);
  }

  cerrar(): void {
    this.abierto.set(false);
  }

  private _mismaPareja(m: Mensaje, a: string, b: string): boolean {
    return (m.autorId === a && m.destinoId === b) || (m.autorId === b && m.destinoId === a);
  }

  private _agregar(data: {canal: CanalChat; autorId: string; destinoId?: string; proyectoId?: string; texto: string}): void {
    const texto = data.texto.trim();
    if (!texto) return;
    const mensaje: Mensaje = {
      id: crypto.randomUUID(),
      canal: data.canal,
      autorId: data.autorId,
      destinoId: data.destinoId,
      proyectoId: data.proyectoId,
      texto,
      fecha: new Date().toISOString(),
      leido: false,
    };
    this._mensajes.update((list) => [...list, mensaje]);
    this._guardar();
  }

  private _marcar(predicado: (m: Mensaje) => boolean): void {
    if (!this._mensajes().some(predicado)) return;
    this._mensajes.update((list) => list.map((m) => (predicado(m) ? {...m, leido: true} : m)));
    this._guardar();
  }

  private _cargar(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      this._mensajes.set(JSON.parse(raw) as Mensaje[]);
    } catch {
      /* ignorar */
    }
  }

  private _guardar(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._mensajes()));
  }
}
