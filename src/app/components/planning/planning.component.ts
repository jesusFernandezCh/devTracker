import {Component, inject, ChangeDetectionStrategy, DestroyRef} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {TableModule} from 'primeng/table';
import {Button} from 'primeng/button';
import {ConfirmationService} from 'primeng/api';
import {PlanningService} from '../../services/planning.service';
import {ProyectoService} from '../../services/proyecto.service';
import {Planning, PlanningTask} from '../../models/planning.model';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {estimacionTotal} from '../../utils/estimacion';
import {PlanningFormComponent} from '../planning-form/planning-form.component';
import {PlanningTasksComponent} from '../planning-tasks/planning-tasks.component';
import {PlanningDetailComponent} from '../planning-detail/planning-detail.component';
import {PermisoDirective} from '../../directives/permiso.directive';

const PAGINA_SIZE = 10;

@Component({
  selector: 'app-planning',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PlanningFormComponent, PlanningTasksComponent, PlanningDetailComponent, PermisoDirective, TableModule, Button],
  template: `
      <div class="row align-items-center mb-8">
        <div class="col-12 col-md">
          <h1 class="text-3xl font-bold" style="color: var(--color-gray-900)">
            Planning
          </h1>
          <p class="mt-1 text-sm" style="color: var(--color-gray-500)">
            {{ plannings().length }} plan{{ plannings().length !== 1 ? 'es' : '' }}
          </p>
        </div>
        <div class="col-12 col-md-auto mt-3 mt-md-0">
          <button *appPermiso="'crear'; recurso: 'planning'" (click)="abrirNuevo()"
                  class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors shadow-sm bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-700)]">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            <span class="d-none d-sm-inline">Planning</span>
          </button>
        </div>
      </div>

      @if (plannings().length === 0) {
        <div class="text-center py-20">
          <svg class="w-16 h-16 mx-auto mb-4" style="color: var(--color-gray-300)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"/>
          </svg>
          <h3 class="text-lg font-medium mb-2" style="color: var(--color-gray-500)">No hay plannings</h3>
          <p class="text-sm mb-6" style="color: var(--color-gray-400)">Crea tu primer planning para empezar.</p>
          <button *appPermiso="'crear'; recurso: 'planning'" (click)="abrirNuevo()"
                  class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-700)]">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Crear planning
          </button>
        </div>
      } @else {
        <div class="rounded-xl border shadow-sm overflow-hidden" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
          <p-table [value]="plannings()" [paginator]="true" [rows]="PAGINA_SIZE"
                   [paginatorStyleClass]="'no-print'" [showCurrentPageReport]="true"
                   currentPageReportTemplate="Mostrando {first}–{last} de {totalRecords}"
                   [rowsPerPageOptions]="[5, 10, 25]" [alwaysShowPaginator]="false"
                   [rowHover]="true" [stripedRows]="true" [tableStyle]="{'min-width': '900px'}">
            <ng-template pTemplate="header">
              <tr>
                <th class="text-left px-4 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style="color: var(--color-gray-400);">Descripción</th>
                <th class="text-left px-4 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Fecha</th>
                <th class="text-left px-4 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style="color: var(--color-gray-400);">Proyecto</th>
                <th class="text-center px-4 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Tareas</th>
                <th class="text-center px-4 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Estimación</th>
                <th class="text-right px-4 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Acciones</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-planning>
              <tr class="planning-row" style="transition: background-color 0.15s;">
                <td class="px-4 sm:px-6 py-2.5 hidden sm:table-cell border-l-2 transition-all duration-200 cursor-pointer" style="border-color: rgba(13, 148, 136, 0.5);" (click)="abrirDetalle(planning)">
                  <span class="text-sm truncate-desc transition-colors text-[var(--color-gray-700)] hover:text-[var(--color-teal-600)]">
                    {{ planning.descripcion || '—' }}
                  </span>
                </td>
                <td class="px-4 sm:px-6 py-2.5">
                  <span class="text-sm whitespace-nowrap" style="color: var(--color-gray-900);">{{ planning.fecha }}</span>
                </td>
                <td class="px-4 sm:px-6 py-2.5 hidden sm:table-cell">
                  <span class="text-sm" style="color: var(--color-gray-500);">{{ nombreProyecto(planning.proyectoId) }}</span>
                </td>
                <td class="px-4 sm:px-6 py-2.5 text-center">
                  <span class="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium"
                        style="background-color: #e0f2fe; color: #0369a1;">
                    {{ planning.tareas.length }}
                  </span>
                </td>
                <td class="px-4 sm:px-6 py-2.5 text-center">
                  <span class="text-sm font-semibold" style="color: var(--color-indigo-600);">
                    {{ estimacionTotal(planning.tareas) }} día{{ estimacionTotal(planning.tareas) !== 1 ? 's' : '' }}
                  </span>
                </td>
                <td class="px-4 sm:px-6 py-2.5 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <p-button *appPermiso="'editar'; recurso: 'planning'" (onClick)="abrirEditar(planning)"
                              icon="pi pi-pencil" [text]="true" [rounded]="true" severity="secondary" size="small"
                              [attr.aria-label]="'Editar planning'" />
                    <p-button (onClick)="abrirTareas(planning)"
                              icon="pi pi-list-check" [text]="true" [rounded]="true" severity="secondary" size="small"
                              [attr.aria-label]="'Tareas del planning'" />
                    <p-button *appPermiso="'crear'; recurso: 'planning'" (onClick)="clonarPlanning(planning)"
                              icon="pi pi-copy" [text]="true" [rounded]="true" severity="secondary" size="small"
                              [attr.aria-label]="'Clonar planning'" />
                    <p-button *appPermiso="'eliminar'; recurso: 'planning'" (onClick)="confirmarEliminar(planning)"
                              icon="pi pi-trash" [text]="true" [rounded]="true" severity="danger" size="small"
                              [attr.aria-label]="'Eliminar planning'" />
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      }

      @if (showForm) {
        <app-planning-form [editando]="editandoPlanning"
                           [proyectos]="proyectos()"
                           (guardar)="onGuardar($event)"
                           (cerrar)="cerrarForm()"/>
      }

      @if (showTareas && planningTareasActual) {
        <app-planning-tasks [planning]="planningTareasActual"
                            [proyectos]="proyectos()"
                            (actualizarTareas)="onActualizarTareas($event)"
                            (cerrar)="cerrarTareas()"/>
      }

      @if (showDetalle && planningDetalleActual) {
        <app-planning-detail [planning]="planningDetalleActual"
                             [proyectos]="proyectos()"
                             (cerrar)="cerrarDetalle()"/>
      }
  `,
  styles: [`
    .truncate-desc {
      max-width: 180px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: block;
    }
    .planning-row:hover {
      background-color: var(--color-gray-50);
    }
  `],
})
export class PlanningComponent {
  private planningService = inject(PlanningService);
  private proyectoService = inject(ProyectoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);

