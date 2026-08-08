import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {provideRouter} from '@angular/router';
import {provideHighcharts} from 'highcharts-angular';
import {DashboardComponent} from './dashboard.component';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;

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
      ],
    },
  ];

  function configurarCon(localStorageData: Record<string, string>): void {
    localStorage.clear();
    for (const [k, v] of Object.entries(localStorageData)) {
      localStorage.setItem(k, v);
    }
    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideHighcharts(), provideRouter([])],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('renderiza la dona de progreso por ambiente', () => {
    configurarCon({
      'dev-tracker-columns': JSON.stringify(columnas),
      'devtracker-proyectos': JSON.stringify(proyectos),
      'devtracker-planning': JSON.stringify(plannings),
    });
    expect(fixture.nativeElement.querySelectorAll('.db-dona').length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Progreso por ambiente');
  });

  it('genera la dona con los datos y colores de cada columna', () => {
    configurarCon({
      'dev-tracker-columns': JSON.stringify(columnas),
      'devtracker-proyectos': JSON.stringify(proyectos),
      'devtracker-planning': JSON.stringify(plannings),
    });
    const g = (component as unknown as {
      graficaAmbiente: () => {plotOptions: unknown; series: {data: {name: string; y: number; color: string}[]}[]};
    }).graficaAmbiente();
    expect(g.plotOptions).not.toBeUndefined();
    expect(g.series[0].data).toEqual([
      {name: 'Desarrollo', y: 1, color: '#6366f1'},
      {name: 'Calidad', y: 1, color: '#14b8a6'},
    ]);
  });

  it('muestra estado vacío sin proyectos por ambiente', () => {
    configurarCon({
      'dev-tracker-columns': JSON.stringify(columnas),
      'devtracker-proyectos': JSON.stringify([]),
      'devtracker-planning': JSON.stringify([]),
    });
    expect(fixture.nativeElement.querySelectorAll('.db-dona').length).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('Sin proyectos por ambiente.');
  });

  it('renderiza el gauge de progreso general', () => {
    configurarCon({
      'dev-tracker-columns': JSON.stringify(columnas),
      'devtracker-proyectos': JSON.stringify(proyectos),
      'devtracker-planning': JSON.stringify(plannings),
    });
    expect(fixture.nativeElement.querySelectorAll('.db-hero-gauge').length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Progreso General');
  });

  it('genera el gauge solidgauge con el porcentaje y color de salud', () => {
    configurarCon({
      'dev-tracker-columns': JSON.stringify(columnas),
      'devtracker-proyectos': JSON.stringify(proyectos),
      'devtracker-planning': JSON.stringify(plannings),
    });
    const g = (component as unknown as {
      graficaProgreso: () => {
        plotOptions: unknown;
        series: {type: string; name: string; color: string; data: number[]}[];
      };
    }).graficaProgreso();
    expect(g.plotOptions).not.toBeUndefined();
    expect(g.series[0].type).toBe('solidgauge');
    expect(g.series[0].name).toBe('Progreso General');
    expect(g.series[0].data).toEqual([50]);
    expect(g.series[0].color).toBe('var(--color-amber-500)');
  });

  it('oculta las secciones de administración sin sesión', () => {
    configurarCon({
      'dev-tracker-columns': JSON.stringify(columnas),
      'devtracker-proyectos': JSON.stringify(proyectos),
      'devtracker-planning': JSON.stringify(plannings),
    });
    expect(fixture.nativeElement.querySelectorAll('.db-tabla').length).toBe(0);
    expect(fixture.nativeElement.textContent).not.toContain('Avance general por cliente');
  });

  it('muestra las secciones de administración para super-administrador', () => {
    configurarCon({
      'dev-tracker-columns': JSON.stringify(columnas),
      'devtracker-proyectos': JSON.stringify(proyectos),
      'devtracker-planning': JSON.stringify(plannings),
      'devtracker-usuarios': JSON.stringify([
        {id: 'super-admin', usuario: 'admin', correo: 'admin@devtracker.app', clave: 'x', tipo: 'super-administrador'},
      ]),
      'devtracker-session': JSON.stringify('super-admin'),
    });
    expect(fixture.nativeElement.textContent).toContain('Avance general por cliente');
    expect(fixture.nativeElement.textContent).toContain('Avance mensual por cliente');
    expect(fixture.nativeElement.textContent).toContain('Usuarios por tipo');
    expect(fixture.nativeElement.textContent).toContain('Plannings y tareas por usuario');
  });

  it('muestra las secciones de administración para administrador', () => {
    configurarCon({
      'dev-tracker-columns': JSON.stringify(columnas),
      'devtracker-proyectos': JSON.stringify(proyectos),
      'devtracker-planning': JSON.stringify(plannings),
      'devtracker-usuarios': JSON.stringify([
        {id: 'u1', usuario: 'ana', correo: 'ana@correo.com', clave: 'x', tipo: 'administrador'},
      ]),
      'devtracker-session': JSON.stringify('u1'),
    });
    expect(fixture.nativeElement.querySelectorAll('.db-tabla').length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Cliente A');
  });
});
