import {Component, inject, ChangeDetectionStrategy, DestroyRef} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {PlanningService} from '../../services/planning.service';
import {ProyectoService} from '../../services/proyecto.service';
import {Planning, PlanningTask} from '../../models/planning.model';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {estimacionTotal} from '../../utils/estimacion';
import {PlanningFormComponent} from '../planning-form/planning-form.component';
import {PlanningTasksComponent} from '../planning-tasks/planning-tasks.component';
import {PlanningDetailComponent} from '../planning-detail/planning-detail.component';

@Component({
  selector: 'app-planning',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PlanningFormComponent, PlanningTasksComponent, PlanningDetailComponent],
  template: `
    <div class="max-w-6xl mx-auto">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-bold" style="color: var(--color-gray-900)">
            Planning
          </h1>
          <p class="mt-1 text-sm" style="color: var(--color-gray-500)">
            {{ plannings().length }} plan{{ plannings().length !== 1 ? 'es' : '' }}
          </p>
        </div>
        <button (click)="abrirNuevo()"
                class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors shadow-sm bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-700)]">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          <span class="hidden sm:inline">Planning</span>
        </button>
      </div>

      @if (plannings().length === 0) {
        <div class="text-center py-20">
          <svg class="w-16 h-16 mx-auto mb-4" style="color: var(--color-gray-300)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"/>
          </svg>
          <h3 class="text-lg font-medium mb-2" style="color: var(--color-gray-500)">No hay plannings</h3>
          <p class="text-sm mb-6" style="color: var(--color-gray-400)">Crea tu primer planning para empezar.</p>
          <button (click)="abrirNuevo()"
                  class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-700)]">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Crear planning
          </button>
        </div>
      } @else {
        <div class="rounded-xl border shadow-sm overflow-hidden" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr style="border-bottom: 1px solid var(--color-gray-100);">
                  <th class="text-left px-4 sm:px-6 py-4 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style="color: var(--color-gray-400);">Descripción</th>
                  <th class="text-left px-4 sm:px-6 py-4 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Fecha</th>
                  <th class="text-left px-4 sm:px-6 py-4 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style="color: var(--color-gray-400);">Proyecto</th>
                  <th class="text-center px-4 sm:px-6 py-4 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Tareas</th>
                  <th class="text-center px-4 sm:px-6 py-4 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Estimación</th>
                  <th class="text-right px-4 sm:px-6 py-4 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Acciones</th>
                </tr>
              </thead>
              <tbody style="border-top: 1px solid var(--color-gray-100);">
                @for (planning of plannings(); track planning.id) {
                  <tr class="planning-row" style="transition: background-color 0.15s;">
                    <td class="px-4 sm:px-6 py-4 hidden sm:table-cell border-l-2 transition-all duration-200 cursor-pointer" style="border-color: rgba(13, 148, 136, 0.5);" (click)="abrirDetalle(planning)">
                      <span class="text-sm truncate-desc transition-colors text-[var(--color-gray-700)] hover:text-[var(--color-teal-600)]">
                        {{ planning.descripcion || '—' }}
                      </span>
                    </td>
                    <td class="px-4 sm:px-6 py-4">
                      <span class="text-sm whitespace-nowrap" style="color: var(--color-gray-900);">{{ planning.fecha }}</span>
                    </td>
                    <td class="px-4 sm:px-6 py-4 hidden sm:table-cell">
                      <span class="text-sm" style="color: var(--color-gray-500);">{{ nombreProyecto(planning.proyectoId) }}</span>
                    </td>
                    <td class="px-4 sm:px-6 py-4 text-center">
                      <span class="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium"
                            style="background-color: #e0f2fe; color: #0369a1;">
                        {{ planning.tareas.length }}
                      </span>
                    </td>
                    <td class="px-4 sm:px-6 py-4 text-center">
                      <span class="text-sm font-semibold" style="color: var(--color-indigo-600);">
                        {{ estimacionTotal(planning.tareas) }} día{{ estimacionTotal(planning.tareas) !== 1 ? 's' : '' }}
                      </span>
                    </td>
                    <td class="px-4 sm:px-6 py-4 text-right">
                      <div class="flex items-center justify-end gap-1">
                        <button (click)="abrirEditar(planning)"
                                class="p-2 rounded-lg transition-colors text-[var(--color-gray-400)] hover:text-[var(--color-teal-600)] hover:bg-[var(--color-gray-100)]"
                                [attr.aria-label]="'Editar planning'">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/>
                          </svg>
                        </button>
                        <button (click)="abrirTareas(planning)"
                                class="p-2 rounded-lg transition-colors text-[var(--color-gray-400)] hover:text-[var(--color-indigo-600)] hover:bg-[var(--color-gray-100)]"
                                [attr.aria-label]="'Tareas del planning'">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6"/>
                          </svg>
                        </button>
                        <button (click)="confirmarEliminar(planning.id)"
                                class="p-2 rounded-lg transition-colors text-[var(--color-gray-400)] hover:text-[var(--color-rose-600)] hover:bg-[var(--color-gray-100)]"
                                [attr.aria-label]="'Eliminar planning'">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      @if (deleteConfirmId) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background-color: rgba(0,0,0,0.4);">
          <div class="modal-enter rounded-xl shadow-xl p-6 w-full max-w-sm border" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
            <h3 class="text-lg font-semibold mb-2" style="color: var(--color-gray-900);">Eliminar planning</h3>
            <p class="text-sm mb-6" style="color: var(--color-gray-500);">
              ¿Eliminar este planning? Esta acción no se puede deshacer.
            </p>
            <div class="flex justify-end gap-3">
              <button (click)="cancelarEliminar()"
                      class="px-4 py-2 text-sm font-medium rounded-lg transition-colors text-[var(--color-gray-700)] bg-[var(--color-gray-100)] hover:bg-[var(--color-gray-200)]">
                Cancelar
              </button>
              <button (click)="ejecutarEliminar()"
                      class="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors bg-[var(--color-rose-600)] hover:bg-[var(--color-rose-700)]">
                Eliminar
              </button>
            </div>
          </div>
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
    </div>
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

  plannings = this.planningService.plannings;
  proyectos = this.proyectoService.proyectos;
  protected readonly estimacionTotal = estimacionTotal;

  showForm = false;
  editandoPlanning: Planning | null = null;
  deleteConfirmId: string | null = null;
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

  confirmarEliminar(id: string): void {
    this.deleteConfirmId = id;
  }

  ejecutarEliminar(): void {
    if (this.deleteConfirmId) {
      this.planningService.eliminar(this.deleteConfirmId);
    }
    this.deleteConfirmId = null;
  }

  cancelarEliminar(): void {
    this.deleteConfirmId = null;
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
