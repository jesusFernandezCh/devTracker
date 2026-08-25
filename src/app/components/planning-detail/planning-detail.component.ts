import {Component, input, output, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Planning} from '../../models/planning.model';
import {Proyecto} from '../../models/proyecto.model';
import {complejidadEstilo, estimacionTotal} from '../../utils/estimacion';

@Component({
  selector: 'app-planning-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background-color: rgba(0,0,0,0.4);" (click)="cerrar.emit()">
      <div class="modal-enter rounded-xl shadow-xl w-full max-w-md border overflow-hidden" style="background-color: var(--color-surface); border-color: var(--color-gray-200);" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between px-4 py-3 border-b" style="border-color: var(--color-gray-200);">
          <h2 class="text-sm font-bold" style="color: var(--color-gray-900);">
            {{ nombreProyecto() }}
          </h2>
          <button (click)="cerrar.emit()"
                  class="p-0.5 rounded transition-colors" style="color: var(--color-gray-400);">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="p-4 space-y-3">
          <div class="rounded-lg p-3 space-y-2" style="background-color: var(--color-gray-50);">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <span class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Fecha</span>
                <p class="mt-0.5 text-sm font-medium" style="color: var(--color-gray-900);">{{ planning().fecha }}</p>
              </div>
              <div>
                <span class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Proyecto</span>
                <p class="mt-0.5 text-sm font-medium" style="color: var(--color-gray-900);">{{ nombreProyecto() }}</p>
              </div>
            </div>
            @if (planning().descripcion) {
              <div>
                <span class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Descripción</span>
                <p class="mt-0.5 text-sm" style="color: var(--color-gray-700);">{{ planning().descripcion }}</p>
              </div>
            }
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-semibold" style="color: var(--color-gray-700);">
                Tareas ({{ planning().tareas.length }})
              </h3>
              @if (planning().tareas.length > 0) {
                <span class="text-xs font-medium px-2 py-0.5 rounded-full"
                      style="background: var(--estimation-bg); color: var(--estimation-text);">
                  {{ estimacionTotal(planning().tareas) }} día{{ estimacionTotal(planning().tareas) !== 1 ? 's' : '' }}
                </span>
              }
            </div>

            @if (planning().tareas.length > 0) {
              <div class="space-y-1 custom-scrollbar"
                   style="max-height: 116px; overflow-y: auto; padding-right: 4px;">
                @for (task of planning().tareas; track task.id) {
                  <div class="flex items-center justify-between px-2.5 py-2 rounded-lg"
                       style="background-color: var(--color-gray-50);">
                    <div class="flex items-center gap-1.5 min-w-0">
                      <span class="w-2 h-2 rounded-full shrink-0"
                            [style.background-color]="complejidadEstilo(task.complejidad).text"></span>
                      <span class="text-sm" style="color: var(--color-gray-900);">{{ task.tarea }}</span>
                    </div>
                    <span class="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                          [style.color]="complejidadEstilo(task.complejidad).text"
                          [style.background-color]="complejidadEstilo(task.complejidad).bg">
                      {{ task.complejidad }}
                    </span>
                  </div>
                }
              </div>
            } @else {
              <p class="text-sm text-center py-4 rounded-lg" style="color: var(--color-gray-400); background-color: var(--color-gray-50);">No hay tareas asociadas a este planning.</p>
            }
          </div>

          @if (planning().tareas.length > 0) {
            <div class="flex items-center justify-between px-3 py-2.5 rounded-lg"
                 style="background: var(--estimation-bg);">
              <span class="text-sm font-semibold" style="color: var(--estimation-text);">Estimación total:</span>
              <span class="text-sm font-bold" style="color: var(--estimation-text);">
                {{ estimacionTotal(planning().tareas) }} día{{ estimacionTotal(planning().tareas) !== 1 ? 's' : '' }}
              </span>
            </div>
          }

          <div class="flex justify-end pt-0.5">
            <button (click)="cerrar.emit()"
                    class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
                    style="color: var(--color-gray-700); background-color: var(--color-gray-100);">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class PlanningDetailComponent {
  readonly planning = input.required<Planning>();
  readonly proyectos = input.required<Proyecto[]>();
  readonly cerrar = output();

  protected readonly complejidadEstilo = complejidadEstilo;
  protected readonly estimacionTotal = estimacionTotal;

  protected nombreProyecto(): string {
    const proj = this.proyectos().find((p) => p.id === this.planning().proyectoId);
    return proj ? proj.nombre : '—';
  }
}
