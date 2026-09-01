import {Injectable, signal, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {Proyecto} from '../models/proyecto.model';
import {EquipoService} from './equipo.service';

const COLUMNA_POR_DEFECTO = 'desarrollo';

export interface ProyectoDto {
  id: string;
  nombre: string;
  descripcion?: string | null;
  cliente?: string | null;
  status?: string | null;
  prioridad?: string | null;
  columnaId: string;
  columna?: string;
  fechaDesde?: string | null;
  fechaHasta?: string | null;
  documentacion?: string | null;
  createdAt: string;
}

function aProyecto(p: ProyectoDto): Proyecto {
  return {
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion ?? '',
    cliente: p.cliente ?? '',
    status: p.status ?? 'Activo',
    prioridad: p.prioridad ?? 'baja',
    columnaId: p.columnaId ?? COLUMNA_POR_DEFECTO,
    fechaDesde: p.fechaDesde ?? '',
    fechaHasta: p.fechaHasta ?? '',
    documentacion: p.documentacion ?? '',
    createdAt: p.createdAt,
  };
}

@Injectable({providedIn: 'root'})
export class ProyectoService {
  private readonly _proyectos = signal<Proyecto[]>([]);
  readonly proyectos = this._proyectos.asReadonly();
  private readonly http = inject(HttpClient);
  private readonly equipoService = inject(EquipoService);

  proyectoPorId(id: string): Proyecto | undefined {
    return this._proyectos().find((p) => p.id === id);
  }

  async cargar(): Promise<void> {
    try {
      const lista = await firstValueFrom(this.http.get<ProyectoDto[]>('api/proyectos'));
      this._proyectos.set((lista ?? []).map(aProyecto));
    } catch {
      /* sin permiso: mantener lista actual */
    }
  }

  async crear(data: Omit<Proyecto, 'id' | 'createdAt' | 'columnaId'> & {columnaId?: string}, creadorId?: string): Promise<Proyecto> {
    const payload: Partial<ProyectoDto> = {
      nombre: data.nombre,
      descripcion: data.descripcion || undefined,
      cliente: data.cliente || undefined,
      status: data.status || undefined,
      prioridad: data.prioridad || undefined,
      columnaId: data.columnaId || COLUMNA_POR_DEFECTO,
      fechaDesde: data.fechaDesde || undefined,
      fechaHasta: data.fechaHasta || undefined,
      documentacion: data.documentacion || undefined,
    };
    const creado = await firstValueFrom(this.http.post<ProyectoDto>('api/proyectos', payload));
    const proyecto = aProyecto(creado);
    this._proyectos.update((list) => [...list, proyecto]);

    if (creadorId) {
      await this.equipoService.asignar(proyecto.id, creadorId);
    }
    return proyecto;
  }

  async actualizar(id: string, data: Partial<Omit<Proyecto, 'id' | 'createdAt'>>): Promise<Proyecto> {
    const actualizado = await firstValueFrom(
      this.http.patch<ProyectoDto>(`api/proyectos/${id}`, this.aPayload(data)),
    );
    const proyecto = aProyecto(actualizado);
    this._proyectos.update((list) => list.map((p) => (p.id === id ? proyecto : p)));
    return proyecto;
  }

  async actualizarColumna(id: string, columnaId: string): Promise<Proyecto> {
    return this.actualizar(id, {columnaId});
  }

  async eliminar(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`api/proyectos/${id}`));
    this._proyectos.update((list) => list.filter((p) => p.id !== id));
  }

  renombrarCliente(nombreAnterior: string, nombreNuevo: string): void {
    this._proyectos.update((list) =>
      list.map((p) => (p.cliente === nombreAnterior ? {...p, cliente: nombreNuevo} : p)),
    );
  }

  limpiar(): void {
    this._proyectos.set([]);
  }

  _creado(p: ProyectoDto): void {
    const proyecto = aProyecto(p);
    this._proyectos.update((list) => {
      if (list.some((x) => x.id === proyecto.id)) return list;
      return [...list, proyecto];
    });
  }

  _actualizado(p: ProyectoDto): void {
    const proyecto = aProyecto(p);
    this._proyectos.update((list) => list.map((x) => (x.id === proyecto.id ? proyecto : x)));
  }

  _eliminado(id: string): void {
    this._proyectos.update((list) => list.filter((x) => x.id !== id));
  }

  private aPayload(data: Partial<Omit<Proyecto, 'id' | 'createdAt'>>): Record<string, unknown> {
    return {
      nombre: data.nombre,
      descripcion: data.descripcion || undefined,
      cliente: data.cliente || undefined,
      status: data.status || undefined,
      prioridad: data.prioridad || undefined,
      columnaId: data.columnaId || undefined,
      fechaDesde: data.fechaDesde || undefined,
      fechaHasta: data.fechaHasta || undefined,
      documentacion: data.documentacion || undefined,
    };
  }
}
