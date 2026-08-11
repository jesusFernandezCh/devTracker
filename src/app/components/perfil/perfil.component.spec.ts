import {ComponentFixture, TestBed} from '@angular/core/testing';
import {PerfilComponent} from './perfil.component';
import {UsuarioService} from '../../services/usuario.service';

describe('PerfilComponent', () => {
  let fixture: ComponentFixture<PerfilComponent>;
  let component: PerfilComponent;
  let usuarioService: UsuarioService;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('devtracker-usuarios', JSON.stringify([
      {
        id: 'u1', usuario: 'jperez', correo: 'jperez@correo.com', clave: 'abcd:efgh', tipo: 'usuario',
        nombres: 'Juan', apellidos: 'Pérez', cedula: 'V-12345678', telefono: '+584121234567',
        telefonoContacto: '', direccion: 'Av. Principal',
      },
    ]));
    localStorage.setItem('devtracker-session', JSON.stringify('u1'));
    TestBed.configureTestingModule({imports: [PerfilComponent]});
    fixture = TestBed.createComponent(PerfilComponent);
    component = fixture.componentInstance;
    usuarioService = TestBed.inject(UsuarioService);
    fixture.detectChanges();
  });

  it('muestra los datos del usuario en el formulario', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Juan');
    expect(text).toContain('Pérez');
    const form = (component as unknown as {
      perfilForm: {getRawValue: () => {correo: string; direccion: string; nombres: string}};
    }).perfilForm;
    expect(form.getRawValue().correo).toBe('jperez@correo.com');
    expect(form.getRawValue().direccion).toBe('Av. Principal');
  });

  it('guarda los cambios en el usuario', async () => {
    const form = (component as unknown as {
      perfilForm: {controls: {nombres: {setValue: (v: string) => void}; correo: {setValue: (v: string) => void}}};
    }).perfilForm;
    form.controls.nombres.setValue('Carlos');
    form.controls.correo.setValue('carlos@correo.com');
    await (component as unknown as {onGuardar: () => Promise<void>}).onGuardar();
    const actualizado = usuarioService.usuarioPorId('u1')!;
    expect(actualizado.nombres).toBe('Carlos');
    expect(actualizado.correo).toBe('carlos@correo.com');
  });

  it('no guarda si el formulario es inválido', async () => {
    const form = (component as unknown as {
      perfilForm: {controls: {correo: {setValue: (v: string) => void}}};
    }).perfilForm;
    form.controls.correo.setValue('correo-invalido');
    await (component as unknown as {onGuardar: () => Promise<void>}).onGuardar();
    expect(usuarioService.usuarioPorId('u1')!.correo).toBe('jperez@correo.com');
  });

  it('muestra el aviso cuando no hay curriculum', () => {
    expect(fixture.nativeElement.textContent).toContain('No has adjuntado un curriculum');
  });
});
