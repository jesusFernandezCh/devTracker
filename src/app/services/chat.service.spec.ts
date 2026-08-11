import {TestBed} from '@angular/core/testing';
import {ChatService} from './chat.service';
import {Mensaje} from '../models/mensaje.model';

describe('ChatService', () => {
  let service: ChatService;

  const mensaje = (overrides: Partial<Mensaje>): Mensaje => ({
    id: crypto.randomUUID(),
    canal: 'general',
    autorId: 'u1',
    texto: 'hola',
    fecha: new Date().toISOString(),
    leido: false,
    ...overrides,
  });

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({providers: [ChatService]});
    service = TestBed.inject(ChatService);
  });

  it('arranca sin mensajes y con el panel cerrado', () => {
    expect(service.mensajes()).toEqual([]);
    expect(service.abierto()).toBeFalse();
  });

  it('enviarGeneral agrega un mensaje del canal general', () => {
    service.enviarGeneral('u1', 'hola a todos');
    expect(service.mensajes()).toHaveSize(1);
    const m = service.mensajes()[0];
    expect(m.canal).toBe('general');
    expect(m.autorId).toBe('u1');
    expect(m.texto).toBe('hola a todos');
    expect(m.leido).toBeFalse();
  });

  it('enviarGeneral ignora textos vacíos o en blanco', () => {
    service.enviarGeneral('u1', '');
    service.enviarGeneral('u1', '   ');
    expect(service.mensajes()).toHaveSize(0);
  });

  it('enviarPrivado agrega un mensaje con destino', () => {
    service.enviarPrivado('u1', 'u2', 'hola u2');
    const m = service.mensajes()[0];
    expect(m.canal).toBe('privado');
    expect(m.destinoId).toBe('u2');
  });

  it('mensajesGeneral devuelve solo los del canal general ordenados', () => {
    const a = mensaje({id: 'a', canal: 'general', fecha: '2026-01-01T00:00:00.000Z'});
    const b = mensaje({id: 'b', canal: 'privado', destinoId: 'u2', fecha: '2026-01-02T00:00:00.000Z'});
    const c = mensaje({id: 'c', canal: 'general', fecha: '2026-01-03T00:00:00.000Z'});
    localStorage.setItem('devtracker-chat', JSON.stringify([b, c, a]));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({providers: [ChatService]});
    service = TestBed.inject(ChatService);
    expect(service.mensajesGeneral('u1').map(m => m.id)).toEqual(['a', 'c']);
  });

  it('mensajesPrivados filtra la pareja en ambos sentidos', () => {
    localStorage.setItem('devtracker-chat', JSON.stringify([
      mensaje({id: 'a', canal: 'privado', autorId: 'u1', destinoId: 'u2'}),
      mensaje({id: 'b', canal: 'privado', autorId: 'u2', destinoId: 'u1'}),
      mensaje({id: 'c', canal: 'privado', autorId: 'u1', destinoId: 'u3'}),
      mensaje({id: 'd', canal: 'general'}),
    ]));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({providers: [ChatService]});
    service = TestBed.inject(ChatService);
    expect(service.mensajesPrivados('u1', 'u2').map(m => m.id)).toEqual(['a', 'b']);
  });

  it('noLeidosTotal cuenta mensajes ajenos no leídos', () => {
    localStorage.setItem('devtracker-chat', JSON.stringify([
      mensaje({id: 'a', autorId: 'u1'}),
      mensaje({id: 'b', autorId: 'u2', leido: false}),
      mensaje({id: 'c', autorId: 'u3', leido: false}),
      mensaje({id: 'd', autorId: 'u4', leido: true}),
    ]));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({providers: [ChatService]});
    service = TestBed.inject(ChatService);
    expect(service.noLeidosTotal('u1')).toBe(2);
  });

  it('noLeidosEn filtra por canal y destino', () => {
    localStorage.setItem('devtracker-chat', JSON.stringify([
      mensaje({id: 'a', canal: 'general', autorId: 'u2'}),
      mensaje({id: 'b', canal: 'general', autorId: 'u1'}),
      mensaje({id: 'c', canal: 'privado', autorId: 'u2', destinoId: 'u1'}),
      mensaje({id: 'd', canal: 'privado', autorId: 'u3', destinoId: 'u1'}),
      mensaje({id: 'e', canal: 'privado', autorId: 'u1', destinoId: 'u2'}),
    ]));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({providers: [ChatService]});
    service = TestBed.inject(ChatService);
    expect(service.noLeidosEn('u1', 'general')).toBe(1);
    expect(service.noLeidosEn('u1', 'privado', 'u2')).toBe(1);
    expect(service.noLeidosEn('u1', 'privado', 'u3')).toBe(1);
  });

  it('marcarLeidosGeneral marca los del canal general', () => {
    localStorage.setItem('devtracker-chat', JSON.stringify([
      mensaje({id: 'a', canal: 'general', autorId: 'u2'}),
      mensaje({id: 'b', canal: 'privado', autorId: 'u2', destinoId: 'u1'}),
    ]));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({providers: [ChatService]});
    service = TestBed.inject(ChatService);
    service.marcarLeidosGeneral('u1');
    const [a, b] = service.mensajes();
    expect(a.leido).toBeTrue();
    expect(b.leido).toBeFalse();
  });

  it('marcarLeidosPrivados marca solo la pareja', () => {
    localStorage.setItem('devtracker-chat', JSON.stringify([
      mensaje({id: 'a', canal: 'privado', autorId: 'u2', destinoId: 'u1'}),
      mensaje({id: 'b', canal: 'privado', autorId: 'u3', destinoId: 'u1'}),
    ]));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({providers: [ChatService]});
    service = TestBed.inject(ChatService);
    service.marcarLeidosPrivados('u1', 'u2');
    const [a, b] = service.mensajes();
    expect(a.leido).toBeTrue();
    expect(b.leido).toBeFalse();
  });

  it('enviarGrupo agrega un mensaje con proyectoId', () => {
    service.enviarGrupo('u1', 'p1', 'hola equipo');
    const m = service.mensajes()[0];
    expect(m.canal).toBe('grupo');
    expect(m.proyectoId).toBe('p1');
    expect(m.autorId).toBe('u1');
  });

  it('enviarGrupo ignora textos vacíos o en blanco', () => {
    service.enviarGrupo('u1', 'p1', '   ');
    expect(service.mensajes()).toHaveSize(0);
  });

  it('mensajesGrupo filtra por proyecto y ordena por fecha', () => {
    localStorage.setItem('devtracker-chat', JSON.stringify([
      mensaje({id: 'a', canal: 'grupo', proyectoId: 'p1', fecha: '2026-01-02T00:00:00.000Z'}),
      mensaje({id: 'b', canal: 'grupo', proyectoId: 'p2', fecha: '2026-01-03T00:00:00.000Z'}),
      mensaje({id: 'c', canal: 'grupo', proyectoId: 'p1', fecha: '2026-01-01T00:00:00.000Z'}),
      mensaje({id: 'd', canal: 'general'}),
    ]));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({providers: [ChatService]});
    service = TestBed.inject(ChatService);
    expect(service.mensajesGrupo('u1', 'p1').map(m => m.id)).toEqual(['c', 'a']);
  });

  it('noLeidosEn con canal grupo filtra por proyecto', () => {
    localStorage.setItem('devtracker-chat', JSON.stringify([
      mensaje({id: 'a', canal: 'grupo', autorId: 'u2', proyectoId: 'p1'}),
      mensaje({id: 'b', canal: 'grupo', autorId: 'u2', proyectoId: 'p2'}),
      mensaje({id: 'c', canal: 'grupo', autorId: 'u1', proyectoId: 'p1'}),
    ]));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({providers: [ChatService]});
    service = TestBed.inject(ChatService);
    expect(service.noLeidosEn('u1', 'grupo', undefined, 'p1')).toBe(1);
    expect(service.noLeidosEn('u1', 'grupo', undefined, 'p2')).toBe(1);
  });

  it('marcarLeidosGrupo marca solo los del proyecto', () => {
    localStorage.setItem('devtracker-chat', JSON.stringify([
      mensaje({id: 'a', canal: 'grupo', autorId: 'u2', proyectoId: 'p1'}),
      mensaje({id: 'b', canal: 'grupo', autorId: 'u2', proyectoId: 'p2'}),
      mensaje({id: 'c', canal: 'grupo', autorId: 'u1', proyectoId: 'p1'}),
    ]));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({providers: [ChatService]});
    service = TestBed.inject(ChatService);
    service.marcarLeidosGrupo('u1', 'p1');
    const [a, b, c] = service.mensajes();
    expect(a.leido).toBeTrue();
    expect(b.leido).toBeFalse();
    expect(c.leido).toBeFalse();
  });

  it('toggle/abrir/cerrar controlan el panel', () => {
    expect(service.abierto()).toBeFalse();
    service.toggle();
    expect(service.abierto()).toBeTrue();
    service.cerrar();
    expect(service.abierto()).toBeFalse();
    service.abrir();
    expect(service.abierto()).toBeTrue();
  });

  it('persiste los mensajes en localStorage', () => {
    service.enviarGeneral('u1', 'hola');
    const guardado = JSON.parse(localStorage.getItem('devtracker-chat')!) as Mensaje[];
    expect(guardado).toHaveSize(1);
    expect(guardado[0].texto).toBe('hola');
  });

  it('recupera mensajes guardados al recargar', () => {
    service.enviarGeneral('u1', 'hola');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({providers: [ChatService]});
    const reloaded = TestBed.inject(ChatService);
    expect(reloaded.mensajes()).toHaveSize(1);
    expect(reloaded.mensajes()[0].texto).toBe('hola');
  });
});
