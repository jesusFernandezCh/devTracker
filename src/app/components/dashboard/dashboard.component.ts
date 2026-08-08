import { Component, inject, computed, signal, afterNextRender, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HighchartsChartComponent, providePartialHighcharts } from 'highcharts-angular';
import type { Options as HighchartsOptions, SeriesOptionsType } from 'highcharts';
import { ProyectoService } from '../../services/proyecto.service';
import { PlanningService } from '../../services/planning.service';
import { ColumnService } from '../../services/column.service';
import { ThemeService } from '../../services/theme.service';
import { EquipoService } from '../../services/equipo.service';
import { AuthService } from '../../services/auth.service';
import { ReporteService } from '../../services/reporte.service';
import { ROL_SUPER_ADMIN_ID } from '../../models/permiso.model';
import { estimacionTotal, prioridadColor } from '../../utils/estimacion';

const PALETA_CLARA = {fondo: '#ffffff', texto: '#374151', suave: '#6b7280', grid: '#f1f5f9'};
const PALETA_OSCURA = {fondo: '#1E293B', texto: '#E2E8F0', suave: '#94A3B8', grid: '#334155'};

const COLORES_SERIES = ['#6366f1', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6', '#0ea5e9', '#10b981', '#f43f5e'];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, HighchartsChartComponent],
  providers: [providePartialHighcharts({
    modules: () => [
      import('highcharts/esm/highcharts-more').then(() => import('highcharts/esm/modules/solid-gauge')),
    ],
  })],
  template: `
    <div class="dbs">
      <!-- ─── Hero ─── -->
      <section class="db-hero">
        <div class="db-hero-gauge-box">
          <highcharts-chart [options]="graficaProgreso()" class="db-hero-gauge"></highcharts-chart>
        </div>
        <p class="db-hero-meta">
          <span>Progreso General</span>
          <span class="db-hero-dot"></span>
          <span>{{ totalProyectos() }} projectos{{ totalProyectos() !== 1 ? 's' : '' }}</span>
          <span class="db-hero-dot"></span>
          <span>{{ totalPlannings() }} planes{{ totalPlannings() !== 1 ? 's' : '' }}</span>
        </p>
      </section>
      <br>

      <!-- ─── Stat pills ─── -->
      <div class="row g-4 mt-6">
        <div class="col-lg-3 col-6">
          <div class="db-pill">
            <span class="db-pill-num">{{ countTareas() }}</span>
            <span class="db-pill-label">Total Tareas</span>
          </div>
        </div>
        <div class="col-lg-3 col-6">
          <div class="db-pill">
            <span class="db-pill-num">{{ countCompletadas() }}</span>
            <span class="db-pill-label">Completadas</span>
          </div>
        </div>
        <div class="col-lg-3 col-6">
          <div class="db-pill">
            <span class="db-pill-num">{{ countPendientes() }}</span>
            <span class="db-pill-label">Pendientes</span>
          </div>
        </div>
        <div class="col-lg-3 col-6">
          <div class="db-pill">
            <span class="db-pill-num">{{ countEstimacion() }}</span>
            <span class="db-pill-label">Story points</span>
          </div>
        </div>
      </div>
      <br>
      <!-- ─── Content grid ─── -->
      <div class="row g-4 mt-6">
        <div class="col-lg-6 col-12">
          <section class="db-card h-full">
            <h2 class="db-card-heading">
              Progreso por proyecto
              <button (click)="soloMios.set(!soloMios())"
                      class="db-solo-mios"
                      [style.background-color]="soloMios() ? 'var(--color-indigo-600)' : 'var(--color-gray-100)'"
                      [style.color]="soloMios() ? '#ffffff' : 'var(--color-gray-600)'">
                Solo míos
              </button>
            </h2>
            @if (avancePorProyecto().length > 0) {
              <div class="db-bars">
                @for (item of avancePorProyecto(); track item.proyecto.id) {
                  <div class="db-bar-row">
                    <div class="db-bar-head">
                      <span class="db-bar-label">
                        {{ item.proyecto.nombre }}
                        @if (item.proyecto.prioridad) {
                          <span class="db-bar-priority"
                                [style.color]="prioridadColor(item.proyecto.prioridad).text"
                                [style.background-color]="prioridadColor(item.proyecto.prioridad).bg">
                            {{ item.proyecto.prioridad }}
                          </span>
                        }
                      </span>
                      <span class="db-bar-value">{{ item.porcentaje }}<span class="db-percent-sign">%</span></span>
                    </div>
                    <div class="db-bar-track">
                      <div class="db-bar-fill"
                           [style.width.%]="animacionIniciada() ? item.porcentaje : 0"
                           [style.background-color]="barColor(item.porcentaje)">
                      </div>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <p class="db-empty">No projects with tasks yet.</p>
            }
          </section>
        </div>

        <div class="col-lg-6 col-12">
          <section class="db-card h-full">
            <h2 class="db-card-heading">Progreso por ambiente</h2>
            @if (tieneDatosAmbiente()) {
              <div class="db-pipeline">
                <highcharts-chart [options]="graficaAmbiente()" class="db-dona"></highcharts-chart>
                <div class="db-pipeline-legend">
                  @for (item of proyectosPorColumna(); track item.columna.id) {
                    @if (item.cantidad > 0) {
                      <div class="db-pipeline-item">
                        <span class="db-pipeline-dot" [style.background-color]="item.columna.color"></span>
                        <span class="db-pipeline-name">{{ item.columna.nombre }}</span>
                        <span class="db-pipeline-count">{{ item.cantidad }}</span>
                      </div>
                    }
                  }
                </div>
              </div>
            } @else {
              <p class="db-empty">Sin proyectos por ambiente.</p>
            }
          </section>
        </div>

        <div class="col-12">
          <section class="db-card">
            <div class="db-card-head-row">
              <h2 class="db-card-heading">Planificaión en curso</h2>
              <a routerLink="/tablero" class="db-card-link">Ver tablero</a>
            </div>
            @if (proximosVencimientos().length > 0) {
              <div class="db-deadlines">
                @for (proy of proximosVencimientos(); track proy.id) {
                  @let days = getDiasRestantes(proy.fechaHasta);
                  <div class="db-deadline-row">
                    <div class="db-deadline-info">
                      <div class="db-deadline-dot" [style.background-color]="days <= 14 ? 'var(--color-rose-500)' : days <= 30 ? 'var(--color-amber-500)' : 'var(--color-gray-300)'"></div>
                      <span class="db-deadline-name">{{ proy.nombre }}</span>
                      @if (days <= 14) {
                        <span class="db-deadline-urgent">URGENT</span>
                      }
                    </div>
                    <div class="db-deadline-meta">
                      <span class="db-deadline-date">{{ proy.fechaHasta }}</span>
                      <span class="db-deadline-countdown" [style.color]="days <= 14 ? 'var(--color-rose-500)' : 'var(--color-gray-400)'">{{ days }}d</span>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <p class="db-empty">No deadlines coming up.</p>
            }
          </section>
        </div>
      </div>
      <br>
      @if (esAdmin()) {
        <div class="row g-4 mt-6">
          <div class="col-lg-6 col-12">
            <section class="db-card h-full">
              <h2 class="db-card-heading">Avance general por cliente</h2>
              @if (avancePorCliente().length > 0) {
                <div class="db-bars">
                  @for (item of avancePorCliente(); track item.cliente) {
                    <div class="db-bar-row">
                      <div class="db-bar-head">
                        <span class="db-bar-label">
                          {{ item.cliente }}
                          <span class="db-bar-sub">{{ item.proyectos }} proyecto{{ item.proyectos !== 1 ? 's' : '' }} · {{ item.completadas }}/{{ item.tareas }} tareas</span>
                        </span>
                        <span class="db-bar-value">{{ item.porcentaje }}<span class="db-percent-sign">%</span></span>
                      </div>
                      <div class="db-bar-track">
                        <div class="db-bar-fill"
                             [style.width.%]="animacionIniciada() ? item.porcentaje : 0"
                             [style.background-color]="barColor(item.porcentaje)">
                        </div>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <p class="db-empty">Sin proyectos por cliente.</p>
              }
            </section>
          </div>
              
          <div class="col-lg-6 col-12">
            <section class="db-card h-full">
              <h2 class="db-card-heading">Avance mensual por cliente</h2>
              @if (hayMensualPorCliente()) {
                <highcharts-chart [options]="graficaMensualCliente()" class="db-mensual"></highcharts-chart>
              } @else {
                <p class="db-empty">Sin datos mensuales por cliente.</p>
              }
            </section>
          </div>

          <div class="col-lg-4 col-12">
            <section class="db-card h-full">
              <h2 class="db-card-heading">Usuarios por tipo</h2>
              @if (usuariosPorTipo().length > 0) {
                <div class="db-usuarios">
                  @for (item of usuariosPorTipo(); track item.rol) {
                    <div class="db-usuario-row">
                      <span class="db-usuario-dot"></span>
                      <span class="db-usuario-nombre">{{ item.nombre }}</span>
                      <span class="db-usuario-count">{{ item.cantidad }}</span>
                    </div>
                  }
                </div>
              } @else {
                <p class="db-empty">Sin usuarios registrados.</p>
              }
            </section>
          </div>

          <div class="col-lg-8 col-12">
            <section class="db-card h-full">
              <h2 class="db-card-heading">Plannings y tareas por usuario</h2>
              @if (productividadPorUsuario().length > 0) {
                <div class="db-tabla">
                  <div class="db-tabla-head">
                    <span>Usuario</span>
                    <span>Plannings</span>
                    <span>Tareas</span>
                    <span>Completadas</span>
                    <span>Pendientes</span>
                    <span>Avance</span>
                  </div>
                  @for (u of productividadPorUsuario(); track u.usuarioId) {
                    <div class="db-tabla-row">
                      <span class="db-tabla-user">{{ u.nombre }}</span>
                      <span class="db-tabla-num">{{ u.plannings }}</span>
                      <span class="db-tabla-num">{{ u.tareas }}</span>
                      <span class="db-tabla-num" style="color: var(--color-emerald-600);">{{ u.completadas }}</span>
                      <span class="db-tabla-num">{{ u.pendientes }}</span>
                      <span class="db-tabla-pct" [style.color]="barColor(u.porcentaje)">{{ u.porcentaje }}%</span>
                    </div>
                  }
                </div>
              } @else {
                <p class="db-empty">Sin plannings por usuario.</p>
              }
            </section>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    /* ─── Layout ─── */
    .db { max-width: 960px; margin: 0 auto; }
    .h-full { height: 100%; }

    /* ─── Hero ─── */
    .db-hero {
      text-align: center;
      padding: 0.5rem 0 0.5rem;
    }

    .db-hero-gauge-box {
      width: 100%;
      max-width: 250px;
      margin: 0 auto;
    }

    .db-hero-gauge {
      width: 100%;
      height: 230px;
      display: block;
    }

    .db-hero-meta {
      font-size: 0.8125rem;
      font-weight: 500;
      letter-spacing: 0.04em;
      color: var(--color-gray-400);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      animation: dbFadeIn 0.6s ease-out 0.4s both;
    }

    .db-hero-dot {
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background-color: var(--color-gray-300);
      display: inline-block;
    }

    /* ─── Stat pills ─── */
    .db-pill {
      text-align: center;
      padding: 1rem 0.5rem;
      border-radius: 0.75rem;
      border: 1px solid var(--color-gray-200);
      background-color: var(--color-surface);
      animation: dbFadeIn 0.5s ease-out both;
    }
    .db-pill:nth-child(1) { animation-delay: 0.15s; }
    .db-pill:nth-child(2) { animation-delay: 0.22s; }
    .db-pill:nth-child(3) { animation-delay: 0.29s; }
    .db-pill:nth-child(4) { animation-delay: 0.36s; }

    .db-pill-num {
      display: block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 2.375rem;
      font-weight: 500;
      line-height: 1.2;
      color: var(--color-gray-900);
    }

    .db-pill-label {
      display: block;
      font-size: 0.6875rem;
      font-weight: 500;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--color-gray-400);
      margin-top: 0.25rem;
    }

    /* ─── Card ─── */
    .db-card {
      background-color: var(--color-surface);
      border: 1px solid var(--color-gray-200);
      border-radius: 1rem;
      padding: 1.5rem;
      animation: dbFadeIn 0.5s ease-out 0.3s both;
    }

    .db-card-heading {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-gray-400);
      margin-bottom: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }

    .db-solo-mios {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.625rem;
      font-size: 0.6875rem;
      font-weight: 500;
      letter-spacing: 0;
      text-transform: none;
      border-radius: 9999px;
      cursor: pointer;
      transition: background-color 0.15s, color 0.15s;
      border: none;
    }

    .db-card-head-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }
    .db-card-head-row .db-card-heading { margin-bottom: 0; }

    .db-card-link {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--color-indigo-500);
      text-decoration: none;
      transition: color 0.15s;
    }
    .db-card-link:hover { color: var(--color-indigo-600); }

    /* ─── Progress bars ─── */
    .db-bars { display: flex; flex-direction: column; gap: 1rem; }

    .db-bar-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.375rem;
    }

    .db-bar-label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--color-gray-700);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding-right: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .db-bar-priority {
      font-size: 0.625rem;
      font-weight: 600;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      white-space: nowrap;
    }

    .db-bar-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--color-gray-500);
      white-space: nowrap;
    }

    .db-percent-sign {
      font-family: 'Inter', sans-serif;
      font-size: 0.6875rem;
      color: var(--color-gray-400);
    }

    .db-bar-track {
      height: 6px;
      border-radius: 3px;
      background-color: var(--color-gray-100);
      overflow: hidden;
    }

    .db-bar-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    /* ─── Pipeline ─── */
    .db-dona {
      width: 100%;
      height: 260px;
      display: block;
    }

    .db-pipeline-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-top: 1rem;
    }

    .db-pipeline-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8125rem;
    }

    .db-pipeline-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .db-pipeline-name {
      color: var(--color-gray-600);
      font-weight: 500;
    }

    .db-pipeline-count {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      color: var(--color-gray-400);
    }

    /* ─── Deadlines ─── */
    .db-deadlines { display: flex; flex-direction: column; }

    .db-deadline-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--color-gray-100);
    }
    .db-deadline-row:last-child { border-bottom: none; }

    .db-deadline-info {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      min-width: 0;
    }

    .db-deadline-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .db-deadline-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-gray-700);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .db-deadline-urgent {
      font-size: 0.625rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--color-rose-500);
      background-color: var(--color-rose-50);
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      white-space: nowrap;
    }

    .db-deadline-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-shrink: 0;
      margin-left: 1rem;
    }

    .db-deadline-date {
      font-size: 0.8125rem;
      color: var(--color-gray-400);
    }

    .db-deadline-countdown {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8125rem;
      font-weight: 500;
      min-width: 2.5rem;
      text-align: right;
    }

    /* ─── Empty state ─── */
    .db-empty {
      font-size: 0.8125rem;
      color: var(--color-gray-400);
      text-align: center;
      padding: 2rem 0;
    }

    /* ─── Admin: clientes y usuarios ─── */
    .db-bar-sub {
      font-size: 0.6875rem;
      font-weight: 400;
      color: var(--color-gray-400);
      white-space: nowrap;
    }

    .db-mensual {
      width: 100%;
      height: 300px;
      display: block;
    }

    .db-usuarios { display: flex; flex-direction: column; }

    .db-usuario-row {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.625rem 0;
      border-bottom: 1px solid var(--color-gray-100);
    }
    .db-usuario-row:last-child { border-bottom: none; }

    .db-usuario-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--color-indigo-400);
      flex-shrink: 0;
    }

    .db-usuario-nombre {
      flex: 1;
      min-width: 0;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--color-gray-700);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .db-usuario-count {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-gray-900);
      background-color: var(--color-gray-100);
      border-radius: 9999px;
      min-width: 2rem;
      text-align: center;
      padding: 0.125rem 0.5rem;
    }

    .db-tabla { display: flex; flex-direction: column; }

    .db-tabla-head,
    .db-tabla-row {
      display: grid;
      grid-template-columns: 1.6fr 0.9fr 0.9fr 1fr 1fr 0.8fr;
      gap: 0.5rem;
      align-items: center;
      padding: 0.625rem 0;
    }

    .db-tabla-head {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-gray-400);
      border-bottom: 1px solid var(--color-gray-100);
    }

    .db-tabla-row {
      font-size: 0.8125rem;
      border-bottom: 1px solid var(--color-gray-100);
    }
    .db-tabla-row:last-child { border-bottom: none; }

    .db-tabla-user {
      font-weight: 500;
      color: var(--color-gray-800);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .db-tabla-num {
      font-family: 'JetBrains Mono', monospace;
      color: var(--color-gray-600);
      text-align: right;
    }

    .db-tabla-pct {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 500;
      text-align: right;
    }

    /* ─── Animations ─── */
    @keyframes dbFadeIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

  `]
})
export class DashboardComponent {
  private readonly proyectoService = inject(ProyectoService);
  private readonly planningService = inject(PlanningService);
  private readonly columnService = inject(ColumnService);
  private readonly themeService = inject(ThemeService);
  private readonly equipoService = inject(EquipoService);
  private readonly authService = inject(AuthService);
  private readonly reporteService = inject(ReporteService);

