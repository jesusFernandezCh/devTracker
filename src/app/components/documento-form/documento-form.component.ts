import {Component, input, output, inject, ChangeDetectionStrategy, signal, computed, effect} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, Validators} from '@angular/forms';
import {MatIconModule} from '@angular/material/icon';
import {Documento, ARCHIVO_EXTENSIONS, TAMANO_MAXIMO_BYTES, TIPOS_ARCHIVO_PERMITIDOS} from '../../models/documento.model';
import {ProyectoService} from '../../services/proyecto.service';
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-documento-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background-color: rgba(0,0,0,0.4);" (click)="cerrar.emit()">
      <div class="modal-enter rounded-xl shadow-xl w-full max-w-lg border overflow-hidden"
           style="background-color: var(--color-surface); border-color: var(--color-gray-200);"
           (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between px-4 py-3 border-b" style="border-color: var(--color-gray-200);">
          <h2 class="text-sm font-bold" style="color: var(--color-gray-900);">
            {{ editando() ? 'Editar documento' : 'Nuevo documento' }}
          </h2>
          <button (click)="cerrar.emit()"
                  class="p-0.5 rounded transition-colors" style="color: var(--color-gray-400);">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onGuardar()" class="p-4 space-y-3">
          <div>
            <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Nombre</label>
            <input formControlName="nombre" type="text" autocomplete="off"
                   class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors"
                   style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);"
                   placeholder="Ej: Requerimientos v2">
            @if (form.controls.nombre.touched && form.controls.nombre.invalid) {
              <p class="mt-1 text-xs" style="color: var(--color-rose-500);">El nombre debe tener al menos 3 caracteres.</p>
            }
          </div>

          <div>
            <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Descripción</label>
            <textarea formControlName="descripcion" rows="2"
                      class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors resize-none"
                      style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);"
                      placeholder="Descripción del documento..."></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Proyecto</label>
            <select formControlName="proyectoId"
                    class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors"
                    style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);">
              <option value="">Selecciona un proyecto</option>
              @for (proyecto of proyectos(); track proyecto.id) {
                <option [value]="proyecto.id">{{ proyecto.nombre }}</option>
              }
            </select>
            @if (form.controls.proyectoId.touched && form.controls.proyectoId.invalid) {
              <p class="mt-1 text-xs" style="color: var(--color-rose-500);">Selecciona un proyecto.</p>
            }
          </div>

          <div>
            <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Archivo</label>
            <div class="relative">
              <input #fileInput type="file" [accept]="extensions"
                     (change)="onFileSelected($event)"
                     class="hidden">
              <button type="button" (click)="fileInput.click()"
                      class="w-full flex items-center justify-center gap-2 px-4 py-6 rounded-lg border-2 border-dashed transition-colors cursor-pointer"
                      [style.border-color]="archivoError() ? 'var(--color-rose-400)' : 'var(--color-gray-300)'"
                      [style.background-color]="archivoSeleccionado() ? 'var(--color-indigo-50)' : 'transparent'"
                      [style.color]="archivoError() ? 'var(--color-rose-500)' : 'var(--color-gray-500)'">
                @if (archivoSeleccionado()) {
                  <mat-icon class="text-xl">description</mat-icon>
                  <span class="text-sm">{{ archivoNombre() }}</span>
                  <span class="text-xs">({{ archivoTamano() }})</span>
                } @else {
                  <mat-icon class="text-xl">cloud_upload</mat-icon>
                  <span class="text-sm">Selecciona un archivo PDF o Word</span>
                }
              </button>
            </div>
            @if (archivoError()) {
              <p class="mt-1 text-xs" style="color: var(--color-rose-500);">{{ archivoError() }}</p>
            }
            @if (!editando() && !archivoSeleccionado()) {
              <p class="mt-1 text-xs" style="color: var(--color-gray-400);">Máximo 10 MB. Formatos: PDF, DOC, DOCX</p>
            }
          </div>

          <div class="flex justify-end gap-3 pt-1.5 border-t" style="border-color: var(--color-gray-200);">
            <button type="button" (click)="cerrar.emit()"
                    class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors text-[var(--color-gray-700)] bg-[var(--color-gray-100)] hover:bg-[var(--color-gray-200)]">
              Cancelar
            </button>
            <button type="submit"
                    class="px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-700)]"
                    [disabled]="form.invalid || (!archivoSeleccionado() && !editando())">
              {{ editando() ? 'Guardar' : 'Subir' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [],
})
export class DocumentoFormComponent {
  private fb = inject(FormBuilder);
  private proyectoService = inject(ProyectoService);
  private authService = inject(AuthService);

  protected readonly proyectos = this.proyectoService.proyectos;

  readonly editando = input<Documento | null>(null);
  readonly guardar = output<{nombre: string; descripcion: string; proyectoId: string; archivoBase64: string; tipoMime: string}>();
  readonly cerrar = output();

  protected readonly archivoNombre = signal('');
  protected readonly archivoTamano = signal('');
  protected readonly archivoError = signal('');
  protected readonly archivoBase64 = signal('');
  protected readonly archivoTipoMime = signal('');

  protected readonly archivoSeleccionado = computed(() => !!this.archivoBase64());

  protected readonly extensions = ARCHIVO_EXTENSIONS;

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: [''],
    proyectoId: ['', Validators.required],
  });

  constructor() {
    effect(() => {
      const doc = this.editando();
      if (doc) {
        this.form.patchValue({
          nombre: doc.nombre,
          descripcion: doc.descripcion,
          proyectoId: doc.proyectoId,
        });
        this.archivoNombre.set(doc.nombre);
        this.archivoTipoMime.set(doc.tipoMime);
      } else {
        this.form.reset();
        this.archivoNombre.set('');
        this.archivoTipoMime.set('');
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    this.archivoError.set('');

    if (!TIPOS_ARCHIVO_PERMITIDOS[file.type]) {
      this.archivoError.set('Formato no permitido. Usa PDF, DOC o DOCX.');
      input.value = '';
      return;
    }

    if (file.size > TAMANO_MAXIMO_BYTES) {
      this.archivoError.set('El archivo supera los 10 MB.');
      input.value = '';
      return;
    }

    this.archivoNombre.set(file.name);
    this.archivoTipoMime.set(file.type);

    const sizeKB = file.size / 1024;
    this.archivoTamano.set(sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${Math.round(sizeKB)} KB`);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.archivoBase64.set(result);
    };
    reader.readAsDataURL(file);
  }

  protected onGuardar(): void {
    if (this.form.invalid) return;
    if (!this.archivoBase64() && !this.editando()) return;

    const v = this.form.getRawValue();

    if (this.editando() && !this.archivoBase64()) {
      this.guardar.emit({
        nombre: v.nombre,
        descripcion: v.descripcion,
        proyectoId: v.proyectoId,
        archivoBase64: this.editando()!.archivoBase64,
        tipoMime: this.editando()!.tipoMime,
      });
    } else {
      this.guardar.emit({
        nombre: v.nombre,
        descripcion: v.descripcion,
        proyectoId: v.proyectoId,
        archivoBase64: this.archivoBase64(),
        tipoMime: this.archivoTipoMime(),
      });
    }
  }
}
