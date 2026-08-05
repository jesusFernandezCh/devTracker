import {Injectable, computed, inject, signal} from '@angular/core';
import {ProyectoService} from './proyecto.service';
import {PlanningService} from './planning.service';
import {ColumnService} from './column.service';
import {Proyecto} from '../models/proyecto.model';
import {Planning, PlanningTask} from '../models/planning.model';
import {Columna} from '../models/columna.model';
import {estimacionTotal} from '../utils/estimacion';

export interface ProyectoReporte {
  proyecto: Proyecto;
  plannings: number;
  tareas: number;
  completadas: number;
  pendientes: number;
  porcentaje: number;
  puntos: number;
  diasRestantes: number | null;
  urgencia: 'normal' | 'alerta' | 'urgente';
}

export interface ComplejidadReporte {
  complejidad: 'Simple' | 'Media' | 'Compleja';
  cantidad: number;
  puntos: number;
}

export interface VencimientoReporte {
  proyecto: Proyecto;
  diasRestantes: number;
  urgencia: 'normal' | 'alerta' | 'urgente';
}

export interface PipelineReporte {
  columna: Columna;
  cantidad: number;
  porcentaje: number;
}

export interface CalidadReporte {
  columna: Columna;
  total: number;
  completadas: number;
  pendientes: number;
  porcentaje: number;
}

export interface ProductividadPlanning {
  planning: Planning;
  tareas: PlanningTask[];
  completadas: number;
  pendientes: number;
  puntos: number;
}

export interface ProductividadReporte {
  proyecto: Proyecto;
  plannings: ProductividadPlanning[];
  totalTareas: number;
  completadas: number;
  porcentaje: number;
  puntos: number;
}

const VALORES_COMPLEJIDAD: Record<string, number> = {Simple: 1, Media: 3, Compleja: 5};

export function diasRestantes(fechaHasta: string): number {
  return Math.max(0, Math.ceil((new Date(fechaHasta).getTime() - Date.now()) / 86400000));
}

export function urgenciaDe(dias: number): 'normal' | 'alerta' | 'urgente' {
  if (dias <= 14) return 'urgente';
  if (dias <= 30) return 'alerta';
  return 'normal';
}

@Injectable({providedIn: 'root'})
export class ReporteService {
  readonly fechaDesde = signal('');
  readonly fechaHasta = signal('');
  readonly proyectoId = signal('');

  private readonly proyectoService = inject(ProyectoService);
  private readonly planningService = inject(PlanningService);
  private readonly columnService = inject(ColumnService);

  private readonly proyectosFiltrados = computed(() => {
    const desde = this.fechaDesde();
    const hasta = this.fechaHasta();
    const id = this.proyectoId();
    return this.proyectoService.proyectos().filter(p => {
      if (id && p.id !== id) return false;
      if (desde && p.fechaDesde && p.fechaDesde < desde) return false;
      if (hasta && p.fechaHasta && p.fechaHasta > hasta) return false;
      return true;
    });
  });

  private planningsDe(proyectoId: string): Planning[] {
    return this.planningService.plannings().filter(pl => pl.proyectoId === proyectoId);
  }

  readonly proyectosDetalle = computed<ProyectoReporte[]>(() =>
    this.proyectosFiltrados().map(p => {
      const tareas = this.planningsDe(p.id).flatMap(pl => pl.tareas);
      const completadas = tareas.filter(t => t.completada).length;
      const puntos = tareas.reduce((s, t) => s + (VALORES_COMPLEJIDAD[t.complejidad] ?? 0), 0);
      const dias = p.fechaHasta ? diasRestantes(p.fechaHasta) : null;
      return {
        proyecto: p,
        plannings: this.planningsDe(p.id).length,
        tareas: tareas.length,
        completadas,
        pendientes: tareas.length - completadas,
        porcentaje: tareas.length > 0 ? Math.round((completadas / tareas.length) * 100) : 0,
        puntos,
        diasRestantes: dias,
        urgencia: dias === null ? 'normal' : urgenciaDe(dias),
      };
    }),
  );

