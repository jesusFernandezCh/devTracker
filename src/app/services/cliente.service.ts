import {Injectable, signal, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {Cliente} from '../models/cliente.model';
import {ProyectoService} from './proyecto.service';

interface ClienteDto {
  id: string;
  nombre: string;
  createdAt: string;
}

function aCliente(c: ClienteDto): Cliente {
  return {id: c.id, nombre: c.nombre, createdAt: c.createdAt};
}

@Injectable({providedIn: 'root'})
export class ClienteService {
  private readonly _clientes = signal<Cliente[]>([]);
  readonly clientes = this._clientes.asReadonly();
  private readonly http = inject(HttpClient);
  private readonly proyectoService = inject(ProyectoService);

  clientePorId(id: string): Cliente | undefined {
    return this._clientes().find((c) => c.id === id);
  }

  existeNombre(nombre: string, ignorarId?: string): boolean {
    const n = nombre.trim().toLowerCase();
    return this._clientes().some((c) => c.id !== ignorarId && c.nombre.trim().toLowerCase() === n);
  }

  async cargar(): Promise<void> {
    try {
      const lista = await firstValueFrom(this.http.get<ClienteDto[]>('api/clientes'));
      this._clientes.set((lista ?? []).map(aCliente));
    } catch {
      /* sin permiso: mantener estado actual */
    }
  }

  async crear(nombre: string): Promise<boolean> {
    const n = nombre.trim();
    if (!n || this.existeNombre(nombre)) return false;
    try {
      const creado = await firstValueFrom(this.http.post<ClienteDto>('api/clientes', {nombre: n}));
      this._clientes.update((list) => [...list, aCliente(creado)]);
      return true;
    } catch {
      return false;
    }
  }

  async renombrar(id: string, nombre: string): Promise<boolean> {
    const n = nombre.trim();
    if (!n || this.existeNombre(nombre, id)) return false;
    const actual = this.clientePorId(id);
    if (!actual || actual.nombre === n) return true;
    try {
      const actualizado = await firstValueFrom(this.http.patch<ClienteDto>(`api/clientes/${id}`, {nombre: n}));
      this._clientes.update((list) => list.map((c) => (c.id === id ? aCliente(actualizado) : c)));
      this.proyectoService.renombrarCliente(actual.nombre, n);
      return true;
    } catch {
      return false;
    }
  }

  async eliminar(id: string): Promise<'ok' | 'en-uso'> {
    const cliente = this.clientePorId(id);
    if (!cliente) return 'ok';
    try {
      await firstValueFrom(this.http.delete(`api/clientes/${id}`));
      this._clientes.update((list) => list.filter((c) => c.id !== id));
      return 'ok';
    } catch {
      return 'en-uso';
    }
  }

  limpiar(): void {
    this._clientes.set([]);
  }
}
