import {Component, inject, ChangeDetectionStrategy} from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {PermisoService} from '../../services/permiso.service';
import {
  ACCIONES,
  RECURSOS_ORDEN,
  ROLES_ORDEN,
  Accion,
  Recurso,
  TipoUsuario,
  labelTipoUsuario,
} from '../../models/permiso.model';

@Component({
  selector: 'app-roles',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="mb-8">
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 class="text-3xl font-bold" style="color: var(--color-gray-900)">Roles y permisos</h1>
          <p class="mt-1 text-sm" style="color: var(--color-gray-500)">
            Matriz de acceso por rol. Haz clic sobre un permiso para activarlo o desactivarlo.
            @if (authService.currentUser(); as user) {
              Tu rol actual es <strong style="color: var(--color-indigo-700)">{{ labelTipoUsuario(user.tipo) }}</strong>.
            }
          </p>
        </div>
        @if (puedeEditar) {
          <button (click)="confirmarRestablecer()"
                  class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-[var(--color-gray-700)] bg-[var(--color-gray-100)] hover:bg-[var(--color-gray-200)]">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>
            </svg>
            Restablecer por defecto
          </button>
        }
      </div>
    </div>

    <div class="rounded-xl border shadow-sm overflow-hidden" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr style="border-bottom: 1px solid var(--color-gray-100);">
              <th class="text-left px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider sticky left-0"
                  style="color: var(--color-gray-400); background-color: var(--color-surface);">Recurso</th>
              @for (rol of ROLES_ORDEN; track rol) {
                <th class="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">
                  <span class="inline-flex items-center gap-1">
                    {{ labelTipoUsuario(rol) }}
                    @if (rol === 'super-administrador') {
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                           [title]="'Permisos fijos de ' + labelTipoUsuario(rol)">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
                      </svg>
                    }
                  </span>
                </th>
              }
            </tr>
          </thead>
          <tbody style="border-top: 1px solid var(--color-gray-100);">
            @for (recurso of RECURSOS_ORDEN; track recurso) {
              <tr style="border-bottom: 1px solid var(--color-gray-100);">
                <td class="px-4 sm:px-6 py-3 font-medium capitalize sticky left-0"
                    style="color: var(--color-gray-900); background-color: var(--color-surface);">{{ recurso }}</td>
                @for (rol of ROLES_ORDEN; track rol) {
                  <td class="px-3 py-3 text-center">
                    <div class="flex flex-wrap items-center justify-center gap-1">
                      @for (accion of ACCIONES; track accion) {
                        @let activo = tienePermiso(rol, recurso, accion);
                        <button type="button"
                                [disabled]="!puedeEditar || rol === 'super-administrador'"
                                (click)="togglePermiso(rol, recurso, accion)"
                                class="permiso-cell"
                                [class.permiso-cell-active]="activo"
                                [attr.aria-pressed]="activo"
                                [title]="labelTipoUsuario(rol) + ' · ' + recurso + ' · ' + accion">
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
        <p style="color: var(--color-indigo-600);">Los permisos se evalúan en el navegador y sirven para ocultar/mostrar acciones (UX). La autorización real debe validarse en el servidor. La fila de Super Administrador es fija y siempre conserva todos los permisos.</p>
      </div>
    </div>

    @if (showRestablecer) {
      <div class="fixed inset-0 z-50 flex items-center justify-center-modal p-4" style="background-color: rgba(0,0,0,0.4);">
        <div class="modal-enter rounded-xl shadow-xl p-6 w-full max-w-sm border" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
          <h3 class="text-lg font-semibold mb-2" style="color: var(--color-gray-900);">Restablecer permisos</h3>
          <p class="text-sm mb-6" style="color: var(--color-gray-500);">
            ¿Restablecer la matriz a los valores por defecto? Esta acción no se puede deshacer.
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
  protected readonly ROLES_ORDEN = ROLES_ORDEN;
  protected readonly RECURSOS_ORDEN = RECURSOS_ORDEN;
  protected readonly ACCIONES = ACCIONES;
  protected readonly labelTipoUsuario = labelTipoUsuario;

  protected showRestablecer = false;

  protected get puedeEditar(): boolean {
    return this.permisoService.puedeUsuarioActual('editar', 'roles');
  }

  protected tienePermiso(rol: TipoUsuario, recurso: Recurso, accion: Accion): boolean {
    return this.permisoService.permisos()[rol]?.[recurso]?.includes(accion) ?? false;
  }

  protected togglePermiso(rol: TipoUsuario, recurso: Recurso, accion: Accion): void {
    this.permisoService.toggle(rol, recurso, accion);
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
