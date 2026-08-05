import {Injectable, computed, inject, signal} from '@angular/core';
import {Rol, ROLES_DEFAULT, ROL_SUPER_ADMIN_ID} from '../models/permiso.model';
import {UsuarioService} from './usuario.service';
import {PermisoService} from './permiso.service';

const STORAGE_KEY = 'devtracker-roles';

export type ResultadoEliminarRol = 'ok' | 'protegido' | 'en-uso';

@Injectable({providedIn: 'root'})
export class RolService {
  private readonly _roles = signal<Rol[]>(this._cargar());
  readonly roles = this._roles.asReadonly();

  readonly rolesUsables = computed(() => this._roles().filter(r => r.id !== ROL_SUPER_ADMIN_ID));

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
    return this.usuarioService.usuarios().filter(u => u.tipo === id).length;
  }

  existeNombre(nombre: string, ignorarId?: string): boolean {
    const n = nombre.trim().toLowerCase();
    return this._roles().some(r => r.nombre.trim().toLowerCase() === n && r.id !== ignorarId);
  }

  crear(nombre: string): boolean {
    const limpio = nombre.trim();
    if (!limpio || this.existeNombre(limpio)) return false;
    const id = crypto.randomUUID();
    this.permisoService.agregarRol(id);
    this._roles.update(list => [...list, {id, nombre: limpio, sistema: false}]);
    this._guardar();
    return true;
  }

  renombrar(id: string, nombre: string): boolean {
    if (this.esSuperAdmin(id)) return false;
    const limpio = nombre.trim();
    if (!limpio || this.existeNombre(limpio, id)) return false;
    this._roles.update(list => list.map(r => (r.id === id ? {...r, nombre: limpio} : r)));
    this._guardar();
    return true;
  }

  eliminar(id: string): ResultadoEliminarRol {
    if (this.esSuperAdmin(id)) return 'protegido';
    if (this.contarUsuarios(id) > 0) return 'en-uso';
    this.permisoService.eliminarRol(id);
    this._roles.update(list => list.filter(r => r.id !== id));
    this._guardar();
    return 'ok';
  }

  private _guardar(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._roles()));
  }

  private _cargar(): Rol[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const data = JSON.parse(raw) as Rol[];
        if (Array.isArray(data) && data.length > 0) {
          const conSistema = data.map(r => ({
            id: r.id,
            nombre: r.nombre,
            sistema: r.sistema ?? false,
          }));
          if (!conSistema.some(r => r.id === ROL_SUPER_ADMIN_ID)) {
            const superAdmin = ROLES_DEFAULT.find(r => r.id === ROL_SUPER_ADMIN_ID);
            if (superAdmin) conSistema.unshift(superAdmin);
          }
          return conSistema;
        }
      } catch { /* ignorar */ }
    }
    return [...ROLES_DEFAULT];
  }
}
