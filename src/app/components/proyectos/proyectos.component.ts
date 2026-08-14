import {Component, inject, ChangeDetectionStrategy, signal, computed} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {TableModule} from 'primeng/table';
import {Dialog} from 'primeng/dialog';
import {Button} from 'primeng/button';
import {Tag} from 'primeng/tag';
import {Avatar} from 'primeng/avatar';
import {ConfirmationService} from 'primeng/api';
import {ProyectoService} from '../../services/proyecto.service';
import {PlanningService} from '../../services/planning.service';
import {ColumnService} from '../../services/column.service';
import {EquipoService} from '../../services/equipo.service';
import {UsuarioService} from '../../services/usuario.service';
import {AuthService} from '../../services/auth.service';
import {NotificacionService} from '../../services/notificacion.service';
import {Proyecto, ProyectoConDatos} from '../../models/proyecto.model';
import {Usuario} from '../../models/usuario.model';
import {statusColor, prioridadColor, estimacionTotal} from '../../utils/estimacion';
import {iniciales, tipoColor} from '../../utils/helpers';
import {ROL_SUPER_ADMIN_ID} from '../../models/permiso.model';
import {ProyectoFormComponent} from '../proyecto-form/proyecto-form.component';
import {EquipoModalComponent} from '../equipo-modal/equipo-modal.component';
import {PermisoDirective} from '../../directives/permiso.directive';

const PAGINA_SIZE = 10;

