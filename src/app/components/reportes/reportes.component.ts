import {Component, inject, ChangeDetectionStrategy, signal, computed, effect} from '@angular/core';
import {HighchartsChartComponent} from 'highcharts-angular';
import type {Options as HighchartsOptions, SeriesOptionsType} from 'highcharts';
import {ReporteService} from '../../services/reporte.service';
import {ColumnService} from '../../services/column.service';
import {ThemeService} from '../../services/theme.service';
import {estimacionTotal} from '../../utils/estimacion';

type TabReporte = 'proyectos' | 'productividad' | 'estimacion' | 'vencimientos' | 'pipeline' | 'calidad' | 'clientes' | 'usuarios' | 'graficas';
type GraficaId = 'cerradas' | 'balance' | 'puntos' | 'produccion' | 'activos';

const PAGINA_SIZE = 10;

const PALETA_CLARA = {fondo: '#ffffff', texto: '#374151', suave: '#6b7280', grid: '#f1f5f9'};
const PALETA_OSCURA = {fondo: '#1E293B', texto: '#E2E8F0', suave: '#94A3B8', grid: '#334155'};

const URGENCIA_STYLE: Record<string, {text: string; bg: string; label: string}> = {
  urgente: {text: '#ffffff', bg: '#e11d48', label: 'URGENTE'},
  alerta: {text: '#92400e', bg: '#fbbf24', label: 'ALERTA'},
  normal: {text: '#6b7280', bg: '#e5e7eb', label: 'NORMAL'},
};