  plannings = this.planningService.plannings;
  proyectos = this.proyectoService.proyectos;
  protected readonly estimacionTotal = estimacionTotal;
  protected readonly PAGINA_SIZE = PAGINA_SIZE;

  showForm = false;
  editandoPlanning: Planning | null = null;
  showTareas = false;
  planningTareasActual: Planning | null = null;
  showDetalle = false;
  planningDetalleActual: Planning | null = null;

  private destroyRef = inject(DestroyRef);

  constructor() {
    this.route.queryParams.pipe(takeUntilDestroyed()).subscribe((params) => {
      const proyectoId = params['proyectoId'];
      if (proyectoId) {
        this.abrirNuevo(proyectoId);
        this.router.navigate([], {queryParams: {}, replaceUrl: true});
      }
    });
  }

  nombreProyecto(proyectoId: string): string {
    const proj = this.proyectos().find((p) => p.id === proyectoId);
    return proj ? proj.nombre : '—';
  }

  abrirNuevo(proyectoId?: string): void {
    this.editandoPlanning = null;
    this.showForm = true;
    if (proyectoId) {
      setTimeout(() => {
        const form = document.querySelector('app-planning-form');
        if (form) {
          const native = (form as any).planningForm;
          if (native) native.controls.proyectoId.setValue(proyectoId);
        }
      });
    }
  }

  abrirEditar(planning: Planning): void {
    this.editandoPlanning = planning;
    this.showForm = true;
  }

  onGuardar(data: {fecha: string; proyectoId: string; descripcion: string}): void {
    if (this.editandoPlanning) {
      this.planningService.actualizar(this.editandoPlanning.id, data);
    } else {
      this.planningService.crear({...data, tareas: []});
    }
    this.cerrarForm();
  }

  clonarPlanning(planning: Planning): void {
    this.planningService.clonar(planning.id);
  }

  confirmarEliminar(planning: Planning): void {
    this.confirmationService.confirm({
      header: 'Eliminar planning',
      message: '¿Eliminar este planning? Esta acción no se puede deshacer.',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.planningService.eliminar(planning.id);
      },
    });
  }

  abrirTareas(planning: Planning): void {
    this.planningTareasActual = planning;
    this.showTareas = true;
  }

  onActualizarTareas(event: {planningId: string; tareas: PlanningTask[]}): void {
    this.planningService.actualizar(event.planningId, {tareas: event.tareas});
    this._actualizarRefTareas();
  }

  private _actualizarRefTareas(): void {
    if (!this.planningTareasActual) return;
    const actualizado = this.planningService.planningPorId(this.planningTareasActual.id);
    if (actualizado) this.planningTareasActual = actualizado;
  }

  cerrarTareas(): void {
    this.showTareas = false;
    this.planningTareasActual = null;
  }

  abrirDetalle(planning: Planning): void {
    this.planningDetalleActual = planning;
    this.showDetalle = true;
  }

  cerrarDetalle(): void {
    this.showDetalle = false;
    this.planningDetalleActual = null;
  }

  cerrarForm(): void {
    this.showForm = false;
    this.editandoPlanning = null;
  }
}
