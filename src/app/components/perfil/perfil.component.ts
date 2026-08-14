import {Component, inject, signal, computed, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, Validators} from '@angular/forms';
import {InputText} from 'primeng/inputtext';
import {Textarea} from 'primeng/textarea';
import {Button} from 'primeng/button';
import {Avatar} from 'primeng/avatar';
import {Chip} from 'primeng/chip';
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
  imports: [CommonModule, ReactiveFormsModule, InputText, Textarea, Button, Avatar, Chip],
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
            <p-avatar [image]="foto()!" shape="circle"
                      [style]="{'width': '6rem', 'height': '6rem', 'font-size': '2rem', 'border': '2px solid var(--color-gray-200)'}"
                      class="mx-auto mb-4 block" />
          } @else {
            <p-avatar [label]="inicialesUsuario()" shape="circle"
                      [style]="{'width': '6rem', 'height': '6rem', 'font-size': '2rem', 'background-color': 'var(--color-indigo-100)', 'color': 'var(--color-indigo-700)', 'border': '2px solid var(--color-gray-200)'}"
                      class="mx-auto mb-4 block" />
          }
          <p class="text-sm font-medium truncate" style="color: var(--color-gray-900);">{{ nombreCompleto() }}</p>
          <p class="text-xs truncate mt-0.5" style="color: var(--color-gray-500);">{{ usuario()?.usuario }}</p>

          <input #fotoInput type="file" accept="image/*" class="hidden" (change)="onFotoSeleccionada($event)">
          <div class="flex items-center justify-center gap-2 mt-5">
            <p-button label="Cambiar foto" icon="pi pi-camera" severity="contrast"
                      (onClick)="fotoInput.click()" />
            @if (foto()) {
              <p-button icon="pi pi-trash" [text]="true" severity="danger" [rounded]="true"
                        (onClick)="quitarFoto()" [attr.aria-label]="'Quitar foto'" />
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
                <input pInputText formControlName="nombres" type="text" autocomplete="given-name" class="w-full" placeholder="Tus nombres">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Apellidos</label>
                <input pInputText formControlName="apellidos" type="text" autocomplete="family-name" class="w-full" placeholder="Tus apellidos">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Cédula de identidad</label>
                <input pInputText formControlName="cedula" type="text" autocomplete="off" class="w-full" placeholder="V-12345678">
                @if (perfilForm.controls.cedula.touched && perfilForm.controls.cedula.invalid) {
                  <small class="mt-1 flex items-center gap-1 text-xs" style="color: var(--color-rose-500);">
                    <i class="pi pi-exclamation-circle"></i> Cédula inválida.
                  </small>
                }
              </div>
              <div>
                <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Número telefónico</label>
                <input pInputText formControlName="telefono" type="tel" autocomplete="tel" class="w-full" placeholder="+58 412-1234567">
                @if (perfilForm.controls.telefono.touched && perfilForm.controls.telefono.invalid) {
                  <small class="mt-1 flex items-center gap-1 text-xs" style="color: var(--color-rose-500);">
                    <i class="pi pi-exclamation-circle"></i> Teléfono inválido.
                  </small>
                }
              </div>
              <div>
                <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Número de contacto</label>
                <input pInputText formControlName="telefonoContacto" type="tel" autocomplete="tel" class="w-full" placeholder="Teléfono alternativo">
                @if (perfilForm.controls.telefonoContacto.touched && perfilForm.controls.telefonoContacto.invalid) {
                  <small class="mt-1 flex items-center gap-1 text-xs" style="color: var(--color-rose-500);">
                    <i class="pi pi-exclamation-circle"></i> Teléfono inválido.
                  </small>
                }
              </div>
              <div>
                <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Email</label>
                <input pInputText formControlName="correo" type="email" autocomplete="email" class="w-full" placeholder="ejemplo@correo.com">
                @if (perfilForm.controls.correo.touched && perfilForm.controls.correo.invalid) {
                  <small class="mt-1 flex items-center gap-1 text-xs" style="color: var(--color-rose-500);">
                    <i class="pi pi-exclamation-circle"></i> Ingresa un correo válido.
                  </small>
                }
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Dirección de vivienda</label>
              <textarea pTextarea formControlName="direccion" rows="2" autocomplete="street-address"
                        class="w-full resize-y" placeholder="Calle, urbanización, ciudad…"></textarea>
            </div>

            <div class="flex justify-end pt-1.5 border-t" style="border-color: var(--color-gray-200);">
              <p-button type="submit" label="Guardar" icon="pi pi-check" [disabled]="perfilForm.invalid" />
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
              <p-chip>
                <i class="pi pi-file"></i>
                <span class="max-w-48 truncate font-medium">{{ curriculum()!.nombre }}</span>
                <span style="color: var(--color-gray-400);">· {{ formatoTamano(curriculum()!.tamano) }}</span>
              </p-chip>
              <p-button icon="pi pi-download" [text]="true" severity="secondary" [rounded]="true"
                        (onClick)="descargarCurriculum()" [attr.aria-label]="'Descargar ' + curriculum()!.nombre" />
              <p-button icon="pi pi-times" [text]="true" severity="danger" [rounded]="true"
                        (onClick)="quitarCurriculum()" [attr.aria-label]="'Quitar curriculum'" />
            </div>
          } @else {
            <p class="text-sm" style="color: var(--color-gray-400);">No has adjuntado un curriculum.</p>
          }
        </div>
        <div class="mt-4 pt-4 border-t" style="border-color: var(--color-gray-200);">
          <input #cvInput type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                 class="hidden" (change)="onCurriculumSeleccionado($event)">
          <p-button [label]="curriculum() ? 'Reemplazar curriculum' : 'Adjuntar curriculum'"
                    icon="pi pi-upload" (onClick)="cvInput.click()" />
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
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