@Component({
  selector: 'app-reportes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HighchartsChartComponent],
  template: `
    <div class="mb-6">
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1>Reportes</h1>
          <p class="mt-1 text-sm" style="color: var(--color-gray-500)">
            Indicadores de proyectos, tareas, estimación y avance.
          </p>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="no-print mb-6 p-4 rounded-xl border flex flex-wrap items-end gap-3"
         style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
      <div>
        <label class="block text-xs font-medium mb-1" style="color: var(--color-gray-500);">Desde</label>
        <input type="date" [value]="reporteService.fechaDesde()"
               (input)="reporteService.fechaDesde.set($any($event.target).value)"
               class="px-2.5 py-2 text-sm rounded-lg outline-none transition-colors"
               style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);">
      </div>
      <div>
        <label class="block text-xs font-medium mb-1" style="color: var(--color-gray-500);">Hasta</label>
        <input type="date" [value]="reporteService.fechaHasta()"
               (input)="reporteService.fechaHasta.set($any($event.target).value)"
               class="px-2.5 py-2 text-sm rounded-lg outline-none transition-colors"
               style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);">
      </div>
      <div class="min-w-[12rem]">
        <label class="block text-xs font-medium mb-1" style="color: var(--color-gray-500);">Proyecto</label>
        <select [value]="reporteService.proyectoId()"
                (change)="reporteService.proyectoId.set($any($event.target).value)"
                class="w-full px-2.5 py-2 text-sm rounded-lg outline-none transition-colors"
                style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);">
          <option value="">Todos los proyectos</option>
          @for (p of reporteService.proyectosAccesibles(); track p.id) {
            <option [value]="p.id">{{ p.nombre }}</option>
          }
        </select>
      </div>
      <button (click)="reporteService.limpiarFiltros()"
              class="px-3 py-2 text-sm font-medium rounded-lg transition-colors text-[var(--color-gray-700)] bg-[var(--color-gray-100)] hover:bg-[var(--color-gray-200)]">
        Limpiar
      </button>
    </div>

    <!-- Pestañas -->
    <div class="no-print mb-6 flex flex-wrap gap-1.5">
      @for (tab of tabs; track tab.id) {
        <button (click)="tabActivo.set(tab.id)"
                class="px-3.5 py-2 text-sm font-medium rounded-lg transition-colors"
                [style.background-color]="tabActivo() === tab.id ? 'var(--color-indigo-600)' : 'var(--color-surface)'"
                [style.color]="tabActivo() === tab.id ? '#ffffff' : 'var(--color-gray-600)'"
                [style.border]="'1px solid ' + (tabActivo() === tab.id ? 'var(--color-indigo-600)' : 'var(--color-gray-200)')">
          {{ tab.label }}
        </button>
      }
    </div>

    <div class="print-area">
      @switch (tabActivo()) {
        @case ('proyectos') {
          @let rows = proyectosPagina();
          <div class="mb-4 flex items-center justify-between no-print">
            <h2 class="text-lg font-semibold" style="color: var(--color-gray-900);">Reporte de proyectos</h2>
            <div class="flex items-center gap-2">
              <button (click)="exportarProyectos()" class="btn-accion">Exportar CSV</button>
              <button (click)="imprimir()" class="btn-accion">Imprimir</button>
            </div>
          </div>
          <div class="rounded-xl border shadow-sm overflow-hidden" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
            <div class="overflow-x-auto">
              <table class="w-full min-w-[900px] text-sm">
                <thead>
                  <tr style="border-bottom: 1px solid var(--color-gray-100);">
                    <th class="th-cell">Proyecto</th>
                    <th class="th-cell">Estado</th>
                    <th class="th-cell">Prioridad</th>
                    <th class="th-cell">Tareas</th>
                    <th class="th-cell">Completadas</th>
                    <th class="th-cell">Avance</th>
                    <th class="th-cell">Story points</th>
                    <th class="th-cell">Vence</th>
                  </tr>
                </thead>
                <tbody style="border-top: 1px solid var(--color-gray-100);">
                  @for (r of rows; track r.proyecto.id) {
                    <tr style="border-bottom: 1px solid var(--color-gray-100);">
                      <td class="td-cell font-medium" style="color: var(--color-gray-900);">{{ r.proyecto.nombre }}</td>
                      <td class="td-cell">
                        <span class="badge" [style.background-color]="r.proyecto.status ? 'var(--color-indigo-100)' : 'var(--color-gray-100)'"
                              [style.color]="'var(--color-indigo-700)'">{{ r.proyecto.status || '—' }}</span>
                      </td>
                      <td class="td-cell">
                        @if (r.proyecto.prioridad) {
                          <span class="badge" [style.background-color]="'var(--color-amber-100)'" [style.color]="'var(--color-amber-700)'">{{ r.proyecto.prioridad }}</span>
                        } @else { — }
                      </td>
                      <td class="td-cell" style="color: var(--color-gray-700);">{{ r.tareas }}</td>
                      <td class="td-cell" style="color: var(--color-gray-700);">{{ r.completadas }}</td>
                      <td class="td-cell">
                        <span class="font-semibold" [style.color]="colorPorcentaje(r.porcentaje)">{{ r.porcentaje }}%</span>
                      </td>
                      <td class="td-cell" style="color: var(--color-gray-700);">{{ r.puntos }}</td>
                      <td class="td-cell">
                        @if (r.diasRestantes !== null) {
                          <span class="badge" [style.background-color]="URGENCIA_STYLE[r.urgencia].bg"
                                [style.color]="URGENCIA_STYLE[r.urgencia].text">{{ URGENCIA_STYLE[r.urgencia].label }} · {{ r.diasRestantes }}d</span>
                        } @else { — }
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="8" class="empty-state">No hay proyectos para los filtros aplicados.</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          @if (totalProyectosReporte() > 0) {
            <div class="mt-4 flex items-center justify-between gap-4 flex-wrap no-print">
              <p class="text-sm" style="color: var(--color-gray-500);">
                Mostrando {{ inicioProyectos() }}–{{ finProyectos() }} de {{ totalProyectosReporte() }} proyecto{{ totalProyectosReporte() !== 1 ? 's' : '' }}
              </p>
              <div class="flex items-center gap-1">
                <button (click)="anteriorProyectos()" [disabled]="paginaProyectos() <= 1"
                        class="px-2.5 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-[var(--color-gray-600)] hover:bg-[var(--color-gray-100)]">
                  Anterior
                </button>
                @if (paginasProyectos() > 1) {
                  @for (p of rangoProyectos(); track $index) {
                    @if (p === null) {
                      <span class="px-1 text-sm" style="color: var(--color-gray-400);">…</span>
                    } @else {
                      <button (click)="irPaginaProyectos(p)"
                              class="min-w-[2rem] px-2 py-1.5 text-sm font-medium rounded-lg transition-colors"
                              [style.background-color]="p === paginaProyectos() ? 'var(--color-indigo-600)' : 'var(--color-surface)'"
                              [style.color]="p === paginaProyectos() ? '#ffffff' : 'var(--color-gray-600)'"
                              [style.border]="p === paginaProyectos() ? '1px solid var(--color-indigo-600)' : '1px solid var(--color-gray-200)'">
                        {{ p }}
                      </button>
                    }
                  }
                }
                <button (click)="siguienteProyectos()" [disabled]="paginaProyectos() >= paginasProyectos()"
                        class="px-2.5 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-[var(--color-gray-600)] hover:bg-[var(--color-gray-100)]">
                  Siguiente
                </button>
              </div>
            </div>
          }
        }

        @case ('productividad') {
          @let items = reporteService.productividadPorProyecto();
          <div class="mb-4 flex items-center justify-between no-print">
            <h2 class="text-lg font-semibold" style="color: var(--color-gray-900);">Productividad por proyecto</h2>
            <div class="flex items-center gap-2">
              <button (click)="exportarProductividad()" class="btn-accion">Exportar CSV</button>
              <button (click)="imprimir()" class="btn-accion">Imprimir</button>
            </div>
          </div>
          <div class="space-y-4">
            @for (item of items; track item.proyecto.id) {
              <div class="rounded-xl border shadow-sm overflow-hidden" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
                <div class="flex items-center justify-between gap-4 px-5 py-3.5 border-b flex-wrap" style="border-color: var(--color-gray-100);">
                  <div>
                    <p class="text-sm font-semibold" style="color: var(--color-gray-900);">{{ item.proyecto.nombre }}</p>
                    <p class="text-xs mt-0.5" style="color: var(--color-gray-500);">{{ item.plannings.length }} planning(s) · {{ item.puntos }} story points</p>
                  </div>
                  <span class="inline-flex items-center gap-2">
                    <div class="w-32 h-1.5 rounded-full overflow-hidden" style="background-color: var(--color-gray-100);">
                      <div class="h-full rounded-full" [style.width.%]="item.porcentaje" [style.background-color]="colorPorcentaje(item.porcentaje)"></div>
                    </div>
                    <span class="text-sm font-semibold" style="color: var(--color-gray-700);">{{ item.porcentaje }}%</span>
                  </span>
                </div>
                @if (item.plannings.length > 0) {
                  <table class="w-full text-sm">
                    <thead>
                      <tr style="border-bottom: 1px solid var(--color-gray-100);">
                        <th class="th-cell">Fecha</th>
                        <th class="th-cell">Descripción</th>
                        <th class="th-cell">Tareas</th>
                        <th class="th-cell">Completadas</th>
                        <th class="th-cell">Puntos</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (pl of item.plannings; track pl.planning.id) {
                        <tr style="border-bottom: 1px solid var(--color-gray-100);">
                          <td class="td-cell" style="color: var(--color-gray-700);">{{ pl.planning.fecha }}</td>
                          <td class="td-cell" style="color: var(--color-gray-900);">{{ pl.planning.descripcion || '—' }}</td>
                          <td class="td-cell" style="color: var(--color-gray-700);">{{ pl.tareas.length }}</td>
                          <td class="td-cell" style="color: var(--color-gray-700);">{{ pl.completadas }}</td>
                          <td class="td-cell font-semibold" style="color: var(--color-indigo-600);">{{ pl.puntos }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                }
              </div>
            } @empty {
              <div class="rounded-xl border p-10 text-center text-sm" style="background-color: var(--color-surface); border-color: var(--color-gray-200); color: var(--color-gray-400);">
                No hay proyectos para los filtros aplicados.
              </div>
            }
          </div>
        }

        @case ('estimacion') {
          @let complejidad = reporteService.estimacionPorComplejidad();
          @let porProyecto = reporteService.estimacionPorProyecto();
          <div class="mb-4 flex items-center justify-between no-print">
            <h2 class="text-lg font-semibold" style="color: var(--color-gray-900);">Estimación / carga de trabajo</h2>
            <div class="flex items-center gap-2">
              <button (click)="exportarEstimacion()" class="btn-accion">Exportar CSV</button>
              <button (click)="imprimir()" class="btn-accion">Imprimir</button>
            </div>
          </div>
          <div class="grid md:grid-cols-3 gap-4 mb-4">
            @for (c of complejidad; track c.complejidad) {
              <div class="rounded-xl border p-4" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
                <p class="text-xs font-semibold uppercase tracking-wider mb-1" style="color: var(--color-gray-400);">{{ c.complejidad }}</p>
                <p class="text-2xl font-bold" style="color: var(--color-gray-900);">{{ c.cantidad }} <span class="text-sm font-medium" style="color: var(--color-gray-400);">tarea{{ c.cantidad !== 1 ? 's' : '' }}</span></p>
                <p class="text-sm mt-1" style="color: var(--color-indigo-600);">{{ c.puntos }} pts</p>
              </div>
            }
          </div>
          <div class="rounded-xl border shadow-sm overflow-hidden" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr style="border-bottom: 1px solid var(--color-gray-100);">
                    <th class="th-cell">Proyecto</th>
                    <th class="th-cell">Tareas</th>
                    <th class="th-cell">Story points</th>
                    <th class="th-cell">Peso relativo</th>
                  </tr>
                </thead>
                <tbody style="border-top: 1px solid var(--color-gray-100);">
                  @let totalPuntos = sumarPuntos(porProyecto);
                  @for (r of porProyecto; track r.proyecto.id) {
                    <tr style="border-bottom: 1px solid var(--color-gray-100);">
                      <td class="td-cell font-medium" style="color: var(--color-gray-900);">{{ r.proyecto.nombre }}</td>
                      <td class="td-cell" style="color: var(--color-gray-700);">{{ r.tareas }}</td>
                      <td class="td-cell font-semibold" style="color: var(--color-indigo-600);">{{ r.puntos }}</td>
                      <td class="td-cell">
                        <div class="flex items-center gap-2">
                          <div class="w-28 h-1.5 rounded-full overflow-hidden" style="background-color: var(--color-gray-100);">
                            <div class="h-full rounded-full" [style.width.%]="totalPuntos > 0 ? (r.puntos / totalPuntos) * 100 : 0" style="background-color: var(--color-indigo-500);"></div>
                          </div>
                          <span class="text-xs" style="color: var(--color-gray-400);">{{ totalPuntos > 0 ? Math.round((r.puntos / totalPuntos) * 100) : 0 }}%</span>
                        </div>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="4" class="empty-state">No hay tareas para los filtros aplicados.</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        @case ('vencimientos') {
          @let vencimientos = reporteService.vencimientos();
          <div class="mb-4 flex items-center justify-between no-print">
            <h2 class="text-lg font-semibold" style="color: var(--color-gray-900);">Vencimientos próximos</h2>
            <div class="flex items-center gap-2">
              <button (click)="exportarVencimientos()" class="btn-accion">Exportar CSV</button>
              <button (click)="imprimir()" class="btn-accion">Imprimir</button>
            </div>
          </div>
          <div class="rounded-xl border shadow-sm overflow-hidden" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr style="border-bottom: 1px solid var(--color-gray-100);">
                    <th class="th-cell">Proyecto</th>
                    <th class="th-cell">Fecha límite</th>
                    <th class="th-cell">Días restantes</th>
                    <th class="th-cell">Urgencia</th>
                  </tr>
                </thead>
                <tbody style="border-top: 1px solid var(--color-gray-100);">
                  @for (v of vencimientos; track v.proyecto.id) {
                    <tr style="border-bottom: 1px solid var(--color-gray-100);">
                      <td class="td-cell font-medium" style="color: var(--color-gray-900);">{{ v.proyecto.nombre }}</td>
                      <td class="td-cell" style="color: var(--color-gray-700);">{{ v.proyecto.fechaHasta }}</td>
                      <td class="td-cell font-semibold" [style.color]="URGENCIA_STYLE[v.urgencia].bg === '#e11d48' ? '#e11d48' : 'var(--color-gray-700)'">{{ v.diasRestantes }}d</td>
                      <td class="td-cell">
                        <span class="badge" [style.background-color]="URGENCIA_STYLE[v.urgencia].bg" [style.color]="URGENCIA_STYLE[v.urgencia].text">{{ URGENCIA_STYLE[v.urgencia].label }}</span>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="4" class="empty-state">No hay proyectos con fecha límite.</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        @case ('pipeline') {
          @let pipeline = reporteService.pipelinePorColumna();
          <div class="mb-4 flex items-center justify-between no-print">
            <h2 class="text-lg font-semibold" style="color: var(--color-gray-900);">Pipeline por ambiente</h2>
            <div class="flex items-center gap-2">
              <button (click)="exportarPipeline()" class="btn-accion">Exportar CSV</button>
              <button (click)="imprimir()" class="btn-accion">Imprimir</button>
            </div>
          </div>
          <div class="rounded-xl border shadow-sm p-5" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
            <div class="flex h-8 rounded-lg overflow-hidden" style="background-color: var(--color-gray-100);">
              @for (item of pipeline; track item.columna.id) {
                @if (item.porcentaje > 0) {
                  <div class="min-w-[4px]" [style.width.%]="item.porcentaje" [style.background-color]="item.columna.color"
                       [title]="item.columna.nombre + ': ' + item.cantidad + ' proyecto' + (item.cantidad !== 1 ? 's' : '')"></div>
                }
              }
            </div>
            <div class="flex flex-wrap gap-4 mt-4">
              @for (item of pipeline; track item.columna.id) {
                <div class="flex items-center gap-2 text-sm">
                  <span class="w-2.5 h-2.5 rounded-full" [style.background-color]="item.columna.color"></span>
                  <span style="color: var(--color-gray-600);">{{ item.columna.nombre }}</span>
                  <span class="font-semibold" style="color: var(--color-gray-900);">{{ item.cantidad }}</span>
                  <span style="color: var(--color-gray-400);">({{ item.porcentaje }}%)</span>
                </div>
              }
            </div>
          </div>
        }

        @case ('calidad') {
          @let calidad = reporteService.calidadPorColumna();
          <div class="mb-4 flex items-center justify-between no-print">
            <h2 class="text-lg font-semibold" style="color: var(--color-gray-900);">Calidad por ambiente</h2>
            <div class="flex items-center gap-2">
              <button (click)="exportarCalidad()" class="btn-accion">Exportar CSV</button>
              <button (click)="imprimir()" class="btn-accion">Imprimir</button>
            </div>
          </div>
          <div class="grid md:grid-cols-3 gap-4">
            @for (c of calidad; track c.columna.id) {
              <div class="rounded-xl border p-5" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
                <div class="flex items-center gap-2 mb-3">
                  <span class="w-2.5 h-2.5 rounded-full" [style.background-color]="c.columna.color"></span>
                  <p class="text-sm font-semibold" style="color: var(--color-gray-900);">{{ c.columna.nombre }}</p>
                </div>
                <p class="text-3xl font-bold" style="color: var(--color-gray-900);">{{ c.porcentaje }}<span class="text-base" style="color: var(--color-gray-400);">%</span></p>
                <p class="text-sm mt-1" style="color: var(--color-gray-500);">{{ c.completadas }} de {{ c.total }} completadas</p>
                <div class="mt-3 h-1.5 rounded-full overflow-hidden" style="background-color: var(--color-gray-100);">
                  <div class="h-full rounded-full" [style.width.%]="c.porcentaje" [style.background-color]="colorPorcentaje(c.porcentaje)"></div>
                </div>
                <p class="text-xs mt-2" style="color: var(--color-gray-400);">{{ c.pendientes }} pendiente{{ c.pendientes !== 1 ? 's' : '' }}</p>
              </div>
            }
          </div>
        }

        @case ('clientes') {
          @let porCliente = reporteService.avancePorCliente();
          <div class="mb-4 flex items-center justify-between no-print">
            <h2 class="text-lg font-semibold" style="color: var(--color-gray-900);">Avance por cliente</h2>
            <div class="flex items-center gap-2">
              <button (click)="exportarClientes()" class="btn-accion">Exportar CSV</button>
              <button (click)="imprimir()" class="btn-accion">Imprimir</button>
            </div>
          </div>

          <div class="rounded-xl border shadow-sm overflow-hidden mb-6" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
            <div class="overflow-x-auto">
              <table class="w-full min-w-[700px] text-sm">
                <thead>
                  <tr style="border-bottom: 1px solid var(--color-gray-100);">
                    <th class="th-cell">Cliente</th>
                    <th class="th-cell">Proyectos</th>
                    <th class="th-cell">Tareas</th>
                    <th class="th-cell">Completadas</th>
                    <th class="th-cell">Pendientes</th>
                    <th class="th-cell">Avance</th>
                  </tr>
                </thead>
                <tbody style="border-top: 1px solid var(--color-gray-100);">
                  @for (c of porCliente; track c.cliente) {
                    <tr style="border-bottom: 1px solid var(--color-gray-100);">
                      <td class="td-cell font-medium" style="color: var(--color-gray-900);">{{ c.cliente }}</td>
                      <td class="td-cell" style="color: var(--color-gray-700);">{{ c.proyectos }}</td>
                      <td class="td-cell" style="color: var(--color-gray-700);">{{ c.tareas }}</td>
                      <td class="td-cell" style="color: var(--color-gray-700);">{{ c.completadas }}</td>
                      <td class="td-cell" style="color: var(--color-gray-700);">{{ c.pendientes }}</td>
                      <td class="td-cell">
                        <span class="font-semibold" [style.color]="colorPorcentaje(c.porcentaje)">{{ c.porcentaje }}%</span>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="6" class="empty-state">No hay proyectos para los filtros aplicados.</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <div class="rounded-xl border shadow-sm p-4" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
            <h3 class="text-sm font-semibold mb-3" style="color: var(--color-gray-900);">Tareas completadas por mes y cliente</h3>
            @if (hayMensualCliente()) {
              <highcharts-chart [options]="graficaMensualCliente()" class="grafica"></highcharts-chart>
            } @else {
              <div class="rounded-xl border p-10 text-center text-sm" style="background-color: var(--color-surface); border-color: var(--color-gray-200); color: var(--color-gray-400);">
                No hay datos mensuales por cliente para los filtros aplicados.
              </div>
            }
          </div>
        }

        @case ('usuarios') {
          @let porUsuario = reporteService.productividadPorUsuario();
          @let porTipo = reporteService.usuariosPorTipo();
          <div class="mb-4 flex items-center justify-between no-print">
            <h2 class="text-lg font-semibold" style="color: var(--color-gray-900);">Productividad por usuario</h2>
            <div class="flex items-center gap-2">
              <button (click)="exportarUsuarios()" class="btn-accion">Exportar CSV</button>
              <button (click)="imprimir()" class="btn-accion">Imprimir</button>
            </div>
          </div>

          <div class="rounded-xl border shadow-sm overflow-hidden mb-6" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
            <div class="overflow-x-auto">
              <table class="w-full min-w-[700px] text-sm">
                <thead>
                  <tr style="border-bottom: 1px solid var(--color-gray-100);">
                    <th class="th-cell">Usuario</th>
                    <th class="th-cell">Plannings</th>
                    <th class="th-cell">Tareas</th>
                    <th class="th-cell">Completadas</th>
                    <th class="th-cell">Pendientes</th>
                    <th class="th-cell">Story points</th>
                    <th class="th-cell">Avance</th>
                  </tr>
                </thead>
                <tbody style="border-top: 1px solid var(--color-gray-100);">
                  @for (u of porUsuario; track u.usuarioId) {
                    <tr style="border-bottom: 1px solid var(--color-gray-100);">
                      <td class="td-cell font-medium" style="color: var(--color-gray-900);">{{ u.nombre }}</td>
                      <td class="td-cell" style="color: var(--color-gray-700);">{{ u.plannings }}</td>
                      <td class="td-cell" style="color: var(--color-gray-700);">{{ u.tareas }}</td>
                      <td class="td-cell" style="color: var(--color-gray-700);">{{ u.completadas }}</td>
                      <td class="td-cell" style="color: var(--color-gray-700);">{{ u.pendientes }}</td>
                      <td class="td-cell font-semibold" style="color: var(--color-indigo-600);">{{ u.puntos }}</td>
                      <td class="td-cell">
                        <span class="font-semibold" [style.color]="colorPorcentaje(u.porcentaje)">{{ u.porcentaje }}%</span>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="7" class="empty-state">No hay plannings para los filtros aplicados.</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <div class="rounded-xl border shadow-sm p-5" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
            <h3 class="text-sm font-semibold mb-3" style="color: var(--color-gray-900);">Usuarios por tipo</h3>
            @if (porTipo.length > 0) {
              <div class="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                @for (t of porTipo; track t.rol) {
                  <div class="flex items-center justify-between gap-3 rounded-lg border p-3" style="border-color: var(--color-gray-200); background-color: var(--color-gray-50);">
                    <span class="text-sm font-medium" style="color: var(--color-gray-800);">{{ t.nombre }}</span>
                    <span class="badge" style="background-color: var(--color-indigo-100); color: var(--color-indigo-700);">{{ t.cantidad }}</span>
                  </div>
                }
              </div>
            } @else {
              <div class="rounded-xl border p-10 text-center text-sm" style="background-color: var(--color-surface); border-color: var(--color-gray-200); color: var(--color-gray-400);">
                Sin usuarios registrados.
              </div>
            }
          </div>
        }

        @case ('graficas') {
          <div class="mb-4 flex items-center justify-between no-print">
            <h2 class="text-lg font-semibold" style="color: var(--color-gray-900);">Gráficas</h2>
            <button (click)="imprimir()" class="btn-accion">Imprimir</button>
          </div>
          @if (hayDatosMensuales()) {
            <div class="grid md:grid-cols-2 gap-4">
              <div class="rounded-xl border shadow-sm p-4" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
                <highcharts-chart [options]="graficas().cerradas" class="grafica"></highcharts-chart>
              </div>
              <div class="rounded-xl border shadow-sm p-4" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
                <highcharts-chart [options]="graficas().produccion" class="grafica"></highcharts-chart>
              </div>
              <div class="rounded-xl border shadow-sm p-4" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
                <highcharts-chart [options]="graficas().balance" class="grafica"></highcharts-chart>
              </div>
              <div class="rounded-xl border shadow-sm p-4" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
                <highcharts-chart [options]="graficas().puntos" class="grafica"></highcharts-chart>
              </div>
              <div class="rounded-xl border shadow-sm p-4 md:col-span-2" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
                <highcharts-chart [options]="graficas().activos" class="grafica"></highcharts-chart>
              </div>
            </div>
          } @else {
            <div class="rounded-xl border p-10 text-center text-sm" style="background-color: var(--color-surface); border-color: var(--color-gray-200); color: var(--color-gray-400);">
              No hay datos mensuales para los filtros aplicados.
            </div>
          }
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .grafica {
      width: 100%;
      height: 320px;
      display: block;
    }

    .btn-accion {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
      font-weight: 500;
      border-radius: 0.5rem;
      color: var(--color-gray-700);
      background-color: var(--color-gray-100);
      border: 1px solid var(--color-gray-200);
      cursor: pointer;
      transition: background-color 0.15s, color 0.15s;
    }
    .btn-accion:hover { background-color: var(--color-gray-200); }

    .th-cell {
      text-align: left;
      padding: 0.625rem 1rem;
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-gray-400);
    }

    .td-cell {
      padding: 0.625rem 1rem;
      white-space: nowrap;
    }
  `]
})
export class ReportesComponent {
  protected readonly reporteService = inject(ReporteService);
  protected readonly columnService = inject(ColumnService);
  protected readonly themeService = inject(ThemeService);

