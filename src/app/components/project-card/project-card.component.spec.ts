import {ComponentFixture, TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {provideRouter} from '@angular/router';
import {provideAnimations} from '@angular/platform-browser/animations';
import {ProjectCardComponent} from './project-card.component';
import {EquipoService} from '../../services/equipo.service';
import {AuthService} from '../../services/auth.service';
import {Usuario} from '../../models/usuario.model';
import {Proyecto} from '../../models/proyecto.model';

const proyecto: Proyecto = {
  id: 'p1', nombre: 'Web App', descripcion: '', cliente: 'Cliente A', status: 'Activo',
  prioridad: 'alta', columnaId: 'desarrollo', fechaDesde: '2026-01-01', fechaHasta: '2027-01-01',
  documentacion: '', createdAt: '',
};

const admin: Usuario = {
  id: 'u1', usuario: 'Ana López', correo: 'ana@correo.com', clave: 'abcd:efgh', tipo: 'super-administrador',
};

describe('ProjectCardComponent', () => {
  let fixture: ComponentFixture<ProjectCardComponent>;
  let component: ProjectCardComponent;
  let equipoService: EquipoService;
  const usuarioActual = signal<Usuario | null>(null);

  function crearComponente(): void {
    TestBed.configureTestingModule({
      imports: [ProjectCardComponent],
      providers: [
        provideAnimations(),
        provideRouter([]),
        {provide: AuthService, useValue: {currentUser: () => usuarioActual()}},
      ],
    });
    fixture = TestBed.createComponent(ProjectCardComponent);
    fixture.componentRef.setInput('proyecto', proyecto);
    component = fixture.componentInstance;
    equipoService = TestBed.inject(EquipoService);
    fixture.detectChanges();
  }

  beforeEach(() => {
    localStorage.clear();
    usuarioActual.set(null);
    localStorage.setItem('devtracker-usuarios', JSON.stringify([
      {id: 'u1', usuario: 'Ana López', correo: 'ana@correo.com', clave: 'abcd:efgh', tipo: 'super-administrador'},
      {id: 'u2', usuario: 'Beto Ruiz', correo: 'beto@correo.com', clave: 'abcd:efgh', tipo: 'usuario'},
    ]));
    crearComponente();
  });

  it('no muestra el pie de miembros sin usuarios asociados', () => {
    expect(fixture.nativeElement.textContent).toContain('Sin equipo');
    expect(fixture.nativeElement.textContent).not.toContain('miembro');
  });

  it('muestra el stack de avatares y el contador con usuarios asociados', () => {
    equipoService.asignar('p1', 'u1');
    equipoService.asignar('p1', 'u2');
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('AL');
    expect(text).toContain('BR');
    expect(text).toContain('2 miembros');
  });

  it('muestra el indicador +N cuando hay más de tres miembros', () => {
    localStorage.setItem('devtracker-usuarios', JSON.stringify([
      {id: 'u1', usuario: 'Ana López', correo: 'a@c.com', clave: 'abcd:efgh', tipo: 'usuario'},
      {id: 'u2', usuario: 'Beto Ruiz', correo: 'b@c.com', clave: 'abcd:efgh', tipo: 'usuario'},
      {id: 'u3', usuario: 'Carla Díaz', correo: 'c@c.com', clave: 'abcd:efgh', tipo: 'usuario'},
      {id: 'u4', usuario: 'Diego Soto', correo: 'd@c.com', clave: 'abcd:efgh', tipo: 'usuario'},
      {id: 'u5', usuario: 'Eva Ríos', correo: 'e@c.com', clave: 'abcd:efgh', tipo: 'usuario'},
    ]));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ProjectCardComponent],
      providers: [
        provideAnimations(),
        provideRouter([]),
        {provide: AuthService, useValue: {currentUser: () => usuarioActual()}},
      ],
    });
    const nuevo = TestBed.createComponent(ProjectCardComponent);
    nuevo.componentRef.setInput('proyecto', proyecto);
    const nuevoEquipo = TestBed.inject(EquipoService);
    for (const id of ['u1', 'u2', 'u3', 'u4', 'u5']) nuevoEquipo.asignar('p1', id);
    nuevo.detectChanges();
    expect(nuevo.nativeElement.textContent).toContain('+2');
    expect(nuevo.nativeElement.textContent).toContain('5 miembros');
  });

  it('oculta el botón + sin permiso (sin sesión)', () => {
    expect(fixture.nativeElement.querySelector('button[aria-label^="Asociar usuarios"]')).toBeNull();
  });

  it('muestra el botón + con permiso y abre el modal de equipo', () => {
    usuarioActual.set(admin);
    fixture.detectChanges();
    const boton = fixture.nativeElement.querySelector('button[aria-label^="Asociar usuarios"]');
    expect(boton).not.toBeNull();

    boton.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-equipo-modal')).not.toBeNull();
  });

  it('cierra el modal de equipo', () => {
    usuarioActual.set(admin);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button[aria-label^="Asociar usuarios"]').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-equipo-modal')).not.toBeNull();

    (component as unknown as {equipoAbierto: {set: (v: boolean) => void}}).equipoAbierto.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-equipo-modal')).toBeNull();
  });
});