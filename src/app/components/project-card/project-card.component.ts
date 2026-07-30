import {Component, input, output, computed, ChangeDetectionStrategy} from '@angular/core';
import {Proyecto} from '../../models/proyecto.model';
import {PlanningTask} from '../../models/planning.model';
import {Planning} from '../../models/planning.model';
import {complejidadEstilo, estimacionTotal, statusColor} from '../../utils/estimacion';

@Component({
  selector: 'app-project-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div class="p-2">
        <div class="flex items-start justify-between mb-2">
          <div class="flex items-center gap-2 min-w-0">
            <h3 class="font-semibold text-gray-900 text-sm truncate cursor-pointer hover:text-indigo-600 transition-colors"
                (click)="viewDetail.emit(proyecto().id)">
              {{ proyecto().nombre }}
            </h3>
            @if (proyecto().status) {
              <span class="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full"
                    [style.color]="statusColor(proyecto().status).text"
                    [style.background-color]="statusColor(proyecto().status).bg">
                {{ proyecto().status }}
              </span>
            }
          </div>
          <button (click)="onDelete(); $event.stopPropagation()"
                  class="shrink-0 text-gray-300 hover:text-red-500 transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mb-3">
          @if (proyecto().cliente) {
            <span class="inline-flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              {{ proyecto().cliente }}
            </span>
          }
          @if (proyecto().fechaDesde) {
            <span class="inline-flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              {{ proyecto().fechaDesde }}
              @if (proyecto().fechaHasta) {
                <span>— {{ proyecto().fechaHasta }}</span>
              }
            </span>
          }
        </div>

        <button (click)="expandido = !expandido"
                class="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors mb-1">
          <span>Detalles</span>
          <svg class="w-3.5 h-3.5 transition-transform duration-200"
               [class.rotate-180]="expandido"
               fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>

        @if (expandido) {
          <div class="space-y-3">
            @if (proyecto().descripcion) {
              <p class="text-xs text-gray-400 line-clamp-2">{{ proyecto().descripcion }}</p>
            }

            @if (proyecto().documentacion) {
              <a [href]="proyecto().documentacion" target="_blank" rel="noopener"
                 class="inline-flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-700 transition-colors">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                </svg>
                Documentación
              </a>
            }

            <div class="space-y-1">
              <button (click)="mostrarPlanificaciones = !mostrarPlanificaciones"
                      class="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                <span class="flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6"/>
                  </svg>
                  Planning ({{ plannings().length }})
                </span>
                <svg class="w-3.5 h-3.5 transition-transform duration-200"
                     [class.rotate-180]="mostrarPlanificaciones"
                     fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              @if (mostrarPlanificaciones) {
                <div class="pl-3 space-y-2">
                  @for (planning of plannings(); track planning.id) {
                    <div class="flex items-center justify-between text-xs text-gray-600 border-l-2 border-indigo-200 pl-2 py-1">
                      <div class="min-w-0">
                        <span class="font-medium text-gray-700">{{ planning.fecha }}</span>
                        @if (planning.descripcion) {
                          <p class="text-gray-400 truncate">{{ planning.descripcion }}</p>
                        }
                      </div>
                      <span class="shrink-0 ml-2 font-semibold text-indigo-600">Estimación: {{ estimacionTotal(planning.tareas) }} días</span>
                    </div>
                  } @empty {
                    <p class="text-xs text-gray-400 pl-2">Sin planificaciones</p>
                  }
                </div>
              }

              <button (click)="mostrarTareas = !mostrarTareas"
                      class="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                <span class="flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6m-6 4h6m-6 4h6m-6 4h6"/>
                  </svg>
                  Tareas ({{ tareas().length }})
                </span>
                <svg class="w-3.5 h-3.5 transition-transform duration-200"
                     [class.rotate-180]="mostrarTareas"
                     fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              @if (mostrarTareas) {
                <div class="pl-3 space-y-1">
                  @for (tarea of tareas(); track tarea.id) {
                    <div class="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-gray-50 transition-colors">
                      <label class="flex items-center gap-2 min-w-0 cursor-pointer flex-1">
                        <input type="checkbox"
                               [checked]="tarea.completada"
                               (change)="toggleCompletada.emit(tarea.id); $event.stopPropagation()"
                               class="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0">
                        <span class="text-gray-700 truncate"
                              [class.line-through]="tarea.completada"
                              [class.text-gray-400]="tarea.completada">{{ tarea.tarea }}</span>
                      </label>
                      <div class="flex items-center gap-2 shrink-0">
                        <span class="text-xs font-medium px-1.5 py-0.5 rounded"
                              [style.background-color]="complejidadEstilo(tarea.complejidad).bg"
                              [style.color]="complejidadEstilo(tarea.complejidad).text">
                          {{ tarea.complejidad }}
                        </span>
                      </div>
                    </div>
                  } @empty {
                    <p class="text-xs text-gray-400 pl-2">Sin tareas</p>
                  }
                </div>
                <div class="mt-2 flex items-center gap-2 px-2">
                  <div class="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-300"
                         [style.width.%]="porcentajeAvance()"
                         [class.bg-green-500]="porcentajeAvance() === 100"
                         [class.bg-indigo-500]="porcentajeAvance() > 0 && porcentajeAvance() < 100">
                    </div>
                  </div>
                  <span class="text-xs font-medium shrink-0"
                        [class.text-green-600]="porcentajeAvance() === 100"
                        [class.text-gray-500]="porcentajeAvance() < 100">
                    {{ porcentajeAvance() }}%
                  </span>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class ProjectCardComponent {
  proyecto = input.required<Proyecto>();
  plannings = input<Planning[]>([]);
  tareas = input<PlanningTask[]>([]);
  viewDetail = output<string>();
  deleteProject = output<string>();
  toggleCompletada = output<string>();

  protected expandido = false;
  protected mostrarPlanificaciones = false;
  protected mostrarTareas = false;
  protected readonly complejidadEstilo = complejidadEstilo;
  protected readonly estimacionTotal = estimacionTotal;
  protected readonly statusColor = statusColor;

  protected readonly porcentajeAvance = computed(() => {
    const lista = this.tareas();
    if (lista.length === 0) return 0;
    const completadas = lista.filter((t) => t.completada).length;
    return Math.round((completadas / lista.length) * 100);
  });

  onDelete(): void {
    this.deleteProject.emit(this.proyecto().id);
  }
}
