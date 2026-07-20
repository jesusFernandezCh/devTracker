import {Injectable, signal} from '@angular/core';
import {Columna, COLUMNAS_DEFAULT, generarId} from '../models/columna.model';

const STORAGE_KEY = 'dev-tracker-columns';

@Injectable({
  providedIn: 'root',
})
export class ColumnService {
  private readonly _columnas = signal<Columna[]>([]);
  readonly columnas = this._columnas.asReadonly();

  constructor() {
    this._cargarDeStorage();
  }

  agregarColumna(nombre: string, color: string): void {
    this._columnas.update((cols) => {
      const maxOrden = cols.reduce((max, c) => Math.max(max, c.orden), -1);
      return [
        ...cols,
        {id: generarId(), nombre, orden: maxOrden + 1, color},
      ].sort((a, b) => a.orden - b.orden);
    });
    this._guardar();
  }

  renombrarColumna(id: string, nombre: string): void {
    this._columnas.update((cols) =>
      cols.map((c) => (c.id === id ? {...c, nombre} : c)),
    );
    this._guardar();
  }

  eliminarColumna(id: string): void {
    this._columnas.update((cols) => cols.filter((c) => c.id !== id));
    this._guardar();
  }

  reordenarColumnas(previousIndex: number, currentIndex: number): void {
    this._columnas.update((cols) => {
      const next = [...cols];
      const [moved] = next.splice(previousIndex, 1);
      next.splice(currentIndex, 0, moved);
      return next.map((c, i) => ({...c, orden: i}));
    });
    this._guardar();
  }

  obtenerColorPorDefecto(): string {
    const paleta = ['#EAB308', '#3B82F6', '#22C55E', '#A855F7', '#EC4899', '#06B6D4'];
    const usados = this._columnas().map((c) => c.color);
    return paleta.find((color) => !usados.includes(color)) ?? paleta[paleta.length - 1];
  }

  private _cargarDeStorage(): void {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        this._columnas.set(JSON.parse(data));
        return;
      } catch {
        /* ignorar */
      }
    }
    this._columnas.set(COLUMNAS_DEFAULT);
  }

  private _guardar(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._columnas()));
  }
}
