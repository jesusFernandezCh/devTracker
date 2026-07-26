import {Component, input, output, inject, ChangeDetectionStrategy, effect} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, Validators} from '@angular/forms';
import {Proyecto} from '../../models/proyecto.model';
import {Planning} from '../../models/planning.model';

@Component({
  selector: 'app-planning-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background-color: rgba(0,0,0,0.4);" (click)="cerrar.emit()">
      <div class="modal-enter rounded-xl shadow-xl w-full max-w-lg border overflow-hidden" style="background-color: var(--color-surface); border-color: var(--color-gray-200);" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between px-6 py-5 border-b" style="border-color: var(--color-gray-100);">
          <h2 class="text-lg font-bold" style="color: var(--color-gray-900);">
            {{ editando() ? 'Editar planning' : 'Nuevo planning' }}
          </h2>
          <button (click)="cerrar.emit()"
                  class="p-1.5 rounded-lg transition-colors text-[var(--color-gray-400)] hover:text-[var(--color-gray-600)] hover:bg-[var(--color-gray-100)]">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form [formGroup]="planningForm" (ngSubmit)="onGuardar()" class="p-6 space-y-5">
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: var(--color-gray-700);">Fecha</label>
            <input formControlName="fecha" type="date"
                   class="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-colors"
                   style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);">
          </div>

          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: var(--color-gray-700);">Proyecto</label>
            <select formControlName="proyectoId"
                    class="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-colors"
                    style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);">
              <option value="">Selecciona un proyecto</option>
              @for (proj of proyectos(); track proj.id) {
                <option [value]="proj.id">{{ proj.nombre }}</option>
              }
            </select>
            @if (planningForm.controls.proyectoId.touched && planningForm.controls.proyectoId.invalid) {
              <p class="mt-1 text-xs" style="color: var(--color-rose-500);">Selecciona un proyecto.</p>
            }
          </div>

          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: var(--color-gray-700);">Descripción</label>
            <textarea formControlName="descripcion" rows="3"
                      class="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-colors resize-none"
                      style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);"
                      placeholder="Descripción del planning..."></textarea>
          </div>

          <div class="flex justify-end gap-3 pt-2 border-t" style="border-color: var(--color-gray-100);">
            <button type="button" (click)="cerrar.emit()"
                    class="px-4 py-2.5 text-sm font-medium rounded-lg transition-colors text-[var(--color-gray-700)] bg-[var(--color-gray-100)] hover:bg-[var(--color-gray-200)]">
              Cancelar
            </button>
            <button type="submit"
                    class="px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-700)]"
                    [disabled]="planningForm.invalid">
              {{ editando() ? 'Guardar cambios' : 'Crear planning' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
  `]
})
export class PlanningFormComponent {
  private fb = inject(FormBuilder);

  readonly editando = input<Planning | null>(null);
  readonly proyectos = input.required<Proyecto[]>();
  readonly guardar = output<{fecha: string; proyectoId: string; descripcion: string}>();
  readonly cerrar = output();

  planningForm = this.fb.nonNullable.group({
    fecha: ['', Validators.required],
    proyectoId: ['', Validators.required],
    descripcion: [''],
  });

  constructor() {
    effect(() => {
      const plan = this.editando();
      if (plan) {
        this.planningForm.setValue({
          fecha: plan.fecha,
          proyectoId: plan.proyectoId,
          descripcion: plan.descripcion,
        });
      } else {
        this.planningForm.reset();
      }
    });
  }

  protected onGuardar(): void {
    if (this.planningForm.invalid) return;
    this.guardar.emit(this.planningForm.getRawValue());
  }
}
