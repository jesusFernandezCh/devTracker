import {Component, inject, computed, signal, afterNextRender, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';
import {ProyectoService} from '../../services/proyecto.service';
import {PlanningService} from '../../services/planning.service';
import {ColumnService} from '../../services/column.service';
import {estimacionTotal} from '../../utils/estimacion';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dbs">
      <!-- ─── Hero ─── -->
      <section class="db-hero">
        <div class="db-hero-number">
          <span class="db-hero-digit">{{ heroValue() }}</span>
          <span class="db-hero-percent">%</span>
        </div>
        <div class="db-hero-line" [style.background-color]="healthColor()"></div>
        <p class="db-hero-meta">
          <span>overall completion</span>
          <span class="db-hero-dot"></span>
          <span>{{ totalProyectos() }} project{{ totalProyectos() !== 1 ? 's' : '' }}</span>
          <span class="db-hero-dot"></span>
          <span>{{ totalPlannings() }} planning{{ totalPlannings() !== 1 ? 's' : '' }}</span>
        </p>
      </section>

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
            <h2 class="db-card-heading">Progreso por proyecto</h2>
            @if (avancePorProyecto().length > 0) {
              <div class="db-bars">
                @for (item of avancePorProyecto(); track item.proyecto.id) {
                  <div class="db-bar-row">
                    <div class="db-bar-head">
                      <span class="db-bar-label">{{ item.proyecto.nombre }}</span>
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
            @if (proyectosPorColumna().length > 0) {
              <div class="db-pipeline">
                <div class="db-pipeline-bar">
                  @for (item of proyectosPorColumna(); track item.columna.id) {
                    @if (item.porcentaje > 0) {
                      <div class="db-pipeline-seg"
                           [style.width.%]="item.porcentaje"
                           [style.background-color]="item.columna.color"
                           [title]="item.columna.nombre + ': ' + item.cantidad + ' project' + (item.cantidad !== 1 ? 's' : '')">
                      </div>
                    }
                  }
                </div>
                <div class="db-pipeline-legend">
                  @for (item of proyectosPorColumna(); track item.columna.id) {
                    <div class="db-pipeline-item">
                      <span class="db-pipeline-dot" [style.background-color]="item.columna.color"></span>
                      <span class="db-pipeline-name">{{ item.columna.nombre }}</span>
                      <span class="db-pipeline-count">{{ item.cantidad }}</span>
                    </div>
                  }
                </div>
              </div>
            } @else {
              <p class="db-empty">No columns configured.</p>
            }
          </section>
        </div>

        <div class="col-12">
          <section class="db-card">
            <div class="db-card-head-row">
              <h2 class="db-card-heading">Upcoming deadlines</h2>
              <a routerLink="/tablero" class="db-card-link">View board</a>
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
      padding: 2.5rem 0 0.5rem;
    }

    .db-hero-number {
      font-family: 'JetBrains Mono', monospace;
      font-size: 4.5rem;
      font-weight: 600;
      line-height: 1;
      letter-spacing: -0.03em;
      color: var(--color-gray-900);
      animation: dbFadeIn 0.6s ease-out;
    }

    .db-hero-percent {
      font-size: 2rem;
      font-weight: 400;
      color: var(--color-gray-400);
      vertical-align: super;
    }

    .db-hero-line {
      height: 4px;
      width: 120px;
      margin: 1rem auto 1.25rem;
      border-radius: 2px;
      animation: dbDrawLine 0.8s ease-out 0.2s both;
      transform-origin: center;
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
      font-size: 1.375rem;
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
    .db-pipeline-bar {
      display: flex;
      height: 2rem;
      border-radius: 0.5rem;
      overflow: hidden;
      background-color: var(--color-gray-100);
    }

    .db-pipeline-seg {
      transition: width 1s ease-out;
      min-width: 4px;
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

    /* ─── Animations ─── */
    @keyframes dbFadeIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes dbDrawLine {
      from { transform: scaleX(0); opacity: 0; }
      to { transform: scaleX(1); opacity: 1; }
    }
  `]
})
export class DashboardComponent {
  private readonly proyectoService = inject(ProyectoService);
  private readonly planningService = inject(PlanningService);
  private readonly columnService = inject(ColumnService);

  protected readonly animacionIniciada = signal(false);
  protected readonly heroValue = signal(0);

  /* ── counter animators ── */
  protected readonly countTareas = signal(0);
  protected readonly countCompletadas = signal(0);
  protected readonly countPendientes = signal(0);
  protected readonly countEstimacion = signal(0);

  /* ── computed ── */
  protected readonly totalProyectos = computed(() => this.proyectoService.proyectos().length);
  protected readonly totalPlannings = computed(() => this.planningService.plannings().length);

  protected readonly tareasStats = computed(() => {
    const tareas = this.planningService.plannings().flatMap(p => p.tareas);
    const total = tareas.length;
    const completadas = tareas.filter(t => t.completada).length;
    return {total, completadas, pendientes: total - completadas, porcentaje: total > 0 ? Math.round((completadas / total) * 100) : 0};
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

  protected barColor(pct: number): string {
    if (pct >= 75) return 'var(--color-emerald-500)';
    if (pct >= 40) return 'var(--color-amber-500)';
    return 'var(--color-rose-500)';
  }

  protected readonly avancePorProyecto = computed(() =>
    this.proyectoService.proyectos()
      .map(p => {
        const tareas = this.planningService.plannings().filter(pl => pl.proyectoId === p.id).flatMap(pl => pl.tareas);
        const total = tareas.length;
        const completadas = tareas.filter(t => t.completada).length;
        return {proyecto: p, totalTareas: total, completadas, porcentaje: total > 0 ? Math.round((completadas / total) * 100) : 0};
      })
      .filter(p => p.totalTareas > 0)
      .sort((a, b) => b.porcentaje - a.porcentaje)
      .slice(0, 5)
  );

  protected readonly proyectosPorColumna = computed(() => {
    const proyectos = this.proyectoService.proyectos();
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

  protected getDiasRestantes(fechaHasta: string): number {
    return Math.max(0, Math.ceil((new Date(fechaHasta).getTime() - Date.now()) / 86400000));
  }

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
      [this.tareasStats().porcentaje, v => this.heroValue.set(v)],
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
