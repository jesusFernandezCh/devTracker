import {Component, inject, input, output, signal, computed, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Proyecto} from '../../models/proyecto.model';
import {UsuarioService} from '../../services/usuario.service';
import {EquipoService} from '../../services/equipo.service';
import {RolService} from '../../services/rol.service';
import {iniciales, tipoColor} from '../../utils/helpers';

@Component({
  selector: 'app-equipo-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center-modal p-4" style="background-color: rgba(0,0,0,0.4);" (click)="cerrar.emit()">
      <div class="modal-enter rounded-xl shadow-xl w-full max-w-lg border overflow-hidden"
           style="background-color: var(--color-surface); border-color: var(--color-gray-200);"
           (click)="$event.stopPropagation()">
        <div class="flex items-start justify-between gap-4 px-6 py-3 border-b" style="border-color: var(--color-gray-100);">
          <div class="min-w-0">
            <h3 class="text-lg font-semibold leading-tight" style="color: var(--color-gray-900);">Equipo</h3>
            <p class="text-sm mt-0.5 truncate" style="color: var(--color-gray-500);">{{ proyecto().nombre }}</p>
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
          <input [value]="busqueda()" (input)="busqueda.set($any($event.target).value)"
                 type="text" autocomplete="off" placeholder="Buscar usuario…"
                 class="w-full px-3 py-2 text-sm rounded-lg outline-none transition-colors mb-4"
                 style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);">

          @if (usuariosFiltrados().length === 0) {
            <p class="text-sm py-8 text-center" style="color: var(--color-gray-400);">
              {{ usuarios().length === 0 ? 'No hay usuarios registrados.' : 'Sin resultados.' }}
            </p>
          } @else {
            <div class="max-h-72 overflow-y-auto -mr-2 pr-2 space-y-1">
              @for (usuario of usuariosFiltrados(); track usuario.id) {
                <button (click)="toggle(usuario.id)"
                        class="w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left"
                        [class.selected]="estaAsignado(usuario.id)"
                        [style.background-color]="estaAsignado(usuario.id) ? 'var(--color-indigo-50)' : 'transparent'">
                  @if (usuario.foto) {
                    <img [src]="usuario.foto" [alt]="'Foto de ' + usuario.usuario"
                         class="w-8 h-8 rounded-full object-cover shrink-0">
                  } @else {
                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                         [style.background-color]="tipoColor(usuario.tipo).bg"
                         [style.color]="tipoColor(usuario.tipo).text">
                      {{ iniciales(usuario.usuario) }}
                    </div>
                  }
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium truncate" style="color: var(--color-gray-900);">{{ usuario.usuario }}</p>
                    <p class="text-xs truncate" style="color: var(--color-gray-500);">
                      {{ rolService.nombreDe(usuario.tipo) }} · {{ usuario.correo }}
                    </p>
                  </div>
                  <span class="w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors"
                        [style.border-color]="estaAsignado(usuario.id) ? 'var(--color-indigo-600)' : 'var(--color-gray-300)'"
                        [style.background-color]="estaAsignado(usuario.id) ? 'var(--color-indigo-600)' : 'transparent'">
                    @if (estaAsignado(usuario.id)) {
                      <svg class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    }
                  </span>
                </button>
              }
            </div>
          }
        </div>

        <div class="flex items-center justify-between gap-3 px-6 py-4 border-t" style="border-color: var(--color-gray-100);">
          <div class="flex items-center gap-1.5 flex-wrap min-w-0">
            @for (usuario of asignados(); track usuario.id) {
              <span class="inline-flex items-center gap-1 pl-1 pr-1.5 py-0.5 rounded-full text-xs font-medium"
                    style="color: var(--color-gray-800); background-color: var(--color-gray-100);">
                {{ iniciales(usuario.usuario) }}
                <button (click)="quitar(usuario.id)"
                        class="p-0.5 rounded-full transition-colors hover:bg-[var(--color-gray-200)]"
                        [attr.aria-label]="'Quitar a ' + usuario.usuario">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </span>
            }
            @if (asignados().length === 0) {
              <span class="text-sm" style="color: var(--color-gray-400);">Sin miembros asignados</span>
            }
          </div>
          <button (click)="cerrar.emit()"
                  class="shrink-0 px-4 py-2 text-sm font-medium rounded-lg transition-colors text-white bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-700)]">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .selected {
      box-shadow: inset 0 0 0 1px var(--color-indigo-200);
    }
  `],
})
export class EquipoModalComponent {
  readonly proyecto = input.required<Proyecto>();
  readonly cerrar = output();

  protected readonly usuarioService = inject(UsuarioService);
  protected readonly equipoService = inject(EquipoService);
  protected readonly rolService = inject(RolService);
  protected readonly iniciales = iniciales;
  protected readonly tipoColor = tipoColor;

  protected readonly busqueda = signal('');
  protected readonly usuarios = this.usuarioService.usuarios;

  protected readonly asignados = computed(() =>
    this.usuarios().filter((u) => this.equipoService.miembrosDe(this.proyecto().id).includes(u.id)),
  );

  protected readonly usuariosFiltrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    if (!q) return this.usuarios();
    return this.usuarios().filter(
      (u) => u.usuario.toLowerCase().includes(q) || u.correo.toLowerCase().includes(q),
    );
  });

  protected estaAsignado(usuarioId: string): boolean {
    return this.equipoService.miembrosDe(this.proyecto().id).includes(usuarioId);
  }

  protected toggle(usuarioId: string): void {
    if (this.estaAsignado(usuarioId)) {
      this.equipoService.quitar(this.proyecto().id, usuarioId);
    } else {
      this.equipoService.asignar(this.proyecto().id, usuarioId);
    }
  }

  protected quitar(usuarioId: string): void {
    this.equipoService.quitar(this.proyecto().id, usuarioId);
  }
}
