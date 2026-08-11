import {Injectable, computed, inject, signal} from '@angular/core';
import {ProyectoService} from './proyecto.service';
import {PlanningService} from './planning.service';
import {ColumnService} from './column.service';
import {UsuarioService} from './usuario.service';
import {RolService} from './rol.service';
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

export interface DatoMensual {
  mes: string;
  etiqueta: string;
  completadas: number;
  pendientes: number;
  puntos: number;
  proyectosProduccion: number;
  proyectosActivos: number;
}

export interface AvanceClienteReporte {
  cliente: string;
  proyectos: number;
  tareas: number;
  completadas: number;
  pendientes: number;
  porcentaje: number;
}

export interface AvanceMensualCliente {
  mes: string;
  etiqueta: string;
  completadas: number;
  pendientes: number;
}

export interface UsuarioPorTipoReporte {
  rol: string;
  nombre: string;
  cantidad: number;
}

export interface ProductividadUsuarioReporte {
  usuarioId: string;
  nombre: string;
  plannings: number;
  tareas: number;
  completadas: number;
  pendientes: number;
  puntos: number;
  porcentaje: number;
}

const VALORES_COMPLEJIDAD: Record<string, number> = {Simple: 1, Media: 3, Compleja: 5};
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function mesDe(fecha: string): string | null {
  const m = /^(\d{4})-(\d{2})/.exec(fecha);
  return m ? `${m[1]}-${m[2]}` : null;
}

