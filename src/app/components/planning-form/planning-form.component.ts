import {Component, input, output, inject, ChangeDetectionStrategy, effect} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, Validators} from '@angular/forms';
import {Dialog} from 'primeng/dialog';
import {InputText} from 'primeng/inputtext';
import {Textarea} from 'primeng/textarea';
import {Select} from 'primeng/select';
import {Button} from 'primeng/button';
import {Proyecto} from '../../models/proyecto.model';
import {Planning} from '../../models/planning.model';

@Component({
  selector: 'app-planning-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, Dialog, InputText, Textarea, Select, Button],
  template: `
    <p-dialog [visible]="true" (onHide)="cerrar.emit()"
              [modal]="true" [draggable]="false" [resizable]="false"
              [closeOnEscape]="true" [dismissableMask]="true"
              [style]="{width: '28rem'}" [breakpoints]="{'575px': '95vw'}"
              [header]="editando() ? 'Editar planning' : 'Nuevo planning'">
      <form [formGroup]="planningForm" (ngSubmit)="onGuardar()" class="space-y-3">
        <div>
          <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Fecha</label>
          <input pInputText formControlName="fecha" type="date" class="w-full">
        </div>

        <div>
          <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Proyecto</label>
          <p-select formControlName="proyectoId"
                    [options]="proyectos()"
                    optionLabel="nombre"
                    optionValue="id"
                    placeholder="Selecciona un proyecto"
                    [showClear]="true"
                    [style]="{width: '100%'}" />
          @if (planningForm.controls.proyectoId.touched && planningForm.controls.proyectoId.invalid) {
            <small class="mt-1 flex items-center gap-1 text-xs" style="color: var(--color-rose-500);">
              <i class="pi pi-exclamation-circle"></i> Selecciona un proyecto.
            </small>
          }
        </div>

        <div>
          <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Descripción</label>
          <textarea pTextarea formControlName="descripcion" rows="2"
                    class="w-full resize-none" placeholder="Descripción del planning..."></textarea>
        </div>

        <div class="flex justify-end gap-3 pt-1.5 border-t" style="border-color: var(--color-gray-200);">
          <p-button label="Cancelar" [text]="true" severity="secondary" (onClick)="cerrar.emit()" />
          <p-button type="submit" [label]="editando() ? 'Guardar cambios' : 'Crear planning'"
                    [disabled]="planningForm.invalid" />
        </div>
      </form>
    </p-dialog>
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
