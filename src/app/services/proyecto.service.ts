import {Injectable, signal, computed} from '@angular/core';
import {Proyecto} from '../models/proyecto.model';

const STORAGE_KEY = 'devtracker-proyectos';

const COLUMNA_POR_DEFECTO = 'desarrollo';

const PROYECTOS_DEMO: Proyecto[] = [
  {
    id: crypto.randomUUID(),
    nombre: 'Sitio Web Corporativo',
    descripcion: 'Rediseño completo del sitio web institucional con enfoque en rendimiento y accesibilidad.',
    fechaDesde: '2026-04-01',
    fechaHasta: '2026-06-30',
    cliente: 'Cliente A',
    status: 'Activo',
    columnaId: 'desarrollo',
    documentacion: 'https://figma.com/file/sitio-web',
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    nombre: 'App Móvil',
    descripcion: 'Aplicación móvil para seguimiento de pedidos en tiempo real.',
    fechaDesde: '2026-05-15',
    fechaHasta: '2026-09-15',
    cliente: 'Cliente B',
    status: 'Pausa',
    columnaId: 'calidad',
    documentacion: 'https://figma.com/file/app-movil',
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    nombre: 'Rediseño Dashboard',
    cliente: 'Cliente C',
    status: 'Activo',
    columnaId: 'produccion',
    descripcion: 'Modernización del panel de administración con gráficos interactivos y modo oscuro.',
    fechaDesde: '2026-07-01',
    fechaHasta: '2026-10-01',
    documentacion: 'https://figma.com/file/dashboard',
    createdAt: new Date().toISOString(),
  },
];

@Injectable({providedIn: 'root'})
export class ProyectoService {
  private readonly _proyectos = signal<Proyecto[]>([]);
  readonly proyectos = this._proyectos.asReadonly();

  constructor() {
    this._cargar();
  }

  proyectoPorId(id: string) {
    return computed(() => this._proyectos().find((p) => p.id === id));
  }

  crear(data: Omit<Proyecto, 'id' | 'createdAt' | 'columnaId'> & {columnaId?: string}): void {
    data = { ...data, cliente: data.cliente || '', status: data.status || 'Activo' };

    const proyecto: Proyecto = {
      ...data,
      columnaId: data.columnaId || COLUMNA_POR_DEFECTO,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this._proyectos.update((list) => [...list, proyecto]);
    this._guardar();
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
