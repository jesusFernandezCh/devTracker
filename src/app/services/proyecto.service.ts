import {Injectable, signal, inject} from '@angular/core';
import {Proyecto} from '../models/proyecto.model';
import {PROYECTOS_DEMO} from '../data/demo-proyectos';
import {AuthService} from './auth.service';
import {EquipoService} from './equipo.service';

const STORAGE_KEY = 'devtracker-proyectos';

const COLUMNA_POR_DEFECTO = 'desarrollo';

@Injectable({providedIn: 'root'})
export class ProyectoService {
  private readonly _proyectos = signal<Proyecto[]>([]);
  readonly proyectos = this._proyectos.asReadonly();
  private readonly authService = inject(AuthService);
  private readonly equipoService = inject(EquipoService);

  constructor() {
    this._cargar();
  }

  proyectoPorId(id: string): Proyecto | undefined {
    return this._proyectos().find((p) => p.id === id);
  }

  crear(data: Omit<Proyecto, 'id' | 'createdAt' | 'columnaId'> & {columnaId?: string}): void {
    data = { ...data, cliente: data.cliente || '', status: data.status || 'Activo', prioridad: data.prioridad || 'baja' };

    const proyecto: Proyecto = {
      ...data,
      columnaId: data.columnaId || COLUMNA_POR_DEFECTO,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this._proyectos.update((list) => [...list, proyecto]);
    this._guardar();
    const creadorId = this.authService.currentUser()?.id;
    if (creadorId) this.equipoService.asignar(proyecto.id, creadorId);
  }

  actualizar(id: string, data: Partial<Omit<Proyecto, 'id' | 'createdAt'>>): void {
    this._proyectos.update((list) =>
      list.map((p) => (p.id === id ? {...p, ...data} : p)),
    );
    this._guardar();
  }

  actualizarColumna(id: string, columnaId: string): void {
    this._proyectos.update((list) =>
      list.map((p) => (p.id === id ? {...p, columnaId} : p)),
    );
    this._guardar();
  }

  renombrarCliente(nombreAnterior: string, nombreNuevo: string): void {
    this._proyectos.update((list) =>
      list.map((p) => (p.cliente === nombreAnterior ? {...p, cliente: nombreNuevo} : p)),
    );
    this._guardar();
  }

  eliminar(id: string): void {
    this._proyectos.update((list) => list.filter((p) => p.id !== id));
    this._guardar();
  }

  private _guardar(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._proyectos()));
  }

  private _cargar(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const data = JSON.parse(raw) as Proyecto[];
        this._proyectos.set(data.map(p => ({
          ...p,
          cliente: p.cliente ?? '',
          status: p.status ?? 'Activo',
          prioridad: p.prioridad ?? 'baja',
          columnaId: p.columnaId ?? COLUMNA_POR_DEFECTO,
        })));
        this._guardar();
        return;
      } catch {
        /* ignorar */
      }
    }
    this._proyectos.set(PROYECTOS_DEMO);
    this._guardar();
  }
}
