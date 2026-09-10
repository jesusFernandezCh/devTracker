import {Injectable, signal, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {CanalArea} from '../models/canal-area.model';

interface CanalAreaDto {
  id: string;
  nombre: string;
  createdAt: string;
}

function aCanalArea(c: CanalAreaDto): CanalArea {
  return {id: c.id, nombre: c.nombre, createdAt: c.createdAt};
}

@Injectable({providedIn: 'root'})
export class CanalAreaService {
  private readonly _canalAreas = signal<CanalArea[]>([]);
  readonly canalAreas = this._canalAreas.asReadonly();
  private readonly http = inject(HttpClient);

  canalAreaPorId(id: string): CanalArea | undefined {
    return this._canalAreas().find((c) => c.id === id);
  }

  existeNombre(nombre: string, ignorarId?: string): boolean {
    const n = nombre.trim().toLowerCase();
    return this._canalAreas().some((c) => c.id !== ignorarId && c.nombre.trim().toLowerCase() === n);
  }

  async cargar(): Promise<void> {
    try {
      const lista = await firstValueFrom(this.http.get<CanalAreaDto[]>('api/canal-area'));
      this._canalAreas.set((lista ?? []).map(aCanalArea));
    } catch {
      /* sin permiso: mantener estado actual */
    }
  }

  async crear(nombre: string): Promise<boolean> {
    const n = nombre.trim();
    if (!n || this.existeNombre(nombre)) return false;
    try {
      const creado = await firstValueFrom(this.http.post<CanalAreaDto>('api/canal-area', {nombre: n}));
      this._canalAreas.update((list) => [...list, aCanalArea(creado)]);
      return true;
    } catch {
      return false;
    }
  }

  async renombrar(id: string, nombre: string): Promise<boolean> {
    const n = nombre.trim();
    if (!n || this.existeNombre(nombre, id)) return false;
    const actual = this.canalAreaPorId(id);
    if (!actual || actual.nombre === n) return true;
    try {
      const actualizado = await firstValueFrom(this.http.patch<CanalAreaDto>(`api/canal-area/${id}`, {nombre: n}));
      this._canalAreas.update((list) => list.map((c) => (c.id === id ? aCanalArea(actualizado) : c)));
      return true;
    } catch {
      return false;
    }
  }

  async eliminar(id: string): Promise<'ok' | 'en-uso'> {
    const canal = this.canalAreaPorId(id);
    if (!canal) return 'ok';
    try {
      await firstValueFrom(this.http.delete(`api/canal-area/${id}`));
      this._canalAreas.update((list) => list.filter((c) => c.id !== id));
      return 'ok';
    } catch {
      return 'en-uso';
    }
  }

  limpiar(): void {
    this._canalAreas.set([]);
  }
}
