import {Component, inject, signal, computed, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, Validators} from '@angular/forms';
import {AuthService} from '../../services/auth.service';
import {UsuarioService} from '../../services/usuario.service';
import {Usuario, Curriculum} from '../../models/usuario.model';
import {iniciales} from '../../utils/helpers';

const MAX_FOTO = 256;
const MAX_CV_BYTES = 2 * 1024 * 1024;

function formatoTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-4xl">
      <div class="mb-8">
        <h1 class="text-3xl font-bold" style="color: var(--color-gray-900)">Mi perfil</h1>
        <p class="mt-1 text-sm" style="color: var(--color-gray-500)">
          Actualiza tu foto, datos personales y curriculum vitae.
        </p>
      </div>

      @if (guardado()) {
        <div class="mb-6 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
             style="background-color: var(--color-teal-50); color: var(--color-teal-800); border: 1px solid var(--color-teal-200);">
          <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Perfil guardado correctamente.
        </div>
      }

      @if (errorGuardado()) {
        <div class="mb-6 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
             style="background-color: var(--color-rose-50); color: var(--color-rose-700); border: 1px solid var(--color-rose-200);">
          <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
          </svg>
          {{ errorGuardado() }}
        </div>
      }

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <!-- Foto de perfil -->
        <div class="rounded-xl border shadow-sm p-6 text-center"
             style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
          <p class="text-sm font-semibold mb-4 text-left" style="color: var(--color-gray-900);">Foto de perfil</p>
          @if (foto()) {
            <img [src]="foto()!" alt="Foto de perfil"
                 class="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-2"
                 style="border-color: var(--color-gray-200);">
          } @else {
            <div class="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4"
                 style="background-color: var(--color-indigo-100); color: var(--color-indigo-700);">
              {{ inicialesUsuario() }}
            </div>
          }
          <p class="text-sm font-medium truncate" style="color: var(--color-gray-900);">{{ nombreCompleto() }}</p>
          <p class="text-xs truncate mt-0.5" style="color: var(--color-gray-500);">{{ usuario()?.usuario }}</p>

          <input #fotoInput type="file" accept="image/*" class="hidden" (change)="onFotoSeleccionada($event)">
          <div class="flex items-center justify-center gap-2 mt-5">
            <button (click)="fotoInput.click()"
                    class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-white bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-700)]">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/>
              </svg>
              Cambiar foto
            </button>
            @if (foto()) {
              <button (click)="quitarFoto()"
                      class="p-2 rounded-lg transition-colors text-[var(--color-gray-400)] hover:text-[var(--color-rose-600)] hover:bg-[var(--color-gray-100)]"
                      aria-label="Quitar foto">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                </svg>
              </button>
            }
          </div>
          <p class="text-xs mt-3" style="color: var(--color-gray-400);">JPG, PNG o GIF. Se redimensiona automáticamente.</p>
        </div>

        <!-- Datos personales -->
        <div class="md:col-span-2 rounded-xl border shadow-sm p-6"
             style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
          <p class="text-sm font-semibold mb-4" style="color: var(--color-gray-900);">Datos personales</p>
          <form [formGroup]="perfilForm" (ngSubmit)="onGuardar()" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Nombres</label>
                <input formControlName="nombres" type="text" autocomplete="given-name"
                       class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors"
                       style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);"
                       placeholder="Tus nombres">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Apellidos</label>
                <input formControlName="apellidos" type="text" autocomplete="family-name"
                       class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors"
                       style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);"
                       placeholder="Tus apellidos">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Cédula de identidad</label>
                <input formControlName="cedula" type="text" autocomplete="off"
                       class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors"
                       style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);"
                       placeholder="V-12345678">
                @if (perfilForm.controls.cedula.touched && perfilForm.controls.cedula.invalid) {
                  <p class="mt-1 text-xs" style="color: var(--color-rose-500);">Cédula inválida.</p>
                }
              </div>
              <div>
                <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Número telefónico</label>
                <input formControlName="telefono" type="tel" autocomplete="tel"
                       class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors"
                       style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);"
                       placeholder="+58 412-1234567">
                @if (perfilForm.controls.telefono.touched && perfilForm.controls.telefono.invalid) {
                  <p class="mt-1 text-xs" style="color: var(--color-rose-500);">Teléfono inválido.</p>
                }
              </div>
              <div>
                <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Número de contacto</label>
                <input formControlName="telefonoContacto" type="tel" autocomplete="tel"
                       class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors"
                       style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);"
                       placeholder="Teléfono alternativo">
                @if (perfilForm.controls.telefonoContacto.touched && perfilForm.controls.telefonoContacto.invalid) {
                  <p class="mt-1 text-xs" style="color: var(--color-rose-500);">Teléfono inválido.</p>
                }
              </div>
              <div>
                <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Email</label>
                <input formControlName="correo" type="email" autocomplete="email"
                       class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors"
                       style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);"
                       placeholder="ejemplo@correo.com">
                @if (perfilForm.controls.correo.touched && perfilForm.controls.correo.invalid) {
                  <p class="mt-1 text-xs" style="color: var(--color-rose-500);">Ingresa un correo válido.</p>
                }
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Dirección de vivienda</label>
              <textarea formControlName="direccion" rows="2" autocomplete="street-address"
                        class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors resize-y"
                        style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);"
                        placeholder="Calle, urbanización, ciudad…"></textarea>
            </div>

            <div class="flex justify-end pt-1.5 border-t" style="border-color: var(--color-gray-200);">
              <button type="submit" [disabled]="perfilForm.invalid"
                      class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-700)]">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/>
                </svg>
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Curriculum -->
      <div class="rounded-xl border shadow-sm p-6 mt-6"
           style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
        <div class="flex items-center justify-between gap-4 flex-wrap">
          <div class="min-w-0">
            <p class="text-sm font-semibold" style="color: var(--color-gray-900);">Curriculum vitae</p>
            <p class="text-xs mt-0.5" style="color: var(--color-gray-500);">PDF, DOC o DOCX. Máximo 2 MB.</p>
          </div>
          @if (curriculum()) {
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
                    style="background-color: var(--color-gray-100); color: var(--color-gray-700);">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
                </svg>
                <span class="max-w-48 truncate font-medium">{{ curriculum()!.nombre }}</span>
                <span style="color: var(--color-gray-400);">· {{ formatoTamano(curriculum()!.tamano) }}</span>
              </span>
              <button (click)="descargarCurriculum()"
                      class="p-2 rounded-lg transition-colors text-[var(--color-gray-400)] hover:text-[var(--color-teal-600)] hover:bg-[var(--color-gray-100)]"
                      [attr.aria-label]="'Descargar ' + curriculum()!.nombre">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                </svg>
              </button>
              <button (click)="quitarCurriculum()"
                      class="p-2 rounded-lg transition-colors text-[var(--color-gray-400)] hover:text-[var(--color-rose-600)] hover:bg-[var(--color-gray-100)]"
                      aria-label="Quitar curriculum">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          } @else {
            <p class="text-sm" style="color: var(--color-gray-400);">No has adjuntado un curriculum.</p>
          }
        </div>
        <div class="mt-4 pt-4 border-t" style="border-color: var(--color-gray-200);">
          <input #cvInput type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                 class="hidden" (change)="onCurriculumSeleccionado($event)">
          <button (click)="cvInput.click()"
                  class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors text-white bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-700)]">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75"/>
            </svg>
            {{ curriculum() ? 'Reemplazar curriculum' : 'Adjuntar curriculum' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    input:focus, textarea:focus { border-color: var(--color-indigo-400) !important; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15); }
  `]
})
export class PerfilComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly authService = inject(AuthService);
  protected readonly usuarioService = inject(UsuarioService);
  protected readonly formatoTamano = formatoTamano;

  protected readonly usuario = computed(() => this.authService.currentUser());
  protected readonly guardado = signal(false);
  protected readonly errorGuardado = signal<string | null>(null);
  protected readonly foto = signal<string | null>(null);
  protected readonly curriculum = signal<Curriculum | null>(null);

  protected readonly nombreCompleto = computed(() => {
    const u = this.usuario();
    if (!u) return '';
    return [u.nombres, u.apellidos].filter(Boolean).join(' ') || u.usuario;
  });

  protected readonly inicialesUsuario = computed(() => {
    const u = this.usuario();
    if (!u) return '?';
    const nombreCompleto = [u.nombres, u.apellidos].filter(Boolean).join(' ') || u.usuario;
    return iniciales(nombreCompleto);
  });

  protected readonly perfilForm = this.fb.nonNullable.group({
    nombres: [''],
    apellidos: [''],
    cedula: ['', [Validators.pattern(/^\d{5,15}$/)]],
    telefono: ['', [Validators.pattern(/^[0-9+\-\s()]{7,20}$/)]],
    telefonoContacto: ['', [Validators.pattern(/^[0-9+\-\s()]{7,20}$/)]],
    correo: ['', [Validators.required, Validators.email]],
    direccion: [''],
  });

  constructor() {
    const u = this.usuario();
    if (u) {
      this.perfilForm.setValue({
        nombres: u.nombres ?? '',
        apellidos: u.apellidos ?? '',
        cedula: u.cedula ?? '',
        telefono: u.telefono ?? '',
        telefonoContacto: u.telefonoContacto ?? '',
        correo: u.correo,
        direccion: u.direccion ?? '',
      });
      this.foto.set(u.foto ?? null);
      this.curriculum.set(u.curriculum ?? null);
    }
  }

  protected async onFotoSeleccionada(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      const foto = await this._redimensionarFoto(file);
      this.foto.set(foto);
      this.errorGuardado.set(null);
    } catch {
      this.errorGuardado.set('No se pudo procesar la imagen. Prueba con otra foto.');
    }
  }

  protected quitarFoto(): void {
    this.foto.set(null);
  }

  protected async onCurriculumSeleccionado(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.errorGuardado.set(null);
    if (file.size > MAX_CV_BYTES) {
      this.errorGuardado.set('El curriculum supera el tamaño máximo de 2 MB.');
      return;
    }
    const datos = await this._leerArchivo(file);
    this.curriculum.set({nombre: file.name, tipo: file.type, tamano: file.size, datos});
  }

  protected descargarCurriculum(): void {
    const cv = this.curriculum();
    if (!cv) return;
    const a = document.createElement('a');
    a.href = cv.datos;
    a.download = cv.nombre;
    a.click();
  }

  protected quitarCurriculum(): void {
    this.curriculum.set(null);
  }

  protected async onGuardar(): Promise<void> {
    if (this.perfilForm.invalid) return;
    const u = this.usuario();
    if (!u) return;
    const raw = this.perfilForm.getRawValue();
    const data: Partial<Omit<Usuario, 'id'>> = {
      nombres: raw.nombres.trim() || undefined,
      apellidos: raw.apellidos.trim() || undefined,
      cedula: raw.cedula.trim() || undefined,
      telefono: raw.telefono.trim() || undefined,
      telefonoContacto: raw.telefonoContacto.trim() || undefined,
      correo: raw.correo.trim(),
      direccion: raw.direccion.trim() || undefined,
      foto: this.foto() ?? undefined,
      curriculum: this.curriculum() ?? undefined,
    };
    try {
      await this.usuarioService.actualizar(u.id, data);
      this.guardado.set(true);
      this.errorGuardado.set(null);
      setTimeout(() => this.guardado.set(false), 2500);
    } catch {
      this.errorGuardado.set('No se pudo guardar: el almacenamiento local está lleno. Reduce el tamaño de la foto o el curriculum.');
    }
  }

  private _leerArchivo(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  private _redimensionarFoto(file: File): Promise<string> {
    return this._leerArchivo(file).then(datos =>
      new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const escala = Math.min(1, MAX_FOTO / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * escala));
          canvas.height = Math.max(1, Math.round(img.height * escala));
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('canvas no disponible'));
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => reject(new Error('imagen inválida'));
        img.src = datos;
      }),
    );
  }
}