function siguienteMes(mes: string): string {
  const [y, m] = mes.split('-').map(Number);
  const d = new Date(Date.UTC(y, m, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function etiquetaDe(mes: string): string {
  const [y, m] = mes.split('-').map(Number);
  return `${MESES_CORTOS[m - 1]} ${y}`;
}

function esColumnaProduccion(columna: Columna): boolean {
  const nombre = columna.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return nombre === 'produccion' || columna.id === 'produccion';
}

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
  private readonly usuarioService = inject(UsuarioService);
  private readonly rolService = inject(RolService);

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

  readonly datosMensuales = computed<DatoMensual[]>(() => {
    const proyectos = this.proyectosFiltrados();
    const plannings = proyectos.flatMap(p => this.planningsDe(p.id));

    const meses = new Set<string>();
    for (const pl of plannings) {
      const m = mesDe(pl.fecha);
      if (m) meses.add(m);
    }
    for (const p of proyectos) {
      if (p.fechaDesde) {
        const m = mesDe(p.fechaDesde);
        if (m) meses.add(m);
      }
      if (p.fechaHasta) {
        const m = mesDe(p.fechaHasta);
        if (m) meses.add(m);
      }
    }
    if (meses.size === 0) return [];

    const ordenados = [...meses].sort();
    const hasta = ordenados[ordenados.length - 1];
    const columnaProduccionId = this.columnService.columnas().find(esColumnaProduccion)?.id;

    const resultado: DatoMensual[] = [];
    let actual = ordenados[0];
    while (actual <= hasta) {
      const tareasMes = plannings
        .filter(pl => mesDe(pl.fecha) === actual)
        .flatMap(pl => pl.tareas);
      const completadas = tareasMes.filter(t => t.completada).length;
      const puntos = tareasMes
        .filter(t => t.completada)
        .reduce((s, t) => s + (VALORES_COMPLEJIDAD[t.complejidad] ?? 0), 0);
      const proyectosProduccion = columnaProduccionId
        ? proyectos.filter(p => p.columnaId === columnaProduccionId && mesDe(p.fechaHasta) === actual).length
        : 0;
      const proyectosActivos = proyectos.filter(p => {
        const desdeMes = p.fechaDesde ? mesDe(p.fechaDesde) : null;
        const hastaMes = p.fechaHasta ? mesDe(p.fechaHasta) : null;
        if (desdeMes && desdeMes > actual) return false;
        if (hastaMes && hastaMes < actual) return false;
        return true;
      }).length;
      resultado.push({
        mes: actual,
        etiqueta: etiquetaDe(actual),
        completadas,
        pendientes: tareasMes.length - completadas,
        puntos,
        proyectosProduccion,
        proyectosActivos,
      });
      actual = siguienteMes(actual);
    }
    return resultado;
  });

  readonly avancePorCliente = computed<AvanceClienteReporte[]>(() => {
    const grupos = new Map<string, Proyecto[]>();
    for (const p of this.proyectosFiltrados()) {
      const cliente = p.cliente?.trim() || 'Sin cliente';
      grupos.set(cliente, [...(grupos.get(cliente) ?? []), p]);
    }
    return [...grupos.entries()]
      .map(([cliente, proyectos]) => {
        const tareas = proyectos.flatMap(p => this.planningsDe(p.id)).flatMap(pl => pl.tareas);
        const completadas = tareas.filter(t => t.completada).length;
        return {
          cliente,
          proyectos: proyectos.length,
          tareas: tareas.length,
          completadas,
          pendientes: tareas.length - completadas,
          porcentaje: tareas.length > 0 ? Math.round((completadas / tareas.length) * 100) : 0,
        };
      })
      .sort((a, b) => b.porcentaje - a.porcentaje);
  });

  readonly avanceMensualPorCliente = computed<Record<string, AvanceMensualCliente[]>>(() => {
    const proyectos = this.proyectosFiltrados();
    const porCliente = new Map<string, Proyecto[]>();
    for (const p of proyectos) {
      const cliente = p.cliente?.trim() || 'Sin cliente';
      porCliente.set(cliente, [...(porCliente.get(cliente) ?? []), p]);
    }

    const meses = new Set<string>();
    for (const p of proyectos) {
      if (p.fechaDesde) {
        const m = mesDe(p.fechaDesde);
        if (m) meses.add(m);
      }
      if (p.fechaHasta) {
        const m = mesDe(p.fechaHasta);
        if (m) meses.add(m);
      }
      for (const pl of this.planningsDe(p.id)) {
        const m = mesDe(pl.fecha);
        if (m) meses.add(m);
      }
    }
    if (meses.size === 0) return {};

    const ordenados = [...meses].sort();
    const hasta = ordenados[ordenados.length - 1];
    const resultado: Record<string, AvanceMensualCliente[]> = {};

    let actual = ordenados[0];
    while (actual <= hasta) {
      for (const [cliente, ps] of porCliente) {
        const tareasMes = ps
          .flatMap(p => this.planningsDe(p.id))
          .filter(pl => mesDe(pl.fecha) === actual)
          .flatMap(pl => pl.tareas);
        const completadas = tareasMes.filter(t => t.completada).length;
        (resultado[cliente] ??= []).push({
          mes: actual,
          etiqueta: etiquetaDe(actual),
          completadas,
          pendientes: tareasMes.length - completadas,
        });
      }
      actual = siguienteMes(actual);
    }
    return resultado;
  });

  readonly usuariosPorTipo = computed<UsuarioPorTipoReporte[]>(() => {
    const conteo = new Map<string, number>();
    for (const u of this.usuarioService.usuarios()) {
      conteo.set(u.tipo, (conteo.get(u.tipo) ?? 0) + 1);
    }
    return [...conteo.entries()]
      .map(([tipo, cantidad]) => ({rol: tipo, nombre: this.rolService.nombreDe(tipo), cantidad}))
      .sort((a, b) => b.cantidad - a.cantidad);
  });

  readonly productividadPorUsuario = computed<ProductividadUsuarioReporte[]>(() => {
    const proyectosVisibles = this.proyectosFiltrados();
    const plannings = this.planningService.plannings().filter(pl =>
      proyectosVisibles.some(p => p.id === pl.proyectoId),
    );

    const grupos = new Map<string, Planning[]>();
    for (const pl of plannings) {
      const clave = pl.usuarioId ?? '';
      grupos.set(clave, [...(grupos.get(clave) ?? []), pl]);
    }

    return [...grupos.entries()]
      .map(([usuarioId, pls]) => {
        const tareas = pls.flatMap(pl => pl.tareas);
        const completadas = tareas.filter(t => t.completada).length;
        const usuario = this.usuarioService.usuarioPorId(usuarioId);
        return {
          usuarioId,
          nombre: usuario?.usuario ?? 'Sin asignar',
          plannings: pls.length,
          tareas: tareas.length,
          completadas,
          pendientes: tareas.length - completadas,
          puntos: pls.reduce((s, pl) => s + estimacionTotal(pl.tareas), 0),
          porcentaje: tareas.length > 0 ? Math.round((completadas / tareas.length) * 100) : 0,
        };
      })
      .sort((a, b) => b.tareas - a.tareas);
  });

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
