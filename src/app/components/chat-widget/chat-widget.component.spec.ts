import {ComponentFixture, TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {ChatWidgetComponent} from './chat-widget.component';
import {ChatService} from '../../services/chat.service';
import {AuthService} from '../../services/auth.service';
import {Usuario} from '../../models/usuario.model';
import {Proyecto} from '../../models/proyecto.model';

const usuarios: Usuario[] = [
  {id: 'u1', usuario: 'Ana López', correo: 'ana@correo.com', clave: 'abcd:efgh', tipo: 'usuario'},
  {id: 'u2', usuario: 'Beto Ruiz', correo: 'beto@correo.com', clave: 'abcd:efgh', tipo: 'qa'},
  {id: 'u3', usuario: 'Carlos Gil', correo: 'carlos@correo.com', clave: 'abcd:efgh', tipo: 'supervisor'},
];

const proyecto = (overrides: Partial<Proyecto>): Proyecto => ({
  id: 'p1',
  nombre: 'App Móvil',
  descripcion: '',
  cliente: '',
  status: 'Activo',
  prioridad: 'baja',
  columnaId: 'desarrollo',
  fechaDesde: '2026-01-01',
  fechaHasta: '2026-12-31',
  documentacion: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const proyectos: Proyecto[] = [
  proyecto({}),
  proyecto({id: 'p2', nombre: 'Portal Web'}),
];

describe('ChatWidgetComponent', () => {
  let fixture: ComponentFixture<ChatWidgetComponent>;
  let component: ChatWidgetComponent;
  let chatService: ChatService;
  const usuarioActual = signal<Usuario | null>(null);

  beforeEach(() => {
    localStorage.clear();
    usuarioActual.set(usuarios[0]);
    localStorage.setItem('devtracker-usuarios', JSON.stringify(usuarios));
    localStorage.setItem('devtracker-chat', JSON.stringify([]));
    localStorage.setItem('devtracker-proyectos', JSON.stringify(proyectos));
    localStorage.setItem('devtracker-equipo-proyecto', JSON.stringify({p1: ['u1', 'u2', 'u3'], p2: ['u2']}));
    TestBed.configureTestingModule({
      imports: [ChatWidgetComponent],
      providers: [{provide: AuthService, useValue: {currentUser: () => usuarioActual()}}],
    });
    fixture = TestBed.createComponent(ChatWidgetComponent);
    component = fixture.componentInstance;
    chatService = TestBed.inject(ChatService);
    fixture.detectChanges();
  });

  it('muestra el FAB cuando el panel está cerrado', () => {
    expect(chatService.abierto()).toBeFalse();
    expect(fixture.nativeElement.querySelector('.chat-fab')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.chat-panel')).toBeNull();
  });

  it('abre el panel al pulsar el FAB', () => {
    fixture.nativeElement.querySelector('.chat-fab').click();
    fixture.detectChanges();
    expect(chatService.abierto()).toBeTrue();
    expect(fixture.nativeElement.querySelector('.chat-panel')).not.toBeNull();
  });

  it('lista el canal General y los contactos, excluyendo al usuario actual', () => {
    chatService.abrir();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('General');
    expect(text).toContain('Beto Ruiz');
    expect(text).toContain('Carlos Gil');
    expect(text).not.toContain('Ana López');
  });

  it('muestra el rol del contacto', () => {
    chatService.abrir();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('QA');
    expect(fixture.nativeElement.textContent).toContain('Supervisor');
  });

  it('enviar en General agrega el mensaje y lo muestra', () => {
    chatService.abrir();
    fixture.detectChanges();
    (component as unknown as {conversacion: {set: (v: unknown) => void}}).conversacion.set({canal: 'general'});
    fixture.detectChanges();
    (component as unknown as {texto: {set: (v: string) => void}}).texto.set('hola a todos');
    fixture.detectChanges();
    (component as unknown as {enviar: () => void}).enviar();
    fixture.detectChanges();
    expect(chatService.mensajes()).toHaveSize(1);
    expect(chatService.mensajes()[0].texto).toBe('hola a todos');
    expect(fixture.nativeElement.textContent).toContain('hola a todos');
  });

  it('envía un mensaje privado al contacto seleccionado', () => {
    chatService.abrir();
    fixture.detectChanges();
    (component as unknown as {seleccionarContacto: (u: Usuario) => void}).seleccionarContacto(usuarios[1]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Beto Ruiz');
    (component as unknown as {texto: {set: (v: string) => void}}).texto.set('privado');
    fixture.detectChanges();
    (component as unknown as {enviar: () => void}).enviar();
    fixture.detectChanges();
    const m = chatService.mensajes()[0];
    expect(m.canal).toBe('privado');
    expect(m.destinoId).toBe('u2');
    expect(m.autorId).toBe('u1');
  });

  it('no envía mensajes en blanco', () => {
    chatService.abrir();
    fixture.detectChanges();
    (component as unknown as {conversacion: {set: (v: unknown) => void}}).conversacion.set({canal: 'general'});
    fixture.detectChanges();
    (component as unknown as {texto: {set: (v: string) => void}}).texto.set('   ');
    fixture.detectChanges();
    (component as unknown as {enviar: () => void}).enviar();
    fixture.detectChanges();
    expect(chatService.mensajes()).toHaveSize(0);
  });

  it('muestra el badge de no leídos en el FAB', () => {
    chatService.enviarGeneral('u2', 'mensaje para Ana');
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.chat-fab-badge');
    expect(badge).not.toBeNull();
    expect(badge.textContent.trim()).toBe('1');
  });

  it('marca como leídos los mensajes del canal al abrirlo', () => {
    chatService.enviarGeneral('u2', 'leer esto');
    chatService.abrir();
    fixture.detectChanges();
    (component as unknown as {conversacion: {set: (v: unknown) => void}}).conversacion.set({canal: 'general'});
    fixture.detectChanges();
    expect(chatService.mensajes()[0].leido).toBeTrue();
  });

  it('marca como leídos los privados de la conversación abierta', () => {
    chatService.enviarPrivado('u2', 'u1', 'privado para Ana');
    chatService.abrir();
    fixture.detectChanges();
    (component as unknown as {seleccionarContacto: (u: Usuario) => void}).seleccionarContacto(usuarios[1]);
    fixture.detectChanges();
    expect(chatService.mensajes()[0].leido).toBeTrue();
  });

  it('lista solo los grupos de proyectos donde el usuario activo es miembro', () => {
    chatService.abrir();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Grupos');
    expect(text).toContain('App Móvil');
    expect(text).not.toContain('Portal Web');
  });

  it('abre un grupo y muestra el nombre del proyecto como título', () => {
    chatService.abrir();
    fixture.detectChanges();
    (component as unknown as {seleccionarGrupo: (proyectoId: string) => void}).seleccionarGrupo('p1');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('App Móvil');
  });

  it('envía un mensaje al grupo seleccionado', () => {
    chatService.abrir();
    fixture.detectChanges();
    (component as unknown as {seleccionarGrupo: (proyectoId: string) => void}).seleccionarGrupo('p1');
    fixture.detectChanges();
    (component as unknown as {texto: {set: (v: string) => void}}).texto.set('mensaje del equipo');
    fixture.detectChanges();
    (component as unknown as {enviar: () => void}).enviar();
    fixture.detectChanges();
    const m = chatService.mensajes()[0];
    expect(m.canal).toBe('grupo');
    expect(m.proyectoId).toBe('p1');
    expect(m.autorId).toBe('u1');
    expect(fixture.nativeElement.textContent).toContain('mensaje del equipo');
  });

  it('marca como leídos los mensajes del grupo al abrirlo', () => {
    chatService.enviarGrupo('u2', 'p1', 'para el equipo');
    chatService.abrir();
    fixture.detectChanges();
    (component as unknown as {seleccionarGrupo: (proyectoId: string) => void}).seleccionarGrupo('p1');
    fixture.detectChanges();
    expect(chatService.mensajes()[0].leido).toBeTrue();
  });

  it('muestra el badge de no leídos del grupo', () => {
    chatService.enviarGrupo('u2', 'p1', 'nuevo mensaje');
    chatService.abrir();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Grupos');
    const gruposButton = (Array.from(fixture.nativeElement.querySelectorAll('.chat-list-item')) as HTMLElement[])
      .find((el) => el.textContent?.includes('App Móvil'));
    expect(gruposButton?.textContent).toContain('1');
  });

  it('el botón cerrar cierra el panel', () => {
    chatService.abrir();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button[aria-label="Cerrar chat"]').click();
    fixture.detectChanges();
    expect(chatService.abierto()).toBeFalse();
    expect(fixture.nativeElement.querySelector('.chat-panel')).toBeNull();
  });
});
