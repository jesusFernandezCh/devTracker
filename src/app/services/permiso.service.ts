import {Injectable, computed, inject, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {environment} from '../../environments/environment';
import {
  ACCIONES,
  RECURSOS_ORDEN,
  Accion,
  MatrizPermisos,
  PERMISOS,
  ROL_SUPER_ADMIN_ID,
  Recurso,
  TipoUsuario,
} from '../models/permiso.model';

export type MatrizServidor = Record<string, Partial<Record<Recurso, Accion[]>>>;

function clonarMatriz(matriz: Record<TipoUsuario, MatrizPermisos>): Record<TipoUsuario, MatrizPermisos> {
  return Object.fromEntries(
    (Object.entries(matriz) as [TipoUsuario, MatrizPermisos][]).map(([rol, recursos]) => [
      rol,
      Object.fromEntries(
        (Object.entries(recursos) as [Recurso, Accion[]][]).map(([recurso, acciones]) => [
          recurso,
          [...acciones],
        ]),
      ),
    ]),
  ) as Record<TipoUsuario, MatrizPermisos>;
}

/**
 * Matriz de permisos servida por el backend (`/auth/me` o `GET /roles/permisos`).
 * Se hidrata al iniciar sesión y se mantiene en memoria; las mutaciones
 * (toggle/restablecer) viajan por HTTP y se reflejan localmente.
 */
@Injectable({providedIn: 'root'})
export class PermisoService {
  private readonly http = inject(HttpClient);

  private readonly _permisos = signal<Record<TipoUsuario, MatrizPermisos>>(clonarMatriz(PERMISOS));
  readonly permisos = this._permisos.asReadonly();

  hidratar(matriz: MatrizServidor): void {
    const result = clonarMatriz({...PERMISOS, ...matriz} as Record<TipoUsuario, MatrizPermisos>);
    this._permisos.set(result);
  }

  async cargar(): Promise<void> {
    try {
      const matriz = await firstValueFrom(this.http.get<MatrizServidor>(`${environment.apiUrl}/roles/permisos`));
      if (matriz) this.hidratar(matriz);
    } catch {
      /* sin permiso para roles: mantener lo hidratado desde /auth/me */
    }
  }

  puede(accion: Accion, recurso: Recurso, tipo: TipoUsuario | undefined): boolean {
    if (!tipo) return false;
    const matriz = this._permisos();
    const recursos = matriz[tipo];
    const acciones = recursos?.[recurso];
    return acciones?.includes(accion) ?? false;
  }

  async toggle(rol: TipoUsuario, recurso: Recurso, accion: Accion): Promise<void> {
    if (rol === ROL_SUPER_ADMIN_ID) return;
    this._toggleLocal(rol, recurso, accion);
    try {
      await firstValueFrom(this.http.patch(`${environment.apiUrl}/roles/${encodeURIComponent(rol)}/permisos`, {recurso, accion}));
    } catch {
      this._toggleLocal(rol, recurso, accion);
    }
  }

  async restablecer(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${environment.apiUrl}/roles/permisos/restablecer`, {}));
      await this.cargar();
    } catch {
      /* sin permiso o error: ignorar */
    }
  }

  agregarRol(id: TipoUsuario): void {
    this._permisos.update((matriz) => {
      if (id in matriz) return matriz;
      return {...matriz, [id]: {}};
    });
  }

  eliminarRol(id: TipoUsuario): void {
    if (id === ROL_SUPER_ADMIN_ID) return;
    this._permisos.update((matriz) => {
      const copia = {...matriz};
      delete copia[id];
      return copia;
    });
  }

  private _toggleLocal(rol: TipoUsuario, recurso: Recurso, accion: Accion): void {
    this._permisos.update((matriz) => {
      const recursos = {...(matriz[rol] ?? {})};
      const acciones = [...(recursos[recurso] ?? [])];
      recursos[recurso] = acciones.includes(accion)
        ? acciones.filter((a) => a !== accion)
        : [...acciones, accion];
      return {...matriz, [rol]: recursos};
    });
  }
}
