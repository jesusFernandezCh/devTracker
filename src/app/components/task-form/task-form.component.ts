import {Component, inject} from '@angular/core';
import {ReactiveFormsModule, NonNullableFormBuilder, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {PlanningService} from '../../services/planning.service';
import {ProyectoService} from '../../services/proyecto.service';
import {PlanningTask} from '../../models/planning.model';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="max-w-2xl mx-auto">
      <div class="mb-6">
        <button (click)="volver()" class="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center">
          <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Volver al tablero
        </button>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 class="text-2xl font-bold text-gray-900 mb-6">Nueva tarea</h1>

        <form [formGroup]="taskForm" (ngSubmit)="onSubmit()" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Planning *</label>
            <select formControlName="planningId"
                    class="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm">
              <option value="">Selecciona un planning</option>
              @for (planning of planningService.plannings(); track planning.id) {
                <option [value]="planning.id">{{ nombrePlanning(planning) }}</option>
              }
            </select>
            @if (taskForm.controls.planningId.touched && taskForm.controls.planningId.errors?.['required']) {
              <p class="text-red-500 text-xs mt-1">Selecciona un planning</p>
            }
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre de la tarea *</label>
            <input type="text" formControlName="nombre"
                   class="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                   placeholder="Ej: Implementar autenticación">
            @if (taskForm.controls.nombre.touched && taskForm.controls.nombre.errors?.['required']) {
              <p class="text-red-500 text-xs mt-1">El nombre es requerido</p>
            }
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Complejidad *</label>
            <select formControlName="complejidad"
                    class="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm">
              <option value="">Selecciona</option>
              <option value="Simple">Simple</option>
              <option value="Media">Media</option>
              <option value="Compleja">Compleja</option>
            </select>
            @if (taskForm.controls.complejidad.touched && taskForm.controls.complejidad.errors?.['required']) {
              <p class="text-red-500 text-xs mt-1">Selecciona la complejidad</p>
            }
          </div>

          <div class="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button type="button" (click)="volver()"
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Cancelar
            </button>
            <button type="submit" [disabled]="taskForm.invalid"
                    class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              Crear tarea
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class TaskFormComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  protected readonly planningService = inject(PlanningService);
  protected readonly proyectoService = inject(ProyectoService);

  protected readonly taskForm = this.fb.group({
    planningId: ['', Validators.required],
    nombre: ['', Validators.required],
    complejidad: ['', Validators.required],
  });

  protected nombrePlanning(planning: import('../../models/planning.model').Planning): string {
    const proj = this.proyectoService.proyectos().find(p => p.id === planning.proyectoId);
    const nombreProyecto = proj?.nombre ?? planning.proyectoId;
    return `${nombreProyecto} — ${planning.fecha}${planning.descripcion ? ' (' + planning.descripcion + ')' : ''}`;
  }

  protected volver(): void {
    this.router.navigate(['/']);
  }

  protected onSubmit(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const values = this.taskForm.getRawValue();

    const nuevaTarea: PlanningTask = {
      id: crypto.randomUUID(),
      tarea: values.nombre,
      complejidad: values.complejidad as PlanningTask['complejidad'],
      completada: false,
    };

    this.planningService.agregarTarea(values.planningId, nuevaTarea);
    this.router.navigate(['/']);
  }
}
