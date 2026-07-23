import {Component, inject, OnDestroy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {DragDropModule, CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {PlanningService} from '../../services/planning.service';
import {ProyectoService} from '../../services/proyecto.service';
import {Planning, PlanningTask} from '../../models/planning.model';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DragDropModule],
  template: `
    <div class="max-w-6xl mx-auto">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-bold" style="font-family: 'DM Sans', sans-serif; color: var(--color-gray-900)">
            Planning
          </h1>
          <p class="mt-1 text-sm" style="color: var(--color-gray-500)">
            {{ plannings().length }} plan{{ plannings().length !== 1 ? 'es' : '' }}
          </p>
        </div>
        <button (click)="abrirNuevo()"
                class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors shadow-sm"
                style="background-color: var(--color-teal-600);"
                onmouseover="this.style.backgroundColor='var(--color-teal-700)'"
                onmouseout="this.style.backgroundColor='var(--color-teal-600)'">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          <span class="hidden sm:inline">Planning</span>
        </button>
      </div>

      @if (plannings().length === 0) {
        <div class="text-center py-20">
          <svg class="w-16 h-16 mx-auto mb-4" style="color: var(--color-gray-300)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"/>
          </svg>
          <h3 class="text-lg font-medium mb-2" style="color: var(--color-gray-500)">No hay plannings</h3>
          <p class="text-sm mb-6" style="color: var(--color-gray-400)">Crea tu primer planning para empezar.</p>
          <button (click)="abrirNuevo()"
                  class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors"
                  style="background-color: var(--color-teal-600);"
                  onmouseover="this.style.backgroundColor='var(--color-teal-700)'"
                  onmouseout="this.style.backgroundColor='var(--color-teal-600)'">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Crear planning
          </button>
        </div>
      } @else {
        <div class="rounded-xl border shadow-sm overflow-hidden" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr style="border-bottom: 1px solid var(--color-gray-100);">
                  <th class="text-left px-4 sm:px-6 py-4 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style="font-family: 'DM Sans', sans-serif; color: var(--color-gray-400);">Descripción</th>
                  <th class="text-left px-4 sm:px-6 py-4 text-xs font-semibold uppercase tracking-wider" style="font-family: 'DM Sans', sans-serif; color: var(--color-gray-400);">Fecha</th>
                  <th class="text-left px-4 sm:px-6 py-4 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style="font-family: 'DM Sans', sans-serif; color: var(--color-gray-400);">Proyecto</th>
                  <th class="text-center px-4 sm:px-6 py-4 text-xs font-semibold uppercase tracking-wider" style="font-family: 'DM Sans', sans-serif; color: var(--color-gray-400);">Tareas</th>
                  <th class="text-center px-4 sm:px-6 py-4 text-xs font-semibold uppercase tracking-wider" style="font-family: 'DM Sans', sans-serif; color: var(--color-gray-400);">Estimación</th>
                  <th class="text-right px-4 sm:px-6 py-4 text-xs font-semibold uppercase tracking-wider" style="font-family: 'DM Sans', sans-serif; color: var(--color-gray-400);">Acciones</th>
                </tr>
              </thead>
              <tbody style="border-top: 1px solid var(--color-gray-100);">
                @for (planning of plannings(); track planning.id) {
                  <tr class="planning-row" style="transition: background-color 0.15s;">
                    <td class="px-4 sm:px-6 py-4 hidden sm:table-cell border-l-2 transition-all duration-200 cursor-pointer" style="border-color: rgba(13, 148, 136, 0.5);" (click)="abrirDetalle(planning)">
                      <span class="text-sm truncate-desc transition-colors" style="color: var(--color-gray-700);"
                            onmouseover="this.style.color='var(--color-teal-600)'"
                            onmouseout="this.style.color='var(--color-gray-700)'">
                        {{ planning.descripcion || '—' }}
                      </span>
                    </td>
                    <td class="px-4 sm:px-6 py-4">
                      <span class="text-sm whitespace-nowrap" style="color: var(--color-gray-900);">{{ planning.fecha }}</span>
                    </td>
                    <td class="px-4 sm:px-6 py-4 hidden sm:table-cell">
                      <span class="text-sm" style="color: var(--color-gray-500);">{{ nombreProyecto(planning.proyectoId) }}</span>
                    </td>
                    <td class="px-4 sm:px-6 py-4 text-center">
                      <span class="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium"
                            style="background-color: #e0f2fe; color: #0369a1;">
                        {{ planning.tareas.length }}
                      </span>
                    </td>
                    <td class="px-4 sm:px-6 py-4 text-center">
                      <span class="text-sm font-semibold" style="color: var(--color-indigo-600);">
                        {{ estimacionTotal(planning.tareas) }} día{{ estimacionTotal(planning.tareas) !== 1 ? 's' : '' }}
                      </span>
                    </td>
                    <td class="px-4 sm:px-6 py-4 text-right">
                      <div class="flex items-center justify-end gap-1">
                        <button (click)="abrirEditar(planning)"
                                class="p-2 rounded-lg transition-colors"
                                style="color: var(--color-gray-400);"
                                onmouseover="this.style.color='var(--color-teal-600)'; this.style.backgroundColor='var(--color-gray-100)'"
                                onmouseout="this.style.color='var(--color-gray-400)'; this.style.backgroundColor='transparent'"
                                [attr.aria-label]="'Editar planning'">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/>
                          </svg>
                        </button>
                        <button (click)="abrirTareasModal(planning)"
                                class="p-2 rounded-lg transition-colors"
                                style="color: var(--color-gray-400);"
                                onmouseover="this.style.color='var(--color-indigo-600)'; this.style.backgroundColor='var(--color-gray-100)'"
                                onmouseout="this.style.color='var(--color-gray-400)'; this.style.backgroundColor='transparent'"
                                [attr.aria-label]="'Tareas del planning'">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6"/>
                          </svg>
                        </button>
                        <button (click)="confirmarEliminar(planning.id)"
                                class="p-2 rounded-lg transition-colors"
                                style="color: var(--color-gray-400);"
                                onmouseover="this.style.color='var(--color-rose-600)'; this.style.backgroundColor='var(--color-gray-100)'"
                                onmouseout="this.style.color='var(--color-gray-400)'; this.style.backgroundColor='transparent'"
                                [attr.aria-label]="'Eliminar planning'">
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

      @if (deleteConfirmId) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background-color: rgba(0,0,0,0.4);">
          <div class="modal-enter rounded-xl shadow-xl p-6 w-full max-w-sm border" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
            <h3 class="text-lg font-semibold mb-2" style="color: var(--color-gray-900);">Eliminar planning</h3>
            <p class="text-sm mb-6" style="color: var(--color-gray-500);">
              ¿Eliminar este planning? Esta acción no se puede deshacer.
            </p>
            <div class="flex justify-end gap-3">
              <button (click)="cancelarEliminar()"
                      class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                      style="color: var(--color-gray-700); background-color: var(--color-gray-100);"
                      onmouseover="this.style.backgroundColor='var(--color-gray-200)'"
                      onmouseout="this.style.backgroundColor='var(--color-gray-100)'">
                Cancelar
              </button>
              <button (click)="ejecutarEliminar()"
                      class="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                      style="background-color: var(--color-rose-600);"
                      onmouseover="this.style.backgroundColor='var(--color-rose-700)'"
                      onmouseout="this.style.backgroundColor='var(--color-rose-600)'">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      }

      @if (showForm) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background-color: rgba(0,0,0,0.4);" (click)="cerrarForm()">
          <div class="modal-enter rounded-xl shadow-xl w-full max-w-lg border overflow-hidden" style="background-color: var(--color-surface); border-color: var(--color-gray-200);" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between px-6 py-5 border-b" style="border-color: var(--color-gray-100);">
              <h2 class="text-lg font-bold" style="font-family: 'DM Sans', sans-serif; color: var(--color-gray-900);">
                {{ editandoId ? 'Editar planning' : 'Nuevo planning' }}
              </h2>
              <button (click)="cerrarForm()"
                      class="p-1.5 rounded-lg transition-colors"
                      style="color: var(--color-gray-400);"
                      onmouseover="this.style.color='var(--color-gray-600)'; this.style.backgroundColor='var(--color-gray-100)'"
                      onmouseout="this.style.color='var(--color-gray-400)'; this.style.backgroundColor='transparent'">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <form [formGroup]="planningForm" (ngSubmit)="guardar()" class="p-6 space-y-5">
              <div>
                <label class="block text-sm font-medium mb-1.5" style="color: var(--color-gray-700);">Fecha</label>
                <input formControlName="fecha" type="date"
                       class="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-colors"
                       style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);">
              </div>

              <div>
                <label class="block text-sm font-medium mb-1.5" style="color: var(--color-gray-700);">Proyecto</label>
                <select formControlName="proyectoId"
                        class="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-colors"
                        style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);">
                  <option value="">Selecciona un proyecto</option>
                  @for (proj of proyectos(); track proj.id) {
                    <option [value]="proj.id">{{ proj.nombre }}</option>
                  }
                </select>
                @if (planningForm.controls.proyectoId.touched && planningForm.controls.proyectoId.invalid) {
                  <p class="mt-1 text-xs" style="color: var(--color-rose-500);">Selecciona un proyecto.</p>
                }
              </div>

              <div>
                <label class="block text-sm font-medium mb-1.5" style="color: var(--color-gray-700);">Descripción</label>
                <textarea formControlName="descripcion" rows="3"
                          class="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-colors resize-none"
                          style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);"
                          placeholder="Descripción del planning..."></textarea>
              </div>

              <div class="flex justify-end gap-3 pt-2 border-t" style="border-color: var(--color-gray-100);">
                <button type="button" (click)="cerrarForm()"
                        class="px-4 py-2.5 text-sm font-medium rounded-lg transition-colors"
                        style="color: var(--color-gray-700); background-color: var(--color-gray-100);"
                        onmouseover="this.style.backgroundColor='var(--color-gray-200)'"
                        onmouseout="this.style.backgroundColor='var(--color-gray-100)'">
                  Cancelar
                </button>
                <button type="submit"
                        class="px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style="background-color: var(--color-teal-600);"
                        [disabled]="planningForm.invalid">
                  {{ editandoId ? 'Guardar cambios' : 'Crear planning' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      @if (showTareasModal && planningTareasActual) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background-color: rgba(0,0,0,0.4);" (click)="cerrarTareasModal()">
          <div class="modal-enter rounded-xl shadow-xl w-full max-w-lg border overflow-hidden" style="background-color: var(--color-surface); border-color: var(--color-gray-200);" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between px-6 py-5 border-b" style="border-color: var(--color-gray-100);">
              <h2 class="text-lg font-bold" style="font-family: 'DM Sans', sans-serif; color: var(--color-gray-900);">
                Planning — {{ nombreProyecto(planningTareasActual.proyectoId) }}
              </h2>
              <button (click)="cerrarTareasModal()"
                      class="p-1.5 rounded-lg transition-colors"
                      style="color: var(--color-gray-400);"
                      onmouseover="this.style.color='var(--color-gray-600)'; this.style.backgroundColor='var(--color-gray-100)'"
                      onmouseout="this.style.color='var(--color-gray-400)'; this.style.backgroundColor='transparent'">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div class="p-6 space-y-5">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-1.5" style="color: var(--color-gray-700);">Tarea</label>
                  <input [formControl]="tareaForm.controls.tarea" type="text" autocomplete="off"
                         class="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-colors"
                         style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);"
                         placeholder="Nombre de la tarea">
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1.5" style="color: var(--color-gray-700);">Complejidad</label>
                  <select [formControl]="tareaForm.controls.complejidad"
                          class="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-colors"
                          style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);">
                    <option value="">Selecciona</option>
                    <option value="Simple">Simple</option>
                    <option value="Media">Media</option>
                    <option value="Compleja">Compleja</option>
                  </select>
                </div>
              </div>

              <button (click)="agregarTarea()"
                      class="w-full px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style="background-color: var(--color-indigo-600);"
                      [disabled]="tareaForm.invalid"
                      onmouseover="this.style.backgroundColor='var(--color-indigo-700)'"
                      onmouseout="this.style.backgroundColor='var(--color-indigo-600)'">
                Agregar tarea
              </button>

              @if (planningTareasActual.tareas.length > 0) {
                <div class="border-t pt-4" style="border-color: var(--color-gray-100);">
                  <p class="text-sm font-medium mb-3" style="color: var(--color-gray-700);">
                    Tareas agregadas ({{ planningTareasActual.tareas.length }})
                  </p>
                    <div cdkDropList [cdkDropListData]="planningTareasActual.tareas"
                         (cdkDropListDropped)="onDropTarea($event)" class="space-y-2 custom-scrollbar"
                         style="max-height: 180px; overflow-y: auto;">
                      @for (task of planningTareasActual.tareas; track task.id) {
                        <div cdkDrag class="flex items-center gap-2 p-3 rounded-lg group"
                             style="background-color: var(--color-gray-50);">
                          <div class="flex-1 flex items-center gap-3 min-w-0">
                            @if (editandoTaskId === task.id) {
                              <input #editInput [value]="editandoTaskValue" autofocus
                                     (blur)="guardarEdicionTarea(task.id, editInput.value)"
                                     (keydown.enter)="guardarEdicionTarea(task.id, editInput.value)"
                                     (keydown.escape)="cancelarEdicionTarea()"
                                     class="flex-1 px-2 py-1 text-sm rounded outline-none"
                                     style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-teal-500);">
                            } @else {
                              <span (click)="iniciarEdicionTarea(task)"
                                    class="text-sm cursor-pointer transition-colors"
                                    style="color: var(--color-gray-900);"
                                    onmouseover="this.style.color='var(--color-teal-600)'"
                                    onmouseout="this.style.color='var(--color-gray-900)'">
                                {{ task.tarea }}
                              </span>
                            }
                            @if (editandoComplexId === task.id) {
                              <select #complexSelect [value]="task.complejidad" autofocus
                                      (change)="guardarEdicionComplejidad(task.id, complexSelect.value)"
                                      (blur)="guardarEdicionComplejidad(task.id, complexSelect.value)"
                                      (keydown.escape)="cancelarEdicionComplejidad()"
                                      class="shrink-0 px-2 py-0.5 rounded-full text-xs font-medium outline-none border"
                                      style="border-color: var(--color-teal-500); background-color: var(--color-surface); color: var(--color-gray-900);">
                                <option value="Simple">Simple</option>
                                <option value="Media">Media</option>
                                <option value="Compleja">Compleja</option>
                              </select>
                            } @else {
                              <span (click)="iniciarEdicionComplejidad(task)"
                                    class="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-opacity"
                                    [style.color]="complejidadColor(task.complejidad).text"
                                    [style.background-color]="complejidadColor(task.complejidad).bg">
                                {{ task.complejidad }}
                              </span>
                            }
                          </div>
                          <button cdkDragHandle
                                  class="p-1 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-grab"
                                  style="color: var(--color-gray-400);"
                                  onmouseover="this.style.color='var(--color-teal-600)'"
                                  onmouseout="this.style.color='var(--color-gray-400)'"
                                  [attr.aria-label]="'Arrastrar para reordenar'">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M4 8h16M4 16h16"/>
                            </svg>
                          </button>
                          <button (click)="removerTarea(task.id)"
                                  class="shrink-0 p-1.5 rounded-lg transition-colors"
                                  style="color: var(--color-gray-400);"
                                  onmouseover="this.style.color='var(--color-rose-600)'; this.style.backgroundColor='var(--color-gray-200)'"
                                  onmouseout="this.style.color='var(--color-gray-400)'; this.style.backgroundColor='transparent'"
                                  [attr.aria-label]="'Eliminar tarea ' + task.tarea">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                          </button>
                        </div>
                      }
                    </div>
                </div>
              } @else {
                <div class="border-t pt-4" style="border-color: var(--color-gray-100);">
                  <p class="text-sm text-center" style="color: var(--color-gray-400);">No hay tareas agregadas.</p>
                </div>
              }

              @if (planningTareasActual.tareas.length > 0) {
                <div class="flex items-center justify-between px-4 py-3 rounded-lg"
                     style="background: var(--estimation-bg);">
                  <span class="text-sm font-semibold" style="color: var(--estimation-text);">Estimación:</span>
                  <span class="text-sm font-bold" style="color: var(--estimation-text);">
                    {{ estimacionTotal(planningTareasActual.tareas) }} día{{ estimacionTotal(planningTareasActual.tareas) !== 1 ? 's' : '' }}
                  </span>
                </div>
              }

              <div class="flex justify-end pt-2">
                <button (click)="cerrarTareasModal()"
                        class="px-4 py-2.5 text-sm font-medium rounded-lg transition-colors"
                        style="color: var(--color-gray-700); background-color: var(--color-gray-100);"
                        onmouseover="this.style.backgroundColor='var(--color-gray-200)'"
                        onmouseout="this.style.backgroundColor='var(--color-gray-100)'">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      @if (showDetalleModal && planningDetalleActual) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background-color: rgba(0,0,0,0.4);" (click)="cerrarDetalleModal()">
          <div class="modal-enter rounded-xl shadow-xl w-full max-w-2xl border overflow-hidden" style="background-color: var(--color-surface); border-color: var(--color-gray-200);" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between px-6 py-5 border-b" style="border-color: var(--color-gray-100);">
              <h2 class="text-lg font-bold" style="font-family: 'DM Sans', sans-serif; color: var(--color-gray-900);">
                Planning — {{ nombreProyecto(planningDetalleActual.proyectoId) }}
              </h2>
              <button (click)="cerrarDetalleModal()"
                      class="p-1.5 rounded-lg transition-colors"
                      style="color: var(--color-gray-400);"
                      onmouseover="this.style.color='var(--color-gray-600)'; this.style.backgroundColor='var(--color-gray-100)'"
                      onmouseout="this.style.color='var(--color-gray-400)'; this.style.backgroundColor='transparent'">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div class="p-6 space-y-6">
              <div class="rounded-lg p-5 space-y-4" style="background-color: var(--color-gray-50);">
                <div class="grid grid-cols-2 gap-6">
                  <div>
                    <span class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Fecha</span>
                    <p class="mt-1 text-sm font-medium" style="color: var(--color-gray-900);">{{ planningDetalleActual.fecha }}</p>
                  </div>
                  <div>
                    <span class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Proyecto</span>
                    <p class="mt-1 text-sm font-medium" style="color: var(--color-gray-900);">{{ nombreProyecto(planningDetalleActual.proyectoId) }}</p>
                  </div>
                </div>
                @if (planningDetalleActual.descripcion) {
                  <div>
                    <span class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Descripción</span>
                    <p class="mt-1 text-sm" style="color: var(--color-gray-700); line-height: 1.6;">{{ planningDetalleActual.descripcion }}</p>
                  </div>
                }
              </div>

              <div>
                <div class="flex items-center justify-between mb-3">
                  <h3 class="text-sm font-semibold" style="color: var(--color-gray-700);">
                    Tareas ({{ planningDetalleActual.tareas.length }})
                  </h3>
                  @if (planningDetalleActual.tareas.length > 0) {
                    <span class="text-xs font-medium px-2 py-0.5 rounded-full"
                          style="background: var(--estimation-bg); color: var(--estimation-text);">
                      {{ estimacionTotal(planningDetalleActual.tareas) }} día{{ estimacionTotal(planningDetalleActual.tareas) !== 1 ? 's' : '' }}
                    </span>
                  }
                </div>

                @if (planningDetalleActual.tareas.length > 0) {
                  <div class="space-y-2 custom-scrollbar"
                       style="max-height: 152px; overflow-y: auto; padding-right: 4px;">
                    @for (task of planningDetalleActual.tareas; track task.id) {
                      <div class="flex items-center justify-between px-4 py-3 rounded-lg"
                           style="background-color: var(--color-gray-50);">
                        <span class="text-sm" style="color: var(--color-gray-900);">{{ task.tarea }}</span>
                        <span class="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                              [style.color]="complejidadColor(task.complejidad).text"
                              [style.background-color]="complejidadColor(task.complejidad).bg">
                          {{ task.complejidad }}
                        </span>
                      </div>
                    }
                  </div>
                } @else {
                  <p class="text-sm text-center py-6 rounded-lg" style="color: var(--color-gray-400); background-color: var(--color-gray-50);">No hay tareas asociadas a este planning.</p>
                }
              </div>

              @if (planningDetalleActual.tareas.length > 0) {
                <div class="flex items-center justify-between px-4 py-3 rounded-lg"
                     style="background: var(--estimation-bg);">
                  <span class="text-sm font-semibold" style="color: var(--estimation-text);">Estimación total:</span>
                  <span class="text-sm font-bold" style="color: var(--estimation-text);">
                    {{ estimacionTotal(planningDetalleActual.tareas) }} día{{ estimacionTotal(planningDetalleActual.tareas) !== 1 ? 's' : '' }}
                  </span>
                </div>
              }

              <div class="flex justify-end pt-2">
                <button (click)="cerrarDetalleModal()"
                        class="px-4 py-2.5 text-sm font-medium rounded-lg transition-colors"
                        style="color: var(--color-gray-700); background-color: var(--color-gray-100);"
                        onmouseover="this.style.backgroundColor='var(--color-gray-200)'"
                        onmouseout="this.style.backgroundColor='var(--color-gray-100)'">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .truncate-desc {
      max-width: 180px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: block;
    }
    .planning-row:hover {
      background-color: var(--color-gray-50);
    }
  `],
})
export class PlanningComponent implements OnDestroy {
  private planningService = inject(PlanningService);
  private proyectoService = inject(ProyectoService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  plannings = this.planningService.plannings;
  proyectos = this.proyectoService.proyectos;

  showForm = false;
  editandoId: string | null = null;
  deleteConfirmId: string | null = null;
  showTareasModal = false;
  planningTareasActual: Planning | null = null;
  showDetalleModal = false;
  planningDetalleActual: Planning | null = null;
  editandoTaskId: string | null = null;
  editandoTaskValue = '';
  editandoComplexId: string | null = null;

  private subs: Subscription[] = [];

  planningForm = this.fb.nonNullable.group({
    fecha: ['', Validators.required],
    proyectoId: ['', Validators.required],
    descripcion: [''],
  });

  tareaForm = this.fb.nonNullable.group({
    tarea: ['', Validators.required],
    complejidad: ['', Validators.required],
  });

  constructor() {
    this.subs.push(
      this.route.queryParams.subscribe((params) => {
        const proyectoId = params['proyectoId'];
        if (proyectoId) {
          this.abrirNuevo(proyectoId);
          this.router.navigate([], {queryParams: {}, replaceUrl: true});
        }
      }),
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  nombreProyecto(proyectoId: string): string {
    const proj = this.proyectos().find((p) => p.id === proyectoId);
    return proj ? proj.nombre : '—';
  }

  abrirNuevo(proyectoId?: string): void {
    this.editandoId = null;
    this.planningForm.reset();
    if (proyectoId) {
      this.planningForm.controls.proyectoId.setValue(proyectoId);
    }
    this.showForm = true;
  }

  abrirEditar(planning: Planning): void {
    this.editandoId = planning.id;
    this.planningForm.setValue({
      fecha: planning.fecha,
      proyectoId: planning.proyectoId,
      descripcion: planning.descripcion,
    });
    this.showForm = true;
  }

  guardar(): void {
    if (this.planningForm.invalid) return;

    const raw = this.planningForm.getRawValue();

    if (this.editandoId) {
      this.planningService.actualizar(this.editandoId, {
        fecha: raw.fecha,
        proyectoId: raw.proyectoId,
        descripcion: raw.descripcion,
      });
    } else {
      this.planningService.crear({
        fecha: raw.fecha,
        proyectoId: raw.proyectoId,
        descripcion: raw.descripcion,
        tareas: [],
      });
    }

    this.cerrarForm();
  }

  confirmarEliminar(id: string): void {
    this.deleteConfirmId = id;
  }

  ejecutarEliminar(): void {
    if (this.deleteConfirmId) {
      this.planningService.eliminar(this.deleteConfirmId);
    }
    this.deleteConfirmId = null;
  }

  cancelarEliminar(): void {
    this.deleteConfirmId = null;
  }

  abrirTareasModal(planning: Planning): void {
    this.planningTareasActual = planning;
    this.showTareasModal = true;
  }

  agregarTarea(): void {
    if (this.tareaForm.invalid || !this.planningTareasActual) return;

    const raw = this.tareaForm.getRawValue();
    const nuevaTarea: PlanningTask = {
      id: crypto.randomUUID(),
      tarea: raw.tarea,
      complejidad: raw.complejidad as PlanningTask['complejidad'],
    };

    const tareasActuales = this.planningTareasActual.tareas ?? [];
    this.planningService.actualizar(this.planningTareasActual.id, {
      tareas: [...tareasActuales, nuevaTarea],
    });

    this._actualizarReferencia();
    this.tareaForm.reset();
  }

  removerTarea(taskId: string): void {
    if (!this.planningTareasActual) return;

    this.planningService.actualizar(this.planningTareasActual.id, {
      tareas: (this.planningTareasActual.tareas ?? []).filter((t) => t.id !== taskId),
    });

    this._actualizarReferencia();
  }

  iniciarEdicionTarea(task: PlanningTask): void {
    this.editandoTaskId = task.id;
    this.editandoTaskValue = task.tarea;
  }

  guardarEdicionTarea(taskId: string, nuevoNombre: string): void {
    if (!this.planningTareasActual || !nuevoNombre.trim()) {
      this.cancelarEdicionTarea();
      return;
    }
    this.planningService.actualizar(this.planningTareasActual.id, {
      tareas: this.planningTareasActual.tareas.map((t) =>
        t.id === taskId ? {...t, tarea: nuevoNombre.trim()} : t,
      ),
    });
    this._actualizarReferencia();
    this.cancelarEdicionTarea();
  }

  cancelarEdicionTarea(): void {
    this.editandoTaskId = null;
    this.editandoTaskValue = '';
  }

  iniciarEdicionComplejidad(task: PlanningTask): void {
    this.editandoComplexId = task.id;
  }

  guardarEdicionComplejidad(taskId: string, nuevoValor: string): void {
    if (!this.planningTareasActual) {
      this.cancelarEdicionComplejidad();
      return;
    }
    this.planningService.actualizar(this.planningTareasActual.id, {
      tareas: this.planningTareasActual.tareas.map((t) =>
        t.id === taskId ? {...t, complejidad: nuevoValor as PlanningTask['complejidad']} : t,
      ),
    });
    this._actualizarReferencia();
    this.cancelarEdicionComplejidad();
  }

  cancelarEdicionComplejidad(): void {
    this.editandoComplexId = null;
  }

  onDropTarea(event: CdkDragDrop<PlanningTask[]>): void {
    if (!this.planningTareasActual) return;
    const tareas = [...this.planningTareasActual.tareas];
    moveItemInArray(tareas, event.previousIndex, event.currentIndex);
    this.planningService.actualizar(this.planningTareasActual.id, {tareas});
    this._actualizarReferencia();
  }

  private _actualizarReferencia(): void {
    if (!this.planningTareasActual) return;
    const actualizado = this.planningService.planningPorId(this.planningTareasActual.id)();
    if (actualizado) this.planningTareasActual = actualizado;
  }

  complejidadColor(comp: string): {text: string; bg: string} {
    switch (comp) {
      case 'Simple': return {text: '#059669', bg: '#d1fae5'};
      case 'Media': return {text: '#b45309', bg: '#fef3c7'};
      case 'Compleja': return {text: '#dc2626', bg: '#fee2e2'};
      default: return {text: '#6b7280', bg: '#f3f4f6'};
    }
  }

  estimacionTotal(tareas: PlanningTask[]): number {
    const valores: Record<string, number> = {Simple: 1, Media: 3, Compleja: 5};
    return tareas.reduce((sum, t) => sum + (valores[t.complejidad] ?? 0), 0);
  }

  cerrarTareasModal(): void {
    this.showTareasModal = false;
    this.planningTareasActual = null;
    this.tareaForm.reset();
  }

  abrirDetalle(planning: Planning): void {
    this.planningDetalleActual = planning;
    this.showDetalleModal = true;
  }

  cerrarDetalleModal(): void {
    this.showDetalleModal = false;
    this.planningDetalleActual = null;
  }

  cerrarForm(): void {
    this.showForm = false;
    this.editandoId = null;
    this.planningForm.reset();
  }
}
