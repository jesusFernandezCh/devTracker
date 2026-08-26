import {Injectable, signal, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {io, Socket} from 'socket.io-client';
import {Mensaje, CanalChat} from '../models/mensaje.model';
import {UsuarioService} from './usuario.service';
import {EquipoService} from './equipo.service';

interface MensajeSerializado {
  id: string;
  canal: CanalChat;
  autorId: string;
  destinoId: string | null;
  proyectoId: string | null;
  texto: string;
  fecha: Date;
  leido: boolean;
}

function aMensaje(m: MensajeSerializado): Mensaje {
  return {
    id: m.id,
    canal: m.canal,
    autorId: m.autorId,
    destinoId: m.destinoId ?? undefined,
    proyectoId: m.proyectoId ?? undefined,
    texto: m.texto,
    fecha: new Date(m.fecha).toISOString(),
    leido: m.leido,
  };
}

@Injectable({providedIn: 'root'})
export class ChatService {
  private readonly _mensajes = signal<Mensaje[]>([]);
  readonly mensajes = this._mensajes.asReadonly();

  readonly abierto = signal(false);

  private readonly http = inject(HttpClient);
  private readonly usuarioService = inject(UsuarioService);
  private readonly equipoService = inject(EquipoService);
  private socket: Socket | null = null;

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

  async conectar(yoId: string, token: string | null): Promise<void> {
    this.desconectar();
    this._mensajes.set([]);
    if (!token) return;

    this.socket = io({auth: {token}, transports: ['websocket', 'polling']});
    this.socket.on('mensaje:nuevo', (m: MensajeSerializado) => this._recibir(m));
    this.socket.on('chat:leido', (payload: {canal: CanalChat; destinoId?: string; proyectoId?: string}) => {
      this._marcarLocal((m) => {
        if (m.autorId !== yoId) return false;
        if (payload.canal === 'privado') return payload.destinoId ? this._mismaPareja(m, yoId, payload.destinoId) : false;
        if (payload.canal === 'grupo') return m.proyectoId === payload.proyectoId;
        return m.canal === 'general';
      });
    });

    const proyectos = this.equipoService.proyectosDe(yoId);
    this.socket.on('connect', () => {
      for (const pid of proyectos) this.socket?.emit('chat:unirse-proyecto', pid);
    });

    await this._cargarHistorial(yoId);
  }

  desconectar(): void {
    this.socket?.disconnect();
    this.socket = null;
    this._mensajes.set([]);
  }

  async enviarGeneral(autorId: string, texto: string): Promise<void> {
    const limpio = texto.trim();
    if (!limpio) return;
    try {
      const m = await firstValueFrom(this.http.post<MensajeSerializado>('api/chat/general', {texto: limpio}));
      this._recibir(m);
    } catch {
      /* error de red: no optimista */
    }
  }

  async enviarPrivado(autorId: string, destinoId: string, texto: string): Promise<void> {
    const limpio = texto.trim();
    if (!limpio) return;
    try {
      const m = await firstValueFrom(this.http.post<MensajeSerializado>(`api/chat/privado/${destinoId}`, {texto: limpio}));
      this._recibir(m);
    } catch {
      /* ignorar */
    }
  }

  async enviarGrupo(autorId: string, proyectoId: string, texto: string): Promise<void> {
    const limpio = texto.trim();
    if (!limpio) return;
    try {
      const m = await firstValueFrom(this.http.post<MensajeSerializado>(`api/chat/grupo/${proyectoId}`, {texto: limpio}));
      this._recibir(m);
    } catch {
      /* ignorar */
    }
  }

  async marcarLeidosGeneral(yoId: string): Promise<void> {
    this._marcarLocal((m) => m.canal === 'general' && m.autorId !== yoId);
    await this._marcarLeidos({canal: 'general'});
  }

  async marcarLeidosPrivados(yoId: string, otroId: string): Promise<void> {
    this._marcarLocal((m) => m.canal === 'privado' && this._mismaPareja(m, yoId, otroId) && m.autorId !== yoId);
    await this._marcarLeidos({canal: 'privado', destinoId: otroId});
  }

  async marcarLeidosGrupo(yoId: string, proyectoId: string): Promise<void> {
    this._marcarLocal((m) => m.canal === 'grupo' && m.proyectoId === proyectoId && m.autorId !== yoId);
    await this._marcarLeidos({canal: 'grupo', proyectoId});
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

  private async _cargarHistorial(yoId: string): Promise<void> {
    const todos: MensajeSerializado[] = [];
    try {
      const general = await firstValueFrom(this.http.get<MensajeSerializado[]>('api/chat/general'));
      if (general) todos.push(...general);
    } catch {
      /* ignorar */
    }
    const otros = this.usuarioService.usuarios().filter((u) => u.id !== yoId);
    await Promise.all(
      otros.map(async (u) => {
        try {
          const privados = await firstValueFrom(this.http.get<MensajeSerializado[]>(`api/chat/privado/${u.id}`));
          if (privados) todos.push(...privados);
        } catch {
          /* ignorar */
        }
      }),
    );
    const proyectos = this.equipoService.proyectosDe(yoId);
    await Promise.all(
      proyectos.map(async (pid) => {
        try {
          const grupo = await firstValueFrom(this.http.get<MensajeSerializado[]>(`api/chat/grupo/${pid}`));
          if (grupo) todos.push(...grupo);
        } catch {
          /* ignorar */
        }
      }),
    );
    const mapa = new Map<string, Mensaje>();
    for (const m of todos) mapa.set(m.id, aMensaje(m));
    this._mensajes.set([...mapa.values()].sort((a, b) => a.fecha.localeCompare(b.fecha)));
  }

  private _recibir(m: MensajeSerializado): void {
    const msg = aMensaje(m);
    this._mensajes.update((list) =>
      list.some((x) => x.id === msg.id) ? list : [...list, msg],
    );
  }

  private _marcarLocal(predicado: (m: Mensaje) => boolean): void {
    if (!this._mensajes().some(predicado)) return;
    this._mensajes.update((list) => list.map((m) => (predicado(m) ? {...m, leido: true} : m)));
  }

  private async _marcarLeidos(payload: {canal: CanalChat; destinoId?: string; proyectoId?: string}): Promise<void> {
    try {
      await firstValueFrom(this.http.patch('api/chat/leer', payload));
    } catch {
      /* ignorar */
    }
  }

  private _mismaPareja(m: Mensaje, a: string, b: string): boolean {
    return (m.autorId === a && m.destinoId === b) || (m.autorId === b && m.destinoId === a);
  }
}
