import {Component, input, output, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Dialog} from 'primeng/dialog';
import {Tag} from 'primeng/tag';
import {Button} from 'primeng/button';
import {Planning} from '../../models/planning.model';
import {Proyecto} from '../../models/proyecto.model';
import {complejidadEstilo, estimacionTotal} from '../../utils/estimacion';

@Component({
  selector: 'app-planning-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, Dialog, Tag, Button],
  template: `
    <p-dialog [visible]="true" (onHide)="cerrar.emit()"
              [modal]="true" [draggable]="false" [resizable]="false"
              [closeOnEscape]="true" [dismissableMask]="true"
              [style]="{width: '30rem'}"
              [header]="nombreProyecto()">
      <div class="space-y-3">
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
              <p-tag [value]="estimacionTotal(planning().tareas) + ' día' + (estimacionTotal(planning().tareas) !== 1 ? 's' : '')"
                     [style]="{background: 'var(--estimation-bg)', color: 'var(--estimation-text)'}" />
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
                  <p-tag [value]="task.complejidad"
                         [style]="{color: complejidadEstilo(task.complejidad).text, backgroundColor: complejidadEstilo(task.complejidad).bg}" />
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
          <p-button label="Cerrar" [text]="true" severity="secondary" (onClick)="cerrar.emit()" />
        </div>
      </div>
    </p-dialog>
  `,
  styles: [`
  `]
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