@Component({
  selector: 'app-proyectos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ProyectoFormComponent, EquipoModalComponent, PermisoDirective, TableModule, Dialog, Button, Tag, Avatar],
  template: `
    <div class="row align-items-center mb-8">
      <div class="col-12 col-md">
        <h1 class="text-3xl font-bold" style="color: var(--color-gray-900)">
          Proyectos
        </h1>
        <p class="mt-1 text-sm" style="color: var(--color-gray-500)">
          {{ proyectosFiltrados().length }} proyecto{{ proyectosFiltrados().length !== 1 ? 's' : '' }}
        </p>
      </div>
      <div class="col-12 col-md-auto mt-3 mt-md-0 d-flex align-items-center gap-2">
        <button *appPermiso="'crear'; recurso: 'proyectos'" (click)="abrirNuevo()"
                class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors shadow-sm bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-700)]">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          <span class="d-none d-sm-inline">Proyecto</span>
        </button>
      </div>
    </div>

      @if (proyectosFiltrados().length === 0) {
        <div class="text-center py-20">
          <svg class="w-16 h-16 mx-auto mb-4" style="color: var(--color-gray-300)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"/>
          </svg>
          @if (!esAdmin() && proyectos().length > 0) {
            <h3 class="text-lg font-medium mb-2" style="color: var(--color-gray-500)">No tienes proyectos asignados</h3>
            <p class="text-sm mb-6" style="color: var(--color-gray-400)">Solo puedes ver los proyectos en los que estás asociado.</p>
          } @else {
            <h3 class="text-lg font-medium mb-2" style="color: var(--color-gray-500)">No hay proyectos</h3>
            <p class="text-sm mb-6" style="color: var(--color-gray-400)">Crea tu primer proyecto para empezar.</p>
          }
          <button *appPermiso="'crear'; recurso: 'proyectos'" (click)="abrirNuevo()"
                  class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-700)]">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Crear proyecto
          </button>
        </div>
      } @else {
        <div class="rounded-xl border shadow-sm overflow-hidden" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
          <p-table [value]="proyectosFiltrados()" [paginator]="true" [rows]="PAGINA_SIZE"
                   [paginatorStyleClass]="'no-print'" [showCurrentPageReport]="true"
                   currentPageReportTemplate="Mostrando {first}–{last} de {totalRecords}"
                   [rowsPerPageOptions]="[5, 10, 25]" [alwaysShowPaginator]="false"
                   [rowHover]="true" [stripedRows]="true" [tableStyle]="{'min-width': '1050px'}">
            <ng-template pTemplate="header">
              <tr>
                <th class="text-left px-4 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Nombre</th>
                <th class="text-left px-4 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Fecha inicio</th>
                <th class="text-left px-4 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Cliente</th>
                <th class="text-left px-4 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Estado</th>
                <th class="text-left px-4 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Prioridad</th>
                <th class="text-left px-4 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Equipo</th>
                <th class="text-left px-4 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Figma</th>
                <th class="text-right px-4 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Acciones</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-proyecto>
              <tr class="proyecto-row" style="transition: background-color 0.15s;">
                <td class="px-4 sm:px-6 py-2.5 border-l-2 transition-all duration-200 hover:border-[rgba(13,148,136,1)] hover:pl-7" style="border-color: rgba(13, 148, 136, 0.5);">
                  <button (click)="abrirDetalle(proyecto)"
                          class="flex items-center gap-3 text-left group"
                          [attr.aria-label]="'Ver detalles de ' + proyecto.nombre">
                    <div class="w-2 h-2 rounded-full shrink-0" style="background-color: var(--color-teal-500);"></div>
                    <span class="text-sm font-medium transition-colors group-hover:text-[var(--color-teal-600)]" style="color: var(--color-gray-900);">{{ proyecto.nombre }}</span>
                  </button>
                </td>
                <td class="px-4 sm:px-6 py-2.5">
                  <span class="text-sm whitespace-nowrap" style="color: var(--color-gray-500);">
                    {{ proyecto.fechaDesde }}
                  </span>
                </td>
                <td class="px-4 sm:px-6 py-2.5">
                  <span class="text-sm" style="color: var(--color-gray-600);">{{ proyecto.cliente || '—' }}</span>
                </td>
                <td class="px-4 sm:px-6 py-2.5">
                  @if (proyecto.status) {
                    <p-tag [value]="proyecto.status"
                           [style]="{backgroundColor: statusColor(proyecto.status).bg, color: statusColor(proyecto.status).text}" />
                  } @else {
                    <span class="text-sm" style="color: var(--color-gray-300);">—</span>
                  }
                </td>
                <td class="px-4 sm:px-6 py-2.5">
                  @if (proyecto.prioridad) {
                    <p-tag [value]="proyecto.prioridad"
                           [style]="{backgroundColor: prioridadColor(proyecto.prioridad).bg, color: prioridadColor(proyecto.prioridad).text}" />
                  } @else {
                    <span class="text-sm" style="color: var(--color-gray-300);">—</span>
                  }
                </td>
                <td class="px-4 sm:px-6 py-2.5">
                  @let miembros = miembrosDeProyecto(proyecto.id);
                  @if (miembros.length > 0) {
                    <div class="flex items-center">
                      <div class="flex -space-x-1.5">
                        @for (m of miembros.slice(0, 3); track m.id) {
                          <p-avatar [label]="iniciales(m.usuario)" shape="circle"
                                    [style]="{'width': '1.5rem', 'height': '1.5rem', 'font-size': '0.625rem', 'background-color': tipoColor(m.tipo).bg, 'color': tipoColor(m.tipo).text, 'border': '2px solid var(--color-surface)'}"
                                    [attr.title]="m.usuario" />
                        }
                        @if (miembros.length > 3) {
                          <p-avatar [label]="'+' + (miembros.length - 3)" shape="circle"
                                    [style]="{'width': '1.5rem', 'height': '1.5rem', 'font-size': '0.625rem', 'background-color': 'var(--color-gray-100)', 'color': 'var(--color-gray-600)', 'border': '2px solid var(--color-surface)'}"
                                    [attr.title]="'+' + (miembros.length - 3)" />
                        }
                      </div>
                      <span class="ml-2 text-xs" style="color: var(--color-gray-400);">{{ miembros.length }}</span>
                    </div>
                  } @else {
                    <span class="text-sm" style="color: var(--color-gray-300);">—</span>
                  }
                </td>
                <td class="px-4 sm:px-6 py-2.5">
                  @if (proyecto.documentacion) {
                     <a [href]="proyecto.documentacion" target="_blank" rel="noopener"
                        class="inline-flex items-center gap-1.5 text-sm transition-colors text-[var(--color-teal-600)] hover:text-[var(--color-teal-700)]">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                      </svg>
                      Figma
                    </a>
                  } @else {
                    <span class="text-sm" style="color: var(--color-gray-300);">—</span>
                  }
                </td>
                <td class="px-4 sm:px-6 py-2.5 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <p-button (onClick)="irAPlanning(proyecto.id)"
                              icon="pi pi-calendar" [text]="true" [rounded]="true" severity="secondary" size="small"
                              [attr.aria-label]="'Ir a planning de ' + proyecto.nombre" />
                    <p-button *appPermiso="'editar'; recurso: 'proyectos'" (onClick)="abrirEquipo(proyecto)"
                              icon="pi pi-users" [text]="true" [rounded]="true" severity="secondary" size="small"
                              [attr.aria-label]="'Gestionar equipo de ' + proyecto.nombre" />
                    <p-button *appPermiso="'editar'; recurso: 'proyectos'" (onClick)="abrirEditar(proyecto)"
                              icon="pi pi-pencil" [text]="true" [rounded]="true" severity="secondary" size="small"
                              [attr.aria-label]="'Editar ' + proyecto.nombre" />
                    <p-button *appPermiso="'eliminar'; recurso: 'proyectos'" (onClick)="confirmarEliminar(proyecto)"
                              icon="pi pi-trash" [text]="true" [rounded]="true" severity="danger" size="small"
                              [attr.aria-label]="'Eliminar ' + proyecto.nombre" />
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      }

      <!-- Detalle modal -->
      <p-dialog
        [visible]="detalleId() !== null"
        (onHide)="cerrarDetalle()"
        [modal]="true"
        [draggable]="false"
        [resizable]="false"
        [closeOnEscape]="true"
        [dismissableMask]="true"
        [style]="{width: '28rem'}">
        @if (detalleProyecto(); as detalle) {
          <ng-template pTemplate="header">
            <div class="min-w-0">
              <h3 class="text-lg font-semibold leading-tight" style="color: var(--color-gray-900);">{{ detalle.proyecto.nombre }}</h3>
              @if (detalle.proyecto.cliente) {
                <p class="text-sm mt-0.5" style="color: var(--color-gray-500);">{{ detalle.proyecto.cliente }}</p>
              }
            </div>
          </ng-template>

          <div class="px-1">
            @if (detalle.proyecto.descripcion) {
              <div class="rounded-lg p-3 mb-5" style="background-color: var(--color-gray-50);">
                <p class="text-sm leading-relaxed" style="color: var(--color-gray-600);">{{ detalle.proyecto.descripcion }}</p>
              </div>
            }

            <div class="grid grid-cols-2 gap-x-4 gap-y-4">
              <div>
                <span class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Estado</span>
                <div class="mt-1">
                  @if (detalle.proyecto.status) {
                    <p-tag [value]="detalle.proyecto.status"
                           [style]="{backgroundColor: statusColor(detalle.proyecto.status).bg, color: statusColor(detalle.proyecto.status).text}" />
                  } @else { <span class="text-sm" style="color: var(--color-gray-300);">—</span> }
                </div>
              </div>
              <div>
                <span class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Prioridad</span>
                <div class="mt-1">
                  @if (detalle.proyecto.prioridad) {
                    <p-tag [value]="detalle.proyecto.prioridad"
                           [style]="{backgroundColor: prioridadColor(detalle.proyecto.prioridad).bg, color: prioridadColor(detalle.proyecto.prioridad).text}" />
                  } @else { <span class="text-sm" style="color: var(--color-gray-300);">—</span> }
                </div>
              </div>
              <div>
                <span class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Ambiente</span>
                <p class="mt-1 text-sm flex items-center gap-1.5" style="color: var(--color-gray-800);">
                  <span class="w-2 h-2 rounded-full" [style.background-color]="columnaColor(detalle.proyecto.columnaId)"></span>
                  {{ nombreColumna(detalle.proyecto.columnaId) }}
                </p>
              </div>
              <div>
                <span class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Documentación</span>
                @if (detalle.proyecto.documentacion) {
                  <a [href]="detalle.proyecto.documentacion" target="_blank" rel="noopener"
                     class="mt-1 inline-flex items-center gap-1.5 text-sm text-[var(--color-teal-600)] hover:text-[var(--color-teal-700)]">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                    </svg>
                    Abrir Figma
                  </a>
                } @else { <p class="mt-1 text-sm" style="color: var(--color-gray-300);">—</p> }
              </div>
              <div class="col-span-2">
                <span class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Duración</span>
                <p class="mt-1 text-sm" style="color: var(--color-gray-800);">
                  {{ detalle.proyecto.fechaDesde || '—' }} — {{ detalle.proyecto.fechaHasta || '—' }}
                </p>
              </div>
            </div>

            <div class="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="rounded-lg p-3 text-center" style="background-color: var(--color-gray-50);">
                <p class="text-xl font-bold" style="color: var(--color-gray-900);">{{ detalle.plannings.length }}</p>
                <p class="text-xs mt-0.5" style="color: var(--color-gray-500);">Planning</p>
              </div>
              <div class="rounded-lg p-3 text-center" style="background-color: var(--color-gray-50);">
                <p class="text-xl font-bold" style="color: var(--color-gray-900);">{{ detalle.tareas.length }}</p>
                <p class="text-xs mt-0.5" style="color: var(--color-gray-500);">Tareas</p>
              </div>
              <div class="rounded-lg p-3 text-center" style="background-color: var(--color-gray-50);">
                <p class="text-xl font-bold" style="color: var(--color-teal-600);">{{ tareasCompletadas(detalle) }}</p>
                <p class="text-xs mt-0.5" style="color: var(--color-gray-500);">Completadas</p>
              </div>
              <div class="rounded-lg p-3 text-center" style="background-color: var(--color-gray-50);">
                <p class="text-xl font-bold" style="color: var(--color-indigo-600);">{{ estimacionTotal(detalle.tareas) }}</p>
                <p class="text-xs mt-0.5" style="color: var(--color-gray-500);">Story points</p>
              </div>
            </div>
          </div>

          <ng-template pTemplate="footer">
            <div class="flex justify-end gap-3">
              <p-button label="Cerrar" [text]="true" severity="secondary" (onClick)="cerrarDetalle()" />
              <p-button label="Ir a planning" icon="pi pi-clock" (onClick)="irAPlanning(detalle.proyecto.id)" />
            </div>
          </ng-template>
        }
      </p-dialog>

      @if (showForm) {
        <app-proyecto-form [editando]="editandoProyecto"
                           (guardar)="onGuardar($event)"
                           (cerrar)="cerrarForm()"/>
      }

      @if (equipoProyecto(); as proyecto) {
        <app-equipo-modal [proyecto]="proyecto" (cerrar)="cerrarEquipo()"/>
      }
  `,
  styles: [`
    .proyecto-row:hover {
      background-color: var(--color-gray-50);
    }
  `],
})
export class ProyectosComponent {
  private proyectoService = inject(ProyectoService);
  private planningService = inject(PlanningService);
  private columnService = inject(ColumnService);
  private equipoService = inject(EquipoService);
  private usuarioService = inject(UsuarioService);
  private authService = inject(AuthService);
  private notificacionService = inject(NotificacionService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);

