import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideAnimations} from '@angular/platform-browser/animations';
import {signal} from '@angular/core';
import {ConfirmationService} from 'primeng/api';
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
      providers: [provideAnimations(), {provide: AuthService, useValue: {currentUser: () => usuarioActual()}}, ConfirmationService],
    });
    fixture = TestBed.createComponent(ProyectosComponent);
    component = fixture.componentInstance;
    equipoService = TestBed.inject(EquipoService);
    fixture.detectChanges();
  });

  it('renderiza la columna Equipo con el contador de miembros', () => {
    usuarioActual.set(usuarios[0]);
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

  it('un usuario regular solo ve los proyectos en los que está asociado', () => {
    usuarioActual.set(usuarios[1]);
    equipoService.asignar('p1', 'u2');
    fixture.detectChanges();

    const c = component as unknown as {proyectosFiltrados: () => typeof proyectos};
    expect(c.proyectosFiltrados().length).toBe(1);
    expect(c.proyectosFiltrados()[0].id).toBe('p1');
    expect(fixture.nativeElement.textContent).toContain('Web App');
    expect(fixture.nativeElement.textContent).not.toContain('Mobile');
  });

  it('admin y super-admin ven todos los proyectos', () => {
    usuarioActual.set(usuarios[0]);
    equipoService.asignar('p1', 'u2');
    fixture.detectChanges();

    const c = component as unknown as {proyectosFiltrados: () => typeof proyectos};
    expect(c.proyectosFiltrados().length).toBe(2);
  });

  it('muestra estado vacío cuando el usuario regular no tiene proyectos asignados', () => {
    usuarioActual.set(usuarios[1]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No tienes proyectos asignados');
  });

  it('al crear un proyecto el creador queda asignado automáticamente y es visible', () => {
    usuarioActual.set(usuarios[1]);
    const c = component as unknown as {
      onGuardar: (data: {nombre: string; descripcion: string; cliente: string; status: string; prioridad: string; fechaDesde: string; fechaHasta: string; documentacion: string}) => void;
      proyectosFiltrados: () => typeof proyectos;
    };
    c.onGuardar({nombre: 'Nuevo', descripcion: '', cliente: '', status: '', prioridad: '', fechaDesde: '', fechaHasta: '', documentacion: ''});
    fixture.detectChanges();

    const visibles = c.proyectosFiltrados();
    expect(visibles.length).toBe(1);
    expect(visibles[0].nombre).toBe('Nuevo');
    expect(equipoService.miembrosDe(visibles[0].id)).toContain('u2');
    expect(fixture.nativeElement.textContent).toContain('Nuevo');
  });
});
