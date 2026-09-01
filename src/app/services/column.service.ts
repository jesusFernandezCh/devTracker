import {Injectable, signal, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {Columna, COLUMNAS_DEFAULT} from '../models/columna.model';

const PALETA = ['#EAB308', '#3B82F6', '#22C55E', '#A855F7', '#EC4899', '#06B6D4'];

@Injectable({
  providedIn: 'root',
})
export class ColumnService {
  private readonly _columnas = signal<Columna[]>([]);
  readonly columnas = this._columnas.asReadonly();
  private readonly http = inject(HttpClient);

  async cargar(): Promise<void> {
    try {
      const lista = await firstValueFrom(this.http.get<Columna[]>('api/columnas'));
      this._columnas.set(lista ?? []);
    } catch {
      /* sin permiso: mantener estado actual */
    }
  }

  async agregarColumna(nombre: string, color: string): Promise<Columna> {
    const creada = await firstValueFrom(this.http.post<Columna>('api/columnas', {nombre, color}));
    this._columnas.update((cols) => [...cols, creada].sort((a, b) => a.orden - b.orden));
    return creada;
  }

  async renombrarColumna(id: string, nombre: string): Promise<Columna> {
    const actualizada = await firstValueFrom(this.http.patch<Columna>(`api/columnas/${id}`, {nombre}));
    this._columnas.update((cols) => cols.map((c) => (c.id === id ? actualizada : c)));
    return actualizada;
  }

  async eliminarColumna(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`api/columnas/${id}`));
    this._columnas.update((cols) => cols.filter((c) => c.id !== id));
  }

  async reordenarColumnas(previousIndex: number, currentIndex: number): Promise<void> {
    if (previousIndex === currentIndex) return;
    const cols = this._columnas();
    const next = [...cols];
    const [moved] = next.splice(previousIndex, 1);
    next.splice(currentIndex, 0, moved);
    const ids = next.map((c) => c.id);
    try {
      const reordenadas = await firstValueFrom(this.http.patch<Columna[]>('api/columnas/reordenar', {ids}));
      if (reordenadas) this._columnas.set(reordenadas);
    } catch {
      /* mantener orden local */
    }
  }

  obtenerColorPorDefecto(): string {
    const usados = this._columnas().map((c) => c.color);
    return PALETA.find((color) => !usados.includes(color)) ?? PALETA[PALETA.length - 1];
  }

  limpiar(): void {
    this._columnas.set([]);
  }

  _creada(c: Columna): void {
    this._columnas.update((list) => {
      if (list.some((x) => x.id === c.id)) return list;
      return [...list, c].sort((a, b) => a.orden - b.orden);
    });
  }

  _actualizada(c: Columna): void {
    this._columnas.update((list) => list.map((x) => (x.id === c.id ? c : x)));
  }

  _eliminada(id: string): void {
    this._columnas.update((list) => list.filter((x) => x.id !== id));
  }

  _reordenadas(cs: Columna[]): void {
    this._columnas.set(cs);
  }
}

export {COLUMNAS_DEFAULT};
