import {Component, input, output, inject, ChangeDetectionStrategy, effect} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, Validators} from '@angular/forms';
import {Proyecto} from '../../models/proyecto.model';

@Component({
  selector: 'app-proyecto-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center-modal p-4" style="background-color: rgba(0,0,0,0.4);" (click)="cerrar.emit()">
      <div class="modal-enter rounded-xl shadow-xl w-full max-w-md border overflow-hidden" style="background-color: var(--color-surface); border-color: var(--color-gray-200);" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between px-4 py-3 border-b" style="border-color: var(--color-gray-200);">
          <h2 class="text-sm font-bold" style="color: var(--color-gray-900);">
            {{ editando() ? 'Editar proyecto' : 'Nuevo proyecto' }}
          </h2>
          <button (click)="cerrar.emit()"
                  class="p-0.5 rounded transition-colors" style="color: var(--color-gray-400);">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form [formGroup]="proyectoForm" (ngSubmit)="onGuardar()" class="p-4 space-y-3">
          <div>
            <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Nombre</label>
            <input formControlName="nombre" type="text" autocomplete="off"
                   class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors"
                   style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);"
                   placeholder="Ej: Sitio Web Corporativo">
            @if (proyectoForm.controls.nombre.touched && proyectoForm.controls.nombre.invalid) {
              <p class="mt-1 text-xs" style="color: var(--color-rose-500);">El nombre debe tener al menos 3 caracteres.</p>
            }
          </div>

          <div>
            <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Descripción</label>
            <textarea formControlName="descripcion" rows="2"
                      class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors resize-none"
                      style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);"
                      placeholder="Descripción del proyecto..."></textarea>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Cliente</label>
              <select formControlName="cliente"
                      class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors"
                      style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);">
                <option value="">Selecciona un cliente</option>
                <option value="Cliente A">Cliente A</option>
                <option value="Cliente B">Cliente B</option>
                <option value="Cliente C">Cliente C</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Estado</label>
              <select formControlName="status"
                      class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors"
                      style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);">
                <option value="">Selecciona un estado</option>
                <option value="Activo">Activo</option>
                <option value="Pausa">Pausa</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Fecha inicio</label>
              <input formControlName="fechaDesde" type="date"
                     class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors"
                     style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Fecha fin</label>
              <input formControlName="fechaHasta" type="date"
                     class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors"
                     style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);">
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">
              Documentación <span style="color: var(--color-gray-400); font-weight: 400;">(link a Figma)</span>
            </label>
            <input formControlName="documentacion" type="url" autocomplete="off"
                   class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors"
                   style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);"
                   placeholder="https://figma.com/file/...">
          </div>

          <div class="flex justify-end gap-3 pt-1.5 border-t" style="border-color: var(--color-gray-200);">
            <button type="button" (click)="cerrar.emit()"
                    class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors text-[var(--color-gray-700)] bg-[var(--color-gray-100)] hover:bg-[var(--color-gray-200)]">
              Cancelar
            </button>
            <button type="submit"
                    class="px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-700)]"
                    [disabled]="proyectoForm.invalid">
              {{ editando() ? 'Guardar' : 'Crear' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
  `]
})
export class ProyectoFormComponent {
  private fb = inject(FormBuilder);

  readonly editando = input<Proyecto | null>(null);
  readonly guardar = output<{nombre: string; descripcion: string; cliente: string; status: string; fechaDesde: string; fechaHasta: string; documentacion: string}>();
  readonly cerrar = output();

  proyectoForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: [''],
    cliente: ['', Validators.required],
    status: ['', Validators.required],
    fechaDesde: ['', Validators.required],
    fechaHasta: ['', Validators.required],
    documentacion: [''],
  });

  constructor() {
    effect(() => {
      const proj = this.editando();
      if (proj) {
        this.proyectoForm.setValue({
          nombre: proj.nombre,
          descripcion: proj.descripcion,
          cliente: proj.cliente,
          status: proj.status,
          fechaDesde: proj.fechaDesde,
          fechaHasta: proj.fechaHasta,
          documentacion: proj.documentacion,
        });
      } else {
        this.proyectoForm.reset();
      }
    });
  }

  protected onGuardar(): void {
    if (this.proyectoForm.invalid) return;
    this.guardar.emit(this.proyectoForm.getRawValue());
  }
}
