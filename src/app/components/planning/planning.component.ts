import {Component, inject, OnDestroy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {PlanningService} from '../../services/planning.service';
import {ProyectoService} from '../../services/proyecto.service';
import {Planning} from '../../models/planning.model';
import {Subscription} from 'rxjs';

const MAPA_DIAS: Record<string, number> = {
  Simple: 1,
  Media: 3,
  Amplia: 5,
};

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
          <span class="hidden sm:inline">Nuevo planning</span>
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
                  <th class="text-left px-4 sm:px-6 py-4 text-xs font-semibold uppercase tracking-wider" style="font-family: 'DM Sans', sans-serif; color: var(--color-gray-400);">Fecha</th>
                  <th class="text-left px-4 sm:px-6 py-4 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style="font-family: 'DM Sans', sans-serif; color: var(--color-gray-400);">Proyecto</th>
                  <th class="text-left px-4 sm:px-6 py-4 text-xs font-semibold uppercase tracking-wider hidden md:table-cell" style="font-family: 'DM Sans', sans-serif; color: var(--color-gray-400);">Tarea</th>
                  <th class="text-left px-4 sm:px-6 py-4 text-xs font-semibold uppercase tracking-wider hidden lg:table-cell" style="font-family: 'DM Sans', sans-serif; color: var(--color-gray-400);">Complejidad</th>
                  <th class="text-center px-4 sm:px-6 py-4 text-xs font-semibold uppercase tracking-wider hidden lg:table-cell" style="font-family: 'DM Sans', sans-serif; color: var(--color-gray-400);">Días</th>
                  <th class="text-center px-4 sm:px-6 py-4 text-xs font-semibold uppercase tracking-wider" style="font-family: 'DM Sans', sans-serif; color: var(--color-gray-400);">T. estimado</th>
                  <th class="text-right px-4 sm:px-6 py-4 text-xs font-semibold uppercase tracking-wider" style="font-family: 'DM Sans', sans-serif; color: var(--color-gray-400);">Acciones</th>
                </tr>
              </thead>
              <tbody style="border-top: 1px solid var(--color-gray-100);">
                @for (planning of plannings(); track planning.id) {
                  <tr class="planning-row" style="transition: background-color 0.15s;">
                    <td class="px-4 sm:px-6 py-4 border-l-2 transition-all duration-200" style="border-color: rgba(13, 148, 136, 0.5);" onmouseover="this.style.borderColor='rgba(13,148,136,1)'; this.style.paddingLeft='1.75rem'" onmouseout="this.style.borderColor='rgba(13,148,136,0.5)'; this.style.paddingLeft='1.5rem'">
                      <span class="text-sm whitespace-nowrap" style="color: var(--color-gray-900);">{{ planning.fecha }}</span>
                    </td>
                    <td class="px-4 sm:px-6 py-4 hidden sm:table-cell">
                      <span class="text-sm" style="color: var(--color-gray-500);">{{ nombreProyecto(planning.proyectoId) }}</span>
                    </td>
                    <td class="px-4 sm:px-6 py-4 hidden md:table-cell">
                      <span class="text-sm truncate-desc" style="color: var(--color-gray-500);">{{ planning.tarea }}</span>
                    </td>
                    <td class="px-4 sm:px-6 py-4 hidden lg:table-cell">
                      <span class="text-sm" style="color: var(--color-gray-500);">{{ planning.complejidad }}</span>
                    </td>
                    <td class="px-4 sm:px-6 py-4 text-center hidden lg:table-cell">
                      <span class="text-sm" style="color: var(--color-gray-500);">{{ planning.diasDesarrollo }}</span>
                    </td>
                    <td class="px-4 sm:px-6 py-4 text-center">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style="background-color: #e0f2fe; color: #0369a1;">
                        {{ planning.tiempoEstimado }} día{{ planning.tiempoEstimado !== 1 ? 's' : '' }}
                      </span>
                    </td>
                    <td class="px-4 sm:px-6 py-4 text-right">
                      <div class="flex items-center justify-end gap-1">
                        <button (click)="abrirEditar(planning)"
                                class="p-2 rounded-lg transition-colors"
                                style="color: var(--color-gray-400);"
                                onmouseover="this.style.color='var(--color-teal-600)'; this.style.backgroundColor='var(--color-gray-100)'"
                                onmouseout="this.style.color='var(--color-gray-400)'; this.style.backgroundColor='transparent'"
                                [attr.aria-label]="'Editar planning ' + planning.tarea">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/>
                          </svg>
                        </button>
                        <button (click)="confirmarEliminar(planning.id)"
                                class="p-2 rounded-lg transition-colors"
                                style="color: var(--color-gray-400);"
                                onmouseover="this.style.color='var(--color-rose-600)'; this.style.backgroundColor='var(--color-gray-100)'"
                                onmouseout="this.style.color='var(--color-gray-400)'; this.style.backgroundColor='transparent'"
                                [attr.aria-label]="'Eliminar planning ' + planning.tarea">
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
                <label class="block text-sm font-medium mb-1.5" style="color: var(--color-gray-700);">Tarea</label>
                <input formControlName="tarea" type="text" autocomplete="off"
                       class="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-colors"
                       style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);"
                       placeholder="Nombre de la tarea">
                @if (planningForm.controls.tarea.touched && planningForm.controls.tarea.invalid) {
                  <p class="mt-1 text-xs" style="color: var(--color-rose-500);">La tarea es requerida.</p>
                }
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-1.5" style="color: var(--color-gray-700);">Complejidad</label>
                  <select formControlName="complejidad"
                          class="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-colors"
                          style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);">
                    <option value="">Selecciona</option>
                    <option value="Simple">Simple</option>
                    <option value="Media">Media</option>
                    <option value="Amplia">Amplia</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1.5" style="color: var(--color-gray-700);">Días de desarrollo</label>
                  <select formControlName="diasDesarrollo"
                          class="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-colors"
                          style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);">
                    <option value="">Selecciona</option>
                    @for (d of opcionesDias; track d) {
                      <option [value]="d">{{ d }}</option>
                    }
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium mb-1.5" style="color: var(--color-gray-700);">
                  Tiempo estimado de desarrollo
                </label>
                <div class="px-3 py-2.5 text-sm rounded-lg"
                     style="background-color: var(--color-gray-100); color: var(--color-gray-700); border: 1px solid var(--color-gray-200);">
                  @if (planningForm.value.diasDesarrollo) {
                    {{ planningForm.value.diasDesarrollo }} día{{ planningForm.value.diasDesarrollo !== 1 ? 's' : '' }}
                  } @else {
                    —
                  }
                </div>
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
    </div>
  `,
  styles: [`
    .truncate-desc {
      max-width: 220px;
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

  opcionesDias = [1, 2, 3, 4, 5];

  showForm = false;
  editandoId: string | null = null;
  deleteConfirmId: string | null = null;

  private subs: Subscription[] = [];

  planningForm = this.fb.nonNullable.group({
    fecha: ['', Validators.required],
    proyectoId: ['', Validators.required],
    tarea: ['', Validators.required],
    complejidad: ['', Validators.required],
    diasDesarrollo: [0, [Validators.required, Validators.min(1)]],
  });

  constructor() {
    this.subs.push(
      this.planningForm.controls.complejidad.valueChanges.subscribe((val) => {
        if (val && MAPA_DIAS[val]) {
          this.planningForm.controls.diasDesarrollo.setValue(MAPA_DIAS[val]);
        }
      }),
    );

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
      tarea: planning.tarea,
      complejidad: planning.complejidad,
      diasDesarrollo: planning.diasDesarrollo,
    });
    this.showForm = true;
  }

  guardar(): void {
    if (this.planningForm.invalid) return;

    const raw = this.planningForm.getRawValue();

    const data = {
      fecha: raw.fecha,
      proyectoId: raw.proyectoId,
      tarea: raw.tarea,
      complejidad: raw.complejidad as 'Simple' | 'Media' | 'Amplia',
      diasDesarrollo: raw.diasDesarrollo,
      tiempoEstimado: raw.diasDesarrollo,
    };

    if (this.editandoId) {
      this.planningService.actualizar(this.editandoId, data);
    } else {
      this.planningService.crear(data);
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

  cerrarForm(): void {
    this.showForm = false;
    this.editandoId = null;
    this.planningForm.reset();
  }
}
