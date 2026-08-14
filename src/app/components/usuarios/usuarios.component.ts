import {Component, inject, ChangeDetectionStrategy, effect} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, Validators} from '@angular/forms';
import {TableModule} from 'primeng/table';
import {Dialog} from 'primeng/dialog';
import {InputText} from 'primeng/inputtext';
import {Password} from 'primeng/password';
import {Select} from 'primeng/select';
import {Button} from 'primeng/button';
import {Tag} from 'primeng/tag';
import {Avatar} from 'primeng/avatar';
import {ConfirmationService} from 'primeng/api';
import {UsuarioService} from '../../services/usuario.service';
import {RolService} from '../../services/rol.service';
import {PermisoDirective} from '../../directives/permiso.directive';
import {Usuario} from '../../models/usuario.model';

function tipoColor(tipo: string): {text: string; bg: string} {
  switch (tipo) {
    case 'super-administrador': return {text: '#ffffff', bg: 'var(--color-purple-600)'};
    case 'administrador': return {text: '#ffffff', bg: 'var(--color-indigo-600)'};
    case 'supervisor': return {text: '#ffffff', bg: 'var(--color-blue-500)'};
    case 'qa': return {text: 'var(--color-gray-900)', bg: 'var(--color-amber-400)'};
    case 'usuario': return {text: 'var(--color-gray-700)', bg: 'var(--color-gray-200)'};
    default: return {text: 'var(--color-gray-900)', bg: 'var(--color-teal-200)'};
  }
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, PermisoDirective, TableModule, Dialog, InputText, Password, Select, Button, Tag, Avatar],
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
        <button *appPermiso="'crear'; recurso: 'usuarios'" (click)="abrirNuevo()"
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
        <button *appPermiso="'crear'; recurso: 'usuarios'" (click)="abrirNuevo()"
                class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-700)]">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Crear usuario
        </button>
      </div>
    } @else {
      <div class="rounded-xl border shadow-sm overflow-hidden" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
        <p-table [value]="usuarios()" [tableStyle]="{'min-width': '50rem'}" [rowHover]="true" [stripedRows]="true">
          <ng-template pTemplate="header">
            <tr>
              <th class="text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style="color: var(--color-gray-400);">Usuario</th>
              <th class="text-xs font-semibold uppercase tracking-wider hidden sm:table-cell whitespace-nowrap" style="color: var(--color-gray-400);">Correo</th>
              <th class="text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style="color: var(--color-gray-400);">Tipo</th>
              <th class="text-right text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style="color: var(--color-gray-400);">Acciones</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-usuario>
            <tr class="usuario-row" style="transition: background-color 0.15s;">
              <td>
                <div class="flex items-center gap-3">
                  @if (usuario.foto) {
                    <p-avatar [image]="usuario.foto" shape="circle" [style]="{width: '2rem', height: '2rem'}" />
                  } @else {
                    <p-avatar [label]="usuario.usuario.charAt(0).toUpperCase()" shape="circle"
                              [style]="{'width': '2rem', 'height': '2rem', backgroundColor: tipoColor(usuario.tipo).bg, color: tipoColor(usuario.tipo).text}" />
                  }
                  <span class="text-sm font-medium whitespace-nowrap" style="color: var(--color-gray-900);">{{ usuario.usuario }}</span>
                </div>
              </td>
              <td class="hidden sm:table-cell">
                <span class="text-sm" style="color: var(--color-gray-500);">{{ usuario.correo }}</span>
              </td>
              <td>
                <p-tag [value]="rolService.nombreDe(usuario.tipo)"
                       [style]="{backgroundColor: tipoColor(usuario.tipo).bg, color: tipoColor(usuario.tipo).text}" />
              </td>
              <td class="text-right">
                <div class="flex items-center justify-end gap-1">
                  <p-button *appPermiso="'editar'; recurso: 'usuarios'" (onClick)="abrirEditar(usuario)"
                            icon="pi pi-pencil" [text]="true" [rounded]="true" severity="secondary" size="small"
                            [attr.aria-label]="'Editar ' + usuario.usuario" />
                  <p-button *appPermiso="'eliminar'; recurso: 'usuarios'" (onClick)="confirmarEliminar(usuario)"
                            icon="pi pi-trash" [text]="true" [rounded]="true" severity="danger" size="small"
                            [attr.aria-label]="'Eliminar ' + usuario.usuario" />
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    }

    <!-- Create/Edit form modal -->
    <p-dialog
      [visible]="showForm"
      (onHide)="cerrarForm()"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [closeOnEscape]="true"
      [dismissableMask]="true"
      [style]="{width: '26rem'}"
      [breakpoints]="{'575px': '95vw'}"
      [header]="editandoUsuario ? 'Editar usuario' : 'Nuevo usuario'">
      @if (showForm) {
        <form [formGroup]="userForm" (ngSubmit)="onGuardar()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: var(--color-gray-700);">Usuario</label>
            <input pInputText formControlName="usuario" type="text" autocomplete="off" class="w-full" placeholder="Ej: jperez" autofocus>
            @if (userForm.controls.usuario.touched && userForm.controls.usuario.invalid) {
              <small class="mt-1 flex items-center gap-1 text-xs" style="color: var(--color-rose-500);">
                <i class="pi pi-exclamation-circle"></i> El usuario debe tener al menos 3 caracteres.
              </small>
            }
          </div>

          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: var(--color-gray-700);">Correo</label>
            <input pInputText formControlName="correo" type="email" autocomplete="off" class="w-full" placeholder="ejemplo@correo.com">
            @if (userForm.controls.correo.touched && userForm.controls.correo.invalid) {
              <small class="mt-1 flex items-center gap-1 text-xs" style="color: var(--color-rose-500);">
                <i class="pi pi-exclamation-circle"></i> Ingresa un correo válido.
              </small>
            }
          </div>

          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: var(--color-gray-700);">
              Contraseña
              @if (editandoUsuario) {
                <span style="color: var(--color-gray-400); font-weight: 400;">(dejar en blanco para mantener)</span>
              }
            </label>
            <p-password formControlName="clave" [toggleMask]="true" [feedback]="false" [style]="{width: '100%'}"
                        [inputStyle]="{width: '100%'}" class="w-full" fluid="true"
                        [placeholder]="editandoUsuario ? 'Sin cambios' : 'Contraseña'"
                        autocomplete="new-password" />
            @if (userForm.controls.clave.touched && userForm.controls.clave.invalid) {
              @if (userForm.controls.clave.errors?.['required']) {
                <small class="mt-1 flex items-center gap-1 text-xs" style="color: var(--color-rose-500);">
                  <i class="pi pi-exclamation-circle"></i> La contraseña es requerida.
                </small>
              }
              @if (userForm.controls.clave.errors?.['minlength']) {
                <small class="mt-1 flex items-center gap-1 text-xs" style="color: var(--color-rose-500);">
                  <i class="pi pi-exclamation-circle"></i> Mínimo 4 caracteres.
                </small>
              }
            }
          </div>

          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: var(--color-gray-700);">Tipo</label>
            <p-select formControlName="tipo"
                      [options]="rolService.rolesUsables()"
                      optionLabel="nombre"
                      optionValue="id"
                      placeholder="Selecciona un tipo"
                      [style]="{width: '100%'}" />
          </div>

          <div class="flex justify-end gap-3 pt-3.5 border-t" style="border-color: var(--color-gray-200);">
            <p-button label="Cancelar" [text]="true" severity="secondary" (onClick)="cerrarForm()" />
            <p-button [label]="editandoUsuario ? 'Guardar' : 'Crear'"
                      icon="pi pi-check"
                      [disabled]="userForm.invalid"
                      (onClick)="onGuardar()" />
          </div>
        </form>
      }
    </p-dialog>
  `,
  styles: [`
    .usuario-row:hover { background-color: var(--color-gray-50); }
  `]
})
export class UsuariosComponent {
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  protected readonly usuarioService = inject(UsuarioService);
  protected readonly rolService = inject(RolService);

  protected readonly usuarios = this.usuarioService.usuarios;
  protected readonly tipoColor = tipoColor;

  protected showForm = false;
  protected editandoUsuario: Usuario | null = null;

  protected userForm = this.fb.nonNullable.group({
    usuario: ['', [Validators.required, Validators.minLength(3)]],
    correo: ['', [Validators.required, Validators.email]],
    clave: ['', [Validators.required, Validators.minLength(4)]],
    tipo: ['usuario', Validators.required],
  });

  private tipoPorDefecto(): string {
    return this.rolService.rolesUsables()[0]?.id ?? 'usuario';
  }

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
          tipo: this.tipoPorDefecto(),
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

  async onGuardar(): Promise<void> {
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
      await this.usuarioService.actualizar(this.editandoUsuario.id, data);
    } else {
      await this.usuarioService.crear({
        usuario: raw.usuario,
        correo: raw.correo,
        clave: raw.clave,
        tipo: raw.tipo,
      });
    }
    this.cerrarForm();
  }

  confirmarEliminar(usuario: Usuario): void {
    this.confirmationService.confirm({
      header: 'Eliminar usuario',
      message: `¿Eliminar a «${usuario.usuario}»? Esta acción no se puede deshacer.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.usuarioService.eliminar(usuario.id),
    });
  }
}