  protected readonly animacionIniciada = signal(false);
  protected readonly soloMios = signal(false);

  protected readonly esAdmin = computed(() => {
    const tipo = this.authService.currentUser()?.tipo;
    return tipo === ROL_SUPER_ADMIN_ID || tipo === 'administrador';
  });

  protected readonly proyectosVisibles = computed(() => {
    const lista = this.proyectoService.proyectos();
    if (!this.soloMios()) return lista;
    const id = this.authService.currentUser()?.id;
    if (!id) return [];
    return lista.filter((p) => this.equipoService.miembrosDe(p.id).includes(id));
  });

  /* ── counter animators ── */
  protected readonly countTareas = signal(0);
  protected readonly countCompletadas = signal(0);
  protected readonly countPendientes = signal(0);
  protected readonly countEstimacion = signal(0);

  /* ── computed ── */
  protected readonly totalProyectos = computed(() => this.proyectoService.proyectos().length);
  protected readonly totalPlannings = computed(() => this.planningService.plannings().length);
  protected readonly prioridadColor = prioridadColor;

  protected readonly tareasStats = computed(() => {
    const tareas = this.planningService.plannings().flatMap(p => p.tareas);
    const total = tareas.length;
    const completadas = tareas.filter(t => t.completada).length;
    return { total, completadas, pendientes: total - completadas, porcentaje: total > 0 ? Math.round((completadas / total) * 100) : 0 };
  });

