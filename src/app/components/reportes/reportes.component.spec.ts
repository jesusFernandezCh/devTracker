import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {provideHighcharts} from 'highcharts-angular';
import {ReportesComponent} from './reportes.component';

describe('ReportesComponent', () => {
  let fixture: ComponentFixture<ReportesComponent>;
  let component: ReportesComponent;

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
    TestBed.configureTestingModule({
      imports: [ReportesComponent],
      providers: [provideHighcharts()],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(ReportesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function activarGraficas(): void {
    const boton = [...fixture.nativeElement.querySelectorAll('button')]
      .find((b: HTMLButtonElement) => b.textContent!.trim() === 'Gráficas');
    (boton as HTMLButtonElement).click();
    fixture.detectChanges();
  }

  it('muestra la pestaña Gráficas', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const labels = [...buttons].map((b: HTMLButtonElement) => b.textContent!.trim());
    expect(labels).toContain('Gráficas');
  });

  it('al activar Gráficas renderiza los 5 charts', () => {
    activarGraficas();
    expect(fixture.nativeElement.querySelectorAll('.grafica').length).toBe(5);
  });

  it('genera opciones de series con datos por mes', () => {
    activarGraficas();
    const g = (component as unknown as {graficas: () => Record<string, {series: {data: unknown[]}[]; plotOptions?: object}>}).graficas();
    expect(g['cerradas'].series[0].data.length).toBeGreaterThan(0);
    expect(g['balance'].series.length).toBe(2);
    expect(g['produccion'].series[0].data.length).toBeGreaterThan(0);
    expect(g['cerradas'].plotOptions).toEqual({});
    expect(g['balance'].plotOptions).toEqual({column: {stacking: 'normal'}});
  });

  it('muestra estado vacío sin datos mensuales', () => {
    (component as unknown as {reporteService: {fechaDesde: {set: (v: string) => void}}})
      .reporteService.fechaDesde.set('2099-01-01');
    fixture.detectChanges();
    activarGraficas();
    expect(fixture.nativeElement.querySelectorAll('.grafica').length).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('No hay datos mensuales');
  });
});
