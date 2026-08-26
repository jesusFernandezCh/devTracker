import {Injectable, computed, inject, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {Rol, ROLES_DEFAULT, ROL_SUPER_ADMIN_ID} from '../models/permiso.model';
import {UsuarioService} from './usuario.service';
import {PermisoService} from './permiso.service';

export type ResultadoEliminarRol = 'ok' | 'protegido' | 'en-uso';

interface RolDto {
  id: string;
  nombre: string;
  sistema: boolean;
  usuarios?: number;
}

@Injectable({providedIn: 'root'})
export class RolService {
  private readonly _roles = signal<Rol[]>([...ROLES_DEFAULT]);
  readonly roles = this._roles.asReadonly();
  private readonly _conteos = signal<Record<string, number>>({});

  readonly rolesUsables = computed(() => this._roles().filter(r => r.id !== ROL_SUPER_ADMIN_ID));

  private readonly http = inject(HttpClient);
  private readonly usuarioService = inject(UsuarioService);
  private readonly permisoService = inject(PermisoService);

  rolPorId(id: string): Rol | undefined {
    return this._roles().find(r => r.id === id);
  }

  nombreDe(id: string): string {
    return this.rolPorId(id)?.nombre ?? id;
  }

  esSuperAdmin(id: string): boolean {
    return id === ROL_SUPER_ADMIN_ID;
  }

  contarUsuarios(id: string): number {
    const conteo = this._conteos()[id];
    if (conteo !== undefined) return conteo;
    return this.usuarioService.usuarios().filter(u => u.tipo === id).length;
  }

  existeNombre(nombre: string, ignorarId?: string): boolean {
    const n = nombre.trim().toLowerCase();
    return this._roles().some(r => r.nombre.trim().toLowerCase() === n && r.id !== ignorarId);
  }

  async cargar(): Promise<void> {
    try {
      const roles = await firstValueFrom(this.http.get<RolDto[]>('api/roles'));
      const lista = (roles ?? []).map(r => ({id: r.id, nombre: r.nombre, sistema: r.sistema}));
      if (!lista.some(r => r.id === ROL_SUPER_ADMIN_ID)) {
        const superAdmin = ROLES_DEFAULT.find(r => r.id === ROL_SUPER_ADMIN_ID);
        if (superAdmin) lista.unshift(superAdmin);
      }
      this._roles.set(lista);
      this._conteos.set(Object.fromEntries((roles ?? []).map(r => [r.id, r.usuarios ?? 0])));
      for (const rol of lista) {
        this.permisoService.agregarRol(rol.id);
      }
    } catch {
      /* sin permiso para roles: mantener los por defecto */
    }
  }

  async crear(nombre: string): Promise<boolean> {
    const limpio = nombre.trim();
    if (!limpio || this.existeNombre(limpio)) return false;
    try {
      const rol = await firstValueFrom(this.http.post<RolDto>('api/roles', {nombre: limpio}));
      this._roles.update(list => [...list, {id: rol.id, nombre: rol.nombre, sistema: rol.sistema}]);
      this._conteos.update(m => ({...m, [rol.id]: 0}));
      this.permisoService.agregarRol(rol.id);
      return true;
    } catch {
      return false;
    }
  }

  async renombrar(id: string, nombre: string): Promise<boolean> {
    if (this.esSuperAdmin(id)) return false;
    const limpio = nombre.trim();
    if (!limpio || this.existeNombre(limpio, id)) return false;
    try {
      const rol = await firstValueFrom(this.http.patch<RolDto>(`api/roles/${encodeURIComponent(id)}`, {nombre: limpio}));
      this._roles.update(list => list.map(r => (r.id === id ? {...r, nombre: rol.nombre} : r)));
      return true;
    } catch {
      return false;
    }
  }

  async eliminar(id: string): Promise<ResultadoEliminarRol> {
    if (this.esSuperAdmin(id)) return 'protegido';
    try {
      const {resultado} = await firstValueFrom(this.http.delete<{resultado: ResultadoEliminarRol}>(`api/roles/${encodeURIComponent(id)}`));
      if (resultado === 'ok') {
        this.permisoService.eliminarRol(id);
        this._roles.update(list => list.filter(r => r.id !== id));
      }
      return resultado;
    } catch {
      return 'en-uso';
    }
  }

  limpiar(): void {
    this._roles.set([...ROLES_DEFAULT]);
    this._conteos.set({});
  }
}
