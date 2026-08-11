import {ComponentFixture, TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {ProyectosComponent} from './proyectos.component';
import {EquipoService} from '../../services/equipo.service';
import {AuthService} from '../../services/auth.service';
import {Usuario} from '../../models/usuario.model';

const columnas = [
  {id: 'desarrollo', nombre: 'Desarrollo', orden: 0, color: '#6366f1'},
  {id: 'calidad', nombre: 'Calidad', orden: 1, color: '#14b8a6'},
];

const proyectos = [
  {
    id: 'p1', nombre: 'Web App', descripcion: '', cliente: 'Cliente A', status: 'Activo',
    prioridad: 'alta', columnaId: 'desarrollo', fechaDesde: '2026-01-01', fechaHasta: '2027-01-01',
    documentacion: '', createdAt: '',
  },
  {
    id: 'p2', nombre: 'Mobile', descripcion: '', cliente: 'Cliente B', status: 'Activo',
    prioridad: 'media', columnaId: 'calidad', fechaDesde: '2026-02-01', fechaHasta: '2027-02-01',
    documentacion: '', createdAt: '',
  },
];

const usuarios: Usuario[] = [
  {id: 'u1', usuario: 'Ana López', correo: 'ana@correo.com', clave: 'abcd:efgh', tipo: 'super-administrador'},
  {id: 'u2', usuario: 'Beto Ruiz', correo: 'beto@correo.com', clave: 'abcd:efgh', tipo: 'usuario'},
];

describe('ProyectosComponent', () => {
  let fixture: ComponentFixture<ProyectosComponent>;
  let component: ProyectosComponent;
  let equipoService: EquipoService;
  const usuarioActual = signal<Usuario | null>(null);

  beforeEach(() => {
    localStorage.clear();
    usuarioActual.set(null);
    localStorage.setItem('dev-tracker-columns', JSON.stringify(columnas));
    localStorage.setItem('devtracker-proyectos', JSON.stringify(proyectos));
    localStorage.setItem('devtracker-planning', JSON.stringify([]));
    localStorage.setItem('devtracker-usuarios', JSON.stringify(usuarios));
    TestBed.configureTestingModule({
      imports: [ProyectosComponent],
      providers: [{provide: AuthService, useValue: {currentUser: () => usuarioActual()}}],
    });
    fixture = TestBed.createComponent(ProyectosComponent);
    component = fixture.componentInstance;
    equipoService = TestBed.inject(EquipoService);
    fixture.detectChanges();
  });

  it('renderiza la columna Equipo con el contador de miembros', () => {
    equipoService.asignar('p1', 'u1');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Equipo');
    const c = component as unknown as {miembrosDeProyecto: (id: string) => Usuario[]};
    expect(c.miembrosDeProyecto('p1').length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('AL');
  });

  it('abre y cierra el modal de equipo', () => {
    const p = proyectos[0];
    component.abrirEquipo(p);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-equipo-modal')).not.toBeNull();
    component.cerrarEquipo();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-equipo-modal')).toBeNull();
  });

  it('el filtro "Solo mis proyectos" filtra por membresía', () => {
    usuarioActual.set(usuarios[0]);
    equipoService.asignar('p1', 'u1');
    fixture.detectChanges();

    const c = component as unknown as {
      soloMios: {set: (v: boolean) => void};
      proyectosFiltrados: () => typeof proyectos;
    };
    expect(c.proyectosFiltrados().length).toBe(2);

    c.soloMios.set(true);
    fixture.detectChanges();
    expect(c.proyectosFiltrados().length).toBe(1);
    expect(c.proyectosFiltrados()[0].id).toBe('p1');
    expect(fixture.nativeElement.textContent).toContain('Web App');
    expect(fixture.nativeElement.textContent).not.toContain('Mobile');
  });

  it('muestra estado vacío cuando no hay proyectos asignados al usuario', () => {
    usuarioActual.set(usuarios[0]);
    fixture.detectChanges();
    const c = component as unknown as {soloMios: {set: (v: boolean) => void}};
    c.soloMios.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No tienes proyectos asignados');
  });
});
