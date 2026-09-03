import {Component, inject, ChangeDetectionStrategy, effect, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, Validators} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {UsuarioService} from '../../services/usuario.service';
import {RolService} from '../../services/rol.service';
import {PermisoDirective} from '../../directives/permiso.directive';
import {Usuario, Invitacion} from '../../models/usuario.model';

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

function estatusColor(estatus: string): {text: string; bg: string; label: string} {
  switch (estatus) {
    case 'activo': return {text: '#ffffff', bg: 'var(--color-emerald-600)', label: 'Activo'};
    case 'pendiente': return {text: 'var(--color-gray-900)', bg: 'var(--color-amber-400)', label: 'Pendiente'};
    case 'suspendido': return {text: '#ffffff', bg: 'var(--color-rose-600)', label: 'Suspendido'};
    default: return {text: 'var(--color-gray-700)', bg: 'var(--color-gray-200)', label: estatus};
  }
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, PermisoDirective],
  template: `
    <div class="row align-items-center mb-8">
      <div class="col-12 col-md">
        <h1>
          Usuarios
        </h1>
        <p class="mt-1 text-sm" style="color: var(--color-gray-500)">
          {{ usuarios().length }} usuario{{ usuarios().length !== 1 ? 's' : '' }}
          @if (pendientes() > 0) {
            <span class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  style="background-color: var(--color-amber-100); color: var(--color-amber-800);">
              {{ pendientes() }} pendiente{{ pendientes() !== 1 ? 's' : '' }}
            </span>
          }
        </p>
      </div>
      <div class="col-12 col-md-auto mt-3 mt-md-0 flex gap-2">
        <button *appPermiso="'crear'; recurso: 'usuarios'" (click)="abrirInvitar()"
                class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors shadow-sm border"
                style="border-color: var(--color-gray-300); color: var(--color-gray-700); background-color: var(--color-surface);">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
          <span class="d-none d-sm-inline">Invitar</span>
        </button>
        <button *appPermiso="'leer'; recurso: 'usuarios'" (click)="abrirGestionarInvitaciones()"
                class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors shadow-sm border"
                style="border-color: var(--color-gray-300); color: var(--color-gray-700); background-color: var(--color-surface);">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
          </svg>
          <span class="d-none d-sm-inline">Gestionar</span>
        </button>
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
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr style="border-bottom: 1px solid var(--color-gray-100);">
                <th class="text-left px-4 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Usuario</th>
                <th class="text-left px-4 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style="color: var(--color-gray-400);">Correo</th>
                <th class="text-left px-4 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Tipo</th>
                <th class="text-left px-4 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Estatus</th>
                <th class="text-right px-4 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Acciones</th>
              </tr>
            </thead>
            <tbody style="border-top: 1px solid var(--color-gray-100);">
              @for (usuario of usuarios(); track usuario.id) {
                <tr class="row-hover" style="transition: background-color 0.15s;">
                  <td class="px-4 sm:px-6 py-2.5">
                    <div class="flex items-center gap-3">
                      @if (usuario.foto) {
                        <img [src]="usuario.foto" [alt]="'Foto de ' + usuario.usuario"
                             class="w-8 h-8 rounded-full object-cover shrink-0">
                      } @else {
                        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                             [style.background-color]="tipoColor(usuario.tipo).bg"
                             [style.color]="tipoColor(usuario.tipo).text">
                          {{ usuario.usuario.charAt(0).toUpperCase() }}
                        </div>
                      }
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
                      {{ rolService.nombreDe(usuario.tipo) }}
                    </span>
                  </td>
                  <td class="px-4 sm:px-6 py-2.5">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          [style.color]="estatusColor(usuario.estatus ?? 'activo').text"
                          [style.background-color]="estatusColor(usuario.estatus ?? 'activo').bg">
                      {{ estatusColor(usuario.estatus ?? 'activo').label }}
                    </span>
                  </td>
                  <td class="px-4 sm:px-6 py-2.5 text-right">
                    <div class="flex items-center justify-end gap-1">
                      @if (usuario.estatus === 'pendiente') {
                        <button *appPermiso="'editar'; recurso: 'usuarios'" (click)="abrirAprobar(usuario)"
                                class="px-2 py-1 text-xs font-medium text-white rounded-lg transition-colors bg-[var(--color-emerald-600)] hover:bg-[var(--color-emerald-700)]">
                          Aprobar
                        </button>
                      }
                      <button *appPermiso="'editar'; recurso: 'usuarios'" (click)="abrirEditar(usuario)"
                              class="p-2 rounded-lg transition-colors text-[var(--color-gray-400)] hover:text-[var(--color-teal-600)] hover:bg-[var(--color-gray-100)]"
                              [attr.aria-label]="'Editar ' + usuario.usuario">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/>
                        </svg>
                      </button>
                      <button *appPermiso="'eliminar'; recurso: 'usuarios'" (click)="confirmarEliminar(usuario.id)"
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
      <div class="fixed inset-0 z-50 flex items-center justify-center-modal p-4" style="background-color: rgba(0,0,0,0.4);">
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

    <!-- Invite modal -->
    @if (showInvitar) {
      <div class="fixed inset-0 z-50 flex items-center justify-center-modal p-4" style="background-color: rgba(0,0,0,0.4);" (click)="cerrarInvitar()">
        <div class="modal-enter rounded-xl shadow-xl w-full max-w-md border overflow-hidden" style="background-color: var(--color-surface); border-color: var(--color-gray-200);" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between px-4 py-3 border-b" style="border-color: var(--color-gray-200);">
            <h2 class="text-sm font-bold" style="color: var(--color-gray-900);">Invitar usuario</h2>
            <button (click)="cerrarInvitar()"
                    class="p-0.5 rounded transition-colors" style="color: var(--color-gray-400);">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          @if (invitacionExito()) {
            <div class="p-4">
              <div class="px-4 py-3 rounded-lg text-sm flex items-center gap-2 mb-4"
                   style="background-color: var(--color-emerald-50); color: var(--color-emerald-700); border: 1px solid var(--color-emerald-200);">
                <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {{ invitacionExito() }}
              </div>
              <button (click)="cerrarInvitar()"
                      class="w-full px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-700)]">
                Cerrar
              </button>
            </div>
          } @else {
            @if (invitacionError()) {
              <div class="px-4 py-3 mx-4 mt-4 rounded-lg text-sm flex items-center gap-2"
                   style="background-color: var(--color-rose-50); color: var(--color-rose-700); border: 1px solid var(--color-rose-200);">
                {{ invitacionError() }}
              </div>
            }

            <form [formGroup]="invitarForm" (ngSubmit)="onInvitar()" class="p-4 space-y-3">
              <div>
                <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Correo electrónico</label>
                <input formControlName="correo" type="email" autocomplete="off"
                       class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors"
                       style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);"
                       placeholder="correo@ejemplo.com">
                @if (invitarForm.controls.correo.touched && invitarForm.controls.correo.invalid) {
                  <p class="mt-1 text-xs" style="color: var(--color-rose-500);">Ingresa un correo válido.</p>
                }
              </div>

              <div>
                <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Rol sugerido (opcional)</label>
                <select formControlName="rolId"
                        class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors"
                        style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);">
                  <option value="">Sin rol específico</option>
                  @for (rol of rolService.rolesUsables(); track rol.id) {
                    <option [value]="rol.id">{{ rol.nombre }}</option>
                  }
                </select>
              </div>

              <div class="flex justify-end gap-3 pt-1.5 border-t" style="border-color: var(--color-gray-200);">
                <button type="button" (click)="cerrarInvitar()"
                        class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors text-[var(--color-gray-700)] bg-[var(--color-gray-100)] hover:bg-[var(--color-gray-200)]">
                  Cancelar
                </button>
                <button type="submit"
                        class="px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-700)]"
                        [disabled]="invitarForm.invalid || invitacionLoading()">
                  {{ invitacionLoading() ? 'Enviando...' : 'Enviar invitación' }}
                </button>
              </div>
            </form>
          }
        </div>
      </div>
    }

    <!-- Approve modal -->
    @if (aprobarUsuario) {
      <div class="fixed inset-0 z-50 flex items-center justify-center-modal p-4" style="background-color: rgba(0,0,0,0.4);" (click)="cerrarAprobar()">
        <div class="modal-enter rounded-xl shadow-xl w-full max-w-md border overflow-hidden" style="background-color: var(--color-surface); border-color: var(--color-gray-200);" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between px-4 py-3 border-b" style="border-color: var(--color-gray-200);">
            <h2 class="text-sm font-bold" style="color: var(--color-gray-900);">Aprobar usuario</h2>
            <button (click)="cerrarAprobar()"
                    class="p-0.5 rounded transition-colors" style="color: var(--color-gray-400);">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <form [formGroup]="aprobarForm" (ngSubmit)="onAprobar()" class="p-4 space-y-3">
            <p class="text-sm" style="color: var(--color-gray-500);">
              Asigna un rol a <strong>{{ aprobarUsuario.usuario }}</strong> ({{ aprobarUsuario.correo }}) para activar su cuenta.
            </p>

            <div>
              <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Rol</label>
              <select formControlName="rolId"
                      class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors"
                      style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);">
                @for (rol of rolService.rolesUsables(); track rol.id) {
                  <option [value]="rol.id">{{ rol.nombre }}</option>
                }
              </select>
            </div>

            <div class="flex justify-end gap-3 pt-1.5 border-t" style="border-color: var(--color-gray-200);">
              <button type="button" (click)="cerrarAprobar()"
                      class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors text-[var(--color-gray-700)] bg-[var(--color-gray-100)] hover:bg-[var(--color-gray-200)]">
                Cancelar
              </button>
              <button type="submit"
                      class="px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--color-emerald-600)] hover:bg-[var(--color-emerald-700)]"
                      [disabled]="aprobarForm.invalid">
                Aprobar y activar
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Create/Edit form modal -->
    @if (showForm) {
      <div class="fixed inset-0 z-50 flex items-center justify-center-modal p-4" style="background-color: rgba(0,0,0,0.4);" (click)="cerrarForm()">
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
                @for (rol of rolService.rolesUsables(); track rol.id) {
                  <option [value]="rol.id">{{ rol.nombre }}</option>
                }
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

    <!-- Gestionar invitaciones modal -->
    @if (showGestionarInvitaciones) {
      <div class="fixed inset-0 z-50 flex items-center justify-center-modal p-4" style="background-color: rgba(0,0,0,0.4);" (click)="cerrarGestionarInvitaciones()">
        <div class="modal-enter rounded-xl shadow-xl w-full max-w-3xl border overflow-hidden" style="background-color: var(--color-surface); border-color: var(--color-gray-200);" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between px-4 py-3 border-b" style="border-color: var(--color-gray-200);">
            <div class="flex items-center gap-2">
              <h2 class="text-sm font-bold" style="color: var(--color-gray-900);">Invitaciones</h2>
              @if (invitaciones().length > 0) {
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      style="background-color: var(--color-gray-100); color: var(--color-gray-600);">
                  {{ invitaciones().length }}
                </span>
              }
            </div>
            <button (click)="cerrarGestionarInvitaciones()"
                    class="p-0.5 rounded transition-colors" style="color: var(--color-gray-400);">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="p-4">
            @if (invitacionesLoading()) {
              <div class="text-center py-12">
                <p class="text-sm" style="color: var(--color-gray-400);">Cargando invitaciones...</p>
              </div>
            } @else if (invitaciones().length === 0) {
              <div class="text-center py-12">
                <svg class="w-12 h-12 mx-auto mb-3" style="color: var(--color-gray-300)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
                </svg>
                <p class="text-sm mb-1" style="color: var(--color-gray-500);">No hay invitaciones</p>
                <p class="text-xs" style="color: var(--color-gray-400);">Las invitaciones enviadas aparecerán aquí.</p>
              </div>
            } @else {
              <div class="rounded-lg border overflow-hidden mb-4" style="border-color: var(--color-gray-200);">
                <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead>
                      <tr style="border-bottom: 1px solid var(--color-gray-100);">
                        <th class="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Correo</th>
                        <th class="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style="color: var(--color-gray-400);">Rol</th>
                        <th class="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider hidden md:table-cell" style="color: var(--color-gray-400);">Enviada</th>
                        <th class="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider hidden md:table-cell" style="color: var(--color-gray-400);">Expira</th>
                        <th class="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Estado</th>
                        <th class="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Acciones</th>
                      </tr>
                    </thead>
                    <tbody style="border-top: 1px solid var(--color-gray-100);">
                      @for (inv of invitaciones(); track inv.id) {
                        <tr style="border-bottom: 1px solid var(--color-gray-50);">
                          <td class="px-4 py-2.5">
                            <span class="text-sm font-medium" style="color: var(--color-gray-900);">{{ inv.correo }}</span>
                          </td>
                          <td class="px-4 py-2.5 hidden sm:table-cell">
                            <span class="text-sm" style="color: var(--color-gray-500);">{{ inv.rolId ? rolService.nombreDe(inv.rolId) : '—' }}</span>
                          </td>
                          <td class="px-4 py-2.5 hidden md:table-cell">
                            <span class="text-xs" style="color: var(--color-gray-400);">{{ inv.createdAt | date:'dd/MM/yy HH:mm' }}</span>
                          </td>
                          <td class="px-4 py-2.5 hidden md:table-cell">
                            <span class="text-xs" style="color: var(--color-gray-400);">{{ inv.expiraEn | date:'dd/MM/yy HH:mm' }}</span>
                          </td>
                          <td class="px-4 py-2.5">
                            @if (inv.usadoEn) {
                              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                    style="background-color: var(--color-emerald-100); color: var(--color-emerald-700);">
                                Registrado
                              </span>
                            } @else if (isExpirada(inv)) {
                              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                    style="background-color: var(--color-gray-100); color: var(--color-gray-500);">
                                Expirado
                              </span>
                            } @else {
                              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                    style="background-color: var(--color-amber-100); color: var(--color-amber-700);">
                                Pendiente
                              </span>
                            }
                          </td>
                          <td class="px-4 py-2.5 text-right">
                            @if (!inv.usadoEn && !isExpirada(inv)) {
                              <div class="flex items-center justify-end gap-1">
                                <button *appPermiso="'editar'; recurso: 'usuarios'"
                                        (click)="reenviarInvitacion(inv)" [disabled]="reenviandoId() === inv.id"
                                        class="p-1.5 rounded-lg transition-colors text-[var(--color-gray-400)] hover:text-[var(--color-teal-600)] hover:bg-[var(--color-gray-100)]"
                                        title="Reenviar invitación">
                                  @if (reenviandoId() === inv.id) {
                                    <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                    </svg>
                                  } @else {
                                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                                    </svg>
                                  }
                                </button>
                                <button *appPermiso="'eliminar'; recurso: 'usuarios'"
                                        (click)="confirmarCancelarInvitacion(inv)"
                                        class="p-1.5 rounded-lg transition-colors text-[var(--color-gray-400)] hover:text-[var(--color-rose-600)] hover:bg-[var(--color-gray-100)]"
                                        title="Cancelar invitación">
                                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                                  </svg>
                                </button>
                              </div>
                            }
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }

            <div class="flex justify-between items-center pt-3 border-t" style="border-color: var(--color-gray-200);">
              <button (click)="cerrarGestionarInvitaciones(); abrirInvitar()"
                      class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors text-[var(--color-teal-700)] bg-[var(--color-teal-50)] hover:bg-[var(--color-teal-100)]">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
                Nueva invitación
              </button>
              <button (click)="cerrarGestionarInvitaciones()"
                      class="px-4 py-2 text-sm font-medium rounded-lg transition-colors text-[var(--color-gray-700)] bg-[var(--color-gray-100)] hover:bg-[var(--color-gray-200)]">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Cancel invitation confirmation -->
    @if (cancelarInvitacionId) {
      <div class="fixed inset-0 z-50 flex items-center justify-center-modal p-4" style="background-color: rgba(0,0,0,0.4);">
        <div class="modal-enter rounded-xl shadow-xl p-6 w-full max-w-sm border" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
          <h3 class="text-lg font-semibold mb-2" style="color: var(--color-gray-900);">Cancelar invitación</h3>
          <p class="text-sm mb-6" style="color: var(--color-gray-500);">
            ¿Cancelar la invitación a <strong>{{ cancelarInvitacionCorreo }}</strong>? Esta acción no se puede deshacer.
          </p>
          <div class="flex justify-end gap-3">
            <button (click)="cancelarCancelarInvitacion()"
                    class="px-4 py-2 text-sm font-medium rounded-lg transition-colors text-[var(--color-gray-700)] bg-[var(--color-gray-100)] hover:bg-[var(--color-gray-200)]">
              No, mantener
            </button>
            <button (click)="ejecutarCancelarInvitacion()"
                    class="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors bg-[var(--color-rose-600)] hover:bg-[var(--color-rose-700)]">
              Sí, cancelar
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: []
})
export class UsuariosComponent {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  protected readonly usuarioService = inject(UsuarioService);
  protected readonly rolService = inject(RolService);

  protected readonly usuarios = this.usuarioService.usuarios;
  protected readonly tipoColor = tipoColor;
  protected readonly estatusColor = estatusColor;

  protected readonly pendientes = signal(0);

  protected showForm = false;
  protected editandoUsuario: Usuario | null = null;
  protected deleteConfirmId: string | null = null;

  protected showInvitar = false;
  protected readonly invitacionLoading = signal(false);
  protected readonly invitacionExito = signal<string | null>(null);
  protected readonly invitacionError = signal<string | null>(null);

  protected aprobarUsuario: Usuario | null = null;

  protected showGestionarInvitaciones = false;
  protected readonly invitaciones = signal<Invitacion[]>([]);
  protected readonly invitacionesLoading = signal(false);
  protected readonly reenviandoId = signal<string | null>(null);
  protected cancelarInvitacionId: string | null = null;
  protected cancelarInvitacionCorreo = '';

  protected userForm = this.fb.nonNullable.group({
    usuario: ['', [Validators.required, Validators.minLength(3)]],
    correo: ['', [Validators.required, Validators.email]],
    clave: ['', [Validators.required, Validators.minLength(4)]],
    tipo: ['usuario', Validators.required],
  });

  protected invitarForm = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    rolId: [''],
  });

  protected aprobarForm = this.fb.nonNullable.group({
    rolId: ['usuario', Validators.required],
  });

  private tipoPorDefecto(): string {
    return this.rolService.rolesUsables()[0]?.id ?? 'usuario';
  }

  constructor() {
    effect(() => {
      const lista = this.usuarios();
      this.pendientes.set(lista.filter(u => u.estatus === 'pendiente').length);
    });

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

  confirmarEliminar(id: string): void {
    this.deleteConfirmId = id;
  }

  async ejecutarEliminar(): Promise<void> {
    if (this.deleteConfirmId) {
      await this.usuarioService.eliminar(this.deleteConfirmId);
    }
    this.deleteConfirmId = null;
  }

  cancelarEliminar(): void {
    this.deleteConfirmId = null;
  }

  abrirInvitar(): void {
    this.invitarForm.reset({correo: '', rolId: ''});
    this.invitacionExito.set(null);
    this.invitacionError.set(null);
    this.showInvitar = true;
  }

  cerrarInvitar(): void {
    this.showInvitar = false;
  }

  async onInvitar(): Promise<void> {
    if (this.invitarForm.invalid) return;
    this.invitacionLoading.set(true);
    this.invitacionError.set(null);

    const raw = this.invitarForm.getRawValue();
    try {
      const response = await firstValueFrom(
        this.http.post<{correo: string}>('api/usuarios/invitar', {
          correo: raw.correo,
          rolId: raw.rolId || undefined,
        }),
      );
      this.invitacionExito.set(`Invitación enviada a ${response.correo}`);
    } catch (e: any) {
      const msg = e?.error?.message ?? 'Error al enviar la invitación';
      this.invitacionError.set(Array.isArray(msg) ? msg.join('. ') : msg);
    } finally {
      this.invitacionLoading.set(false);
    }
  }

  abrirAprobar(usuario: Usuario): void {
    this.aprobarUsuario = usuario;
    this.aprobarForm.reset({rolId: 'usuario'});
  }

  cerrarAprobar(): void {
    this.aprobarUsuario = null;
  }

  async onAprobar(): Promise<void> {
    if (this.aprobarForm.invalid || !this.aprobarUsuario) return;
    const raw = this.aprobarForm.getRawValue();
    await this.usuarioService.actualizar(this.aprobarUsuario.id, {
      estatus: 'activo',
      tipo: raw.rolId,
    });
    this.cerrarAprobar();
  }

  async abrirGestionarInvitaciones(): Promise<void> {
    this.showGestionarInvitaciones = true;
    await this.cargarInvitaciones();
  }

  cerrarGestionarInvitaciones(): void {
    this.showGestionarInvitaciones = false;
  }

  async cargarInvitaciones(): Promise<void> {
    this.invitacionesLoading.set(true);
    try {
      const lista = await firstValueFrom(this.http.get<Invitacion[]>('api/usuarios/invitaciones'));
      this.invitaciones.set(lista ?? []);
    } catch {
      this.invitaciones.set([]);
    } finally {
      this.invitacionesLoading.set(false);
    }
  }

  isExpirada(inv: Invitacion): boolean {
    return !inv.usadoEn && new Date(inv.expiraEn).getTime() < Date.now();
  }

  async reenviarInvitacion(inv: Invitacion): Promise<void> {
    this.reenviandoId.set(inv.id);
    try {
      await firstValueFrom(this.http.post(`api/usuarios/invitaciones/${inv.id}/reenviar`, {}));
      await this.cargarInvitaciones();
    } catch {
      /* error silencioso */
    } finally {
      this.reenviandoId.set(null);
    }
  }

  confirmarCancelarInvitacion(inv: Invitacion): void {
    this.cancelarInvitacionId = inv.id;
    this.cancelarInvitacionCorreo = inv.correo;
  }

  cancelarCancelarInvitacion(): void {
    this.cancelarInvitacionId = null;
    this.cancelarInvitacionCorreo = '';
  }

  async ejecutarCancelarInvitacion(): Promise<void> {
    if (!this.cancelarInvitacionId) return;
    try {
      await firstValueFrom(this.http.delete(`api/usuarios/invitaciones/${this.cancelarInvitacionId}`));
      this.invitaciones.update(list => list.filter(i => i.id !== this.cancelarInvitacionId));
    } catch {
      /* error silencioso */
    } finally {
      this.cancelarInvitacionId = null;
      this.cancelarInvitacionCorreo = '';
    }
  }
}
