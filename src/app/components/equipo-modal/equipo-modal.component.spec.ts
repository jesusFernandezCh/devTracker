import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideAnimations} from '@angular/platform-browser/animations';
import {EquipoModalComponent} from './equipo-modal.component';
import {EquipoService} from '../../services/equipo.service';
import {Proyecto} from '../../models/proyecto.model';

const proyecto: Proyecto = {
  id: 'p1', nombre: 'Web App', descripcion: '', cliente: 'Cliente A', status: 'Activo',
  prioridad: 'media', columnaId: 'desarrollo', fechaDesde: '2026-01-01', fechaHasta: '2027-01-01',
  documentacion: '', createdAt: '',
};

describe('EquipoModalComponent', () => {
  let fixture: ComponentFixture<EquipoModalComponent>;
  let component: EquipoModalComponent;
  let equipoService: EquipoService;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('devtracker-usuarios', JSON.stringify([
      {id: 'u1', usuario: 'Ana López', correo: 'ana@correo.com', clave: 'abcd:efgh', tipo: 'usuario'},
      {id: 'u2', usuario: 'Beto Ruiz', correo: 'beto@correo.com', clave: 'abcd:efgh', tipo: 'qa'},
    ]));
    TestBed.configureTestingModule({imports: [EquipoModalComponent], providers: [provideAnimations()]});
    fixture = TestBed.createComponent(EquipoModalComponent);
    fixture.componentRef.setInput('proyecto', proyecto);
    component = fixture.componentInstance;
    equipoService = TestBed.inject(EquipoService);
    fixture.detectChanges();
  });

  it('lista los usuarios con sus nombres', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Ana López');
    expect(text).toContain('Beto Ruiz');
    expect(text).toContain('Sin miembros asignados');
  });

  it('toggle asigna y desasigna un usuario', () => {
    (component as unknown as {toggle: (id: string) => void}).toggle('u1');
    expect(equipoService.miembrosDe('p1')).toEqual(['u1']);
    (component as unknown as {toggle: (id: string) => void}).toggle('u1');
    expect(equipoService.miembrosDe('p1')).toEqual([]);
  });

  it('quitar elimina del equipo', () => {
    equipoService.asignar('p1', 'u1');
    fixture.detectChanges();
    expect((component as unknown as {estaAsignado: (id: string) => boolean}).estaAsignado('u1')).toBeTrue();
    (component as unknown as {quitar: (id: string) => void}).quitar('u1');
    expect(equipoService.miembrosDe('p1')).toEqual([]);
  });

  it('emite cerrar al pulsar el botón', () => {
    let emitido = false;
    component.cerrar.subscribe(() => (emitido = true));
    const cerrarBtn = fixture.nativeElement.querySelector('button[aria-label="Cerrar"]');
    cerrarBtn.click();
    expect(emitido).toBeTrue();
  });
});
