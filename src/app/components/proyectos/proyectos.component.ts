import {Component, inject, ChangeDetectionStrategy, signal, computed, effect} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {ProyectoService} from '../../services/proyecto.service';
import {PlanningService} from '../../services/planning.service';
import {ColumnService} from '../../services/column.service';
import {EquipoService} from '../../services/equipo.service';
import {UsuarioService} from '../../services/usuario.service';
import {AuthService} from '../../services/auth.service';
import {NotificacionService} from '../../services/notificacion.service';
import {Proyecto, ProyectoConDatos} from '../../models/proyecto.model';
import {Usuario} from '../../models/usuario.model';
import {statusColor, prioridadColor, estimacionTotal} from '../../utils/estimacion';
import {iniciales, tipoColor} from '../../utils/helpers';
import {ROL_SUPER_ADMIN_ID} from '../../models/permiso.model';
import {ProyectoFormComponent} from '../proyecto-form/proyecto-form.component';
import {EquipoModalComponent} from '../equipo-modal/equipo-modal.component';
import {PermisoDirective} from '../../directives/permiso.directive';

const PAGINA_SIZE = 10;

@Component({
  selector: 'app-proyectos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ProyectoFormComponent, EquipoModalComponent, PermisoDirective],
  template: `
    <div class="row align-items-center mb-8">
      <div class="col-12 col-md">
        <h1 class="text-3xl font-bold" style="color: var(--color-gray-900)">
          Proyectos
        </h1>
        <p class="mt-1 text-sm" style="color: var(--color-gray-500)">
          {{ proyectosFiltrados().length }} proyecto{{ proyectosFiltrados().length !== 1 ? 's' : '' }}
        </p>
      </div>
      <div class="col-12 col-md-auto mt-3 mt-md-0 d-flex align-items-center gap-2">
        <button *appPermiso="'crear'; recurso: 'proyectos'" (click)="abrirNuevo()"
                class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors shadow-sm bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-700)]">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          <span class="d-none d-sm-inline">Proyecto</span>
        </button>
      </div>
    </div>

      @if (proyectosFiltrados().length === 0) {
        <div class="text-center py-20">
          <svg class="w-16 h-16 mx-auto mb-4" style="color: var(--color-gray-300)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"/>
          </svg>
          @if (!esAdmin() && proyectos().length > 0) {
            <h3 class="text-lg font-medium mb-2" style="color: var(--color-gray-500)">No tienes proyectos asignados</h3>
            <p class="text-sm mb-6" style="color: var(--color-gray-400)">Solo puedes ver los proyectos en los que estás asociado.</p>
          } @else {
            <h3 class="text-lg font-medium mb-2" style="color: var(--color-gray-500)">No hay proyectos</h3>
            <p class="text-sm mb-6" style="color: var(--color-gray-400)">Crea tu primer proyecto para empezar.</p>
          }
          <button *appPermiso="'crear'; recurso: 'proyectos'" (click)="abrirNuevo()"
                  class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-700)]">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Crear proyecto
          </button>
        </div>
      } @else {
        <div class="rounded-xl border shadow-sm overflow-hidden" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[1050px]">
              <thead>
                <tr style="border-bottom: 1px solid var(--color-gray-100);">
                  <th class="text-left px-4 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Nombre</th>
                  <th class="text-left px-4 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Fecha inicio</th>
                  <th class="text-left px-4 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Cliente</th>
                  <th class="text-left px-4 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Estado</th>
                  <th class="text-left px-4 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Prioridad</th>
                  <th class="text-left px-4 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Equipo</th>
                  <th class="text-left px-4 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Figma</th>
                  <th class="text-right px-4 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Acciones</th>
                </tr>
              </thead>
              <tbody style="border-top: 1px solid var(--color-gray-100);">
                @for (proyecto of proyectosPagina(); track proyecto.id) {
                  <tr class="proyecto-row" style="transition: background-color 0.15s;">
                    <td class="px-4 sm:px-6 py-2.5 border-l-2 transition-all duration-200 hover:border-[rgba(13,148,136,1)] hover:pl-7" style="border-color: rgba(13, 148, 136, 0.5);">
                      <button (click)="abrirDetalle(proyecto)"
                              class="flex items-center gap-3 text-left group"
                              [attr.aria-label]="'Ver detalles de ' + proyecto.nombre">
                        <div class="w-2 h-2 rounded-full shrink-0" style="background-color: var(--color-teal-500);"></div>
                        <span class="text-sm font-medium transition-colors group-hover:text-[var(--color-teal-600)]" style="color: var(--color-gray-900);">{{ proyecto.nombre }}</span>
                      </button>
                    </td>
                    <td class="px-4 sm:px-6 py-2.5">
                      <span class="text-sm whitespace-nowrap" style="color: var(--color-gray-500);">
                        {{ proyecto.fechaDesde }}
                      </span>
                    </td>
                    <td class="px-4 sm:px-6 py-2.5">
                      <span class="text-sm" style="color: var(--color-gray-600);">{{ proyecto.cliente || '—' }}</span>
                    </td>
                    <td class="px-4 sm:px-6 py-2.5">
                      @if (proyecto.status) {
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
                              [style.color]="statusColor(proyecto.status).text" 
                              [style.background-color]="statusColor(proyecto.status).bg">
                          {{ proyecto.status }}
                        </span>
                      } @else {
                        <span class="text-sm" style="color: var(--color-gray-300);">—</span>
                      }
                    </td>
                    <td class="px-4 sm:px-6 py-2.5">
                      @if (proyecto.prioridad) {
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                              [style.color]="prioridadColor(proyecto.prioridad).text"
                              [style.background-color]="prioridadColor(proyecto.prioridad).bg">
                          {{ proyecto.prioridad }}
                        </span>
                      } @else {
                        <span class="text-sm" style="color: var(--color-gray-300);">—</span>
                      }
                    </td>
                    <td class="px-4 sm:px-6 py-2.5">
                      @let miembros = miembrosDeProyecto(proyecto.id);
                      @if (miembros.length > 0) {
                        <div class="flex items-center">
                          <div class="flex -space-x-1.5">
                            @for (m of miembros.slice(0, 3); track m.id) {
                              <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 shrink-0"
                                   [style.background-color]="tipoColor(m.tipo).bg"
                                   [style.color]="tipoColor(m.tipo).text"
                                   [style.border-color]="'var(--color-surface)'"
                                   [attr.title]="m.usuario">
                                {{ iniciales(m.usuario) }}
                              </div>
                            }
                            @if (miembros.length > 3) {
                              <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 shrink-0"
                                   style="background-color: var(--color-gray-100); color: var(--color-gray-600); border-color: var(--color-surface);"
                                   [attr.title]="'+' + (miembros.length - 3)">
                                +{{ miembros.length - 3 }}
                              </div>
                            }
                          </div>
                          <span class="ml-2 text-xs" style="color: var(--color-gray-400);">{{ miembros.length }}</span>
                        </div>
                      } @else {
                        <span class="text-sm" style="color: var(--color-gray-300);">—</span>
                      }
                    </td>
                    <td class="px-4 sm:px-6 py-2.5">
                      @if (proyecto.documentacion) {
                         <a [href]="proyecto.documentacion" target="_blank" rel="noopener"
                            class="inline-flex items-center gap-1.5 text-sm transition-colors text-[var(--color-teal-600)] hover:text-[var(--color-teal-700)]">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                          </svg>
                          Figma
                        </a>
                      } @else {
                        <span class="text-sm" style="color: var(--color-gray-300);">—</span>
                      }
                    </td>
                    <td class="px-4 sm:px-6 py-2.5 text-right">
                      <div class="flex items-center justify-end gap-1">
                        <button (click)="irAPlanning(proyecto.id)"
                                class="p-2 rounded-lg transition-colors text-[var(--color-gray-400)] hover:text-[var(--color-indigo-600)] hover:bg-[var(--color-gray-100)]"
                                [attr.aria-label]="'Ir a planning de ' + proyecto.nombre">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                        </button>
                        <button *appPermiso="'editar'; recurso: 'proyectos'" (click)="abrirEquipo(proyecto)"
                                class="p-2 rounded-lg transition-colors text-[var(--color-gray-400)] hover:text-[var(--color-indigo-600)] hover:bg-[var(--color-gray-100)]"
                                [attr.aria-label]="'Gestionar equipo de ' + proyecto.nombre">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                          </svg>
                        </button>
                        <button *appPermiso="'editar'; recurso: 'proyectos'" (click)="abrirEditar(proyecto)"
                                class="p-2 rounded-lg transition-colors text-[var(--color-gray-400)] hover:text-[var(--color-teal-600)] hover:bg-[var(--color-gray-100)]"
                                [attr.aria-label]="'Editar ' + proyecto.nombre">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/>
                          </svg>
                        </button>
                        <button *appPermiso="'eliminar'; recurso: 'proyectos'" (click)="confirmarEliminar(proyecto.id)"
                                class="p-2 rounded-lg transition-colors text-[var(--color-gray-400)] hover:text-[var(--color-rose-600)] hover:bg-[var(--color-gray-100)]"
                                [attr.aria-label]="'Eliminar ' + proyecto.nombre">
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

        @if (totalProyectos() > 0) {
          <div class="mt-4 flex items-center justify-between gap-4 flex-wrap no-print">
            <p class="text-sm" style="color: var(--color-gray-500);">
              Mostrando {{ paginaInicio() }}–{{ paginaFin() }} de {{ totalProyectos() }} proyecto{{ totalProyectos() !== 1 ? 's' : '' }}
            </p>
            <div class="flex items-center gap-1">
              <button (click)="paginaAnterior()" [disabled]="paginaActual() <= 1"
                      class="px-2.5 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-[var(--color-gray-600)] hover:bg-[var(--color-gray-100)]">
                Anterior
              </button>
              @if (paginasTotales() > 1) {
                @for (p of rangoPaginas(); track $index) {
                  @if (p === null) {
                    <span class="px-1 text-sm" style="color: var(--color-gray-400);">…</span>
                  } @else {
                    <button (click)="irPagina(p)"
                            class="min-w-[2rem] px-2 py-1.5 text-sm font-medium rounded-lg transition-colors"
                            [style.background-color]="p === paginaActual() ? 'var(--color-indigo-600)' : 'var(--color-surface)'"
                            [style.color]="p === paginaActual() ? '#ffffff' : 'var(--color-gray-600)'"
                            [style.border]="p === paginaActual() ? '1px solid var(--color-indigo-600)' : '1px solid var(--color-gray-200)'">
                      {{ p }}
                    </button>
                  }
                }
              }
              <button (click)="paginaSiguiente()" [disabled]="paginaActual() >= paginasTotales()"
                      class="px-2.5 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-[var(--color-gray-600)] hover:bg-[var(--color-gray-100)]">
                Siguiente
              </button>
            </div>
          </div>
        }
      }

      @if (detalleProyecto(); as detalle) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background-color: rgba(0,0,0,0.4);" (click)="cerrarDetalle()">
          <div class="modal-enter rounded-xl shadow-xl w-full max-w-md border overflow-hidden" style="background-color: var(--color-surface); border-color: var(--color-gray-200);" (click)="$event.stopPropagation()">
            <div class="flex items-start justify-between gap-4 px-6 py-3 border-b" style="border-color: var(--color-gray-100);">
              <div class="min-w-0">
                <h3 class="text-lg font-semibold leading-tight" style="color: var(--color-gray-900);">{{ detalle.proyecto.nombre }}</h3>
                @if (detalle.proyecto.cliente) {
                  <p class="text-sm mt-0.5" style="color: var(--color-gray-500);">{{ detalle.proyecto.cliente }}</p>
                }
              </div>
              <button (click)="cerrarDetalle()"
                      class="shrink-0 p-1.5 rounded-lg transition-colors text-[var(--color-gray-400)] hover:text-[var(--color-gray-700)] hover:bg-[var(--color-gray-100)]"
                      aria-label="Cerrar detalle">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div class="px-6 py-3">
              @if (detalle.proyecto.descripcion) {
                <div class="rounded-lg p-3 mb-5" style="background-color: var(--color-gray-50);">
                  <p class="text-sm leading-relaxed" style="color: var(--color-gray-600);">{{ detalle.proyecto.descripcion }}</p>
                </div>
              }

              <div class="grid grid-cols-2 gap-x-4 gap-y-4">
                <div>
                  <span class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Estado</span>
                  <div class="mt-1">
                    @if (detalle.proyecto.status) {
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            [style.color]="statusColor(detalle.proyecto.status).text"
                            [style.background-color]="statusColor(detalle.proyecto.status).bg">
                        {{ detalle.proyecto.status }}
                      </span>
                    } @else { <span class="text-sm" style="color: var(--color-gray-300);">—</span> }
                  </div>
                </div>
                <div>
                  <span class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Prioridad</span>
                  <div class="mt-1">
                    @if (detalle.proyecto.prioridad) {
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            [style.color]="prioridadColor(detalle.proyecto.prioridad).text"
                            [style.background-color]="prioridadColor(detalle.proyecto.prioridad).bg">
                        {{ detalle.proyecto.prioridad }}
                      </span>
                    } @else { <span class="text-sm" style="color: var(--color-gray-300);">—</span> }
                  </div>
                </div>
                <div>
                  <span class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Ambiente</span>
                  <p class="mt-1 text-sm flex items-center gap-1.5" style="color: var(--color-gray-800);">
                    <span class="w-2 h-2 rounded-full" [style.background-color]="columnaColor(detalle.proyecto.columnaId)"></span>
                    {{ nombreColumna(detalle.proyecto.columnaId) }}
                  </p>
                </div>
                <div>
                  <span class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Documentación</span>
                  @if (detalle.proyecto.documentacion) {
                    <a [href]="detalle.proyecto.documentacion" target="_blank" rel="noopener"
                       class="mt-1 inline-flex items-center gap-1.5 text-sm text-[var(--color-teal-600)] hover:text-[var(--color-teal-700)]">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                      </svg>
                      Abrir Figma
                    </a>
                  } @else { <p class="mt-1 text-sm" style="color: var(--color-gray-300);">—</p> }
                </div>
                <div class="col-span-2">
                  <span class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Duración</span>
                  <p class="mt-1 text-sm" style="color: var(--color-gray-800);">
                    {{ detalle.proyecto.fechaDesde || '—' }} — {{ detalle.proyecto.fechaHasta || '—' }}
                  </p>
                </div>
              </div>

              <div class="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div class="rounded-lg p-3 text-center" style="background-color: var(--color-gray-50);">
                  <p class="text-xl font-bold" style="color: var(--color-gray-900);">{{ detalle.plannings.length }}</p>
                  <p class="text-xs mt-0.5" style="color: var(--color-gray-500);">Planning</p>
                </div>
                <div class="rounded-lg p-3 text-center" style="background-color: var(--color-gray-50);">
                  <p class="text-xl font-bold" style="color: var(--color-gray-900);">{{ detalle.tareas.length }}</p>
                  <p class="text-xs mt-0.5" style="color: var(--color-gray-500);">Tareas</p>
                </div>
                <div class="rounded-lg p-3 text-center" style="background-color: var(--color-gray-50);">
                  <p class="text-xl font-bold" style="color: var(--color-teal-600);">{{ tareasCompletadas(detalle) }}</p>
                  <p class="text-xs mt-0.5" style="color: var(--color-gray-500);">Completadas</p>
                </div>
                <div class="rounded-lg p-3 text-center" style="background-color: var(--color-gray-50);">
                  <p class="text-xl font-bold" style="color: var(--color-indigo-600);">{{ estimacionTotal(detalle.tareas) }}</p>
                  <p class="text-xs mt-0.5" style="color: var(--color-gray-500);">Story points</p>
                </div>
              </div>
            </div>

            <div class="flex justify-end gap-3 px-6 py-4 border-t" style="border-color: var(--color-gray-100);">
              <button (click)="cerrarDetalle()"
                      class="px-4 py-2 text-sm font-medium rounded-lg transition-colors text-[var(--color-gray-700)] bg-[var(--color-gray-100)] hover:bg-[var(--color-gray-200)]">
                Cerrar
              </button>
              <button (click)="irAPlanning(detalle.proyecto.id)"
                      class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-700)]">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Ir a planning
              </button>
            </div>
          </div>
        </div>
      }

      @if (deleteConfirmId) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background-color: rgba(0,0,0,0.4);">
          <div class="modal-enter rounded-xl shadow-xl p-6 w-full max-w-sm border" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
            <h3 class="text-lg font-semibold mb-2" style="color: var(--color-gray-900);">Eliminar proyecto</h3>
            <p class="text-sm mb-6" style="color: var(--color-gray-500);">
              ¿Eliminar este proyecto? Esta acción no se puede deshacer.
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

      @if (showForm) {
        <app-proyecto-form [editando]="editandoProyecto"
                           (guardar)="onGuardar($event)"
                           (cerrar)="cerrarForm()"/>
      }

      @if (equipoProyecto(); as proyecto) {
        <app-equipo-modal [proyecto]="proyecto" (cerrar)="cerrarEquipo()"/>
      }
  `,
  styles: [`
    .proyecto-row:hover {
      background-color: var(--color-gray-50);
    }
  `],
})
export class ProyectosComponent {
  private proyectoService = inject(ProyectoService);
  private planningService = inject(PlanningService);
  private columnService = inject(ColumnService);
  private equipoService = inject(EquipoService);
  private usuarioService = inject(UsuarioService);
  private authService = inject(AuthService);
  private notificacionService = inject(NotificacionService);
  private router = inject(Router);

