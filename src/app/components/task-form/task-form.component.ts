import {Component, inject, ChangeDetectionStrategy, computed} from '@angular/core';
import {ReactiveFormsModule, NonNullableFormBuilder, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {PlanningService} from '../../services/planning.service';
import {ProyectoService} from '../../services/proyecto.service';
import {NotificacionService} from '../../services/notificacion.service';
import {PlanningTask} from '../../models/planning.model';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-task-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="row justify-content-center">
      <div class="col-12 col-md-6 col-lg-5">
      <div class="mb-4">
        <button (click)="volver()" class="text-xs text-gray-500 hover:text-gray-700 inline-flex items-center">
          <svg class="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Volver
        </button>
      </div>

      <div class="rounded-xl border shadow-sm overflow-hidden" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
        <div class="px-4 py-3 border-b" style="border-color: var(--color-gray-200);">
          <h1 class="text-sm font-bold" style="color: var(--color-gray-900);">{{ editTaskId ? 'Editar tarea' : 'Nueva tarea' }}</h1>
        </div>

        <div class="p-4">
          <form [formGroup]="taskForm" (ngSubmit)="onSubmit()" class="space-y-3">
            @if (!editTaskId) {
              <div>
                <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Planning *</label>
                <select formControlName="planningId"
                        class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors"
                        style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);">
                  <option value="">Selecciona un planning</option>
                  @for (planning of planningService.plannings(); track planning.id) {
                    <option [value]="planning.id">{{ nombrePlanning(planning) }}</option>
                  }
                </select>
                @if (taskForm.controls.planningId.touched && taskForm.controls.planningId.errors?.['required']) {
                  <p class="mt-1 text-xs" style="color: var(--color-rose-500);">Selecciona un planning</p>
                }
              </div>
            }
            @if (editTaskId && editContext(); as ctx) {
              <div class="rounded-lg p-3" style="background-color: var(--color-gray-50);">
                <p class="text-sm" style="color: var(--color-gray-600);">
                  Planning: <span class="font-medium" style="color: var(--color-gray-900);">{{ ctx.planningDesc }}</span>
                  · {{ ctx.proyectoNombre }} · {{ ctx.fecha }}
                </p>
              </div>
            }

            <div>
              <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Nombre de la tarea *</label>
              <input type="text" formControlName="nombre"
                     class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors"
                     style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);"
                     placeholder="Ej: Implementar autenticación">
              @if (taskForm.controls.nombre.touched && taskForm.controls.nombre.errors?.['required']) {
                <p class="mt-1 text-xs" style="color: var(--color-rose-500);">El nombre es requerido</p>
              }
            </div>

            <div>
              <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Complejidad *</label>
              <select formControlName="complejidad"
                      class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors"
                      style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);">
                <option value="">Selecciona</option>
                <option value="Simple">Simple</option>
                <option value="Media">Media</option>
                <option value="Compleja">Compleja</option>
              </select>
              @if (taskForm.controls.complejidad.touched && taskForm.controls.complejidad.errors?.['required']) {
                <p class="mt-1 text-xs" style="color: var(--color-rose-500);">Selecciona la complejidad</p>
              }
            </div>

            <div class="flex items-center justify-end gap-3 pt-1.5 border-t" style="border-color: var(--color-gray-200);">
              <button type="button" (click)="volver()"
                      class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors text-[var(--color-gray-700)] bg-[var(--color-gray-100)] hover:bg-[var(--color-gray-200)]">
                Cancelar
              </button>
              <button type="submit" [disabled]="taskForm.invalid"
                      class="px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--color-indigo-600)] hover:bg-[var(--color-indigo-700)]">
                {{ editTaskId ? 'Guardar cambios' : 'Crear tarea' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </div>
  `,
  styles: [`
  `]
})
export class TaskFormComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly planningService = inject(PlanningService);
  protected readonly proyectoService = inject(ProyectoService);
  private readonly notificacionService = inject(NotificacionService);

  protected editTaskId = this.route.snapshot.paramMap.get('id') ?? null;

  protected readonly editContext = computed(() => {
    if (!this.editTaskId) return null;
    for (const planning of this.planningService.plannings()) {
      const task = planning.tareas.find(t => t.id === this.editTaskId);
      if (task) {
        const proyecto = this.proyectoService.proyectos().find(p => p.id === planning.proyectoId);
        return {
          task,
          planningId: planning.id,
          planningDesc: planning.descripcion || 'Sin descripción',
          proyectoNombre: proyecto?.nombre || '—',
          fecha: planning.fecha,
        };
      }
    }
    return null;
  });

  protected readonly taskForm = this.fb.group({
    planningId: ['', Validators.required],
    nombre: ['', Validators.required],
    complejidad: ['', Validators.required],
  });

  constructor() {
    const editCtx = this.editContext();
    if (editCtx) {
      this.taskForm.setValue({
        planningId: editCtx.planningId,
        nombre: editCtx.task.tarea,
        complejidad: editCtx.task.complejidad,
      });
    }
  }

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

    if (this.editTaskId && this.editContext()) {
      const ctx = this.editContext()!;
      this.planningService.actualizar(ctx.planningId, {
        tareas: this.planningService.planningPorId(ctx.planningId)!.tareas.map(t =>
          t.id === this.editTaskId ? {...t, tarea: values.nombre, complejidad: values.complejidad as PlanningTask['complejidad']} : t,
        ),
      });
      this.notificacionService.notificar({tipo: 'info', descripcion: `Tarea «${values.nombre}» actualizada`, url: '/'});
    } else {
      const nuevaTarea: PlanningTask = {
        id: crypto.randomUUID(),
        tarea: values.nombre,
        complejidad: values.complejidad as PlanningTask['complejidad'],
        completada: false,
      };
      this.planningService.agregarTarea(values.planningId, nuevaTarea);
      this.notificacionService.notificar({tipo: 'exito', descripcion: `Tarea «${values.nombre}» creada`, url: '/'});
    }

    this.router.navigate(['/']);
  }
}