  protected readonly estimacionStats = computed(() => {
    const plannings = this.planningService.plannings();
    return plannings.reduce((s, p) => s + estimacionTotal(p.tareas), 0);
  });

  protected readonly healthColor = computed(() => {
    const pct = this.tareasStats().porcentaje;
    if (pct >= 70) return 'var(--color-emerald-500)';
    if (pct >= 40) return 'var(--color-amber-500)';
    return 'var(--color-rose-500)';
  });

  protected readonly graficaProgreso = computed<HighchartsOptions>(() => {
    const p = this.themeService.isDark() ? PALETA_OSCURA : PALETA_CLARA;
    return {
      chart: {
        type: 'solidgauge',
        backgroundColor: 'transparent',
        // height: 230,
        style: {fontFamily: "'Inter', -apple-system, 'Segoe UI', sans-serif"},
      },
      title: {text: undefined},
      credits: {enabled: false},
      pane: {
        startAngle: -90,
        endAngle: 90,
        innerSize: '60%',
        background: [{
          outerRadius: '100%',
          // innerRadius: '72%',
          shape: 'arc',
          borderWidth: 1,
          backgroundColor: p.grid,
        }],
      },
      yAxis: {
        min: 0,
        max: 100,
        lineWidth: 0,
        tickWidth: 0,
        labels: {enabled: false},
         stops: [
            [100, '#55BF3B'], // green
            [50, '#DDDF0D'], // yellow
            [0, '#DF5353'] // red
        ],
        tickAmount: 2,
        title: {
            y: -70
        }
      },
      tooltip: {valueSuffix: '%'},
      
      plotOptions: {
        solidgauge: {
          linecap: 'round',
          dataLabels: {
            enabled: true,
            y: 10,
            format: '{y}%',
            style: {
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '2rem',
              fontWeight: '600',
              color: p.texto,
            },
          },
        },
      },
      series: [{
        type: 'solidgauge',
        name: 'Progreso General',
        color: this.healthColor(),
        data: [this.tareasStats().porcentaje],
      }] as SeriesOptionsType[],
    };
  });

