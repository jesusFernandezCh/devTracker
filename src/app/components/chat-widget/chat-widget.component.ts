import {Component, inject, signal, computed, effect, viewChild, ElementRef, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Avatar} from 'primeng/avatar';
import {ChatService} from '../../services/chat.service';
import {UsuarioService} from '../../services/usuario.service';
import {AuthService} from '../../services/auth.service';
import {RolService} from '../../services/rol.service';
import {EquipoService} from '../../services/equipo.service';
import {ProyectoService} from '../../services/proyecto.service';
import {CanalChat} from '../../models/mensaje.model';
import {Usuario} from '../../models/usuario.model';
import {iniciales, tipoColor} from '../../utils/helpers';

type Conversacion = {canal: CanalChat; destinoId?: string; proyectoId?: string} | null;

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, Avatar],
  template: `
    @if (!chatService.abierto()) {
      <button (click)="chatService.abrir()" class="chat-fab" aria-label="Abrir chat">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
        </svg>
        @if (totalNoLeidos() > 0) {
          <span class="chat-fab-badge">{{ totalNoLeidos() }}</span>
        }
      </button>
    }

    @if (chatService.abierto()) {
      <div class="chat-panel" role="dialog" aria-label="Chat">
        <div class="chat-header">
          <div class="flex items-center gap-2 min-w-0">
            @if (conversacion()) {
              <button (click)="conversacion.set(null)"
                      class="chat-icon-btn"
                      aria-label="Volver a contactos">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
            }
            <div class="min-w-0">
              <p class="chat-header-title truncate">{{ conversacion() ? tituloConversacion() : 'Chat' }}</p>
              @if (!conversacion()) {
                <p class="chat-header-sub">{{ totalNoLeidos() }} no leído{{ totalNoLeidos() !== 1 ? 's' : '' }}</p>
              }
            </div>
          </div>
          <button (click)="chatService.cerrar()" class="chat-icon-btn" aria-label="Cerrar chat">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="chat-body">
          @if (!conversacion()) {
            <button (click)="seleccionarGeneral()" class="chat-list-item">
              <p-avatar icon="pi pi-comments" shape="circle"
                        [style]="{'width': '2rem', 'height': '2rem', 'font-size': '0.75rem', 'background-color': 'var(--color-indigo-100)', 'color': 'var(--color-indigo-700)'}" />
              <span class="flex-1 min-w-0 text-left">
                <span class="chat-list-name">General</span>
                <span class="chat-list-sub">Canal para todos los usuarios</span>
              </span>
              @if (noLeidosGeneral() > 0) {
                <span class="chat-badge">{{ noLeidosGeneral() }}</span>
              }
            </button>

            @if (grupos().length > 0) {
              <div class="chat-list-section">Grupos</div>

              @for (g of grupos(); track g.proyecto.id) {
                <button (click)="seleccionarGrupo(g.proyecto.id)" class="chat-list-item">
                  <p-avatar icon="pi pi-users" shape="circle"
                            [style]="{'width': '2rem', 'height': '2rem', 'font-size': '0.75rem', 'background-color': 'var(--color-indigo-100)', 'color': 'var(--color-indigo-700)'}" />
                  <span class="flex-1 min-w-0 text-left">
                    <span class="chat-list-name truncate">{{ g.proyecto.nombre }}</span>
                    <span class="chat-list-sub truncate">{{ g.miembros }} miembro{{ g.miembros !== 1 ? 's' : '' }}</span>
                  </span>
                  @if (g.noLeidos > 0) {
                    <span class="chat-badge">{{ g.noLeidos }}</span>
                  }
                </button>
              }
            }

            <div class="chat-list-section">Contactos</div>

            @for (c of contactos(); track c.usuario.id) {
              <button (click)="seleccionarContacto(c.usuario)" class="chat-list-item">
                @if (c.usuario.foto) {
                  <p-avatar [image]="c.usuario.foto" shape="circle" [style]="{'width': '2rem', 'height': '2rem'}" />
                } @else {
                  <p-avatar [label]="iniciales(c.usuario.usuario)" shape="circle"
                            [style]="{'width': '2rem', 'height': '2rem', 'font-size': '0.6875rem', 'background-color': tipoColor(c.usuario.tipo).bg, 'color': tipoColor(c.usuario.tipo).text}" />
                }
                <span class="flex-1 min-w-0 text-left">
                  <span class="chat-list-name truncate">{{ c.usuario.usuario }}</span>
                  <span class="chat-list-sub truncate">{{ rolService.nombreDe(c.usuario.tipo) }}</span>
                </span>
                @if (c.noLeidos > 0) {
                  <span class="chat-badge">{{ c.noLeidos }}</span>
                }
              </button>
            } @empty {
              <p class="chat-empty">No hay otros usuarios registrados.</p>
            }
          } @else {
            <div #scroll class="chat-scroll">
              @for (m of mensajesActuales(); track m.id) {
                <div class="chat-row" [class.chat-row-mio]="esMio(m.autorId)">
                  @if (!esMio(m.autorId)) {
                    @if (fotoDe(m.autorId)) {
                      <p-avatar [image]="fotoDe(m.autorId)" shape="circle" [style]="{'width': '1.5rem', 'height': '1.5rem'}" />
                    } @else {
                      <p-avatar [label]="iniciales(nombreDe(m.autorId))" shape="circle"
                                [style]="{'width': '1.5rem', 'height': '1.5rem', 'font-size': '0.5625rem', 'background-color': tipoColor(tipoDe(m.autorId)).bg, 'color': tipoColor(tipoDe(m.autorId)).text}" />
                    }
                  }
                  <div class="chat-bubble" [class.chat-bubble-mio]="esMio(m.autorId)" [class.chat-bubble-otro]="!esMio(m.autorId)">
                    @if (!esMio(m.autorId)) {
                      <p class="chat-bubble-autor">{{ nombreDe(m.autorId) }}</p>
                    }
                    <p class="chat-bubble-texto">{{ m.texto }}</p>
                    <span class="chat-bubble-hora">{{ formatoHora(m.fecha) }}</span>
                  </div>
                </div>
              } @empty {
                <p class="chat-empty">Sin mensajes. Escribe el primero.</p>
              }
            </div>

            <div class="chat-input">
              <input #input [value]="texto()" (input)="texto.set($any($event.target).value)" (keydown.enter)="enviar()"
                     type="text" autocomplete="off" placeholder="Escribe un mensaje…">
              <button (click)="enviar()" [disabled]="!texto().trim()" class="chat-send" aria-label="Enviar mensaje">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg>
              </button>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .chat-fab {
      position: fixed;
      bottom: 1.25rem;
      right: 1.25rem;
      z-index: 1000;
      width: 3.25rem;
      height: 3.25rem;
      border-radius: 9999px;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      background-color: var(--color-indigo-600);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
      cursor: pointer;
      transition: background-color 0.15s, transform 0.15s;
    }
    .chat-fab:hover {
      background-color: var(--color-indigo-700);
      transform: scale(1.05);
    }
    .chat-fab-badge {
      position: absolute;
      top: -0.25rem;
      right: -0.25rem;
      min-width: 1.25rem;
      height: 1.25rem;
      padding: 0 0.3rem;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.6875rem;
      font-weight: 700;
      color: #ffffff;
      background-color: var(--color-rose-500);
      border: 2px solid var(--color-surface);
    }

    .chat-panel {
      position: fixed;
      bottom: 1.25rem;
      right: 1.25rem;
      z-index: 1000;
      width: min(24rem, calc(100vw - 2rem));
      height: min(34rem, calc(100dvh - 2.5rem));
      display: flex;
      flex-direction: column;
      border-radius: 1rem;
      overflow: hidden;
      background-color: var(--color-surface);
      border: 1px solid var(--color-gray-200);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
    }
    .chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--color-gray-200);
    }
    .chat-header-title {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--color-gray-900);
    }
    .chat-header-sub {
      font-size: 0.75rem;
      color: var(--color-gray-400);
    }
    .chat-icon-btn {
      width: 2rem;
      height: 2rem;
      border-radius: 0.5rem;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--color-gray-400);
      background: transparent;
      transition: background-color 0.15s, color 0.15s;
    }
    .chat-icon-btn:hover {
      color: var(--color-gray-700);
      background-color: var(--color-gray-100);
    }

    .chat-body {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .chat-list-section {
      padding: 0.75rem 1rem 0.25rem;
      font-size: 0.625rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-gray-400);
    }
    .chat-list-item {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 1rem;
      border: none;
      background: transparent;
      cursor: pointer;
      transition: background-color 0.15s;
    }
    .chat-list-item:hover {
      background-color: var(--color-gray-50);
    }
    .chat-list-name {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-gray-900);
    }
    .chat-list-sub {
      display: block;
      font-size: 0.75rem;
      color: var(--color-gray-500);
    }
    .chat-badge {
      min-width: 1.25rem;
      height: 1.25rem;
      padding: 0 0.3rem;
      border-radius: 9999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.6875rem;
      font-weight: 700;
      color: #ffffff;
      background-color: var(--color-indigo-600);
    }
    .chat-avatar {
      width: 2rem;
      height: 2rem;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.6875rem;
      font-weight: 700;
      flex-shrink: 0;
    }
    .chat-avatar-sm {
      width: 1.5rem;
      height: 1.5rem;
      font-size: 0.5625rem;
    }
    .chat-avatar-img {
      object-fit: cover;
      display: block;
    }

    .chat-scroll {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .chat-row {
      display: flex;
      align-items: flex-end;
      gap: 0.5rem;
    }
    .chat-row-mio {
      justify-content: flex-end;
    }
    .chat-bubble {
      max-width: 75%;
      padding: 0.5rem 0.75rem;
      border-radius: 0.875rem;
      display: flex;
      flex-direction: column;
    }
    .chat-bubble-mio {
      background-color: var(--color-indigo-600);
      color: #ffffff;
      border-bottom-right-radius: 0.25rem;
    }
    .chat-bubble-otro {
      background-color: var(--color-gray-100);
      color: var(--color-gray-900);
      border-bottom-left-radius: 0.25rem;
    }
    .chat-bubble-autor {
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--color-indigo-500);
      margin-bottom: 0.125rem;
    }
    .chat-bubble-texto {
      font-size: 0.8125rem;
      line-height: 1.35;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .chat-bubble-hora {
      margin-top: 0.25rem;
      font-size: 0.625rem;
      opacity: 0.7;
      align-self: flex-end;
    }
    .chat-empty {
      padding: 1.5rem 1rem;
      text-align: center;
      font-size: 0.8125rem;
      color: var(--color-gray-400);
    }

    .chat-input {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-top: 1px solid var(--color-gray-200);
    }
    .chat-input input {
      flex: 1;
      min-width: 0;
      padding: 0.5rem 0.75rem;
      font-size: 0.8125rem;
      border-radius: 0.625rem;
      outline: none;
      border: 1px solid var(--color-gray-300);
      background-color: var(--color-surface);
      color: var(--color-gray-900);
    }
    .chat-input input:focus {
      border-color: var(--color-indigo-500);
    }
    .chat-send {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 0.625rem;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #ffffff;
      background-color: var(--color-indigo-600);
      transition: background-color 0.15s;
    }
    .chat-send:hover:not(:disabled) {
      background-color: var(--color-indigo-700);
    }
    .chat-send:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    @media (max-width: 767px) {
      .chat-fab {
        bottom: calc(5.5rem + env(safe-area-inset-bottom));
      }
      .chat-panel {
        bottom: calc(5.5rem + env(safe-area-inset-bottom));
        height: min(34rem, calc(100dvh - 7.5rem));
      }
    }
  `],
})
export class ChatWidgetComponent {
  protected readonly chatService = inject(ChatService);
  protected readonly usuarioService = inject(UsuarioService);
  protected readonly authService = inject(AuthService);
  protected readonly rolService = inject(RolService);
  protected readonly equipoService = inject(EquipoService);
  protected readonly proyectoService = inject(ProyectoService);
  protected readonly iniciales = iniciales;
  protected readonly tipoColor = tipoColor;

