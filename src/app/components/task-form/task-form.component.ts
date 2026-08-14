import {Component, inject, ChangeDetectionStrategy, computed} from '@angular/core';
import {ReactiveFormsModule, NonNullableFormBuilder, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {InputText} from 'primeng/inputtext';
import {Select} from 'primeng/select';
import {Button} from 'primeng/button';
import {PlanningService} from '../../services/planning.service';
import {ProyectoService} from '../../services/proyecto.service';
import {NotificacionService} from '../../services/notificacion.service';
import {PlanningTask} from '../../models/planning.model';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-task-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CommonModule, InputText, Select, Button],
  template: `
    <div class="flex justify-center px-4 pb-8">
      <div class="w-full max-w-lg">
      <div class="mb-4">
        <p-button [text]="true" severity="secondary" icon="pi pi-arrow-left" label="Volver" (onClick)="volver()" />
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
                <p-select formControlName="planningId"
                          [options]="planningOptions()"
                          optionLabel="label"
                          optionValue="value"
                          placeholder="Selecciona un planning"
                          [showClear]="true"
                          [style]="{width: '100%'}" />
                @if (taskForm.controls.planningId.touched && taskForm.controls.planningId.errors?.['required']) {
                  <small class="mt-1 flex items-center gap-1 text-xs" style="color: var(--color-rose-500);">
                    <i class="pi pi-exclamation-circle"></i> Selecciona un planning
                  </small>
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
              <input pInputText type="text" formControlName="nombre" class="w-full"
                     placeholder="Ej: Implementar autenticación" autofocus>
              @if (taskForm.controls.nombre.touched && taskForm.controls.nombre.errors?.['required']) {
                <small class="mt-1 flex items-center gap-1 text-xs" style="color: var(--color-rose-500);">
                  <i class="pi pi-exclamation-circle"></i> El nombre es requerido
                </small>
              }
            </div>

            <div>
              <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Complejidad *</label>
              <p-select formControlName="complejidad"
                        [options]="complejidadOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Selecciona"
                        [style]="{width: '100%'}" />
              @if (taskForm.controls.complejidad.touched && taskForm.controls.complejidad.errors?.['required']) {
                <p class="mt-1 text-xs" style="color: var(--color-rose-500);">Selecciona la complejidad</p>
              }
            </div>

            <div class="flex items-center justify-end gap-3 pt-1.5 border-t" style="border-color: var(--color-gray-200);">
              <p-button label="Cancelar" [text]="true" severity="secondary" (onClick)="volver()" />
              <p-button type="submit" [label]="editTaskId ? 'Guardar cambios' : 'Crear tarea'"
                        [disabled]="taskForm.invalid" />
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

  protected readonly planningOptions = computed(() =>
    this.planningService.plannings().map(p => ({label: this.nombrePlanning(p), value: p.id})),
  );

  protected readonly complejidadOptions = [
    {label: 'Simple', value: 'Simple'},
    {label: 'Media', value: 'Media'},
    {label: 'Compleja', value: 'Compleja'},
  ];

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
