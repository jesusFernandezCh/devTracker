import {Component, inject, ChangeDetectionStrategy, signal} from '@angular/core';
import {ReactiveFormsModule, FormBuilder, Validators} from '@angular/forms';
import {AuthService} from '../../services/auth.service';
import {PermisoService} from '../../services/permiso.service';
import {RolService} from '../../services/rol.service';
import {
  ACCIONES,
  RECURSOS_ORDEN,
  ROL_SUPER_ADMIN_ID,
  Accion,
  Recurso,
  Rol,
} from '../../models/permiso.model';

@Component({
  selector: 'app-roles',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="mb-8">
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1>Roles y permisos</h1>
          <p class="mt-1 text-sm" style="color: var(--color-gray-500)">
            Matriz de acceso por rol. Haz clic sobre un permiso para activarlo o desactivarlo.
            @if (authService.currentUser(); as user) {
              Tu rol actual es <strong style="color: var(--color-indigo-700)">{{ rolService.nombreDe(user.tipo) }}</strong>.
            }
          </p>
        </div>
        <div class="flex items-center gap-2">
          @if (puedeEditar) {
            <button (click)="abrirNuevoRol()"
                    class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-700)]">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
              Rol
            </button>
          }
          @if (puedeEditar) {
            <button (click)="confirmarRestablecer()"
                    class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-[var(--color-gray-700)] bg-[var(--color-gray-100)] hover:bg-[var(--color-gray-200)]">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>
              </svg>
              Restablecer
            </button>
          }
        </div>
      </div>
    </div>

    <div class="rounded-xl border shadow-sm " style="background-color: var(--color-surface); border-color: var(--color-gray-200); overflow:auto; width:99%">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr style="border-bottom: 1px solid var(--color-gray-100);">
              <th class="text-left px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider sticky left-0"
                  style="color: var(--color-gray-400); background-color: var(--color-surface);">Recurso</th>
              @for (rol of rolService.roles(); track rol.id) {
                <th class="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[7rem]" style="color: var(--color-gray-400);">
                  <div class="flex items-center justify-center gap-1.5">
                    @if (esSuperAdmin(rol.id)) {
                      <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                           [title]="'Permisos fijos de ' + rol.nombre">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
                      </svg>
                    }
                    @if (puedeEditar && !esSuperAdmin(rol.id)) {
                      <button (click)="abrirEditarRol(rol)"
                              class="max-w-[6rem] truncate rounded px-1 hover:bg-[var(--color-gray-100)]"
                              [title]="'Haz clic para renombrar ' + rol.nombre">
                        {{ rol.nombre }}
                      </button>
                      <button (click)="confirmarEliminarRol(rol)"
                              class="p-0.5 rounded transition-colors text-[var(--color-gray-400)] hover:text-[var(--color-rose-600)]"
                              [attr.aria-label]="'Eliminar rol ' + rol.nombre">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                        </svg>
                      </button>
                    } @else {
                      <span class="max-w-[6rem] truncate">{{ rol.nombre }}</span>
                    }
                  </div>
                </th>
              }
            </tr>
          </thead>
          <tbody style="border-top: 1px solid var(--color-gray-100);">
            @for (recurso of RECURSOS_ORDEN; track recurso) {
              <tr style="border-bottom: 1px solid var(--color-gray-100);">
                <td class="px-4 sm:px-6 py-3 font-medium capitalize sticky left-0"
                    style="color: var(--color-gray-900); background-color: var(--color-surface);">{{ recurso }}</td>
                @for (rol of rolService.roles(); track rol.id) {
                  <td class="px-3 py-3 text-center">
                    <div class="flex flex-wrap items-center justify-center gap-1">
                      @for (accion of ACCIONES; track accion) {
                        @let activo = tienePermiso(rol.id, recurso, accion);
                        <button type="button"
                                [disabled]="!puedeEditar || esSuperAdmin(rol.id)"
                                (click)="togglePermiso(rol.id, recurso, accion)"
                                class="permiso-cell"
                                [class.permiso-cell-active]="activo"
                                [attr.aria-pressed]="activo"
                                [title]="rol.nombre + ' · ' + recurso + ' · ' + accion">
                          {{ inicialAccion(accion) }}
                        </button>
                      }
                    </div>
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <div class="mt-6 p-4 rounded-xl border text-sm flex items-start gap-3"
         style="background-color: var(--color-indigo-50); border-color: var(--color-indigo-200); color: var(--color-indigo-800);">
      <svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z"/>
      </svg>
      <div>
        <p class="font-medium mb-1" style="color: var(--color-indigo-600);">Nota de seguridad</p>
        <p style="color: var(--color-indigo-600);">Los permisos se evalúan en el navegador y sirven para ocultar/mostrar acciones (UX). La autorización real debe validarse en el servidor. El rol de Super Administrador es fijo y siempre conserva todos los permisos; un rol con usuarios asignados no puede eliminarse.</p>
      </div>
    </div>

    <!-- Create / Edit role name modal -->
    @if (showRolForm) {
      <div class="fixed inset-0 z-50 flex items-center justify-center-modal p-4" style="background-color: rgba(0,0,0,0.4);" (click)="cerrarRolForm()">
        <div class="modal-enter rounded-xl shadow-xl p-6 w-full max-w-sm border" style="background-color: var(--color-surface); border-color: var(--color-gray-200);" (click)="$event.stopPropagation()">
          <h3 class="text-lg font-semibold mb-4" style="color: var(--color-gray-900);">
            {{ editandoRol ? 'Renombrar rol' : 'Nuevo rol' }}
          </h3>
          <form [formGroup]="rolForm" (ngSubmit)="guardarRol()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Nombre</label>
              <input formControlName="nombre" type="text" autocomplete="off" autofocus
                     class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors"
                     style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);"
                     placeholder="Nombre del rol">
              @if (rolForm.controls.nombre.touched && rolForm.controls.nombre.invalid) {
                <p class="mt-1 text-xs" style="color: var(--color-rose-500);">El nombre es requerido.</p>
              }
              @if (errorNombre()) {
                <p class="mt-1 text-xs" style="color: var(--color-rose-500);">{{ errorNombre() }}</p>
              }
            </div>
            <div class="flex justify-end gap-3">
              <button type="button" (click)="cerrarRolForm()"
                      class="px-4 py-2 text-sm font-medium rounded-lg transition-colors text-[var(--color-gray-700)] bg-[var(--color-gray-100)] hover:bg-[var(--color-gray-200)]">
                Cancelar
              </button>
              <button type="submit"
                      class="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-700)]"
                      [disabled]="rolForm.invalid">
                {{ editandoRol ? 'Guardar' : 'Crear rol' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Delete role confirmation -->
    @if (rolAEliminar; as rol) {
      <div class="fixed inset-0 z-50 flex items-center justify-center-modal p-4" style="background-color: rgba(0,0,0,0.4);">
        <div class="modal-enter rounded-xl shadow-xl p-6 w-full max-w-sm border" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
          <h3 class="text-lg font-semibold mb-2" style="color: var(--color-gray-900);">Eliminar rol</h3>
          <p class="text-sm mb-4" style="color: var(--color-gray-500);">
            ¿Eliminar el rol <strong style="color: var(--color-gray-900);">{{ rol.nombre }}</strong>? Esta acción no se puede deshacer.
          </p>
          @if (usuariosDelRol(rol.id) > 0) {
            <div class="mb-4 px-3 py-2.5 rounded-lg text-sm flex items-start gap-2"
                 style="background-color: var(--color-amber-50); color: var(--color-amber-800); border: 1px solid var(--color-amber-200);">
              <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
              </svg>
              <span>Este rol tiene <strong>{{ usuariosDelRol(rol.id) }}</strong> usuario{{ usuariosDelRol(rol.id) !== 1 ? 's' : '' }} asignado{{ usuariosDelRol(rol.id) !== 1 ? 's' : '' }}. Reasígnalos antes de eliminar.</span>
            </div>
          }
          <div class="flex justify-end gap-3">
            <button (click)="cancelarEliminarRol()"
                    class="px-4 py-2 text-sm font-medium rounded-lg transition-colors text-[var(--color-gray-700)] bg-[var(--color-gray-100)] hover:bg-[var(--color-gray-200)]">
              Cancelar
            </button>
            <button (click)="ejecutarEliminarRol()"
                    [disabled]="usuariosDelRol(rol.id) > 0"
                    class="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[var(--color-rose-600)] hover:bg-[var(--color-rose-700)]">
              Eliminar
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Reset confirmation -->
    @if (showRestablecer) {
      <div class="fixed inset-0 z-50 flex items-center justify-center-modal p-4" style="background-color: rgba(0,0,0,0.4);">
        <div class="modal-enter rounded-xl shadow-xl p-6 w-full max-w-sm border" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
          <h3 class="text-lg font-semibold mb-2" style="color: var(--color-gray-900);">Restablecer permisos</h3>
          <p class="text-sm mb-6" style="color: var(--color-gray-500);">
            ¿Restablecer la matriz de los roles de sistema a los valores por defecto? Los roles personalizados se conservan.
          </p>
          <div class="flex justify-end gap-3">
            <button (click)="cancelarRestablecer()"
                    class="px-4 py-2 text-sm font-medium rounded-lg transition-colors text-[var(--color-gray-700)] bg-[var(--color-gray-100)] hover:bg-[var(--color-gray-200)]">
              Cancelar
            </button>
            <button (click)="ejecutarRestablecer()"
                    class="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors bg-[var(--color-rose-600)] hover:bg-[var(--color-rose-700)]">
              Restablecer
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }

    .permiso-cell {
      width: 1.5rem;
      height: 1.5rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 700;
      background-color: var(--color-gray-100);
      color: var(--color-gray-300);
      border: 1px solid var(--color-gray-200);
      cursor: pointer;
      transition: background-color 0.15s, color 0.15s, border-color 0.15s, transform 0.15s, box-shadow 0.15s;
      padding: 0;
    }

    .permiso-cell-active {
      background-color: var(--color-teal-100);
      color: var(--color-teal-700);
      border-color: var(--color-teal-200);
    }

    .permiso-cell:not(:disabled):hover {
      transform: scale(1.15);
      box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.15);
    }

    .permiso-cell:not(:disabled):focus-visible {
      outline: 2px solid var(--color-teal-500);
      outline-offset: 1px;
    }

    .permiso-cell:disabled {
      cursor: not-allowed;
      opacity: 0.9;
    }
  `]
})
export class RolesComponent {
  protected readonly authService = inject(AuthService);
  protected readonly permisoService = inject(PermisoService);
  protected readonly rolService = inject(RolService);
  private readonly fb = inject(FormBuilder);

  protected readonly RECURSOS_ORDEN = RECURSOS_ORDEN;
  protected readonly ACCIONES = ACCIONES;

  protected showRolForm = false;
  protected editandoRol: Rol | null = null;
  protected rolAEliminar: Rol | null = null;
  protected showRestablecer = false;
  protected readonly errorNombre = signal<string | null>(null);

  protected readonly rolForm = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
  });

  protected get puedeEditar(): boolean {
    return this.permisoService.puedeUsuarioActual('editar', 'roles');
  }

  protected esSuperAdmin(id: string): boolean {
    return id === ROL_SUPER_ADMIN_ID;
  }

  protected tienePermiso(rol: string, recurso: Recurso, accion: Accion): boolean {
    return this.permisoService.permisos()[rol]?.[recurso]?.includes(accion) ?? false;
  }

  protected togglePermiso(rol: string, recurso: Recurso, accion: Accion): void {
    this.permisoService.toggle(rol, recurso, accion);
  }

  protected abrirNuevoRol(): void {
    this.editandoRol = null;
    this.errorNombre.set(null);
    this.rolForm.reset({nombre: ''});
    this.showRolForm = true;
  }

  protected abrirEditarRol(rol: Rol): void {
    this.editandoRol = rol;
    this.errorNombre.set(null);
    this.rolForm.reset({nombre: rol.nombre});
    this.showRolForm = true;
  }

  protected cerrarRolForm(): void {
    this.showRolForm = false;
    this.editandoRol = null;
  }

  protected guardarRol(): void {
    if (this.rolForm.invalid) return;
    const nombre = this.rolForm.controls.nombre.value.trim();
    let ok: boolean;
    if (this.editandoRol) {
      ok = this.rolService.renombrar(this.editandoRol.id, nombre);
    } else {
      ok = this.rolService.crear(nombre);
    }
    if (!ok) {
      this.errorNombre.set('Ya existe un rol con ese nombre.');
      return;
    }
    this.cerrarRolForm();
  }

  protected confirmarEliminarRol(rol: Rol): void {
    this.rolAEliminar = rol;
  }

  protected cancelarEliminarRol(): void {
    this.rolAEliminar = null;
  }

  protected ejecutarEliminarRol(): void {
    const rol = this.rolAEliminar;
    if (!rol) return;
    this.rolService.eliminar(rol.id);
    this.rolAEliminar = null;
  }

  protected usuariosDelRol(id: string): number {
    return this.rolService.contarUsuarios(id);
  }

  protected confirmarRestablecer(): void {
    this.showRestablecer = true;
  }

  protected cancelarRestablecer(): void {
    this.showRestablecer = false;
  }

  protected ejecutarRestablecer(): void {
    this.permisoService.restablecer();
    this.showRestablecer = false;
  }

  protected inicialAccion(accion: Accion): string {
    return accion.charAt(0).toUpperCase();
  }
}