  protected barColor(pct: number): string {
    if (pct >= 75) return 'var(--color-emerald-500)';
    if (pct >= 40) return 'var(--color-amber-500)';
    return 'var(--color-rose-500)';
  }

  protected readonly avancePorProyecto = computed(() =>
    this.proyectosVisibles()
      .map(p => {
        const tareas = this.planningService.plannings().filter(pl => pl.proyectoId === p.id).flatMap(pl => pl.tareas);
        const total = tareas.length;
        const completadas = tareas.filter(t => t.completada).length;
        return { proyecto: p, totalTareas: total, completadas, porcentaje: total > 0 ? Math.round((completadas / total) * 100) : 0 };
      })
      .filter(p => p.totalTareas > 0)
      .sort((a, b) => b.porcentaje - a.porcentaje)
      .slice(0, 5)
  );

  protected readonly proyectosPorColumna = computed(() => {
    const proyectos = this.proyectosVisibles();
    const columnas = this.columnService.columnas();
    const total = proyectos.length;
    return columnas.map(c => ({
      columna: c,
      cantidad: proyectos.filter(p => p.columnaId === c.id).length,
      porcentaje: total > 0 ? Math.round((proyectos.filter(p => p.columnaId === c.id).length / total) * 100) : 0,
    }));
  });

