import {Component, inject, computed, signal, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule, DatePipe} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {FullCalendarModule} from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import {ProyectoService} from '../../services/proyecto.service';
import {ColumnService} from '../../services/column.service';
import {PlanningService} from '../../services/planning.service';
import {ThemeService} from '../../services/theme.service';
import {EquipoService} from '../../services/equipo.service';
import {AuthService} from '../../services/auth.service';
import {EventoService} from '../../services/evento.service';
import {ROL_SUPER_ADMIN_ID} from '../../models/permiso.model';
import {statusColor, complejidadEstilo, estimacionTotal} from '../../utils/estimacion';
import type {Proyecto} from '../../models/proyecto.model';
import type {Columna} from '../../models/columna.model';

function addDay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + 1);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function getWeekdaySegments(startStr: string, endStr: string): Array<{start: string; end: string}> {
  const segments: Array<{start: string; end: string}> = [];
  const toDate = (s: string) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  const fmt = (dt: Date) => {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const start = toDate(startStr);
  const end = toDate(endStr);
  let segStart: Date | null = null;
  const cursor = new Date(start);
  while (cursor <= end) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      if (!segStart) segStart = new Date(cursor);
    } else {
      if (segStart) {
        segments.push({start: fmt(segStart), end: fmt(cursor)});
        segStart = null;
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  if (segStart) {
    const next = new Date(end);
    next.setDate(next.getDate() + 1);
    segments.push({start: fmt(segStart), end: fmt(next)});
  }
  return segments;
}

@Component({
  selector: 'app-calendario',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, FullCalendarModule, DatePipe],
  template: `
    <div class="calendario-page">
      <div class="flex justify-between items-center mb-6">
        <h1>Calendario de Proyectos</h1>
      </div>

      <div class="fc-wrapper">
        <full-calendar
          [options]="calendarOptions"
          [events]="events()"
        ></full-calendar>
      </div>
    </div>

    @if (selectedProyecto(); as p) {
      <div class="modal-backdrop" (click)="cerrarModal()">
        <div class="modal-card modal-enter" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 style="color: var(--color-gray-900);">{{ p.nombre }}</h2>
            <button (click)="cerrarModal()" class="close-btn" style="color: var(--color-gray-400);">&times;</button>
          </div>
          <div class="modal-body">
            @if (p.descripcion) {
              <div class="rounded-lg p-3 mb-3" style="background-color: var(--color-gray-50);">
                <p class="text-sm leading-relaxed" style="color: var(--color-gray-600);">{{ p.descripcion }}</p>
              </div>
            }

            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <span class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Cliente</span>
                <p class="mt-1 text-sm" style="color: var(--color-gray-800);">{{ p.cliente || '—' }}</p>
              </div>
              <div>
                <span class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Estado</span>
                <div class="mt-1">
                  <span class="badge" [style.background-color]="statusInfo(p.status).bg" [style.color]="statusInfo(p.status).text">
                    {{ p.status }}
                  </span>
                </div>
              </div>
              <div>
                <span class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Columna</span>
                <div class="mt-1 flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full" [style.background-color]="columnaColor(p.columnaId)"></span>
                  <span class="text-sm" style="color: var(--color-gray-800);">{{ columnaNombre(p.columnaId) }}</span>
                </div>
              </div>
              @if (p.documentacion) {
                <div>
                  <span class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Documentación</span>
                  <a [href]="p.documentacion" target="_blank" rel="noopener"
                     class="mt-1 inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                    </svg>
                    Abrir Figma
                  </a>
                </div>
              }
            </div>

            <div class="mt-3 pt-3 border-t" style="border-color: var(--color-gray-200);">
              <span class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Duración</span>
              <p class="mt-1 text-sm" style="color: var(--color-gray-800);">
                {{ p.fechaDesde | date:'dd/MM/yyyy' }} — {{ p.fechaHasta | date:'dd/MM/yyyy' }}
              </p>
            </div>

            <div class="mt-3 space-y-1">
              <button (click)="mostrarPlanificaciones = !mostrarPlanificaciones"
                      class="section-toggle">
                <span class="flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6"/>
                  </svg>
                  <span>Planning ({{ planningsDelProyecto().length }})</span>
                </span>
                <svg class="chevron" [class.rotate-180]="mostrarPlanificaciones" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              @if (mostrarPlanificaciones) {
                <div class="pl-3 space-y-2">
                  @for (planning of planningsDelProyecto(); track planning.id) {
                    <div class="planning-item">
                      <div class="min-w-0">
                        <span class="font-medium" style="color: var(--color-gray-700);">{{ planning.fecha }}</span>
                        @if (planning.descripcion) {
                          <p class="truncate" style="color: var(--color-gray-400);">{{ planning.descripcion }}</p>
                        }
                      </div>
                      <span class="shrink-0 ml-2 font-semibold" style="color: var(--color-indigo-600);">Estimación: {{ estimacionTotal(planning.tareas) }} días</span>
                    </div>
                  } @empty {
                    <p class="text-xs pl-2" style="color: var(--color-gray-400);">Sin planificaciones</p>
                  }
                </div>
              }

              <button (click)="mostrarTareas = !mostrarTareas"
                      class="section-toggle">
                <span class="flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6m-6 4h6m-6 4h6m-6 4h6"/>
                  </svg>
                  <span>Tareas ({{ tareasDelProyecto().length }})</span>
                </span>
                <svg class="chevron" [class.rotate-180]="mostrarTareas" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              @if (mostrarTareas) {
                <div class="pl-3 space-y-1 tareas-scroll" style="max-height: 116px; overflow-y: auto;">
                  @for (tarea of tareasDelProyecto(); track tarea.id) {
                    <div class="task-item">
                      <label class="flex items-center gap-2 min-w-0 cursor-pointer flex-1">
                        <input type="checkbox"
                               [checked]="tarea.completada"
                               (change)="toggleTarea(tarea.id)"
                               class="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0">
                        <span class="text-xs truncate"
                              [class.line-through]="tarea.completada"
                              [style.text-decoration]="tarea.completada ? 'line-through' : 'none'"
                              [style.color]="tarea.completada ? 'var(--color-gray-400)' : 'var(--color-gray-700)'">{{ tarea.tarea }}</span>
                      </label>
                      <span class="shrink-0 text-xs font-medium px-1.5 py-0.5 rounded"
                            [style.background-color]="complejidadEstilo(tarea.complejidad).bg"
                            [style.color]="complejidadEstilo(tarea.complejidad).text">
                        {{ tarea.complejidad }}
                      </span>
                    </div>
                  } @empty {
                    <p class="text-xs pl-2" style="color: var(--color-gray-400);">Sin tareas</p>
                  }
                </div>
                @if (tareasDelProyecto().length > 0) {
                  <div class="mt-2 flex items-center gap-2 px-2">
                    <div class="flex-1 h-1.5 rounded-full overflow-hidden" style="background-color: var(--color-gray-200);">
                      <div class="h-full rounded-full transition-all duration-300"
                           [style.width.%]="porcentajeAvance()"
                           [style.background-color]="porcentajeAvance() === 100 ? '#22C55E' : '#6366F1'"></div>
                    </div>
                    <span class="text-xs font-medium shrink-0"
                          [style.color]="porcentajeAvance() === 100 ? '#059669' : 'var(--color-gray-400)'">
                      {{ porcentajeAvance() }}%
                    </span>
                  </div>
                }
              }
            </div>

            <div class="flex justify-end gap-2 pt-3">
              <button (click)="router.navigate(['/proyectos'])"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6h16.5M3.75 12h16.5m-16.5 6h16.5"/>
                </svg>
                Proyectos
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    @if (showEventoModal) {
      <div class="modal-backdrop" (click)="cerrarModalEvento()">
        <div class="modal-card modal-enter" style="max-width: 440px;" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 style="color: var(--color-gray-900);">Nuevo evento</h2>
            <button (click)="cerrarModalEvento()" class="close-btn" style="color: var(--color-gray-400);">&times;</button>
          </div>
          <div class="modal-body">
            <form [formGroup]="eventoForm" (ngSubmit)="onGuardarEvento()" class="space-y-3">
              <div>
                <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Título *</label>
                <input formControlName="titulo" type="text" autocomplete="off"
                       class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors"
                       style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);"
                       placeholder="Nombre del evento">
                @if (eventoForm.controls.titulo.touched && eventoForm.controls.titulo.invalid) {
                  <p class="mt-1 text-xs" style="color: var(--color-rose-500);">El título es requerido (mín. 2 caracteres).</p>
                }
              </div>

              <div>
                <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Descripción</label>
                <textarea formControlName="descripcion" rows="2"
                          class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors resize-none"
                          style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);"
                          placeholder="Opcional"></textarea>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Inicio *</label>
                  <input formControlName="fechaInicio" type="date"
                         class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors"
                         style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);">
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Fin *</label>
                  <input formControlName="fechaFin" type="date"
                         class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors"
                         style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);">
                </div>
              </div>

              <div>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input formControlName="todoElDia" type="checkbox"
                         class="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
                  <span class="text-sm" style="color: var(--color-gray-700);">Todo el día</span>
                </label>
              </div>

              <div>
                <label class="block text-sm font-medium mb-1" style="color: var(--color-gray-700);">Categoría</label>
                <select formControlName="categoria"
                        class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors"
                        style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);">
                  @for (cat of categorias; track cat.id) {
                    <option [value]="cat.id">{{ cat.label }}</option>
                  }
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium mb-1.5" style="color: var(--color-gray-700);">Color</label>
                <div class="flex items-center gap-2">
                  @for (c of colores; track c) {
                    <button type="button"
                            (click)="eventoForm.patchValue({color: c})"
                            class="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                            [style.background-color]="c"
                            [style.border-color]="eventoForm.value.color === c ? 'var(--color-gray-900)' : 'transparent'">
                    </button>
                  }
                </div>
              </div>

              <div class="flex justify-end gap-3 pt-2 border-t" style="border-color: var(--color-gray-200);">
                <button type="button" (click)="cerrarModalEvento()"
                        class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors text-[var(--color-gray-700)] bg-[var(--color-gray-100)] hover:bg-[var(--color-gray-200)]">
                  Cancelar
                </button>
                <button type="submit"
                        class="px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-700)]"
                        [disabled]="eventoForm.invalid">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .calendario-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .fc-wrapper {
      background-color: var(--color-surface);
      border: 1px solid var(--color-gray-200);
      border-radius: 0.75rem;
      padding: 1rem;
      overflow: hidden;
    }

    :host-context([data-theme="dark"]) .fc {
      --fc-page-bg-color: var(--color-surface);
      --fc-border-color: var(--color-gray-200);
      --fc-today-bg-color: rgba(99, 102, 241, 0.12);
      --fc-neutral-bg-color: var(--color-gray-100);
      --fc-list-event-hover-bg-color: var(--color-gray-100);
      --fc-button-text-color: var(--color-gray-600);
      --fc-button-bg-color: var(--color-gray-200);
      --fc-button-border-color: var(--color-gray-300);
      --fc-button-hover-bg-color: var(--color-gray-300);
      --fc-button-hover-border-color: var(--color-gray-400);
      --fc-button-active-bg-color: var(--color-gray-300);
      --fc-button-active-border-color: var(--color-gray-400);
      --fc-now-indicator-color: #818CF8;
    }

    :host-context([data-theme="dark"]) .fc .fc-toolbar-title {
      color: var(--color-gray-800);
    }

    :host-context([data-theme="dark"]) .fc .fc-col-header-cell-cushion {
      color: var(--color-gray-700);
    }

    :host-context([data-theme="dark"]) .fc .fc-daygrid-day-number {
      color: var(--color-gray-900) !important;
    }

    :host-context([data-theme="dark"]) .fc .fc-day-other .fc-daygrid-day-number {
      color: var(--color-gray-600);
    }

    :host-context([data-theme="dark"]) .fc .fc-day-today .fc-daygrid-day-number {
      color: #A5B4FC;
      font-weight: 600;
    }

    :host-context([data-theme="dark"]) .fc .fc-popover {
      background-color: var(--color-gray-100);
      border-color: var(--color-gray-300);
    }

    :host-context([data-theme="dark"]) .fc .fc-popover-header {
      background-color: var(--color-gray-200);
      color: var(--color-gray-700);
    }

    :host-context([data-theme="dark"]) .fc .fc-daygrid-more-link {
      color: var(--color-indigo-500);
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal-card {
      background-color: var(--color-surface);
      border-radius: 0.75rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      width: 100%;
      max-width: 400px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--color-gray-200);
    }

    .modal-header h2 {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 700;
      line-height: 1.4;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      line-height: 1;
      padding: 0;
      transition: color 0.15s;
    }

    .close-btn:hover {
      color: var(--color-gray-700) !important;
    }

    .modal-body {
      padding: 1rem;
    }

    .badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      width: fit-content;
    }

    .section-toggle {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.375rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--color-gray-600);
      transition: background-color 0.15s;
      border: none;
      cursor: pointer;
      background: none;
    }

    .section-toggle:hover {
      background-color: var(--color-gray-100);
    }

    .section-toggle .chevron {
      width: 0.875rem;
      height: 0.875rem;
      transition: transform 0.2s;
    }

    .section-toggle .chevron.rotate-180 {
      transform: rotate(180deg);
    }

    .planning-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--color-gray-600);
      border-left: 2px solid var(--color-indigo-500);
      padding-left: 0.5rem;
      padding-top: 0.25rem;
      padding-bottom: 0.25rem;
    }

    .task-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      transition: background-color 0.15s;
      color: var(--color-gray-600);
    }

    .task-item:hover {
      background-color: var(--color-gray-50);
    }

    .tareas-scroll::-webkit-scrollbar {
      width: 4px;
    }
    .tareas-scroll::-webkit-scrollbar-track {
      background: transparent;
    }
    .tareas-scroll::-webkit-scrollbar-thumb {
      background-color: var(--color-gray-300);
      border-radius: 4px;
    }
    .tareas-scroll::-webkit-scrollbar-thumb:hover {
      background-color: var(--color-gray-400);
    }
    .tareas-scroll {
      scrollbar-width: thin;
      scrollbar-color: var(--color-gray-300) transparent;
    }

    @media (max-width: 767px) {
      .calendario-page {
        padding: 0 0.5rem;
      }

      .fc-wrapper {
        padding: 0.5rem;
        border-radius: 0.5rem;
      }

      :host ::ng-deep .fc .fc-toolbar {
        flex-wrap: wrap;
        gap: 0.375rem;
      }

      :host ::ng-deep .fc .fc-toolbar-chunk {
        flex: 1 1 100%;
        display: flex;
        justify-content: center;
      }

      :host ::ng-deep .fc .fc-toolbar-title {
        font-size: 1rem !important;
        order: -1;
      }

      :host ::ng-deep .fc .fc-button {
        font-size: 0.7rem;
        padding: 0.25rem 0.4rem;
      }

      :host ::ng-deep .fc .fc-daygrid-day-number {
        font-size: 0.625rem;
      }

      :host ::ng-deep .fc .fc-event {
        font-size: 0.6rem;
        padding: 0 1px;
      }

      :host ::ng-deep .fc .fc-event-title {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .modal-backdrop {
        padding: 0.5rem;
      }

      .modal-card {
        max-height: 90vh;
        overflow-y: auto;
      }
    }
  `]
})
export class CalendarioComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly router = inject(Router);
  private readonly proyectoService = inject(ProyectoService);
  private readonly columnService = inject(ColumnService);
  protected readonly planningService = inject(PlanningService);
  protected readonly themeService = inject(ThemeService);
  private readonly equipoService = inject(EquipoService);
  private readonly authService = inject(AuthService);
  private readonly eventoService = inject(EventoService);

  protected showEventoModal = false;
  protected eventoFechaInicio = '';
  protected eventoFechaFin = '';

  protected readonly eventoForm = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.minLength(2)]],
    descripcion: [''],
    fechaInicio: ['', Validators.required],
    fechaFin: ['', Validators.required],
    todoElDia: [true],
    categoria: ['general'],
    color: ['#6366F1'],
  });

  protected readonly categorias = [
    {id: 'general', label: 'General'},
    {id: 'reunion', label: 'Reunión'},
    {id: 'deadline', label: 'Deadline'},
    {id: 'otro', label: 'Otro'},
  ];

  protected readonly colores = [
    '#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280',
  ];

  protected abrirModalEvento(fechaInicio: string, fechaFin: string): void {
    this.eventoFechaInicio = fechaInicio;
    this.eventoFechaFin = fechaFin;
    this.eventoForm.reset({
      titulo: '',
      descripcion: '',
      fechaInicio,
      fechaFin,
      todoElDia: true,
      categoria: 'general',
      color: '#6366F1',
    });
    this.showEventoModal = true;
  }

  protected cerrarModalEvento(): void {
    this.showEventoModal = false;
  }

  protected async onGuardarEvento(): Promise<void> {
    if (this.eventoForm.invalid) return;
    const raw = this.eventoForm.getRawValue();
    await this.eventoService.crear({
      titulo: raw.titulo,
      descripcion: raw.descripcion || undefined,
      fechaInicio: raw.fechaInicio,
      fechaFin: raw.fechaFin,
      todoElDia: raw.todoElDia,
      categoria: raw.categoria,
      color: raw.color,
    });
    this.cerrarModalEvento();
  }

  protected mostrarPlanificaciones = false;
  protected mostrarTareas = false;

  protected readonly complejidadEstilo = complejidadEstilo;
  protected readonly estimacionTotal = estimacionTotal;

  protected readonly planningsDelProyecto = computed(() => {
    const p = this.selectedProyecto();
    if (!p) return [];
    return this.planningService.plannings().filter(pl => pl.proyectoId === p.id);
  });

  protected readonly tareasDelProyecto = computed(() =>
    this.planningsDelProyecto().flatMap(pl => pl.tareas)
  );

  protected readonly porcentajeAvance = computed(() => {
    const lista = this.tareasDelProyecto();
    if (lista.length === 0) return 0;
    const completadas = lista.filter(t => t.completada).length;
    return Math.round((completadas / lista.length) * 100);
  });

  protected async toggleTarea(tareaId: string): Promise<void> {
    const planning = this.planningsDelProyecto().find(p =>
      p.tareas.some(t => t.id === tareaId)
    );
    if (planning) await this.planningService.toggleCompletada(planning.id, tareaId);
  }

  protected readonly selectedProyecto = signal<Proyecto | null>(null);

  readonly calendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    locale: esLocale,
    height: 'auto',
    selectable: true,
    selectMirror: true,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek',
    },
    dateClick: (info: any) => {
      if (this.esAdmin()) {
        this.abrirModalEvento(info.dateStr, info.dateStr);
      }
    },
    select: (info: any) => {
      if (this.esAdmin()) {
        this.abrirModalEvento(info.startStr, info.endStr);
      }
    },
    eventClick: (info: any) => {
      const tipo = info.event.extendedProps['tipo'];
      if (tipo === 'evento') {
        return;
      }
      const id = info.event.extendedProps['proyectoId'] as string;
      const proyecto = this.proyectoService.proyectoPorId(id);
      if (proyecto) {
        this.selectedProyecto.set(proyecto);
      }
    },
  };

  protected readonly esAdmin = computed(() => {
    const tipo = this.authService.currentUser()?.tipo;
    return tipo === ROL_SUPER_ADMIN_ID || tipo === 'administrador';
  });

  protected readonly proyectosVisibles = computed(() => {
    const lista = this.proyectoService.proyectos();
    if (this.esAdmin()) return lista;
    const id = this.authService.currentUser()?.id;
    if (!id) return [];
    return lista.filter((p) => this.equipoService.miembrosDe(p.id).includes(id));
  });

  protected readonly events = computed(() => {
    const proyectoEvents = this.proyectosVisibles().flatMap((p) => {
      const colors = statusColor(p.status);
      return getWeekdaySegments(p.fechaDesde, p.fechaHasta).map(seg => ({
        title: p.nombre,
        start: seg.start,
        end: seg.end,
        allDay: true,
        backgroundColor: colors.text,
        borderColor: colors.text,
        textColor: '#ffffff',
        extendedProps: {proyectoId: p.id},
      }));
    });
    const eventoEvents = this.eventoService.eventos().map(e => ({
      title: e.titulo,
      start: e.fechaInicio,
      end: e.fechaFin,
      allDay: e.todoElDia,
      backgroundColor: e.color ?? '#6366F1',
      borderColor: e.color ?? '#6366F1',
      textColor: '#ffffff',
      extendedProps: {tipo: 'evento', eventoId: e.id},
    }));
    return [...proyectoEvents, ...eventoEvents];
  });

  protected cerrarModal(): void {
    this.selectedProyecto.set(null);
  }

  protected columnaNombre(columnaId: string): string {
    return this.columnService.columnas().find((c: Columna) => c.id === columnaId)?.nombre ?? columnaId;
  }

  protected columnaColor(columnaId: string): string {
    return this.columnService.columnas().find((c: Columna) => c.id === columnaId)?.color ?? '#6b7280';
  }

  protected statusInfo(status: string) {
    return statusColor(status);
  }
}
