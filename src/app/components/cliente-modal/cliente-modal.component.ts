import {Component, inject, input, output, signal, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ClienteService} from '../../services/cliente.service';
import {NotificacionService} from '../../services/notificacion.service';
import {PermisoDirective} from '../../directives/permiso.directive';

@Component({
  selector: 'app-cliente-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PermisoDirective],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center-modal p-4" style="background-color: rgba(0,0,0,0.4);" (click)="cerrar.emit()">
      <div class="modal-enter rounded-xl shadow-xl w-full max-w-lg border overflow-hidden"
           style="background-color: var(--color-surface); border-color: var(--color-gray-200);"
           (click)="$event.stopPropagation()">
        <div class="flex items-start justify-between gap-4 px-6 py-3 border-b" style="border-color: var(--color-gray-100);">
          <div class="min-w-0">
            <h3 class="text-lg font-semibold leading-tight" style="color: var(--color-gray-900);">Clientes</h3>
            <p class="text-sm mt-0.5 truncate" style="color: var(--color-gray-500);">{{ clientes().length }} cliente{{ clientes().length !== 1 ? 's' : '' }} registrados</p>
          </div>
          <button (click)="cerrar.emit()"
                  class="shrink-0 p-1.5 rounded-lg transition-colors text-[var(--color-gray-400)] hover:text-[var(--color-gray-700)] hover:bg-[var(--color-gray-100)]"
                  aria-label="Cerrar">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="px-6 py-4">
          <div class="flex gap-2 mb-4">
            <input [value]="nuevoNombre()" (input)="nuevoNombre.set($any($event.target).value)" (keydown.enter)="agregar()"
                   type="text" autocomplete="off" placeholder="Nuevo cliente…"
                   class="w-full px-3 py-2 text-sm rounded-lg outline-none transition-colors"
                   style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);">
            <button (click)="agregar()"
                    class="shrink-0 px-4 py-2 text-sm font-medium rounded-lg transition-colors text-white bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-700)]">
              Agregar
            </button>
          </div>

          @if (clientes().length === 0) {
            <p class="text-sm py-8 text-center" style="color: var(--color-gray-400);">No hay clientes registrados.</p>
          } @else {
            <div class="custom-scrollbar max-h-[176px] overflow-y-auto -mr-2 pr-2 space-y-1">
              @for (cliente of clientes(); track cliente.id) {
                <div class="flex items-center gap-2 p-2 rounded-lg transition-colors"
                     [style.background-color]="eliminarId() === cliente.id ? 'var(--color-rose-50)' : 'transparent'">
                  @if (editandoId() === cliente.id) {
                    <input [value]="editandoNombre()" (input)="editandoNombre.set($any($event.target).value)" (keydown.enter)="guardarEdicion(cliente.id)"
                           type="text" autocomplete="off" placeholder="Nombre del cliente"
                           class="flex-1 min-w-0 px-2.5 py-1.5 text-sm rounded-lg outline-none transition-colors"
                           style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-indigo-400);">
                    <button (click)="guardarEdicion(cliente.id)"
                            class="shrink-0 p-1.5 rounded-lg transition-colors text-[var(--color-teal-600)] hover:bg-[var(--color-teal-50)]"
                            aria-label="Guardar">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    </button>
                    <button (click)="cancelarEdicion()"
                            class="shrink-0 p-1.5 rounded-lg transition-colors text-[var(--color-gray-400)] hover:bg-[var(--color-gray-100)]"
                            aria-label="Cancelar">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  } @else {
                    <span class="flex-1 min-w-0 text-sm font-medium truncate" style="color: var(--color-gray-900);">{{ cliente.nombre }}</span>
                    <button *appPermiso="'editar'; recurso: 'proyectos'" (click)="editar(cliente.id)"
                            class="shrink-0 p-1.5 rounded-lg transition-colors text-[var(--color-gray-400)] hover:text-[var(--color-indigo-600)] hover:bg-[var(--color-indigo-50)]"
                            [attr.aria-label]="'Editar ' + cliente.nombre">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.862 4.487zm0 0L19.5 7.125"/>
                      </svg>
                    </button>
                    <button *appPermiso="'editar'; recurso: 'proyectos'" (click)="confirmarEliminar(cliente.id)"
                            class="shrink-0 p-1.5 rounded-lg transition-colors text-[var(--color-gray-400)] hover:text-[var(--color-rose-600)] hover:bg-[var(--color-rose-50)]"
                            [attr.aria-label]="'Eliminar ' + cliente.nombre">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                      </svg>
                    </button>
                  }
                </div>
                @if (eliminarId() === cliente.id) {
                  <p class="flex items-center justify-between gap-2 px-2 pb-2 text-xs" style="color: var(--color-gray-500);">
                    <span>¿Eliminar «{{ cliente.nombre }}»?</span>
                    <span class="flex gap-2 shrink-0">
                      <button (click)="ejecutarEliminar()"
                              class="px-2 py-1 text-xs font-medium rounded-md transition-colors text-white bg-[var(--color-rose-600)] hover:bg-[var(--color-rose-700)]">
                        Sí, eliminar
                      </button>
                      <button (click)="cancelarEliminar()"
                              class="px-2 py-1 text-xs font-medium rounded-md transition-colors text-[var(--color-gray-700)] bg-[var(--color-gray-100)] hover:bg-[var(--color-gray-200)]">
                        Cancelar
                      </button>
                    </span>
                  </p>
                }
              }
            </div>
          }
        </div>

        <div class="flex items-center justify-between gap-3 px-6 py-4 border-t" style="border-color: var(--color-gray-100);">
          <span class="text-sm" style="color: var(--color-gray-500);">
            Un cliente en uso no puede eliminarse.
          </span>
          <button (click)="cerrar.emit()"
                  class="shrink-0 px-4 py-2 text-sm font-medium rounded-lg transition-colors text-white bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-700)]">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class ClienteModalComponent {
  readonly cerrar = output();

  private readonly clienteService = inject(ClienteService);
  protected readonly clientes = this.clienteService.clientes;
  private readonly notificacionService = inject(NotificacionService);

  protected readonly nuevoNombre = signal('');
  protected readonly editandoId = signal<string | null>(null);
  protected readonly editandoNombre = signal('');
  protected readonly eliminarId = signal<string | null>(null);

  protected agregar(): void {
    const nombre = this.nuevoNombre().trim();
    if (!nombre) {
      this.notificacionService.notificar({tipo: 'error', descripcion: `El nombre del cliente no puede estar vacío.`});
      return;
    }
    if (this.clientes().some((c) => c.nombre.trim().toLowerCase() === nombre.toLowerCase())) {
      this.notificacionService.notificar({tipo: 'error', descripcion: `Ya existe un cliente llamado «${nombre}».`});
      return;
    }
    this.clienteService.crear(nombre);
    this.nuevoNombre.set('');
    this.notificacionService.notificar({tipo: 'exito', descripcion: `Cliente «${nombre}» creado.`});
  }

  protected editar(id: string): void {
    const cliente = this.clientes().find((c) => c.id === id);
    if (!cliente) return;
    this.editandoId.set(id);
    this.editandoNombre.set(cliente.nombre);
  }

  protected guardarEdicion(id: string): void {
    const nombre = this.editandoNombre().trim();
    const actual = this.clientes().find((c) => c.id === id);
    if (!actual) return;
    if (!nombre) {
      this.notificacionService.notificar({tipo: 'error', descripcion: `El nombre del cliente no puede estar vacío.`});
      return;
    }
    if (this.clientes().some((c) => c.id !== id && c.nombre.trim().toLowerCase() === nombre.toLowerCase())) {
      this.notificacionService.notificar({tipo: 'error', descripcion: `Ya existe un cliente llamado «${nombre}».`});
      return;
    }
    this.clienteService.renombrar(id, nombre);
    this.editandoId.set(null);
    this.editandoNombre.set('');
    this.notificacionService.notificar({tipo: 'exito', descripcion: `Cliente «${actual.nombre}» renombrado a «${nombre}» en sus proyectos.`});
  }

  protected cancelarEdicion(): void {
    this.editandoId.set(null);
    this.editandoNombre.set('');
  }

  protected confirmarEliminar(id: string): void {
    this.eliminarId.set(id);
  }

  protected ejecutarEliminar(): void {
    const id = this.eliminarId();
    if (!id) return;
    const cliente = this.clientes().find((c) => c.id === id);
    const resultado = this.clienteService.eliminar(id);
    this.eliminarId.set(null);
    if (resultado === 'en-uso') {
      this.notificacionService.notificar({
        tipo: 'alerta',
        descripcion: `No se puede eliminar «${cliente?.nombre ?? ''}»: hay proyectos que lo utilizan.`,
      });
      return;
    }
    this.notificacionService.notificar({tipo: 'exito', descripcion: `Cliente «${cliente?.nombre ?? ''}» eliminado.`, url: '/proyectos'});
  }

  protected cancelarEliminar(): void {
    this.eliminarId.set(null);
  }
}