  protected readonly conversacion = signal<Conversacion>(null);
  protected readonly texto = signal('');
  protected readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('input');

  protected readonly yo = computed(() => this.authService.currentUser());

  protected readonly contactos = computed(() => {
    const yoId = this.yo()?.id;
    return this.usuarioService.usuarios()
      .filter((u) => u.id !== yoId)
      .map((u) => ({
        usuario: u,
        noLeidos: yoId ? this.chatService.noLeidosEn(yoId, 'privado', u.id) : 0,
      }))
      .sort((a, b) => b.noLeidos - a.noLeidos || a.usuario.usuario.localeCompare(b.usuario.usuario));
  });

  protected readonly grupos = computed(() => {
    const yoId = this.yo()?.id;
    if (!yoId) return [];
    return this.equipoService.proyectosDe(yoId)
      .map((proyectoId) => ({
        proyecto: this.proyectoService.proyectoPorId(proyectoId)!,
        miembros: this.equipoService.miembrosDe(proyectoId).length,
        noLeidos: this.chatService.noLeidosEn(yoId, 'grupo', undefined, proyectoId),
      }))
      .filter((g) => g.proyecto !== undefined)
      .sort((a, b) => b.noLeidos - a.noLeidos || a.proyecto.nombre.localeCompare(b.proyecto.nombre));
  });

