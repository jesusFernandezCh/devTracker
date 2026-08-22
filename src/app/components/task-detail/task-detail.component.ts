import {Component, inject, ChangeDetectionStrategy, computed} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {PlanningService} from '../../services/planning.service';
import {ProyectoService} from '../../services/proyecto.service';
import {complejidadEstilo} from '../../utils/estimacion';
import {PermisoDirective} from '../../directives/permiso.directive';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PermisoDirective],
  template: `
    <div class="row justify-content-center">
      <div class="col-12 col-md-8 col-lg-6">
      <div class="mb-6">
        <button (click)="volver()" class="text-sm inline-flex items-center transition-colors"
                style="color: var(--color-gray-500);" (mouseenter)="hoverVolver = true" (mouseleave)="hoverVolver = false"
                [style.color]="hoverVolver ? 'var(--color-gray-700)' : 'var(--color-gray-500)'">
          <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Volver
        </button>
      </div>

      @if (taskData(); as data) {
        <div class="rounded-xl border shadow-sm overflow-hidden" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
          <div class="px-6 py-5 border-b" style="border-color: var(--color-gray-100);">
            <h1>{{ data.task.tarea }}</h1>
            <p class="mt-2 text-sm" style="color: var(--color-gray-500);">
              {{ data.planning.fecha }} · {{ data.proyectoNombre }}
            </p>
          </div>
          <div class="p-6 space-y-5">
            <div class="flex items-center gap-4">
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                    [style.color]="complejidadEstilo(data.task.complejidad).text"
                    [style.background-color]="complejidadEstilo(data.task.complejidad).bg">
                {{ data.task.complejidad }}
              </span>
              @if (data.task.completada) {
                <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
                      style="background-color: #d1fae5; color: #059669;">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                  Completada
                </span>
              } @else {
                <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
                      style="background-color: #fef3c7; color: #b45309;">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Pendiente
                </span>
              }
            </div>

            <div class="rounded-lg p-4 space-y-3" style="background-color: var(--color-gray-50);">
              <div>
                <span class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Planning</span>
                <p class="mt-1 text-sm font-medium" style="color: var(--color-gray-900);">{{ data.planning.descripcion || 'Sin descripción' }}</p>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <span class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Proyecto</span>
                  <p class="mt-1 text-sm" style="color: var(--color-gray-700);">{{ data.proyectoNombre }}</p>
                </div>
                <div>
                  <span class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Fecha</span>
                  <p class="mt-1 text-sm" style="color: var(--color-gray-700);">{{ data.planning.fecha }}</p>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-3 pt-2">
              <button *appPermiso="'editar'; recurso: 'tareas'" (click)="editarTarea(data.task.id)"
                      class="px-4 py-2.5 text-sm font-medium rounded-lg transition-colors text-[var(--color-gray-700)] bg-[var(--color-gray-100)] hover:bg-[var(--color-gray-200)]">
                Editar tarea
              </button>
              <button (click)="volver()"
                      class="px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-700)]">
                Volver al tablero
              </button>
            </div>
          </div>
        </div>
      } @else {
        <div class="text-center py-20">
          <h3 class="text-lg font-medium mb-2" style="color: var(--color-gray-500);">Tarea no encontrada</h3>
          <p class="text-sm mb-6" style="color: var(--color-gray-400);">La tarea que buscas no existe o ha sido eliminada.</p>
          <button (click)="volver()"
                  class="px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-700)]">
            Volver al tablero
          </button>
        </div>
      }
    </div>
    </div>
  `,
  styles: [`
  `]
})
export class TaskDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private planningService = inject(PlanningService);
  private proyectoService = inject(ProyectoService);

  protected readonly complejidadEstilo = complejidadEstilo;
  hoverVolver = false;

  private readonly taskId = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly taskData = computed(() => {
    for (const planning of this.planningService.plannings()) {
      const task = planning.tareas.find(t => t.id === this.taskId);
      if (task) {
        const proyecto = this.proyectoService.proyectos().find(p => p.id === planning.proyectoId);
        return {task, planning, proyectoNombre: proyecto?.nombre ?? '—'};
      }
    }
    return null;
  });

  protected volver(): void {
    this.router.navigate(['/']);
  }

  protected editarTarea(taskId: string): void {
    this.router.navigate(['/tarea', taskId, 'editar']);
  }
}
