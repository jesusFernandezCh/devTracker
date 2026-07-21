import {Component, inject, OnInit} from '@angular/core';
import {ReactiveFormsModule, NonNullableFormBuilder, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {Task, TaskPriority} from '../../models/task.model';
import {TaskService} from '../../services/task.service';
import {ColumnService} from '../../services/column.service';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [ReactiveFormsModule],
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

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 class="text-2xl font-bold text-gray-900 mb-6">{{ editando ? 'Editar Tarea' : 'Nueva Tarea' }}</h1>

        <form [formGroup]="taskForm" (ngSubmit)="onSubmit()" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input type="text" formControlName="titulo"
                   class="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                   placeholder="Título de la tarea">
            @if (taskForm.controls.titulo.touched && taskForm.controls.titulo.errors?.['required']) {
              <p class="text-red-500 text-xs mt-1">El título es requerido</p>
            }
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea formControlName="descripcion" rows="4"
                      class="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      placeholder="Describe la tarea..."></textarea>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
              <select formControlName="estado"
                      class="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm">
                @for (col of columnService.columnas(); track col.id) {
                  <option [value]="col.id">{{ col.nombre }}</option>
                }
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Prioridad *</label>
              <select formControlName="prioridad"
                      class="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm">
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Asignado a</label>
              <input type="text" formControlName="asignadoA"
                     class="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                     placeholder="Nombre del responsable">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Proyecto</label>
              <input type="text" formControlName="proyecto"
                     class="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                     placeholder="Nombre del proyecto">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de vencimiento</label>
              <input type="date" formControlName="fechaVencimiento"
                     class="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Etiquetas</label>
              <input type="text" formControlName="etiquetasInput"
                     (keydown.enter)="agregarEtiqueta(); $event.preventDefault()"
                     class="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                     placeholder="Escribe y presiona Enter">
              <div class="flex flex-wrap gap-1 mt-2">
                @for (tag of etiquetas; track tag) {
                  <span class="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                    {{ tag }}
                    <button type="button" (click)="removerEtiqueta(tag)" class="hover:text-purple-900">&times;</button>
                  </span>
                }
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button type="button" (click)="volver()"
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Cancelar
            </button>
            <button type="submit" [disabled]="taskForm.invalid"
                    class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {{ editando ? 'Guardar Cambios' : 'Crear Tarea' }}
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
export class TaskFormComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly taskService = inject(TaskService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly columnService = inject(ColumnService);

  private editandoId: string | null = null;
  protected editando = false;
  protected etiquetas: string[] = [];

  protected readonly taskForm = this.fb.group({
    titulo: ['', Validators.required],
    descripcion: [''],
    estado: ['', Validators.required],
    prioridad: ['media' as TaskPriority, Validators.required],
    asignadoA: [''],
    proyecto: [''],
    fechaVencimiento: [''],
    etiquetasInput: [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const tarea = this.taskService.obtenerTareaPorId(id);
      if (tarea) {
        this.editandoId = id;
        this.editando = true;
        this.etiquetas = [...tarea.etiquetas];
        this.taskForm.patchValue({
          titulo: tarea.titulo,
          descripcion: tarea.descripcion,
          estado: tarea.estado,
          prioridad: tarea.prioridad,
          asignadoA: tarea.asignadoA,
          proyecto: tarea.proyecto,
          fechaVencimiento: tarea.fechaVencimiento
            ? this._formatDate(tarea.fechaVencimiento)
            : '',
        });
      }
    }

    const cols = this.columnService.columnas();
    if (cols.length > 0 && !this.taskForm.controls.estado.value) {
      const columnaId = this.route.snapshot.queryParamMap.get('columna');
      if (columnaId && cols.some(c => c.id === columnaId)) {
        this.taskForm.patchValue({estado: columnaId});
      } else {
        this.taskForm.patchValue({estado: cols[0].id});
      }
    }
  }

  private _formatDate(date: Date): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  private _generarId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  protected agregarEtiqueta(): void {
    const input = this.taskForm.controls.etiquetasInput;
    const valor = input.value.trim();
    if (valor && !this.etiquetas.includes(valor)) {
      this.etiquetas = [...this.etiquetas, valor];
    }
    input.setValue('');
  }

  protected removerEtiqueta(tag: string): void {
    this.etiquetas = this.etiquetas.filter((t) => t !== tag);
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
    const fechaVen = values.fechaVencimiento ? new Date(values.fechaVencimiento) : null;

    if (this.editandoId) {
      this.taskService.actualizarTarea(this.editandoId, {
        titulo: values.titulo,
        descripcion: values.descripcion,
        estado: values.estado,
        prioridad: values.prioridad,
        asignadoA: values.asignadoA,
        proyecto: values.proyecto,
        fechaVencimiento: fechaVen,
        etiquetas: this.etiquetas,
      });
    } else {
      const nuevaTarea: Task = {
        id: this._generarId(),
        titulo: values.titulo,
        descripcion: values.descripcion,
        estado: values.estado,
        prioridad: values.prioridad,
        asignadoA: values.asignadoA,
        proyecto: values.proyecto,
        fechaCreacion: new Date(),
        fechaVencimiento: fechaVen,
        etiquetas: this.etiquetas,
        comentarios: [],
      };
      this.taskService.agregarTarea(nuevaTarea);
    }

    this.router.navigate(['/']);
  }
}