  protected readonly totalNoLeidos = computed(() => {
    const yoId = this.yo()?.id;
    return yoId ? this.chatService.noLeidosTotal(yoId) : 0;
  });

  protected readonly noLeidosGeneral = computed(() => {
    const yoId = this.yo()?.id;
    return yoId ? this.chatService.noLeidosEn(yoId, 'general') : 0;
  });

  protected readonly mensajesActuales = computed(() => {
    const yoId = this.yo()?.id;
    const conv = this.conversacion();
    if (!yoId || !conv) return [];
    if (conv.canal === 'general') return this.chatService.mensajesGeneral(yoId);
    if (conv.canal === 'grupo') return conv.proyectoId ? this.chatService.mensajesGrupo(yoId, conv.proyectoId) : [];
    return conv.destinoId ? this.chatService.mensajesPrivados(yoId, conv.destinoId) : [];
  });

  protected readonly tituloConversacion = computed(() => {
    const conv = this.conversacion();
    if (!conv) return '';
    if (conv.canal === 'general') return 'General';
    if (conv.canal === 'grupo') return this.proyectoService.proyectoPorId(conv.proyectoId!)?.nombre ?? 'Chat';
    return this.usuarioService.usuarioPorId(conv.destinoId!)?.usuario ?? 'Chat';
  });

