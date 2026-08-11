import {TestBed} from '@angular/core/testing';
import {PermisoService} from './permiso.service';
import {AuthService} from './auth.service';
import {PERMISOS, ACCIONES, RECURSOS_ORDEN} from '../models/permiso.model';

describe('PermisoService', () => {
  let service: PermisoService;

  function authStub(currentUser: () => unknown) {
    return {currentUser};
  }

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        PermisoService,
        {provide: AuthService, useValue: authStub(() => null)},
      ],
    });
    service = TestBed.runInInjectionContext(() => new PermisoService());
  });

  it('se crea con la matriz por defecto', () => {
    for (const rol of Object.keys(PERMISOS)) {
      for (const recurso of RECURSOS_ORDEN) {
        const esperadas = PERMISOS[rol][recurso] ?? [];
        const actuales = service.permisos()[rol][recurso] ?? [];
        expect([...actuales].sort()).toEqual([...esperadas].sort());
      }
    }
  });

  it('el super-administrador siempre tiene todas las acciones en todos los recursos', () => {
    for (const recurso of RECURSOS_ORDEN) {
      for (const accion of ACCIONES) {
        expect(service.puede(accion, recurso, 'super-administrador')).toBeTrue();
      }
    }
  });

  it('un usuario con editar puede editar tareas y proyectos (matriz ampliada)', () => {
    expect(service.puede('editar', 'tareas', 'usuario')).toBeTrue();
    expect(service.puede('eliminar', 'tareas', 'usuario')).toBeTrue();
    expect(service.puede('editar', 'proyectos', 'usuario')).toBeTrue();
    expect(service.puede('eliminar', 'proyectos', 'usuario')).toBeTrue();
  });

  it('un usuario NO puede editar ni eliminar planning/calendario/tablero', () => {
    for (const recurso of ['planning', 'calendario', 'tablero'] as const) {
      expect(service.puede('editar', recurso, 'usuario')).toBeFalse();
      expect(service.puede('eliminar', recurso, 'usuario')).toBeFalse();
    }
  });

  it('un supervisor puede editar y eliminar tareas/proyectos/planning (matriz ampliada)', () => {
    for (const recurso of ['tareas', 'proyectos', 'planning'] as const) {
      expect(service.puede('editar', recurso, 'supervisor')).toBeTrue();
      expect(service.puede('eliminar', recurso, 'supervisor')).toBeTrue();
    }
  });

  it('un administrador puede eliminar usuarios y roles', () => {
    expect(service.puede('eliminar', 'usuarios', 'administrador')).toBeTrue();
    expect(service.puede('eliminar', 'roles', 'administrador')).toBeTrue();
  });

  it('toggle agrega y luego remueve un permiso, y persiste en localStorage', () => {
    expect(service.puede('eliminar', 'planning', 'supervisor')).toBeTrue();

    service.toggle('supervisor', 'planning', 'eliminar');
    expect(service.puede('eliminar', 'planning', 'supervisor')).toBeFalse();
    const guardado = JSON.parse(localStorage.getItem('devtracker-permisos') ?? '{}');
    expect(guardado.version).toBe(1);
    expect(guardado.matriz.supervisor.planning).not.toContain('eliminar');

    service.toggle('supervisor', 'planning', 'eliminar');
    expect(service.puede('eliminar', 'planning', 'supervisor')).toBeTrue();
  });

  it('toggle sobre la fila super-administrador no tiene efecto', () => {
    service.toggle('super-administrador', 'roles', 'eliminar');
    expect(service.puede('eliminar', 'roles', 'super-administrador')).toBeTrue();
  });

  it('los cambios de toggle sobreviven a una nueva instancia (lectura de localStorage)', () => {
    service.toggle('qa', 'planning', 'eliminar');
    const nueva = TestBed.runInInjectionContext(() => new PermisoService());
    expect(nueva.puede('eliminar', 'planning', 'qa')).toBeTrue();
  });

  it('restablecer vuelve a la matriz por defecto', () => {
    service.toggle('qa', 'planning', 'eliminar');
    expect(service.puede('eliminar', 'planning', 'qa')).toBeTrue();
    service.restablecer();
    expect(service.puede('eliminar', 'planning', 'qa')).toBeFalse();
  });

  it('ignora datos sin versionar (formato antiguo) y usa la matriz por defecto', () => {
    localStorage.setItem(
      'devtracker-permisos',
      JSON.stringify({usuario: {tareas: ['leer'], proyectos: ['leer']}}),
    );
    const nueva = TestBed.runInInjectionContext(() => new PermisoService());
    expect(nueva.puede('editar', 'tareas', 'usuario')).toBeTrue();
    expect(nueva.puede('crear', 'proyectos', 'usuario')).toBeTrue();
  });

  it('ignora acciones inválidas dentro de datos versionados', () => {
    localStorage.setItem(
      'devtracker-permisos',
      JSON.stringify({
        version: 1,
        matriz: {supervisor: {tareas: ['leer', 'crear', 'editar', 'eliminar', 'hack']}},
      }),
    );
    const nueva = TestBed.runInInjectionContext(() => new PermisoService());
    const tareas = (nueva.permisos()['supervisor'].tareas ?? []) as string[];
    expect(tareas).not.toContain('hack');
    expect(tareas.sort()).toEqual(['crear', 'editar', 'eliminar', 'leer']);
  });

  it('agregarRol crea una entrada con permisos vacíos y persiste', () => {
    service.agregarRol('rol-personalizado');
    expect(service.permisos()['rol-personalizado']).toEqual({});
    const guardado = JSON.parse(localStorage.getItem('devtracker-permisos') ?? '{}');
    expect(guardado.matriz['rol-personalizado']).toEqual({});
  });

  it('eliminarRol remueve la entrada de la matriz', () => {
    service.agregarRol('rol-personalizado');
    expect(service.permisos()['rol-personalizado']).toBeDefined();
    service.eliminarRol('rol-personalizado');
    expect(service.permisos()['rol-personalizado']).toBeUndefined();
  });

  it('eliminarRol no afecta al super-administrador', () => {
    service.eliminarRol('super-administrador');
    expect(service.permisos()['super-administrador']).toBeDefined();
  });

  it('los roles personalizados se conservan tras restablecer', () => {
    service.agregarRol('rol-personalizado');
    service.toggle('rol-personalizado', 'tareas', 'leer');
    service.restablecer();
    expect(service.puede('leer', 'tareas', 'rol-personalizado')).toBeTrue();
    expect(service.puede('eliminar', 'tareas', 'usuario')).toBeTrue();
  });

  it('las entradas de roles personalizados sobreviven a una nueva instancia', () => {
    service.agregarRol('rol-personalizado');
    service.toggle('rol-personalizado', 'proyectos', 'crear');
    const nueva = TestBed.runInInjectionContext(() => new PermisoService());
    expect(nueva.puede('crear', 'proyectos', 'rol-personalizado')).toBeTrue();
  });
});
