import {Component, input, output} from '@angular/core';
import {Task, PRIORITY_COLORS, PRIORITY_LABELS, STATUS_LABELS, TaskStatus} from '../../models/task.model';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [],
  template: `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
         (click)="onViewDetail()">
      <div class="flex items-start justify-between mb-2">
        <span class="text-xs font-semibold px-2 py-0.5 rounded-full {{priorityColor()}}">
          {{ PRIORITY_LABELS[tarea().prioridad] }}
        </span>
        <button (click)="onDelete(); $event.stopPropagation()" class="text-gray-300 hover:text-red-500 transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>
      <h3 class="font-medium text-gray-900 text-sm mb-1">{{ tarea().titulo }}</h3>
      @if (tarea().descripcion) {
        <p class="text-gray-500 text-xs mb-3 line-clamp-2">{{ tarea().descripcion }}</p>
      }
      <div class="flex flex-wrap gap-1 mb-3">
        @for (etiqueta of tarea().etiquetas; track etiqueta) {
          <span class="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{{ etiqueta }}</span>
        }
      </div>
      <div class="flex items-center justify-between text-xs text-gray-400">
        <span>{{ tarea().asignadoA }}</span>
        <span>{{ tarea().fechaCreacion.toLocaleDateString() }}</span>
      </div>
      <div class="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
        <span class="text-xs text-gray-400">{{ tarea().comentarios.length }} comentarios</span>
        <span class="text-xs font-medium px-2 py-0.5 rounded-full {{statusBgClass()}}">
          {{ STATUS_LABELS[tarea().estado] }}
        </span>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class TaskCardComponent {
  tarea = input.required<Task>();
  viewDetail = output<string>();
  deleteTask = output<string>();

  protected readonly PRIORITY_LABELS = PRIORITY_LABELS;
  protected readonly STATUS_LABELS = STATUS_LABELS;

  protected priorityColor(): string {
    return PRIORITY_COLORS[this.tarea().prioridad];
  }

  protected statusBgClass(): string {
    switch (this.tarea().estado) {
      case 'desarrollo': return 'badge-desarrollo';
      case 'calidad': return 'badge-calidad';
      case 'produccion': return 'badge-produccion';
    }
  }

  onViewDetail(): void {
    this.viewDetail.emit(this.tarea().id);
  }

  onDelete(): void {
    this.deleteTask.emit(this.tarea().id);
  }
}