  protected readonly proximosVencimientos = computed(() =>
    [...this.proyectoService.proyectos()]
      .filter(p => p.fechaHasta)
      .sort((a, b) => new Date(a.fechaHasta).getTime() - new Date(b.fechaHasta).getTime())
      .slice(0, 5)
  );

  protected readonly tieneDatosAmbiente = computed(() =>
    this.proyectosPorColumna().some(i => i.cantidad > 0),
  );

  protected readonly graficaAmbiente = computed<HighchartsOptions>(() => {
    const p = this.themeService.isDark() ? PALETA_OSCURA : PALETA_CLARA;
    const data = this.proyectosPorColumna()
      .filter(i => i.cantidad > 0)
      .map(i => ({ name: i.columna.nombre, y: i.cantidad, color: i.columna.color }));
    return {
      chart: {
        type: 'pie',
        borderRadius: 8, // Rounded slice corners
        innerSize: '70%', // Turning the pie into a donut
        // We can show multiple data labels per point
        backgroundColor: p.fondo,
        // height: 260,
        // style: { fontFamily: "'Inter', -apple-system, 'Segoe UI', sans-serif" },
      },
      title: { text: undefined },
      credits: { enabled: false },
      legend: { enabled: false },
      tooltip: {
        pointFormat: '<b>{point.y} proyecto{point.y === 1 ? "" : "s"} · {point.percentage:.1f}%',
      },
      plotOptions: {
        pie: {
          innerSize: '60%',
          allowPointSelect: false,
          cursor: 'pointer',
          dataLabels: { enabled: false },
        },
      },
      series: [
        {
          name: 'Allocation',
          // borderRadius: 8, // Rounded slice corners
          // borderWidth: 3,
          innerSize: '70%', // Turning the pie into a donut
          // We can show multiple data labels per point
          dataLabels: [
            {
              format: '{point.name}'
            },
            {
              format: '{point.percentage:.1f}%',
              distance: '-15%', // Placing the label inside
              backgroundColor: 'contrast',
              style: {
                textOutline: 'none'
              }
            }
          ],
          data,
        }] as SeriesOptionsType[],
    };
  });

