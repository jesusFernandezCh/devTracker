import {TestBed} from '@angular/core/testing';
import {ReporteService, diasRestantes, urgenciaDe} from './reporte.service';

describe('ReporteService', () => {
  let service: ReporteService;

  const columnas = [
    {id: 'desarrollo', nombre: 'Desarrollo', orden: 0, color: '#6366f1'},
    {id: 'calidad', nombre: 'Calidad', orden: 1, color: '#14b8a6'},
    {id: 'produccion', nombre: 'Produccion', orden: 2, color: '#f59e0b'},
  ];

  const proyectos = [
    {
      id: 'p1', nombre: 'Web App', descripcion: '', cliente: 'Cliente A', status: 'Activo',
      prioridad: 'alta', columnaId: 'desarrollo', fechaDesde: '2026-01-01', fechaHasta: '2027-01-10',
      documentacion: '', createdAt: '',
    },
    {
      id: 'p2', nombre: 'Mobile', descripcion: '', cliente: 'Cliente B', status: 'Activo',
      prioridad: 'media', columnaId: 'calidad', fechaDesde: '2026-02-01', fechaHasta: '2027-02-01',
      documentacion: '', createdAt: '',
    },
  ];

  const plannings = [
    {
      id: 'pl1', fecha: '2026-03-01', proyectoId: 'p1', descripcion: 'Sprint 1', createdAt: '',
      tareas: [
        {id: 't1', tarea: 'Setup', complejidad: 'Simple', completada: true},
        {id: 't2', tarea: 'Login', complejidad: 'Media', completada: false},
        {id: 't3', tarea: 'Payments', complejidad: 'Compleja', completada: false},
      ],
    },
    {
      id: 'pl2', fecha: '2026-03-15', proyectoId: 'p2', descripcion: 'Sprint 1', createdAt: '',
      tareas: [
        {id: 't4', tarea: 'Onboarding', complejidad: 'Simple', completada: true},
        {id: 't5', tarea: 'Push', complejidad: 'Simple', completada: true},
      ],
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('dev-tracker-columns', JSON.stringify(columnas));
    localStorage.setItem('devtracker-proyectos', JSON.stringify(proyectos));
    localStorage.setItem('devtracker-planning', JSON.stringify(plannings));
    TestBed.configureTestingModule({providers: [ReporteService]});
    service = TestBed.inject(ReporteService);
  });

  it('proyectosDetalle calcula tareas, completadas y story points', () => {
    const detalle = service.proyectosDetalle();
    const p1 = detalle.find(r => r.proyecto.id === 'p1')!;
    expect(p1.tareas).toBe(3);
    expect(p1.completadas).toBe(1);
    expect(p1.pendientes).toBe(2);
    expect(p1.puntos).toBe(9);
    expect(p1.porcentaje).toBe(33);
    const p2 = detalle.find(r => r.proyecto.id === 'p2')!;
    expect(p2.puntos).toBe(2);
  });

  it('estimacionPorComplejidad agrupa por complejidad', () => {
    const res = service.estimacionPorComplejidad();
    const simple = res.find(r => r.complejidad === 'Simple')!;
    const media = res.find(r => r.complejidad === 'Media')!;
    const compleja = res.find(r => r.complejidad === 'Compleja')!;
    expect(simple.cantidad).toBe(3);
    expect(simple.puntos).toBe(3);
    expect(media.cantidad).toBe(1);
    expect(media.puntos).toBe(3);
    expect(compleja.cantidad).toBe(1);
    expect(compleja.puntos).toBe(5);
  });

  it('estimacionPorProyecto ordena por puntos descendente', () => {
    const res = service.estimacionPorProyecto();
    expect(res[0].proyecto.id).toBe('p1');
    expect(res[0].puntos).toBe(9);
    expect(res[1].puntos).toBe(2);
  });

  it('vencimientos ordena por días restantes y marca urgencia', () => {
    const res = service.vencimientos();
    expect(res.length).toBe(2);
    expect(res[0].proyecto.id).toBe('p1');
    expect(res[1].proyecto.id).toBe('p2');
    expect(res[0].diasRestantes).toBeGreaterThanOrEqual(0);
    expect(['normal', 'alerta', 'urgente']).toContain(res[0].urgencia);
  });

  it('pipelinePorColumna reparte proyectos por ambiente', () => {
    const res = service.pipelinePorColumna();
    const desarrollo = res.find(r => r.columna.id === 'desarrollo')!;
    const calidad = res.find(r => r.columna.id === 'calidad')!;
    const produccion = res.find(r => r.columna.id === 'produccion')!;
    expect(desarrollo.cantidad).toBe(1);
    expect(desarrollo.porcentaje).toBe(50);
    expect(calidad.cantidad).toBe(1);
    expect(produccion.cantidad).toBe(0);
  });

  it('calidadPorColumna calcula la tasa de completadas', () => {
    const res = service.calidadPorColumna();
    const desarrollo = res.find(r => r.columna.id === 'desarrollo')!;
    const calidad = res.find(r => r.columna.id === 'calidad')!;
    expect(desarrollo.total).toBe(3);
    expect(desarrollo.completadas).toBe(1);
    expect(desarrollo.porcentaje).toBe(33);
    expect(calidad.porcentaje).toBe(100);
  });

  it('productividadPorProyecto desglosa plannings por proyecto', () => {
    const res = service.productividadPorProyecto();
    const p1 = res.find(r => r.proyecto.id === 'p1')!;
    expect(p1.plannings.length).toBe(1);
    expect(p1.totalTareas).toBe(3);
    expect(p1.completadas).toBe(1);
    expect(p1.puntos).toBe(9);
  });

  it('los filtros por proyecto y fecha limitan el resultado', () => {
    expect(service.proyectosDetalle().length).toBe(2);
    service.proyectoId.set('p1');
    expect(service.proyectosDetalle().length).toBe(1);
    service.proyectoId.set('');
    service.fechaHasta.set('2027-01-20');
    const res = service.proyectosDetalle();
    expect(res.length).toBe(1);
    expect(res[0].proyecto.id).toBe('p1');
  });

  it('limpiarFiltros restablece los filtros', () => {
    service.proyectoId.set('p1');
    service.fechaDesde.set('2026-01-01');
    service.fechaHasta.set('2026-12-31');
    service.limpiarFiltros();
    expect(service.proyectoId()).toBe('');
    expect(service.fechaDesde()).toBe('');
    expect(service.fechaHasta()).toBe('');
  });

  it('exportarCSV genera una descarga sin errores', () => {
    expect(() =>
      service.exportarCSV('test', [{A: 'x', B: 1}, {A: 'y', B: 2}], ['A', 'B']),
    ).not.toThrow();
  });

  it('diasRestantes y urgenciaDe son deterministas', () => {
    expect(urgenciaDe(5)).toBe('urgente');
    expect(urgenciaDe(20)).toBe('alerta');
    expect(urgenciaDe(60)).toBe('normal');
    expect(diasRestantes('2099-01-01')).toBeGreaterThan(0);
  });
});