  private readonly scrollEl = viewChild<ElementRef<HTMLElement>>('scroll');

  constructor() {
    effect(() => {
      const conv = this.conversacion();
      const yoId = this.yo()?.id;
      if (!conv || !yoId) return;
      if (conv.canal === 'general') {
        this.chatService.marcarLeidosGeneral(yoId);
      } else if (conv.canal === 'grupo' && conv.proyectoId) {
        this.chatService.marcarLeidosGrupo(yoId, conv.proyectoId);
      } else if (conv.destinoId) {
        this.chatService.marcarLeidosPrivados(yoId, conv.destinoId);
      }
    });

    effect(() => {
      this.mensajesActuales();
      const el = this.scrollEl();
      if (el) el.nativeElement.scrollTop = el.nativeElement.scrollHeight;
    });
  }

  protected seleccionarGeneral(): void {
    this.conversacion.set({canal: 'general'});
  }

  protected seleccionarContacto(usuario: Usuario): void {
    this.conversacion.set({canal: 'privado', destinoId: usuario.id});
  }

  protected seleccionarGrupo(proyectoId: string): void {
    this.conversacion.set({canal: 'grupo', proyectoId});
  }

  protected esMio(autorId: string): boolean {
    return this.yo()?.id === autorId;
  }

  protected nombreDe(usuarioId: string): string {
    return this.usuarioService.usuarioPorId(usuarioId)?.usuario ?? 'Usuario';
  }

  protected fotoDe(usuarioId: string): string | undefined {
    return this.usuarioService.usuarioPorId(usuarioId)?.foto;
  }

  protected tipoDe(usuarioId: string): string {
    return this.usuarioService.usuarioPorId(usuarioId)?.tipo ?? 'usuario';
  }

  protected formatoHora(fecha: string): string {
    return new Date(fecha).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
  }

  protected enviar(): void {
    const yoId = this.yo()?.id;
    const conv = this.conversacion();
    const texto = this.texto();
    if (!yoId || !texto.trim() || !conv) return;
    if (conv.canal === 'general') {
      this.chatService.enviarGeneral(yoId, texto);
    } else if (conv.canal === 'grupo' && conv.proyectoId) {
      this.chatService.enviarGrupo(yoId, conv.proyectoId, texto);
    } else if (conv.destinoId) {
      this.chatService.enviarPrivado(yoId, conv.destinoId, texto);
    }
    this.texto.set('');
    this.inputEl()?.nativeElement.focus();
  }
}