  proyectos = this.proyectoService.proyectos;
  protected readonly statusColor = statusColor;
  protected readonly prioridadColor = prioridadColor;
  protected readonly estimacionTotal = estimacionTotal;
  protected readonly iniciales = iniciales;
  protected readonly tipoColor = tipoColor;

  showForm = false;
  editandoProyecto: Proyecto | null = null;
  deleteConfirmId: string | null = null;

  protected readonly equipoProyecto = signal<Proyecto | null>(null);

  protected readonly esAdmin = computed(() => {
    const tipo = this.authService.currentUser()?.tipo;
    return tipo === ROL_SUPER_ADMIN_ID || tipo === 'administrador';
  });

  protected readonly proyectosFiltrados = computed(() => {
    const lista = this.proyectos();
    if (this.esAdmin()) return lista;
    const id = this.authService.currentUser()?.id;
    if (!id) return [];
    return lista.filter((p) => this.equipoService.miembrosDe(p.id).includes(id));
  });

  protected readonly detalleId = signal<string | null>(null);
  protected readonly detalleProyecto = computed<ProyectoConDatos | null>(() => {
    const id = this.detalleId();
    if (!id) return null;
    const proyecto = this.proyectoService.proyectoPorId(id);
    if (!proyecto) return null;
    const plannings = this.planningService.plannings().filter((pl) => pl.proyectoId === id);
    const tareas = plannings.flatMap((pl) => pl.tareas);
    return {proyecto, plannings, tareas};
  });

