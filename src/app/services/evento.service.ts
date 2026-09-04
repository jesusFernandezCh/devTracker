import {Injectable, signal, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {EventoCalendario} from '../models/evento.model';

@Injectable({providedIn: 'root'})
export class EventoService {
  private readonly _eventos = signal<EventoCalendario[]>([]);
  readonly eventos = this._eventos.asReadonly();
  private readonly http = inject(HttpClient);

  async cargar(): Promise<void> {
    try {
      const lista = await firstValueFrom(this.http.get<EventoCalendario[]>('api/eventos'));
      this._eventos.set(lista ?? []);
    } catch {
      /* sin permiso o no autenticado */
    }
  }

  async crear(data: Omit<EventoCalendario, 'id' | 'createdAt' | 'usuarioId'>): Promise<EventoCalendario> {
    const creado = await firstValueFrom(
      this.http.post<EventoCalendario>('api/eventos', data),
    );
    this._eventos.update(list => [...list, creado]);
    return creado;
  }

  async actualizar(id: string, data: Partial<Omit<EventoCalendario, 'id' | 'createdAt' | 'usuarioId'>>): Promise<EventoCalendario> {
    const actualizado = await firstValueFrom(
      this.http.patch<EventoCalendario>(`api/eventos/${id}`, data),
    );
    this._eventos.update(list => list.map(e => (e.id === id ? actualizado : e)));
    return actualizado;
  }

  async eliminar(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`api/eventos/${id}`));
    this._eventos.update(list => list.filter(e => e.id !== id));
  }

  limpiar(): void {
    this._eventos.set([]);
  }
}
