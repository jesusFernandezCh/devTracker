import {Injectable, computed, inject, isDevMode, signal} from '@angular/core';
import {AuthService} from './auth.service';
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

const STORAGE_KEY = 'devtracker-permisos';
const STORAGE_VERSION = 1;

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

@Injectable({providedIn: 'root'})
export class PermisoService {
  private readonly authService = inject(AuthService);

  private readonly _permisos = signal<Record<TipoUsuario, MatrizPermisos>>(this._cargar());
  readonly permisos = this._permisos.asReadonly();

  readonly permisosUsuarioActual = computed(() => {
    const user = this.authService.currentUser();
    return user ? (this._permisos()[user.tipo] ?? {}) : {};
  });

  puede(accion: Accion, recurso: Recurso, tipo?: TipoUsuario): boolean {
    const rol = tipo ?? this.authService.currentUser()?.tipo;
    if (!rol) return false;
    const acciones = this._permisos()[rol]?.[recurso];
    const resultado = acciones?.includes(accion) ?? false;
    if (isDevMode()) {
      console.debug('[PermisoService] puede', {accion, recurso, rol, acciones: acciones ?? [], resultado});
    }
    return resultado;
  }

  puedeUsuarioActual(accion: Accion, recurso: Recurso): boolean {
    const tipo = this.authService.currentUser()?.tipo;
    return this.puede(accion, recurso, tipo);
  }

  toggle(rol: TipoUsuario, recurso: Recurso, accion: Accion): void {
    if (rol === ROL_SUPER_ADMIN_ID) return;
    this._permisos.update((matriz) => {
      const recursos = {...matriz[rol]};
      const acciones = [...(recursos[recurso] ?? [])];
      recursos[recurso] = acciones.includes(accion)
        ? acciones.filter((a) => a !== accion)
        : [...acciones, accion];
      return {...matriz, [rol]: recursos};
    });
    this._guardar();
  }

  agregarRol(id: TipoUsuario): void {
    this._permisos.update((matriz) => ({...matriz, [id]: {}}));
    this._guardar();
  }

  eliminarRol(id: TipoUsuario): void {
    if (id === ROL_SUPER_ADMIN_ID) return;
    this._permisos.update((matriz) => {
      const copia = {...matriz};
      delete copia[id];
      return copia;
    });
    this._guardar();
  }

  restablecer(): void {
    this._permisos.update((matriz) => {
      const base = clonarMatriz(PERMISOS);
      for (const id of Object.keys(matriz)) {
        if (!(id in PERMISOS) && id !== ROL_SUPER_ADMIN_ID) {
          base[id] = clonarMatriz({[id]: matriz[id]})[id];
        }
      }
      return base;
    });
    this._guardar();
  }

  private _guardar(): void {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({version: STORAGE_VERSION, matriz: this._permisos()}),
    );
  }

  private _cargar(): Record<TipoUsuario, MatrizPermisos> {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const data: Record<TipoUsuario, MatrizPermisos> | null =
          parsed && parsed.version === STORAGE_VERSION && parsed.matriz ? parsed.matriz : null;
        if (data) {
          const base = clonarMatriz(PERMISOS);
          for (const [rolId, guardado] of Object.entries(data)) {
            if (rolId === ROL_SUPER_ADMIN_ID) continue;
            if (!guardado || typeof guardado !== 'object') continue;
            if (rolId in PERMISOS) {
              const recursos = {...base[rolId]};
              for (const recurso of RECURSOS_ORDEN) {
                const accionesGuardadas = (guardado as Partial<Record<Recurso, unknown>>)[recurso];
                if (!Array.isArray(accionesGuardadas)) continue;
                const validas = accionesGuardadas.filter(
                  (a): a is Accion => (ACCIONES as readonly string[]).includes(a as string),
                );
                recursos[recurso] = [...new Set(validas)];
              }
              base[rolId] = recursos;
            } else {
              const recursos: MatrizPermisos = {};
              for (const recurso of RECURSOS_ORDEN) {
                const accionesGuardadas = (guardado as Partial<Record<Recurso, unknown>>)[recurso];
                if (!Array.isArray(accionesGuardadas)) continue;
                const validas = accionesGuardadas.filter(
                  (a): a is Accion => (ACCIONES as readonly string[]).includes(a as string),
                );
                recursos[recurso] = [...new Set(validas)];
              }
              base[rolId] = recursos;
            }
          }
          return base;
        }
      } catch {
        /* ignorar */
      }
    }
    return clonarMatriz(PERMISOS);
  }
}
