import {Component, inject} from '@angular/core';
import {Router} from '@angular/router';
import {TaskService} from '../../services/task.service';
import {TaskStatus} from '../../models/task.model';
import {ColumnComponent} from '../column/column.component';
import {CdkDropListGroup} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [ColumnComponent, CdkDropListGroup],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Tablero Kanban</h1>
          <p class="text-sm text-gray-500 mt-1">Arrastra las tareas entre columnas para cambiar su estado</p>
        </div>
        <button (click)="nuevaTarea()"
                class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
          <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nueva Tarea
        </button>
      </div>

      <div cdkDropListGroup class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-gray-50 rounded-xl p-4 border border-gray-200 min-h-[calc(100vh-220px)]">
          <app-column [status]="'desarrollo'"
                      [tasks]="taskService.tareasDesarrollo()"
                      (moveTask)="onMoverTarea($event)"
                      (viewDetail)="onViewDetail($event)"
                      (deleteTask)="onEliminarTarea($event)"/>
        </div>

        <div class="bg-gray-50 rounded-xl p-4 border border-gray-200 min-h-[calc(100vh-220px)]">
          <app-column [status]="'calidad'"
                      [tasks]="taskService.tareasCalidad()"
                      (moveTask)="onMoverTarea($event)"
                      (viewDetail)="onViewDetail($event)"
                      (deleteTask)="onEliminarTarea($event)"/>
        </div>

        <div class="bg-gray-50 rounded-xl p-4 border border-gray-200 min-h-[calc(100vh-220px)]">
          <app-column [status]="'produccion'"
                      [tasks]="taskService.tareasProduccion()"
                      (moveTask)="onMoverTarea($event)"
                      (viewDetail)="onViewDetail($event)"
                      (deleteTask)="onEliminarTarea($event)"/>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class BoardComponent {
  protected readonly taskService = inject(TaskService);
  private readonly router = inject(Router);

  onMoverTarea(event: { taskId: string; newStatus: TaskStatus }): void {
    this.taskService.moverTarea(event.taskId, event.newStatus);
  }

  onViewDetail(id: string): void {
    this.router.navigate(['/tarea', id]);
  }

  onEliminarTarea(id: string): void {
    if (confirm('¿Estás seguro de eliminar esta tarea?')) {
      this.taskService.eliminarTarea(id);
    }
  }

  nuevaTarea(): void {
    this.router.navigate(['/tarea/nueva']);
  }
}