  protected readonly paginaActual = signal(1);
  protected readonly totalProyectos = computed(() => this.proyectosFiltrados().length);
  protected readonly paginasTotales = computed(() => Math.max(1, Math.ceil(this.totalProyectos() / PAGINA_SIZE)));
  protected readonly paginaInicio = computed(() => (this.paginaActual() - 1) * PAGINA_SIZE + 1);
  protected readonly paginaFin = computed(() => Math.min(this.paginaActual() * PAGINA_SIZE, this.totalProyectos()));
  protected readonly proyectosPagina = computed(() => this.proyectosFiltrados().slice(this.paginaInicio() - 1, this.paginaFin()));
  protected readonly rangoPaginas = computed<(number | null)[]>(() => {
    const total = this.paginasTotales();
    const actual = this.paginaActual();
    if (total <= 7) {
      return Array.from({length: total}, (_, i) => i + 1);
    }
    const paginas = new Set<number>([1, actual - 1, actual, actual + 1, total]);
    const lista = [...paginas].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
    const resultado: (number | null)[] = [];
    let anterior = 0;
    for (const p of lista) {
      if (p - anterior > 1) resultado.push(null);
      resultado.push(p);
      anterior = p;
    }
    return resultado;
  });

  constructor() {
    effect(() => {
      const total = this.paginasTotales();
      if (this.paginaActual() > total) {
        this.paginaActual.set(total);
      }
    });
  }

