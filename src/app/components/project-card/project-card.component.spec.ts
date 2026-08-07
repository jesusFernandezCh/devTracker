import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ProjectCardComponent} from './project-card.component';
import {EquipoService} from '../../services/equipo.service';
import {Proyecto} from '../../models/proyecto.model';

const proyecto: Proyecto = {
  id: 'p1', nombre: 'Web App', descripcion: '', cliente: 'Cliente A', status: 'Activo',
  prioridad: 'alta', columnaId: 'desarrollo', fechaDesde: '2026-01-01', fechaHasta: '2027-01-01',
  documentacion: '', createdAt: '',
};

describe('ProjectCardComponent', () => {
  let fixture: ComponentFixture<ProjectCardComponent>;
  let component: ProjectCardComponent;
  let equipoService: EquipoService;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('devtracker-usuarios', JSON.stringify([
      {id: 'u1', usuario: 'Ana López', correo: 'ana@correo.com', clave: 'abcd:efgh', tipo: 'super-administrador'},
      {id: 'u2', usuario: 'Beto Ruiz', correo: 'beto@correo.com', clave: 'abcd:efgh', tipo: 'usuario'},
    ]));
    TestBed.configureTestingModule({imports: [ProjectCardComponent]});
    fixture = TestBed.createComponent(ProjectCardComponent);
    fixture.componentRef.setInput('proyecto', proyecto);
    component = fixture.componentInstance;
    equipoService = TestBed.inject(EquipoService);
    fixture.detectChanges();
  });

  it('no muestra el pie de miembros sin usuarios asociados', () => {
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
    TestBed.configureTestingModule({imports: [ProjectCardComponent]});
    const nuevo = TestBed.createComponent(ProjectCardComponent);
    nuevo.componentRef.setInput('proyecto', proyecto);
    const nuevoEquipo = TestBed.inject(EquipoService);
    for (const id of ['u1', 'u2', 'u3', 'u4', 'u5']) nuevoEquipo.asignar('p1', id);
    nuevo.detectChanges();
    expect(nuevo.nativeElement.textContent).toContain('+2');
    expect(nuevo.nativeElement.textContent).toContain('5 miembros');
  });
});
