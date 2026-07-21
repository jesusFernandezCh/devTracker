import {Injectable, signal, computed} from '@angular/core';
import {Proyecto} from '../models/proyecto.model';

const STORAGE_KEY = 'devtracker-proyectos';

const PROYECTOS_DEMO: Proyecto[] = [
  {
    id: crypto.randomUUID(),
    nombre: 'Sitio Web Corporativo',
    descripcion: 'Rediseño completo del sitio web institucional con enfoque en rendimiento y accesibilidad.',
    fechaDesde: '2026-04-01',
    fechaHasta: '2026-06-30',
    documentacion: 'https://figma.com/file/sitio-web',
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    nombre: 'App Móvil',
    descripcion: 'Aplicación móvil para seguimiento de pedidos en tiempo real.',
    fechaDesde: '2026-05-15',
    fechaHasta: '2026-09-15',
    documentacion: 'https://figma.com/file/app-movil',
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    nombre: 'Rediseño Dashboard',
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

  crear(data: Omit<Proyecto, 'id' | 'createdAt'>): void {
    const proyecto: Proyecto = {
      ...data,
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
        this._proyectos.set(JSON.parse(raw));
        return;
      } catch {
        /* ignorar */
      }
    }
    this._proyectos.set(PROYECTOS_DEMO);
    this._guardar();
  }
}
