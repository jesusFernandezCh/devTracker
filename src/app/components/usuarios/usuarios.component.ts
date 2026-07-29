import {Component, inject, ChangeDetectionStrategy, effect} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, Validators} from '@angular/forms';
import {UsuarioService} from '../../services/usuario.service';
import {Usuario, TipoUsuario} from '../../models/usuario.model';

function tipoColor(tipo: TipoUsuario): {text: string; bg: string} {
  switch (tipo) {
    case 'super-administrador': return {text: '#ffffff', bg: 'var(--color-purple-600)'};
    case 'administrador': return {text: '#ffffff', bg: 'var(--color-indigo-600)'};
    case 'supervisor': return {text: '#ffffff', bg: 'var(--color-blue-500)'};
    default: return {text: 'var(--color-gray-700)', bg: 'var(--color-gray-200)'};
  }
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="row align-items-center mb-8">
      <div class="col-12 col-md">
        <h1 class="text-3xl font-bold" style="color: var(--color-gray-900)">
          Usuarios
        </h1>
        <p class="mt-1 text-sm" style="color: var(--color-gray-500)">
          {{ usuarios().length }} usuario{{ usuarios().length !== 1 ? 's' : '' }}
        </p>
      </div>
      <div class="col-12 col-md-auto mt-3 mt-md-0">
        <button (click)="abrirNuevo()"
                class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors shadow-sm bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-700)]">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          <span class="d-none d-sm-inline">Usuario</span>
        </button>
      </div>
    </div>

    @if (usuarios().length === 0) {
      <div class="text-center py-20">
        <svg class="w-16 h-16 mx-auto mb-4" style="color: var(--color-gray-300)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        <h3 class="text-lg font-medium mb-2" style="color: var(--color-gray-500);">No hay usuarios</h3>
        <p class="text-sm mb-6" style="color: var(--color-gray-400);">Crea el primer usuario para empezar.</p>
        <button (click)="abrirNuevo()"
                class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-700)]">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Crear usuario
        </button>
      </div>
    } @else {
      <div class="rounded-xl border shadow-sm overflow-hidden" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr style="border-bottom: 1px solid var(--color-gray-100);">
                <th class="text-left px-4 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Usuario</th>
                <th class="text-left px-4 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style="color: var(--color-gray-400);">Correo</th>
                <th class="text-left px-4 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Tipo</th>
                <th class="text-right px-4 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Acciones</th>
              </tr>
            </thead>
            <tbody style="border-top: 1px solid var(--color-gray-100);">
              @for (usuario of usuarios(); track usuario.id) {
                <tr class="usuario-row" style="transition: background-color 0.15s;">
                  <td class="px-4 sm:px-6 py-2.5">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                           [style.background-color]="tipoColor(usuario.tipo).bg"
                           [style.color]="tipoColor(usuario.tipo).text">
                        {{ usuario.usuario.charAt(0).toUpperCase() }}
                      </div>
                      <span class="text-sm font-medium" style="color: var(--color-gray-900);">{{ usuario.usuario }}</span>
                    </div>
                  </td>
                  <td class="px-4 sm:px-6 py-2.5 hidden sm:table-cell">
                    <span class="text-sm" style="color: var(--color-gray-500);">{{ usuario.correo }}</span>
                  </td>
                  <td class="px-4 sm:px-6 py-2.5">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          [style.color]="tipoColor(usuario.tipo).text"
                          [style.background-color]="tipoColor(usuario.tipo).bg">
                      {{ usuario.tipo }}
                    </span>
                  </td>
                  <td class="px-4 sm:px-6 py-2.5 text-right">
                    <div class="flex items-center justify-end gap-1">
                      <button (click)="abrirEditar(usuario)"
                              class="p-2 rounded-lg transition-colors text-[var(--color-gray-400)] hover:text-[var(--color-teal-600)] hover:bg-[var(--color-gray-100)]"
                              [attr.aria-label]="'Editar ' + usuario.usuario">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/>
                        </svg>
                      </button>
                      <button (click)="confirmarEliminar(usuario.id)"
                              class="p-2 rounded-lg transition-colors text-[var(--color-gray-400)] hover:text-[var(--color-rose-600)] hover:bg-[var(--color-gray-100)]"
                              [attr.aria-label]="'Eliminar ' + usuario.usuario">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    <!-- Delete confirmation -->
    @if (deleteConfirmId) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background-color: rgba(0,0,0,0.4);">
        <div class="modal-enter rounded-xl shadow-xl p-6 w-full max-w-sm border" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
          <h3 class="text-lg font-semibold mb-2" style="color: var(--color-gray-900);">Eliminar usuario</h3>
          <p class="text-sm mb-6" style="color: var(--color-gray-500);">
            ¿Eliminar este usuario? Esta acción no se puede deshacer.
          </p>
          <div class="flex justify-end gap-3">
            <button (click)="cancelarEliminar()"
                    class="px-4 py-2 text-sm font-medium rounded-lg transition-colors text-[var(--color-gray-700)] bg-[var(--color-gray-100)] hover:bg-[var(--color-gray-200)]">
              Cancelar
            </button>
            <button (click)="ejecutarEliminar()"
                    class="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors bg-[var(--color-rose-600)] hover:bg-[var(--color-rose-700)]">
              Eliminar
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Create/Edit form modal -->
    @if (showForm) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background-color: rgba(0,0,0,0.4);" (click)="cerrarForm()">
        <div class="modal-enter rounded-xl shadow-xl w-full max-w-md border overflow-hidden" style="background-color: var(--color-surface); border-color: var(--color-gray-200);" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between px-4 py-3 border-b" style="border-color: var(--color-gray-200);">
            <h2 class="text-sm font-bold" style="color: var(--color-gray-900);">
              {{ editandoUsuario ? 'Editar usuario' : 'Nuevo usuario' }}
            </h2>
            <button (click)="cerrarForm()"
                    class="p-0.5 rounded transition-colors" style="color: var(--color-gray-400);">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <form [formGroup]="userForm" (ngSubmit)="onGuardar()" class="p-4 space-y-3">
            <div>
              <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Usuario</label>
              <input formControlName="usuario" type="text" autocomplete="off"
                     class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors"
                     style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);"
                     placeholder="Ej: jperez">
              @if (userForm.controls.usuario.touched && userForm.controls.usuario.invalid) {
                <p class="mt-1 text-xs" style="color: var(--color-rose-500);">El usuario debe tener al menos 3 caracteres.</p>
              }
            </div>

            <div>
              <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Correo</label>
              <input formControlName="correo" type="email" autocomplete="off"
                     class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors"
                     style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);"
                     placeholder="ejemplo@correo.com">
              @if (userForm.controls.correo.touched && userForm.controls.correo.invalid) {
                <p class="mt-1 text-xs" style="color: var(--color-rose-500);">Ingresa un correo válido.</p>
              }
            </div>

            <div>
              <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">
                Contraseña
                @if (editandoUsuario) {
                  <span style="color: var(--color-gray-400); font-weight: 400;">(dejar en blanco para mantener)</span>
                }
              </label>
              <input formControlName="clave" type="password" autocomplete="new-password"
                     class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors"
                     style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);"
                     placeholder="{{ editandoUsuario ? 'Sin cambios' : 'Contraseña' }}">
              @if (userForm.controls.clave.touched && userForm.controls.clave.invalid) {
                @if (userForm.controls.clave.errors?.['required']) {
                  <p class="mt-1 text-xs" style="color: var(--color-rose-500);">La contraseña es requerida.</p>
                }
                @if (userForm.controls.clave.errors?.['minlength']) {
                  <p class="mt-1 text-xs" style="color: var(--color-rose-500);">Mínimo 4 caracteres.</p>
                }
              }
            </div>

            <div>
              <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Tipo</label>
              <select formControlName="tipo"
                      class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors"
                      style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);">
                <option value="usuario">Usuario</option>
                <option value="supervisor">Supervisor</option>
                <option value="administrador">Administrador</option>
                <option value="super-administrador">Super Administrador</option>
              </select>
            </div>

            <div class="flex justify-end gap-3 pt-1.5 border-t" style="border-color: var(--color-gray-200);">
              <button type="button" (click)="cerrarForm()"
                      class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors text-[var(--color-gray-700)] bg-[var(--color-gray-100)] hover:bg-[var(--color-gray-200)]">
                Cancelar
              </button>
              <button type="submit"
                      class="px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-700)]"
                      [disabled]="userForm.invalid">
                {{ editandoUsuario ? 'Guardar' : 'Crear' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .usuario-row:hover { background-color: var(--color-gray-50); }
  `]
})
export class UsuariosComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly usuarioService = inject(UsuarioService);

  protected readonly usuarios = this.usuarioService.usuarios;
  protected readonly tipoColor = tipoColor;

  protected showForm = false;
  protected editandoUsuario: Usuario | null = null;
  protected deleteConfirmId: string | null = null;

  protected userForm = this.fb.nonNullable.group({
    usuario: ['', [Validators.required, Validators.minLength(3)]],
    correo: ['', [Validators.required, Validators.email]],
    clave: ['', [Validators.required, Validators.minLength(4)]],
    tipo: ['usuario' as TipoUsuario, Validators.required],
  });

  constructor() {
    effect(() => {
      const user = this.editandoUsuario;
      if (user) {
        this.userForm.setValue({
          usuario: user.usuario,
          correo: user.correo,
          clave: '',
          tipo: user.tipo,
        });
        this.userForm.controls.clave.clearValidators();
      } else {
        this.userForm.reset({
          usuario: '',
          correo: '',
          clave: '',
          tipo: 'usuario',
        });
        this.userForm.controls.clave.setValidators([Validators.required, Validators.minLength(4)]);
      }
      this.userForm.controls.clave.updateValueAndValidity();
    });
  }

  abrirNuevo(): void {
    this.editandoUsuario = null;
    this.showForm = true;
  }

  abrirEditar(usuario: Usuario): void {
    this.editandoUsuario = usuario;
    this.showForm = true;
  }

  cerrarForm(): void {
    this.showForm = false;
    this.editandoUsuario = null;
  }

  onGuardar(): void {
    if (this.userForm.invalid) return;
    const raw = this.userForm.getRawValue();
    if (this.editandoUsuario) {
      const data: Partial<Omit<Usuario, 'id'>> = {
        usuario: raw.usuario,
        correo: raw.correo,
        tipo: raw.tipo,
      };
      if (raw.clave) {
        data.clave = raw.clave;
      }
      this.usuarioService.actualizar(this.editandoUsuario.id, data);
    } else {
      this.usuarioService.crear({
        usuario: raw.usuario,
        correo: raw.correo,
        clave: raw.clave,
        tipo: raw.tipo,
      });
    }
    this.cerrarForm();
  }

  confirmarEliminar(id: string): void {
    this.deleteConfirmId = id;
  }

  ejecutarEliminar(): void {
    if (this.deleteConfirmId) {
      this.usuarioService.eliminar(this.deleteConfirmId);
    }
    this.deleteConfirmId = null;
  }

  cancelarEliminar(): void {
    this.deleteConfirmId = null;
  }
}
