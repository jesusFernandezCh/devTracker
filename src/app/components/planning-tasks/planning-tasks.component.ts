import {Component, input, output, inject, signal, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, Validators} from '@angular/forms';
import {DragDropModule, CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {Planning, PlanningTask} from '../../models/planning.model';
import {Proyecto} from '../../models/proyecto.model';
import {complejidadEstilo, estimacionTotal} from '../../utils/estimacion';

@Component({
  selector: 'app-planning-tasks',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, DragDropModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background-color: rgba(0,0,0,0.4);" (click)="cerrar.emit()">
      <div class="modal-enter rounded-xl shadow-xl w-full max-w-lg border overflow-hidden" style="background-color: var(--color-surface); border-color: var(--color-gray-200);" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between px-6 py-5 border-b" style="border-color: var(--color-gray-100);">
          <h2 class="text-lg font-bold" style="color: var(--color-gray-900);">
            Planning — {{ nombreProyecto() }}
          </h2>
          <button (click)="cerrar.emit()"
                  class="p-1.5 rounded-lg transition-colors text-[var(--color-gray-400)] hover:text-[var(--color-gray-600)] hover:bg-[var(--color-gray-100)]">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="p-6 space-y-5">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1.5" style="color: var(--color-gray-700);">Tarea</label>
              <input [formControl]="tareaForm.controls.tarea" type="text" autocomplete="off"
                     class="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-colors"
                     style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);"
                     placeholder="Nombre de la tarea">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1.5" style="color: var(--color-gray-700);">Complejidad</label>
              <select [formControl]="tareaForm.controls.complejidad"
                      class="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-colors"
                      style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);">
                <option value="">Selecciona</option>
                <option value="Simple">Simple</option>
                <option value="Media">Media</option>
                <option value="Compleja">Compleja</option>
              </select>
            </div>
          </div>

          <button (click)="agregarTarea()"
                  class="w-full px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--color-indigo-600)] hover:bg-[var(--color-indigo-700)]"
                  [disabled]="tareaForm.invalid">
            Agregar tarea
          </button>

          @if (planning().tareas.length > 0) {
            <div class="border-t pt-4" style="border-color: var(--color-gray-100);">
              <p class="text-sm font-medium mb-3" style="color: var(--color-gray-700);">
                Tareas agregadas ({{ planning().tareas.length }})
              </p>
              <div cdkDropList [cdkDropListData]="planning().tareas"
                   (cdkDropListDropped)="onDropTarea($event)" class="space-y-2 custom-scrollbar"
                   style="max-height: 180px; overflow-y: auto;">
                @for (task of planning().tareas; track task.id) {
                  <div cdkDrag class="flex items-center gap-2 p-3 rounded-lg group"
                       style="background-color: var(--color-gray-50);">
                    <div class="flex-1 flex items-center gap-3 min-w-0">
                      @if (editandoTaskId() === task.id) {
                        <input #editInput [value]="editandoTaskValue()" autofocus
                               (blur)="guardarEdicionTarea(task.id, editInput.value)"
                               (keydown.enter)="guardarEdicionTarea(task.id, editInput.value)"
                               (keydown.escape)="cancelarEdicionTarea()"
                               class="flex-1 px-2 py-1 text-sm rounded outline-none"
                               style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-teal-500);">
                      } @else {
                        <span (click)="iniciarEdicionTarea(task)"
                              class="text-sm cursor-pointer transition-colors text-[var(--color-gray-900)] hover:text-[var(--color-teal-600)]">
                          {{ task.tarea }}
                        </span>
                      }
                      @if (editandoComplexId() === task.id) {
                        <select #complexSelect [value]="task.complejidad" autofocus
                                (change)="guardarEdicionComplejidad(task.id, complexSelect.value)"
                                (blur)="guardarEdicionComplejidad(task.id, complexSelect.value)"
                                (keydown.escape)="cancelarEdicionComplejidad()"
                                class="shrink-0 px-2 py-0.5 rounded-full text-xs font-medium outline-none border"
                                style="border-color: var(--color-teal-500); background-color: var(--color-surface); color: var(--color-gray-900);">
                          <option value="Simple">Simple</option>
                          <option value="Media">Media</option>
                          <option value="Compleja">Compleja</option>
                        </select>
                      } @else {
                        <span (click)="iniciarEdicionComplejidad(task)"
                              class="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-opacity"
                              [style.color]="complejidadEstilo(task.complejidad).text"
                              [style.background-color]="complejidadEstilo(task.complejidad).bg">
                          {{ task.complejidad }}
                        </span>
                      }
                    </div>
                    <button cdkDragHandle
                            class="p-1 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-grab text-[var(--color-gray-400)] hover:text-[var(--color-teal-600)]"
                            [attr.aria-label]="'Arrastrar para reordenar'">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 8h16M4 16h16"/>
                      </svg>
                    </button>
                    <button (click)="removerTarea(task.id)"
                            class="shrink-0 p-1.5 rounded-lg transition-colors text-[var(--color-gray-400)] hover:text-[var(--color-rose-600)] hover:bg-[var(--color-gray-200)]"
                            [attr.aria-label]="'Eliminar tarea ' + task.tarea">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                }
              </div>
            </div>
          } @else {
            <div class="border-t pt-4" style="border-color: var(--color-gray-100);">
              <p class="text-sm text-center" style="color: var(--color-gray-400);">No hay tareas agregadas.</p>
            </div>
          }

          @if (planning().tareas.length > 0) {
            <div class="flex items-center justify-between px-4 py-3 rounded-lg"
                 style="background: var(--estimation-bg);">
              <span class="text-sm font-semibold" style="color: var(--estimation-text);">Estimación:</span>
              <span class="text-sm font-bold" style="color: var(--estimation-text);">
                {{ estimacionTotal(planning().tareas) }} día{{ estimacionTotal(planning().tareas) !== 1 ? 's' : '' }}
              </span>
            </div>
          }

          <div class="flex justify-end pt-2">
            <button (click)="cerrar.emit()"
                    class="px-4 py-2.5 text-sm font-medium rounded-lg transition-colors text-[var(--color-gray-700)] bg-[var(--color-gray-100)] hover:bg-[var(--color-gray-200)]">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
  `]
})
export class PlanningTasksComponent {
  private fb = inject(FormBuilder);

  readonly planning = input.required<Planning>();
  readonly proyectos = input.required<Proyecto[]>();
  readonly actualizarTareas = output<{planningId: string; tareas: PlanningTask[]}>();
  readonly cerrar = output();

  protected readonly complejidadEstilo = complejidadEstilo;
  protected readonly estimacionTotal = estimacionTotal;

  protected editandoTaskId = signal<string | null>(null);
  protected editandoTaskValue = signal<string>('');
  protected editandoComplexId = signal<string | null>(null);

  tareaForm = this.fb.nonNullable.group({
    tarea: ['', Validators.required],
    complejidad: ['', Validators.required],
  });

  protected nombreProyecto(): string {
    const proj = this.proyectos().find((p) => p.id === this.planning().proyectoId);
    return proj ? proj.nombre : '—';
  }

  protected agregarTarea(): void {
    if (this.tareaForm.invalid) return;

    const raw = this.tareaForm.getRawValue();
    const nuevaTarea: PlanningTask = {
      id: crypto.randomUUID(),
      tarea: raw.tarea,
      complejidad: raw.complejidad as PlanningTask['complejidad'],
      completada: false,
    };

    this.actualizarTareas.emit({
      planningId: this.planning().id,
      tareas: [...this.planning().tareas, nuevaTarea],
    });
    this.tareaForm.reset();
  }

  protected removerTarea(taskId: string): void {
    this.actualizarTareas.emit({
      planningId: this.planning().id,
      tareas: this.planning().tareas.filter((t) => t.id !== taskId),
    });
  }

  protected iniciarEdicionTarea(task: PlanningTask): void {
    this.editandoTaskId.set(task.id);
    this.editandoTaskValue.set(task.tarea);
  }

  protected guardarEdicionTarea(taskId: string, nuevoNombre: string): void {
    if (!nuevoNombre.trim()) {
      this.cancelarEdicionTarea();
      return;
    }
    this.actualizarTareas.emit({
      planningId: this.planning().id,
      tareas: this.planning().tareas.map((t) =>
        t.id === taskId ? {...t, tarea: nuevoNombre.trim()} : t,
      ),
    });
    this.cancelarEdicionTarea();
  }

  protected cancelarEdicionTarea(): void {
    this.editandoTaskId.set(null);
    this.editandoTaskValue.set('');
  }

  protected iniciarEdicionComplejidad(task: PlanningTask): void {
    this.editandoComplexId.set(task.id);
  }

  protected guardarEdicionComplejidad(taskId: string, nuevoValor: string): void {
    this.actualizarTareas.emit({
      planningId: this.planning().id,
      tareas: this.planning().tareas.map((t) =>
        t.id === taskId ? {...t, complejidad: nuevoValor as PlanningTask['complejidad']} : t,
      ),
    });
    this.cancelarEdicionComplejidad();
  }

  protected cancelarEdicionComplejidad(): void {
    this.editandoComplexId.set(null);
  }

  protected onDropTarea(event: CdkDragDrop<PlanningTask[]>): void {
    const tareas = [...this.planning().tareas];
    moveItemInArray(tareas, event.previousIndex, event.currentIndex);
    this.actualizarTareas.emit({
      planningId: this.planning().id,
      tareas,
    });
  }
}
