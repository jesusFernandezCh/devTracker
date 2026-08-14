import {Component, inject, input, output, signal, computed, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Dialog} from 'primeng/dialog';
import {IconField} from 'primeng/iconfield';
import {InputIcon} from 'primeng/inputicon';
import {InputText} from 'primeng/inputtext';
import {Avatar} from 'primeng/avatar';
import {Chip} from 'primeng/chip';
import {Proyecto} from '../../models/proyecto.model';
import {UsuarioService} from '../../services/usuario.service';
import {EquipoService} from '../../services/equipo.service';
import {RolService} from '../../services/rol.service';
import {NotificacionService} from '../../services/notificacion.service';
import {iniciales, tipoColor} from '../../utils/helpers';

@Component({
  selector: 'app-equipo-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, Dialog, IconField, InputIcon, InputText, Avatar, Chip],
  template: `
    <p-dialog
      header="Equipo"
      [visible]="true"
      (onHide)="cerrar.emit()"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [closeOnEscape]="true"
      [dismissableMask]="true"
      [style]="{width: '28rem'}"
      styleClass="equipo-modal">
      <p class="text-sm mt-1 mb-4 truncate" style="color: var(--color-gray-500);">{{ proyecto().nombre }}</p>

      <p-iconfield styleClass="mb-4 w-full">
        <p-inputicon styleClass="pi pi-search" />
        <input pInputText [value]="busqueda()" (input)="busqueda.set($any($event.target).value)"
               autocomplete="off" placeholder="Buscar usuario…" class="w-full" />
      </p-iconfield>

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
                <p-avatar [image]="usuario.foto" shape="circle" [style]="{width: '2rem', height: '2rem'}" />
              } @else {
                <p-avatar [label]="iniciales(usuario.usuario)" shape="circle"
                          [style]="{backgroundColor: tipoColor(usuario.tipo).bg, color: tipoColor(usuario.tipo).text}" />
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

      <div class="flex items-center justify-between gap-3 mt-4 pt-4 border-t" style="border-color: var(--color-gray-100);">
        <div class="flex items-center gap-1.5 flex-wrap min-w-0">
          @for (usuario of asignados(); track usuario.id) {
            <p-chip>
              <p-avatar [label]="iniciales(usuario.usuario)" shape="circle"
                        [style]="{'width': '1.25rem', 'height': '1.25rem', 'font-size': '0.55rem'}" />
              <button (click)="quitar(usuario.id)"
                      class="p-0.5 rounded-full transition-colors hover:bg-[var(--color-gray-200)]"
                      [attr.aria-label]="'Quitar a ' + usuario.usuario">
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </p-chip>
          }
          @if (asignados().length === 0) {
            <span class="text-sm" style="color: var(--color-gray-400);">Sin miembros asignados</span>
          }
        </div>
        <button (click)="cerrar.emit()"
                class="shrink-0 px-4 py-2 text-sm font-medium rounded-lg transition-colors text-white bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-700)]"
                aria-label="Cerrar">
          Cerrar
        </button>
      </div>
    </p-dialog>
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
  private readonly notificacionService = inject(NotificacionService);
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
    const nombre = this.usuarioService.usuarioPorId(usuarioId)?.usuario ?? usuarioId;
    const asignando = !this.estaAsignado(usuarioId);
    if (asignando) {
      this.equipoService.asignar(this.proyecto().id, usuarioId);
    } else {
      this.equipoService.quitar(this.proyecto().id, usuarioId);
    }
    this.notificacionService.notificar({
      tipo: 'info',
      descripcion: `«${nombre}» ${asignando ? 'agregado al' : 'quitado del'} equipo de «${this.proyecto().nombre}»`,
      url: '/proyectos',
    });
  }

  protected quitar(usuarioId: string): void {
    const nombre = this.usuarioService.usuarioPorId(usuarioId)?.usuario ?? usuarioId;
    this.equipoService.quitar(this.proyecto().id, usuarioId);
    this.notificacionService.notificar({
      tipo: 'info',
      descripcion: `«${nombre}» quitado del equipo de «${this.proyecto().nombre}»`,
      url: '/proyectos',
    });
  }
}