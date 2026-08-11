import {Component} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {PermisoDirective} from './permiso.directive';
import {PermisoService} from '../services/permiso.service';
import {AuthService} from '../services/auth.service';

@Component({
  standalone: true,
  imports: [PermisoDirective],
  template: `
    <button *appPermiso="'editar'; recurso: 'tareas'" id="editarTareas">Editar tarea</button>
    <button *appPermiso="'eliminar'; recurso: 'tareas'" id="eliminarTareas">Eliminar tarea</button>
    <button *appPermiso="'eliminar'; recurso: 'planning'" id="eliminarPlanning">Eliminar planning</button>
  `,
})
class HostComponent {}

describe('PermisoDirective', () => {
  let fixture: ComponentFixture<HostComponent>;

  function configurar(tipo: 'usuario' | 'supervisor') {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        PermisoService,
        {provide: AuthService, useValue: {currentUser: () => ({tipo})}},
      ],
    });
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  }

  it('muestra editar/eliminar tareas para un usuario que los tiene', () => {
    configurar('usuario');
    expect(fixture.nativeElement.querySelector('#editarTareas')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#eliminarTareas')).toBeTruthy();
  });

  it('oculta eliminar planning para un usuario que no lo tiene', () => {
    configurar('usuario');
    expect(fixture.nativeElement.querySelector('#eliminarPlanning')).toBeFalsy();
  });

  it('muestra eliminar planning para un supervisor que lo tiene', () => {
    configurar('supervisor');
    expect(fixture.nativeElement.querySelector('#eliminarPlanning')).toBeTruthy();
  });
});
