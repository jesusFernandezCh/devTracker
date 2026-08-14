import {Component, input, output, inject, ChangeDetectionStrategy, effect} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, Validators} from '@angular/forms';
import {Dialog} from 'primeng/dialog';
import {InputText} from 'primeng/inputtext';
import {Textarea} from 'primeng/textarea';
import {Select} from 'primeng/select';
import {Button} from 'primeng/button';
import {Proyecto} from '../../models/proyecto.model';

@Component({
  selector: 'app-proyecto-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, Dialog, InputText, Textarea, Select, Button],
  template: `
    <p-dialog [visible]="true" (onHide)="cerrar.emit()"
              [modal]="true" [draggable]="false" [resizable]="false"
              [closeOnEscape]="true" [dismissableMask]="true"
              [style]="{width: '30rem'}" [breakpoints]="{'575px': '95vw'}"
              [header]="editando() ? 'Editar proyecto' : 'Nuevo proyecto'">
      <form [formGroup]="proyectoForm" (ngSubmit)="onGuardar()" class="space-y-3">
        <div>
          <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Nombre</label>
          <input pInputText formControlName="nombre" type="text" autocomplete="off" class="w-full"
                 placeholder="Ej: Sitio Web Corporativo" autofocus>
          @if (proyectoForm.controls.nombre.touched && proyectoForm.controls.nombre.invalid) {
            <small class="mt-1 flex items-center gap-1 text-xs" style="color: var(--color-rose-500);">
              <i class="pi pi-exclamation-circle"></i> El nombre debe tener al menos 3 caracteres.
            </small>
          }
        </div>

        <div>
          <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Descripción</label>
          <textarea pTextarea formControlName="descripcion" rows="2"
                    class="w-full resize-none" placeholder="Descripción del proyecto..."></textarea>
        </div>

        <div class="grid grid-cols-3 gap-2">
          <div>
            <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Cliente</label>
            <p-select formControlName="cliente" [options]="clienteOptions"
                      optionLabel="label" optionValue="value" placeholder="Selecciona" [style]="{width: '100%'}" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Estado</label>
            <p-select formControlName="status" [options]="statusOptions"
                      optionLabel="label" optionValue="value" placeholder="Selecciona" [style]="{width: '100%'}" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Prioridad</label>
            <p-select formControlName="prioridad" [options]="prioridadOptions"
                      optionLabel="label" optionValue="value" placeholder="Selecciona" [style]="{width: '100%'}" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Fecha inicio</label>
            <input pInputText formControlName="fechaDesde" type="date" class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Fecha fin</label>
            <input pInputText formControlName="fechaHasta" type="date" class="w-full">
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">
            Documentación <span style="color: var(--color-gray-400); font-weight: 400;">(link a Figma)</span>
          </label>
          <input pInputText formControlName="documentacion" type="url" autocomplete="off" class="w-full"
                 placeholder="https://figma.com/file/...">
        </div>

        <div class="flex justify-end gap-3 pt-1.5 border-t" style="border-color: var(--color-gray-200);">
          <p-button label="Cancelar" [text]="true" severity="secondary" (onClick)="cerrar.emit()" />
          <p-button type="submit" [label]="editando() ? 'Guardar' : 'Crear'"
                    [disabled]="proyectoForm.invalid" />
        </div>
      </form>
    </p-dialog>
  `,
  styles: [`
  `]
})
export class ProyectoFormComponent {
  private fb = inject(FormBuilder);

  readonly editando = input<Proyecto | null>(null);
  readonly guardar = output<{nombre: string; descripcion: string; cliente: string; status: string; prioridad: string; fechaDesde: string; fechaHasta: string; documentacion: string}>();
  readonly cerrar = output();

  protected readonly clienteOptions = [
    {label: 'Cliente A', value: 'Cliente A'},
    {label: 'Cliente B', value: 'Cliente B'},
    {label: 'Cliente C', value: 'Cliente C'},
  ];

  protected readonly statusOptions = [
    {label: 'Activo', value: 'Activo'},
    {label: 'Pausa', value: 'Pausa'},
    {label: 'Inactivo', value: 'Inactivo'},
  ];

  protected readonly prioridadOptions = [
    {label: 'Baja', value: 'baja'},
    {label: 'Media', value: 'media'},
    {label: 'Alta', value: 'alta'},
  ];

  proyectoForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: [''],
    cliente: ['', Validators.required],
    status: ['', Validators.required],
    prioridad: ['', Validators.required],
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
          prioridad: proj.prioridad,
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