  proyectos = this.proyectoService.proyectos;
  protected readonly statusColor = statusColor;
  protected readonly prioridadColor = prioridadColor;
  protected readonly estimacionTotal = estimacionTotal;
  protected readonly iniciales = iniciales;
  protected readonly tipoColor = tipoColor;
  protected readonly PAGINA_SIZE = PAGINA_SIZE;

  showForm = false;
  editandoProyecto: Proyecto | null = null;

  protected readonly equipoProyecto = signal<Proyecto | null>(null);

  protected readonly esAdmin = computed(() => {
    const tipo = this.authService.currentUser()?.tipo;
    return tipo === ROL_SUPER_ADMIN_ID || tipo === 'administrador';
  });

  protected readonly proyectosFiltrados = computed(() => {
    const lista = this.proyectos();
    if (this.esAdmin()) return lista;
    const id = this.authService.currentUser()?.id;
    if (!id) return [];
    return lista.filter((p) => this.equipoService.miembrosDe(p.id).includes(id));
  });

  protected readonly detalleId = signal<string | null>(null);
  protected readonly detalleProyecto = computed<ProyectoConDatos | null>(() => {
    const id = this.detalleId();
    if (!id) return null;
    const proyecto = this.proyectoService.proyectoPorId(id);
    if (!proyecto) return null;
    const plannings = this.planningService.plannings().filter((pl) => pl.proyectoId === id);
    const tareas = plannings.flatMap((pl) => pl.tareas);
    return {proyecto, plannings, tareas};
  });

