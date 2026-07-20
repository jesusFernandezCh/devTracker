import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {TaskService} from '../../services/task.service';
import {ColumnService} from '../../services/column.service';
import {PRIORITY_LABELS, PRIORITY_COLORS} from '../../models/task.model';
import {hexToRgba} from '../../models/columna.model';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="max-w-3xl mx-auto">
      <div class="mb-6">
        <button (click)="volver()" class="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center">
          <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Volver al tablero
        </button>
      </div>

      @if (tarea) {
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-start justify-between mb-4">
            <h1 class="text-2xl font-bold text-gray-900">{{ tarea.titulo }}</h1>
            <div class="flex items-center space-x-2">
              <a [routerLink]="['/tarea', tarea.id, 'editar']"
                 class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                Editar
              </a>
              <button (click)="eliminarTarea()"
                      class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                Eliminar
              </button>
            </div>
          </div>

          <div class="flex flex-wrap gap-2 mb-6">
            <span class="text-xs font-semibold px-2 py-1 rounded-full {{priorityColor}}">
              {{ PRIORITY_LABELS[tarea.prioridad] }}
            </span>
            <span class="text-xs font-semibold px-2 py-1 rounded-full"
                  [style.background-color]="statusBg"
                  [style.color]="statusColor">
              {{ statusNombre }}
            </span>
            @for (tag of tarea.etiquetas; track tag) {
              <span class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">{{ tag }}</span>
            }
          </div>

          <div class="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p class="text-xs text-gray-500">Asignado a</p>
              <p class="text-sm font-medium text-gray-900">{{ tarea.asignadoA || 'Sin asignar' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500">Proyecto</p>
              <p class="text-sm font-medium text-gray-900">{{ tarea.proyecto || 'Sin proyecto' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500">Fecha de creación</p>
              <p class="text-sm font-medium text-gray-900">{{ tarea.fechaCreacion.toLocaleDateString() }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500">Fecha de vencimiento</p>
              <p class="text-sm font-medium text-gray-900">{{ tarea.fechaVencimiento ? tarea.fechaVencimiento.toLocaleDateString() : 'Sin fecha' }}</p>
            </div>
          </div>

          @if (tarea.descripcion) {
            <div class="mb-6">
              <h3 class="text-sm font-medium text-gray-700 mb-2">Descripción</h3>
              <p class="text-sm text-gray-600 whitespace-pre-wrap">{{ tarea.descripcion }}</p>
            </div>
          }

          <div class="border-t border-gray-200 pt-6">
            <h3 class="text-sm font-medium text-gray-700 mb-4">Comentarios ({{ tarea.comentarios.length }})</h3>
            @if (tarea.comentarios.length === 0) {
              <p class="text-sm text-gray-400">Sin comentarios aún.</p>
            } @else {
              <div class="space-y-4">
                @for (comentario of tarea.comentarios; track comentario.id) {
                  <div class="bg-gray-50 rounded-lg p-3">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-sm font-medium text-gray-900">{{ comentario.autor }}</span>
                      <span class="text-xs text-gray-400">{{ comentario.fecha.toLocaleString() }}</span>
                    </div>
                    <p class="text-sm text-gray-600">{{ comentario.texto }}</p>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="text-center py-12">
          <p class="text-gray-500">Tarea no encontrada</p>
          <a routerLink="/" class="text-indigo-600 hover:text-indigo-700 text-sm mt-2 inline-block">Volver al tablero</a>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class TaskDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly taskService = inject(TaskService);
  private readonly columnService = inject(ColumnService);

  protected tarea!: import('../../models/task.model').Task;
  protected readonly PRIORITY_LABELS = PRIORITY_LABELS;

  protected statusNombre = '';
  protected statusColor = '';
  protected statusBg = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const found = this.taskService.obtenerTareaPorId(id);
      if (found) {
        this.tarea = found;
        const col = this.columnService.columnas().find((c) => c.id === found.estado);
        this.statusNombre = col?.nombre ?? '';
        this.statusColor = col?.color ?? '#6B7280';
        this.statusBg = hexToRgba(this.statusColor, 0.15);
      }
    }
  }

  protected get priorityColor(): string {
    return PRIORITY_COLORS[this.tarea.prioridad];
  }

  protected volver(): void {
    this.router.navigate(['/']);
  }

  protected eliminarTarea(): void {
    if (confirm('¿Estás seguro de eliminar esta tarea?')) {
      this.taskService.eliminarTarea(this.tarea.id);
      this.router.navigate(['/']);
    }
  }
}
