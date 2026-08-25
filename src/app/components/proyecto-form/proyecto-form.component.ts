import {Component, input, output, inject, ChangeDetectionStrategy, effect} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, Validators} from '@angular/forms';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {Proyecto} from '../../models/proyecto.model';
import {ClienteService} from '../../services/cliente.service';

@Component({
  selector: 'app-proyecto-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, MatDatepickerModule],
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

          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Cliente</label>
              <select formControlName="cliente"
                      class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors"
                      style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);">
                <option value="">Selecciona</option>
                @for (cliente of clientes(); track cliente.id) {
                  <option [value]="cliente.nombre">{{ cliente.nombre }}</option>
                }
              </select>
            </div>
            @if (editando()) {
              <div>
                <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Estado</label>
                <select formControlName="status"
                        class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors"
                        style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);">
                  <option value="">Selecciona</option>
                  <option value="Activo">Activo</option>
                  <option value="Pausa">Pausa</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
            }
            <div>
              <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Prioridad</label>
              <select formControlName="prioridad"
                      class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors"
                      style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);">
                <option value="">Selecciona</option>
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Rango de fechas</label>
            <div class="proyecto-fechas" (click)="fechaRange.open()">
              <mat-date-range-input [formGroup]="rangoFechas" [rangePicker]="fechaRange" class="proyecto-fechas-input">
                <input matStartDate formControlName="start" placeholder="Inicio" autocomplete="off">
                <input matEndDate formControlName="end" placeholder="Fin" autocomplete="off">
              </mat-date-range-input>
              <button type="button" class="proyecto-fechas-btn" (click)="fechaRange.open()" aria-label="Abrir calendario de fechas">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75A1.5 1.5 0 014.5 17.25h3A1.5 1.5 0 019 18.75V21h6v-2.25a1.5 1.5 0 011.5-1.5h3a1.5 1.5 0 011.5 1.5V21M3 9h18m-16.5 0h15.75M3 9v9.75A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V9a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9z"/>
                </svg>
              </button>
              <mat-date-range-picker #fechaRange></mat-date-range-picker>
            </div>
            @if (rangoFechas.touched && rangoFechas.invalid) {
              <p class="mt-1 text-xs" style="color: var(--color-rose-500);">Selecciona fecha de inicio y fin.</p>
            }
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
    .proyecto-fechas {
      display: flex;
      align-items: center;
      height: 40px;
      padding-left: 0.75rem;
      border: 1px solid var(--color-gray-300);
      border-radius: 0.5rem;
      background-color: var(--color-surface);
      cursor: pointer;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .proyecto-fechas:hover {
      border-color: var(--color-gray-400);
    }
    .proyecto-fechas:focus-within {
      border-color: var(--color-indigo-500);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }
    .proyecto-fechas-input {
      flex: 1;
      min-width: 0;
    }
    .proyecto-fechas .mat-date-range-input-wrapper {
      height: 20px;
    }
    .proyecto-fechas .mat-date-range-input-inner {
      font-size: 0.875rem;
      line-height: 20px;
      color: var(--color-gray-900);
      outline: none;
    }
    .proyecto-fechas .mat-date-range-input-inner::placeholder {
      color: var(--color-gray-400);
    }
    .proyecto-fechas .mat-date-range-input-separator {
      color: var(--color-gray-400);
      margin: 0 0.25rem;
      font-size: 0.875rem;
      line-height: 20px;
    }
    .proyecto-fechas-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      margin-right: 0.375rem;
      border-radius: 0.375rem;
      color: var(--color-gray-500);
      transition: color 0.15s, background-color 0.15s;
    }
    .proyecto-fechas-btn:hover {
      color: var(--color-indigo-600);
      background-color: var(--color-gray-100);
    }
  `]
})
export class ProyectoFormComponent {
  private fb = inject(FormBuilder);
  private clienteService = inject(ClienteService);

  protected readonly clientes = this.clienteService.clientes;

  readonly editando = input<Proyecto | null>(null);
  readonly guardar = output<{nombre: string; descripcion: string; cliente: string; status: string; prioridad: string; fechaDesde: string; fechaHasta: string; documentacion: string}>();
  readonly cerrar = output();

  readonly rangoFechas = this.fb.group({
    start: [null as Date | null, Validators.required],
    end: [null as Date | null, Validators.required],
  });

  proyectoForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: [''],
    cliente: ['', Validators.required],
    status: ['Activo', Validators.required],
    prioridad: ['', Validators.required],
    rangoFechas: this.rangoFechas,
    documentacion: [''],
  });

  constructor() {
    effect(() => {
      const proj = this.editando();
      if (proj) {
        this.proyectoForm.patchValue({
          nombre: proj.nombre,
          descripcion: proj.descripcion,
          cliente: proj.cliente,
          status: proj.status,
          prioridad: proj.prioridad,
          documentacion: proj.documentacion,
        });
        this.rangoFechas.setValue({
          start: this.aFecha(proj.fechaDesde),
          end: this.aFecha(proj.fechaHasta),
        });
      } else {
        this.proyectoForm.reset();
        this.rangoFechas.reset();
      }
    });
  }

  protected onGuardar(): void {
    if (this.proyectoForm.invalid) return;
    const v = this.proyectoForm.getRawValue();
    this.guardar.emit({
      nombre: v.nombre,
      descripcion: v.descripcion,
      cliente: v.cliente,
      status: v.status || 'Activo',
      prioridad: v.prioridad,
      fechaDesde: this.aISO(v.rangoFechas.start),
      fechaHasta: this.aISO(v.rangoFechas.end),
      documentacion: v.documentacion,
    });
  }

  private aFecha(iso: string): Date | null {
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }

  private aISO(fecha: Date | null): string {
    if (!fecha) return '';
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
