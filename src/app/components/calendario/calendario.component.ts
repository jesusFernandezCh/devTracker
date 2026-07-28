import {Component, inject, computed, signal, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule, DatePipe} from '@angular/common';
import {Router} from '@angular/router';
import {FullCalendarModule} from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import {ProyectoService} from '../../services/proyecto.service';
import {ColumnService} from '../../services/column.service';
import {ThemeService} from '../../services/theme.service';
import {statusColor} from '../../utils/estimacion';
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

@Component({
  selector: 'app-calendario',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FullCalendarModule, DatePipe],
  template: `
    <div class="calendario-page">
      <div class="flex justify-between items-center mb-6">
        <h1 style="color: var(--color-gray-900);" class="text-2xl font-bold">Calendario de Proyectos</h1>
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
              <div class="rounded-lg p-4 mb-4" style="background-color: var(--color-gray-50);">
                <p class="text-sm leading-relaxed" style="color: var(--color-gray-600);">{{ p.descripcion }}</p>
              </div>
            }

            <div class="grid grid-cols-2 gap-x-6 gap-y-4">
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

            <div class="mt-4 pt-4 border-t" style="border-color: var(--color-gray-200);">
              <span class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Duración</span>
              <p class="mt-1 text-sm" style="color: var(--color-gray-800);">
                {{ p.fechaDesde | date:'dd/MM/yyyy' }} — {{ p.fechaHasta | date:'dd/MM/yyyy' }}
              </p>
            </div>

            <div class="flex justify-end pt-4">
              <button (click)="router.navigate(['/proyectos'])"
                      class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
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
      max-width: 480px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--color-gray-200);
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      line-height: 1.4;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      line-height: 1;
      padding: 0;
      transition: color 0.15s;
    }

    .close-btn:hover {
      color: var(--color-gray-700) !important;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      width: fit-content;
    }
  `]
})
export class CalendarioComponent {
  protected readonly router = inject(Router);
  private readonly proyectoService = inject(ProyectoService);
  private readonly columnService = inject(ColumnService);
  protected readonly themeService = inject(ThemeService);

  protected readonly selectedProyecto = signal<Proyecto | null>(null);

  readonly calendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    locale: esLocale,
    height: 'auto',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek',
    },
    eventClick: (info: any) => {
      const id = info.event.extendedProps['proyectoId'] as string;
      const proyecto = this.proyectoService.proyectoPorId(id);
      if (proyecto) {
        this.selectedProyecto.set(proyecto);
      }
    },
  };

  protected readonly events = computed(() =>
    this.proyectoService.proyectos().map((p) => {
      const colors = statusColor(p.status);
      return {
        title: p.nombre,
        start: p.fechaDesde,
        end: addDay(p.fechaHasta),
        allDay: true,
        backgroundColor: colors.text,
        borderColor: colors.text,
        textColor: '#ffffff',
        extendedProps: {proyectoId: p.id},
      };
    }),
  );

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