  readonly estimacionPorComplejidad = computed<ComplejidadReporte[]>(() => {
    const tareas = this.proyectosFiltrados().flatMap(p => this.planningsDe(p.id)).flatMap(pl => pl.tareas);
    return (['Simple', 'Media', 'Compleja'] as const).map(complejidad => {
      const delTipo = tareas.filter(t => t.complejidad === complejidad);
      return {
        complejidad,
        cantidad: delTipo.length,
        puntos: delTipo.reduce((s, t) => s + (VALORES_COMPLEJIDAD[t.complejidad] ?? 0), 0),
      };
    });
  });

  readonly estimacionPorProyecto = computed(() =>
    this.proyectosDetalle()
      .map(r => ({proyecto: r.proyecto, tareas: r.tareas, puntos: r.puntos}))
      .sort((a, b) => b.puntos - a.puntos),
  );

  readonly vencimientos = computed<VencimientoReporte[]>(() =>
    this.proyectosFiltrados()
      .filter(p => p.fechaHasta)
      .map(p => {
        const dias = diasRestantes(p.fechaHasta);
        return {proyecto: p, diasRestantes: dias, urgencia: urgenciaDe(dias)};
      })
      .sort((a, b) => a.diasRestantes - b.diasRestantes),
  );

  readonly pipelinePorColumna = computed<PipelineReporte[]>(() => {
    const proyectos = this.proyectosFiltrados();
    const total = proyectos.length;
    return this.columnService.columnas().map(c => ({
      columna: c,
      cantidad: proyectos.filter(p => p.columnaId === c.id).length,
      porcentaje: total > 0 ? Math.round((proyectos.filter(p => p.columnaId === c.id).length / total) * 100) : 0,
    }));
  });

  readonly calidadPorColumna = computed<CalidadReporte[]>(() =>
    this.columnService.columnas().map(c => {
      const proyectos = this.proyectosFiltrados().filter(p => p.columnaId === c.id);
      const tareas = proyectos.flatMap(p => this.planningsDe(p.id)).flatMap(pl => pl.tareas);
      const completadas = tareas.filter(t => t.completada).length;
      return {
        columna: c,
        total: tareas.length,
        completadas,
        pendientes: tareas.length - completadas,
        porcentaje: tareas.length > 0 ? Math.round((completadas / tareas.length) * 100) : 0,
      };
    }),
  );

  readonly productividadPorProyecto = computed<ProductividadReporte[]>(() =>
    this.proyectosFiltrados().map(p => {
      const plannings = this.planningsDe(p.id).map<ProductividadPlanning>(pl => {
        const completadas = pl.tareas.filter(t => t.completada).length;
        return {
          planning: pl,
          tareas: pl.tareas,
          completadas,
          pendientes: pl.tareas.length - completadas,
          puntos: estimacionTotal(pl.tareas),
        };
      });
      const totalTareas = plannings.reduce((s, pl) => s + pl.tareas.length, 0);
      const completadas = plannings.reduce((s, pl) => s + pl.completadas, 0);
      const puntos = plannings.reduce((s, pl) => s + pl.puntos, 0);
      return {
        proyecto: p,
        plannings,
        totalTareas,
        completadas,
        porcentaje: totalTareas > 0 ? Math.round((completadas / totalTareas) * 100) : 0,
        puntos,
      };
    }),
  );

  limpiarFiltros(): void {
    this.fechaDesde.set('');
    this.fechaHasta.set('');
    this.proyectoId.set('');
  }

  exportarCSV(nombre: string, filas: Record<string, unknown>[], columnas: string[]): void {
    const escapar = (v: unknown): string => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const encabezado = columnas.join(',');
    const cuerpo = filas.map(f => columnas.map(c => escapar(f[c])).join(',')).join('\n');
    const csv = `\uFEFF${encabezado}\n${cuerpo}`;
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nombre}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
