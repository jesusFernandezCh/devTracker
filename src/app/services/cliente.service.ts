import {Injectable, signal, inject} from '@angular/core';
import {Cliente} from '../models/cliente.model';
import {ProyectoService} from './proyecto.service';

const STORAGE_KEY = 'devtracker-clientes';

const CLIENTES_DEFAULT: string[] = ['Cliente A', 'Cliente B', 'Cliente C'];

@Injectable({providedIn: 'root'})
export class ClienteService {
  private readonly _clientes = signal<Cliente[]>([]);
  readonly clientes = this._clientes.asReadonly();
  private readonly proyectoService = inject(ProyectoService);

  constructor() {
    this._cargar();
  }

  clientePorId(id: string): Cliente | undefined {
    return this._clientes().find((c) => c.id === id);
  }

  existeNombre(nombre: string, ignorarId?: string): boolean {
    const n = nombre.trim().toLowerCase();
    return this._clientes().some((c) => c.id !== ignorarId && c.nombre.trim().toLowerCase() === n);
  }

  crear(nombre: string): boolean {
    const n = nombre.trim();
    if (!n || this.existeNombre(nombre)) return false;
    const cliente: Cliente = {
      id: crypto.randomUUID(),
      nombre: n,
      createdAt: new Date().toISOString(),
    };
    this._clientes.update((list) => [...list, cliente]);
    this._guardar();
    return true;
  }

  renombrar(id: string, nombre: string): boolean {
    const n = nombre.trim();
    if (!n || this.existeNombre(nombre, id)) return false;
    const actual = this.clientePorId(id);
    if (!actual || actual.nombre === n) return true;
    this._clientes.update((list) => list.map((c) => (c.id === id ? {...c, nombre: n} : c)));
    this._guardar();
    this.proyectoService.renombrarCliente(actual.nombre, n);
    return true;
  }

  eliminar(id: string): 'ok' | 'en-uso' {
    const cliente = this.clientePorId(id);
    if (!cliente) return 'ok';
    if (this.proyectoService.proyectos().some((p) => p.cliente === cliente.nombre)) {
      return 'en-uso';
    }
    this._clientes.update((list) => list.filter((c) => c.id !== id));
    this._guardar();
    return 'ok';
  }

  private _guardar(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._clientes()));
  }

  private _cargar(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const data = JSON.parse(raw) as Cliente[];
        this._clientes.set(data.map((c) => ({...c, nombre: c.nombre || ''})));
        this._guardar();
        return;
      } catch {
        /* ignorar */
      }
    }
    this._clientes.set(CLIENTES_DEFAULT.map((nombre) => ({
      id: crypto.randomUUID(),
      nombre,
      createdAt: new Date().toISOString(),
    })));
    this._guardar();
  }
}