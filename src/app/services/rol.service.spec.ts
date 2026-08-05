import {TestBed} from '@angular/core/testing';
import {RolService} from './rol.service';
import {PermisoService} from './permiso.service';
import {UsuarioService} from './usuario.service';
import {AuthService} from './auth.service';
import {ROLES_DEFAULT, ROL_SUPER_ADMIN_ID} from '../models/permiso.model';

describe('RolService', () => {
  let service: RolService;
  let permisoService: PermisoService;
  let usuarioService: UsuarioService;

  function authStub() {
    return {currentUser: () => null};
  }

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        RolService,
        PermisoService,
        UsuarioService,
        {provide: AuthService, useValue: authStub()},
      ],
    });
    service = TestBed.inject(RolService);
    permisoService = TestBed.inject(PermisoService);
    usuarioService = TestBed.inject(UsuarioService);
  });

  it('se crea con los roles por defecto', () => {
    expect(service.roles().length).toBe(ROLES_DEFAULT.length);
    expect(service.rolPorId(ROL_SUPER_ADMIN_ID)?.nombre).toBe('Super Administrador');
  });

  it('crear agrega un rol con permisos vacíos', () => {
    expect(service.crear('Desarrollador')).toBeTrue();
    const nuevo = service.roles().find(r => r.nombre === 'Desarrollador');
    expect(nuevo).toBeDefined();
    expect(nuevo!.sistema).toBeFalse();
    expect(permisoService.permisos()[nuevo!.id]).toEqual({});
  });

  it('crear rechaza nombres duplicados', () => {
    expect(service.crear('Desarrollador')).toBeTrue();
    expect(service.crear('desarrollador')).toBeFalse();
  });

  it('renombrar actualiza el nombre y bloquea el super-administrador', () => {
    expect(service.renombrar(ROL_SUPER_ADMIN_ID, 'Dios')).toBeFalse();
    expect(service.rolPorId(ROL_SUPER_ADMIN_ID)?.nombre).toBe('Super Administrador');
    const qa = service.rolPorId('qa')!;
    expect(service.renombrar(qa.id, 'QA Senior')).toBeTrue();
    expect(service.rolPorId(qa.id)?.nombre).toBe('QA Senior');
  });

  it('eliminar bloquea al super-administrador', () => {
    expect(service.eliminar(ROL_SUPER_ADMIN_ID)).toBe('protegido');
    expect(service.rolPorId(ROL_SUPER_ADMIN_ID)).toBeDefined();
  });

  it('eliminar bloquea roles con usuarios asignados', async () => {
    await usuarioService.crear({usuario: 'juan', correo: 'juan@correo.com', clave: '1234', tipo: 'qa'});
    expect(service.eliminar('qa')).toBe('en-uso');
    expect(service.rolPorId('qa')).toBeDefined();
  });

  it('eliminar remueve el rol y su matriz cuando no está en uso', () => {
    expect(service.crear('Desarrollador')).toBeTrue();
    const nuevo = service.rolPorId(service.roles().find(r => r.nombre === 'Desarrollador')!.id)!;
    expect(service.eliminar(nuevo.id)).toBe('ok');
    expect(service.rolPorId(nuevo.id)).toBeUndefined();
    expect(permisoService.permisos()[nuevo.id]).toBeUndefined();
  });

  it('contarUsuarios devuelve el número de usuarios con el rol', async () => {
    await usuarioService.crear({usuario: 'juan', correo: 'juan@correo.com', clave: '1234', tipo: 'usuario'});
    await usuarioService.crear({usuario: 'maria', correo: 'maria@correo.com', clave: '1234', tipo: 'usuario'});
    expect(service.contarUsuarios('usuario')).toBe(2);
  });

  it('persiste los roles en localStorage y los recupera', () => {
    service.crear('Desarrollador');
    const nueva = TestBed.inject(RolService);
    expect(nueva.roles().some(r => r.nombre === 'Desarrollador')).toBeTrue();
    expect(nueva.roles().some(r => r.id === ROL_SUPER_ADMIN_ID)).toBeTrue();
  });
});