  protected getDiasRestantes(fechaHasta: string): number {
    return Math.max(0, Math.ceil((new Date(fechaHasta).getTime() - Date.now()) / 86400000));
  }

  /* ── Admin: avance por cliente, usuarios y productividad ── */
  protected readonly avancePorCliente = computed(() => this.reporteService.avancePorCliente());

  protected readonly avanceMensualPorCliente = computed(() =>
    this.reporteService.avanceMensualPorCliente(),
  );

  protected readonly hayMensualPorCliente = computed(() => {
    const datos = this.reporteService.avanceMensualPorCliente();
    return Object.keys(datos).length > 0 && (Object.values(datos)[0]?.length ?? 0) > 0;
  });

  protected readonly usuariosPorTipo = computed(() => this.reporteService.usuariosPorTipo());

  protected readonly productividadPorUsuario = computed(() =>
    this.reporteService.productividadPorUsuario(),
  );

  protected readonly graficaMensualCliente = computed<HighchartsOptions>(() => {
    const p = this.themeService.isDark() ? PALETA_OSCURA : PALETA_CLARA;
    const datos = this.reporteService.avanceMensualPorCliente();
    const clientes = Object.keys(datos);
    const categorias = clientes[0]
      ? datos[clientes[0]].map(d => d.etiqueta)
      : [];
    const series = clientes
      .filter(c => (datos[c]?.length ?? 0) > 0)
      .map((c, i) => ({
        name: c,
        data: datos[c].map(d => d.completadas),
        color: COLORES_SERIES[i % COLORES_SERIES.length],
      }));

    return {
      chart: {
        type: 'column',
        backgroundColor: p.fondo,
        height: 300,
        style: {fontFamily: "'Inter', -apple-system, 'Segoe UI', sans-serif"},
      },
      title: {text: undefined},
      credits: {enabled: false},
      legend: {enabled: true, itemStyle: {color: p.texto}, itemHoverStyle: {color: p.texto}},
      tooltip: {shared: true},
      xAxis: {
        categories: categorias,
        labels: {style: {color: p.suave}},
        lineColor: p.grid,
        tickColor: p.grid,
      },
      yAxis: {
        title: {text: undefined},
        labels: {style: {color: p.suave}},
        gridLineColor: p.grid,
      },
      plotOptions: {column: {borderRadius: 3, pointPadding: 0.15, groupPadding: 0.1}},
      series: series as SeriesOptionsType[],
    };
  });

  constructor() {
    afterNextRender(() => {
      setTimeout(() => {
        this.animacionIniciada.set(true);
        this._animarValores();
      }, 300);
    });
  }

  private _animarValores(): void {
    const dur = 1000;
    const targets: [number, (v: number) => void][] = [
      [this.tareasStats().total, v => this.countTareas.set(v)],
      [this.tareasStats().completadas, v => this.countCompletadas.set(v)],
      [this.tareasStats().pendientes, v => this.countPendientes.set(v)],
      [this.estimacionStats(), v => this.countEstimacion.set(v)],
    ];
    for (const [target, set] of targets) {
      if (target === 0) { set(0); continue; }
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / dur, 1);
        const e = 1 - Math.pow(1 - t, 3);
        set(Math.round(e * target));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }
}
