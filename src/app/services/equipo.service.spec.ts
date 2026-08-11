import {TestBed} from '@angular/core/testing';
import {EquipoService} from './equipo.service';

describe('EquipoService', () => {
  let service: EquipoService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({providers: [EquipoService]});
    service = TestBed.inject(EquipoService);
  });

  it('arranca sin asignaciones', () => {
    expect(service.miembrosDe('p1')).toEqual([]);
    expect(service.porProyecto()).toEqual({});
  });

  it('asignar agrega un usuario al proyecto', () => {
    service.asignar('p1', 'u1');
    service.asignar('p1', 'u2');
    expect(service.miembrosDe('p1')).toEqual(['u1', 'u2']);
  });

  it('asignar es idempotente', () => {
    service.asignar('p1', 'u1');
    service.asignar('p1', 'u1');
    expect(service.miembrosDe('p1')).toEqual(['u1']);
  });

  it('quitar desasigna un usuario', () => {
    service.asignar('p1', 'u1');
    service.asignar('p1', 'u2');
    service.quitar('p1', 'u1');
    expect(service.miembrosDe('p1')).toEqual(['u2']);
  });

  it('establecer reemplaza la lista completa', () => {
    service.asignar('p1', 'u1');
    service.establecer('p1', ['u2', 'u3']);
    expect(service.miembrosDe('p1')).toEqual(['u2', 'u3']);
  });

  it('proyectosDe devuelve los proyectos de un usuario', () => {
    service.asignar('p1', 'u1');
    service.asignar('p2', 'u1');
    service.asignar('p3', 'u2');
    expect(service.proyectosDe('u1')).toEqual(['p1', 'p2']);
    expect(service.proyectosDe('u2')).toEqual(['p3']);
  });

  it('eliminarUsuarioDeTodos remueve al usuario y limpia entradas vacías', () => {
    service.asignar('p1', 'u1');
    service.asignar('p1', 'u2');
    service.asignar('p2', 'u1');
    service.eliminarUsuarioDeTodos('u1');
    expect(service.porProyecto()).toEqual({p1: ['u2']});
  });

  it('persiste en localStorage', () => {
    service.asignar('p1', 'u1');
    expect(JSON.parse(localStorage.getItem('devtracker-equipo-proyecto')!)).toEqual({p1: ['u1']});
  });

  it('recupera asignaciones guardadas al recargar', () => {
    localStorage.setItem('devtracker-equipo-proyecto', JSON.stringify({p1: ['u1']}));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({providers: [EquipoService]});
    const reloaded = TestBed.inject(EquipoService);
    expect(reloaded.miembrosDe('p1')).toEqual(['u1']);
  });
});