  abrirNuevo(): void {
    this.editandoProyecto = null;
    this.showForm = true;
  }

  abrirEditar(proyecto: Proyecto): void {
    this.editandoProyecto = proyecto;
    this.showForm = true;
  }

  abrirDetalle(proyecto: Proyecto): void {
    this.detalleId.set(proyecto.id);
  }

  cerrarDetalle(): void {
    this.detalleId.set(null);
  }

  nombreColumna(id: string): string {
    return this.columnService.columnas().find((c) => c.id === id)?.nombre ?? '—';
  }

  columnaColor(id: string): string {
    return this.columnService.columnas().find((c) => c.id === id)?.color ?? 'var(--color-gray-300)';
  }

  tareasCompletadas(detalle: ProyectoConDatos): number {
    return detalle.tareas.filter((t) => t.completada).length;
  }

  miembrosDeProyecto(proyectoId: string): Usuario[] {
    return this.equipoService.miembrosDe(proyectoId)
      .map((id) => this.usuarioService.usuarioPorId(id))
      .filter((u): u is Usuario => !!u);
  }

  abrirEquipo(proyecto: Proyecto): void {
    this.equipoProyecto.set(proyecto);
  }

  cerrarEquipo(): void {
    this.equipoProyecto.set(null);
  }

  onGuardar(data: {nombre: string; descripcion: string; cliente: string; status: string; prioridad: string; fechaDesde: string; fechaHasta: string; documentacion: string}): void {
    if (this.editandoProyecto) {
      this.proyectoService.actualizar(this.editandoProyecto.id, data);
      this.notificacionService.notificar({tipo: 'info', descripcion: `Proyecto «${data.nombre}» actualizado`, url: '/proyectos'});
    } else {
      this.proyectoService.crear(data);
      this.notificacionService.notificar({tipo: 'exito', descripcion: `Proyecto «${data.nombre}» creado`, url: '/proyectos'});
    }
    this.cerrarForm();
  }

  confirmarEliminar(proyecto: Proyecto): void {
    this.confirmationService.confirm({
      header: 'Eliminar proyecto',
      message: `¿Eliminar el proyecto «${proyecto.nombre}»? Esta acción no se puede deshacer.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.proyectoService.eliminar(proyecto.id);
        this.notificacionService.notificar({tipo: 'alerta', descripcion: `Proyecto «${proyecto.nombre}» eliminado`});
      },
    });
  }

  irAPlanning(proyectoId: string): void {
    this.router.navigate(['/planning'], {queryParams: {proyectoId}});
  }

  cerrarForm(): void {
    this.showForm = false;
    this.editandoProyecto = null;
  }
}