  protected readonly tabActivo = signal<TabReporte>('proyectos');
  protected readonly tabs: {id: TabReporte; label: string}[] = [
    {id: 'proyectos', label: 'Proyectos'},
    {id: 'productividad', label: 'Productividad'},
    {id: 'estimacion', label: 'Estimación'},
    {id: 'vencimientos', label: 'Vencimientos'},
    {id: 'pipeline', label: 'Pipeline'},
    {id: 'calidad', label: 'Calidad'},
    {id: 'clientes', label: 'Clientes'},
    {id: 'usuarios', label: 'Usuarios'},
    {id: 'graficas', label: 'Gráficas'},
  ];

  protected readonly URGENCIA_STYLE = URGENCIA_STYLE;
  protected readonly estimacionTotal = estimacionTotal;
  protected readonly Math = Math;

  protected readonly paginaProyectos = signal(1);
  protected readonly totalProyectosReporte = computed(() => this.reporteService.proyectosDetalle().length);
  protected readonly paginasProyectos = computed(() => Math.max(1, Math.ceil(this.totalProyectosReporte() / PAGINA_SIZE)));
  protected readonly inicioProyectos = computed(() => (this.paginaProyectos() - 1) * PAGINA_SIZE + 1);
  protected readonly finProyectos = computed(() => Math.min(this.paginaProyectos() * PAGINA_SIZE, this.totalProyectosReporte()));
  protected readonly proyectosPagina = computed(() =>
    this.reporteService.proyectosDetalle().slice(this.inicioProyectos() - 1, this.finProyectos()),
  );
  protected readonly rangoProyectos = computed<(number | null)[]>(() => {
    const total = this.paginasProyectos();
    const actual = this.paginaProyectos();
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
      const total = this.paginasProyectos();
      if (this.paginaProyectos() > total) {
        this.paginaProyectos.set(total);
      }
    });
  }

  irPaginaProyectos(pagina: number): void {
    if (pagina >= 1 && pagina <= this.paginasProyectos()) {
      this.paginaProyectos.set(pagina);
    }
  }

  anteriorProyectos(): void {
    this.irPaginaProyectos(this.paginaProyectos() - 1);
  }

  siguienteProyectos(): void {
    this.irPaginaProyectos(this.paginaProyectos() + 1);
  }

  protected colorPorcentaje(pct: number): string {
    if (pct >= 75) return 'var(--color-emerald-600)';
    if (pct >= 40) return 'var(--color-amber-500)';
    return 'var(--color-rose-500)';
  }

  protected sumarPuntos(items: {puntos: number}[]): number {
    return items.reduce((s, r) => s + r.puntos, 0);
  }

  protected nombreColumna(id: string): string {
    return this.columnService.columnas().find(c => c.id === id)?.nombre ?? '—';
  }

  protected readonly hayDatosMensuales = computed(() => this.reporteService.datosMensuales().length > 0);

  protected readonly hayMensualCliente = computed(() => {
    const datos = this.reporteService.avanceMensualPorCliente();
    return Object.keys(datos).length > 0 && (Object.values(datos)[0]?.length ?? 0) > 0;
  });

  protected readonly graficaMensualCliente = computed<HighchartsOptions>(() => {
    const p = this.themeService.isDark() ? PALETA_OSCURA : PALETA_CLARA;
    const datos = this.reporteService.avanceMensualPorCliente();
    const clientes = Object.keys(datos);
    const categorias = clientes[0] ? datos[clientes[0]].map(d => d.etiqueta) : [];
    const colores = ['#6366f1', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6', '#0ea5e9', '#10b981', '#f43f5e'];
    const series = clientes
      .filter(c => (datos[c]?.length ?? 0) > 0)
      .map((c, i) => ({
        nombre: c,
        datos: datos[c].map(d => d.completadas),
        color: colores[i % colores.length],
      }));
    return this.construirOpcionesGrafica({
      titulo: 'Tareas completadas por mes y cliente',
      tipo: 'column',
      categorias,
      series,
    });
  });

  protected readonly graficas = computed<Record<GraficaId, HighchartsOptions>>(() => {
    const datos = this.reporteService.datosMensuales();
    const categorias = datos.map(d => d.etiqueta);
    const oscuro = this.themeService.isDark();
    const pendientesColor = oscuro ? '#475569' : '#CBD5E1';
    return {
      cerradas: this.construirOpcionesGrafica({
        titulo: 'Tareas cerradas por mes',
        tipo: 'column',
        categorias,
        series: [{nombre: 'Cerradas', datos: datos.map(d => d.completadas), color: '#6366F1'}],
      }),
      balance: this.construirOpcionesGrafica({
        titulo: 'Tareas pendientes vs completadas por mes',
        tipo: 'column',
        categorias,
        apilado: true,
        series: [
          {nombre: 'Pendientes', datos: datos.map(d => d.pendientes), color: pendientesColor},
          {nombre: 'Completadas', datos: datos.map(d => d.completadas), color: '#6366F1'},
        ],
      }),
      puntos: this.construirOpcionesGrafica({
        titulo: 'Story points por mes',
        tipo: 'area',
        categorias,
        series: [{nombre: 'Story points', datos: datos.map(d => d.puntos), color: '#8B5CF6'}],
      }),
      produccion: this.construirOpcionesGrafica({
        titulo: 'Proyectos llevados a producción por mes',
        tipo: 'column',
        categorias,
        series: [{nombre: 'En producción', datos: datos.map(d => d.proyectosProduccion), color: '#10B981'}],
      }),
      activos: this.construirOpcionesGrafica({
        titulo: 'Proyectos activos por mes',
        tipo: 'line',
        categorias,
        series: [{nombre: 'Activos', datos: datos.map(d => d.proyectosActivos), color: '#0EA5E9'}],
      }),
    };
  });

  private construirOpcionesGrafica(opts: {
    titulo: string;
    tipo: 'column' | 'area' | 'line';
    categorias: string[];
    apilado?: boolean;
    series: {nombre: string; datos: number[]; color: string}[];
  }): HighchartsOptions {
    const p = this.themeService.isDark() ? PALETA_OSCURA : PALETA_CLARA;
    const continuo = opts.tipo === 'area' || opts.tipo === 'line';
    return {
      chart: {
        type: opts.tipo,
        backgroundColor: p.fondo,
        height: 320,
        style: {fontFamily: "'Inter', -apple-system, 'Segoe UI', sans-serif"},
      },
      title: {text: opts.titulo, style: {color: p.texto, fontSize: '14px', fontWeight: '600'}},
      credits: {enabled: false},
      legend: {
        enabled: true,
        itemStyle: {color: p.texto},
        itemHoverStyle: {color: p.texto},
      },
      tooltip: {shared: true},
      xAxis: {
        categories: opts.categorias,
        labels: {style: {color: p.suave}},
        lineColor: p.grid,
        tickColor: p.grid,
      },
      yAxis: {
        title: {text: undefined},
        gridLineColor: p.grid,
        labels: {style: {color: p.suave}},
        allowDecimals: false,
      },
      plotOptions: opts.apilado ? {column: {stacking: 'normal'}} : {},
      series: opts.series.map(s => ({
        name: s.nombre,
        data: s.datos,
        color: s.color,
        type: opts.tipo,
        ...(continuo ? {marker: {enabled: false}, lineWidth: 2} : {}),
        ...(opts.tipo === 'area' ? {fillOpacity: 0.25} : {}),
      })) as SeriesOptionsType[],
    };
  }

  protected imprimir(): void {
    window.print();
  }

  protected exportarProyectos(): void {
    const filas = this.reporteService.proyectosDetalle().map(r => ({
      Proyecto: r.proyecto.nombre,
      Estado: r.proyecto.status ?? '',
      Prioridad: r.proyecto.prioridad ?? '',
      Ambiente: this.nombreColumna(r.proyecto.columnaId),
      Tareas: r.tareas,
      Completadas: r.completadas,
      Pendientes: r.pendientes,
      Avance: `${r.porcentaje}%`,
      'Story points': r.puntos,
      'Fecha inicio': r.proyecto.fechaDesde ?? '',
      'Fecha fin': r.proyecto.fechaHasta ?? '',
      'Dias restantes': r.diasRestantes ?? '',
    }));
    this.reporteService.exportarCSV('reporte-proyectos', filas, [
      'Proyecto', 'Estado', 'Prioridad', 'Ambiente', 'Tareas', 'Completadas', 'Pendientes',
      'Avance', 'Story points', 'Fecha inicio', 'Fecha fin', 'Dias restantes',
    ]);
  }

  protected exportarProductividad(): void {
    const filas = this.reporteService.productividadPorProyecto().map(r => ({
      Proyecto: r.proyecto.nombre,
      Plannings: r.plannings.length,
      Tareas: r.totalTareas,
      Completadas: r.completadas,
      Avance: `${r.porcentaje}%`,
      'Story points': r.puntos,
    }));
    this.reporteService.exportarCSV('reporte-productividad', filas, [
      'Proyecto', 'Plannings', 'Tareas', 'Completadas', 'Avance', 'Story points',
    ]);
  }

  protected exportarEstimacion(): void {
    const filas = this.reporteService.estimacionPorProyecto().map(r => ({
      Proyecto: r.proyecto.nombre,
      Tareas: r.tareas,
      'Story points': r.puntos,
    }));
    this.reporteService.exportarCSV('reporte-estimacion', filas, ['Proyecto', 'Tareas', 'Story points']);
  }

  protected exportarVencimientos(): void {
    const filas: Record<string, unknown>[] = this.reporteService.vencimientos().map(v => ({
      Proyecto: v.proyecto.nombre,
      'Fecha limite': v.proyecto.fechaHasta,
      'Dias restantes': v.diasRestantes,
      Urgencia: URGENCIA_STYLE[v.urgencia].label,
    }));
    this.reporteService.exportarCSV('reporte-vencimientos', filas, [
      'Proyecto', 'Fecha limite', 'Dias restantes', 'Urgencia',
    ]);
  }

  protected exportarPipeline(): void {
    const filas = this.reporteService.pipelinePorColumna().map(r => ({
      Ambiente: r.columna.nombre,
      Proyectos: r.cantidad,
      Porcentaje: `${r.porcentaje}%`,
    }));
    this.reporteService.exportarCSV('reporte-pipeline', filas, ['Ambiente', 'Proyectos', 'Porcentaje']);
  }

  protected exportarCalidad(): void {
    const filas = this.reporteService.calidadPorColumna().map(r => ({
      Ambiente: r.columna.nombre,
      Total: r.total,
      Completadas: r.completadas,
      Pendientes: r.pendientes,
      Porcentaje: `${r.porcentaje}%`,
    }));
    this.reporteService.exportarCSV('reporte-calidad', filas, [
      'Ambiente', 'Total', 'Completadas', 'Pendientes', 'Porcentaje',
    ]);
  }

  protected exportarClientes(): void {
    const filas = this.reporteService.avancePorCliente().map(c => ({
      Cliente: c.cliente,
      Proyectos: c.proyectos,
      Tareas: c.tareas,
      Completadas: c.completadas,
      Pendientes: c.pendientes,
      Porcentaje: `${c.porcentaje}%`,
    }));
    this.reporteService.exportarCSV('reporte-clientes', filas, [
      'Cliente', 'Proyectos', 'Tareas', 'Completadas', 'Pendientes', 'Porcentaje',
    ]);
  }

  protected exportarUsuarios(): void {
    const filas = this.reporteService.productividadPorUsuario().map(u => ({
      Usuario: u.nombre,
      Plannings: u.plannings,
      Tareas: u.tareas,
      Completadas: u.completadas,
      Pendientes: u.pendientes,
      'Story points': u.puntos,
      Porcentaje: `${u.porcentaje}%`,
    }));
    this.reporteService.exportarCSV('reporte-usuarios', filas, [
      'Usuario', 'Plannings', 'Tareas', 'Completadas', 'Pendientes', 'Story points', 'Porcentaje',
    ]);
  }
}