  abrirNuevo(): void {
    this.editandoProyecto = null;
    this.showForm = true;
  }

  abrirEditar(proyecto: Proyecto): void {
    this.editandoProyecto = proyecto;
    this.showForm = true;
  }

  abrirDetalle(proyecto: Proyecto): void {
    this.detalleId.set(proyecto.id);
  }

  cerrarDetalle(): void {
    this.detalleId.set(null);
  }

  nombreColumna(id: string): string {
    return this.columnService.columnas().find((c) => c.id === id)?.nombre ?? '—';
  }

  columnaColor(id: string): string {
    return this.columnService.columnas().find((c) => c.id === id)?.color ?? 'var(--color-gray-300)';
  }

  tareasCompletadas(detalle: ProyectoConDatos): number {
    return detalle.tareas.filter((t) => t.completada).length;
  }

  miembrosDeProyecto(proyectoId: string): Usuario[] {
    return this.equipoService.miembrosDe(proyectoId)
      .map((id) => this.usuarioService.usuarioPorId(id))
      .filter((u): u is Usuario => !!u);
  }

  abrirEquipo(proyecto: Proyecto): void {
    this.equipoProyecto.set(proyecto);
  }

  cerrarEquipo(): void {
    this.equipoProyecto.set(null);
  }

  irPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.paginasTotales()) {
      this.paginaActual.set(pagina);
    }
  }

  paginaAnterior(): void {
    this.irPagina(this.paginaActual() - 1);
  }

  paginaSiguiente(): void {
    this.irPagina(this.paginaActual() + 1);
  }

  onGuardar(data: {nombre: string; descripcion: string; cliente: string; status: string; prioridad: string; fechaDesde: string; fechaHasta: string; documentacion: string}): void {
    if (this.editandoProyecto) {
      this.proyectoService.actualizar(this.editandoProyecto.id, data);
      this.notificacionService.notificar({tipo: 'info', descripcion: `Proyecto «${data.nombre}» actualizado`, url: '/proyectos'});
    } else {
      this.proyectoService.crear(data);
      this.notificacionService.notificar({tipo: 'exito', descripcion: `Proyecto «${data.nombre}» creado`, url: '/proyectos'});
    }
    this.cerrarForm();
  }

  confirmarEliminar(id: string): void {
    this.deleteConfirmId = id;
  }

  ejecutarEliminar(): void {
    if (this.deleteConfirmId) {
      const nombre = this.proyectoService.proyectoPorId(this.deleteConfirmId)?.nombre;
      this.proyectoService.eliminar(this.deleteConfirmId);
      this.notificacionService.notificar({tipo: 'alerta', descripcion: `Proyecto «${nombre ?? 'eliminado'}» eliminado`});
    }
    this.deleteConfirmId = null;
  }

  cancelarEliminar(): void {
    this.deleteConfirmId = null;
  }

  irAPlanning(proyectoId: string): void {
    this.router.navigate(['/planning'], {queryParams: {proyectoId}});
  }

  cerrarForm(): void {
    this.showForm = false;
    this.editandoProyecto = null;
  }
}
