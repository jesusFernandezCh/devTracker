import {Component, inject, signal, computed, ChangeDetectionStrategy, HostListener, viewChild, ElementRef} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {toSignal} from '@angular/core/rxjs-interop';
import {BreakpointObserver} from '@angular/cdk/layout';
import {map} from 'rxjs';
import {NotificacionService} from '../../services/notificacion.service';
import {Notificacion, TipoNotificacion} from '../../models/notificacion.model';

interface TipoEstilo {
  text: string;
  bg: string;
  icon: string;
}

const ESTILOS: Record<TipoNotificacion, TipoEstilo> = {
  info: {text: 'var(--color-indigo-600)', bg: 'var(--color-indigo-100)', icon: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z'},
  exito: {text: 'var(--color-emerald-600)', bg: 'var(--color-emerald-100)', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'},
  alerta: {text: 'var(--color-amber-600)', bg: 'var(--color-amber-100)', icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z'},
  error: {text: 'var(--color-rose-600)', bg: 'var(--color-rose-100)', icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z'},
};

const ETIQUETAS: Record<TipoNotificacion, string> = {
  info: 'Información',
  exito: 'Éxito',
  alerta: 'Alerta',
  error: 'Error',
};

@Component({
  selector: 'app-notificaciones-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="relative" #panel>
      <button (click)="toggle()"
              class="p-2 rounded-lg transition-colors"
              [style.color]="'var(--color-gray-500)'"
              [attr.aria-label]="'Notificaciones'"
              [attr.aria-haspopup]="'dialog'"
              [attr.aria-expanded]="abierto()">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
        </svg>
        @if (noLeidas() > 0) {
          <span class="notif-badge">{{ noLeidas() > 99 ? '99+' : noLeidas() }}</span>
        }
      </button>

      @if (abierto()) {
        @if (esMovil()) {
          <div class="notif-backdrop" (click)="toggle()">
            <div class="notif-panel notif-panel-modal" role="dialog" aria-label="Notificaciones" (click)="$event.stopPropagation()">
              <ng-container *ngTemplateOutlet="panelContenido" />
            </div>
          </div>
        } @else {
          <div class="notif-panel" role="dialog" aria-label="Notificaciones">
            <ng-container *ngTemplateOutlet="panelContenido" />
          </div>
        }
      }

      <ng-template #panelContenido>
        <div class="notif-header">
          <div class="flex items-center gap-1 min-w-0">
            <button (click)="toggle()" class="notif-close" [attr.aria-label]="'Cerrar notificaciones'">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
            <div class="min-w-0">
              <p class="notif-title">Notificaciones</p>
              @if (noLeidas() > 0) {
                <p class="notif-sub">{{ noLeidas() }} no leída{{ noLeidas() !== 1 ? 's' : '' }}</p>
              }
            </div>
          </div>
          @if (lista().length > 0) {
            <button (click)="marcarTodasLeidas()"
                    class="notif-action"
                    [attr.aria-label]="'Marcar todas como leídas'">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Marcar todas
            </button>
          }
        </div>

        <div class="notif-body custom-scrollbar">
          @for (n of lista(); track n.id) {
            <button (click)="abrirNotificacion(n)"
                    class="notif-item"
                    [class.notif-item-no-leida]="!n.leida">
              <span class="notif-icon shrink-0" [style.color]="estilo(n.tipo).text" [style.background-color]="estilo(n.tipo).bg">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="estilo(n.tipo).icon"/>
                </svg>
              </span>
              <span class="flex-1 min-w-0 text-left">
                <span class="notif-desc">{{ n.descripcion }}</span>
                <span class="notif-time">{{ tiempoRelativo(n.fecha) }}</span>
              </span>
              @if (!n.leida) {
                <span class="notif-dot"></span>
              }
            </button>
          } @empty {
            <p class="notif-empty">Sin notificaciones</p>
          }
        </div>

        @if (lista().length > 0) {
          <div class="notif-footer">
            <button (click)="limpiar()" class="notif-action w-full justify-center">Limpiar todas</button>
          </div>
        }
      </ng-template>
    </div>
  `,
  styles: [`
    .notif-badge {
      position: absolute;
      top: 0.125rem;
      right: 0.125rem;
      min-width: 1rem;
      height: 1rem;
      padding: 0 0.25rem;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.625rem;
      font-weight: 700;
      color: #ffffff;
      background-color: var(--color-rose-500);
      border: 2px solid var(--color-surface);
    }

    .notif-panel {
      position: absolute;
      top: calc(100% + 0.5rem);
      right: 0;
      width: min(22rem, calc(100vw - 2rem));
      border-radius: 0.75rem;
      border: 1px solid var(--color-gray-200);
      background-color: var(--color-surface);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
      z-index: 50;
      overflow: hidden;
    }

    .notif-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--color-gray-200);
    }
    .notif-title {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--color-gray-900);
    }
    .notif-sub {
      font-size: 0.75rem;
      color: var(--color-gray-400);
    }
    .notif-action {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.625rem;
      border-radius: 0.5rem;
      border: none;
      cursor: pointer;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--color-indigo-600);
      background: transparent;
      transition: background-color 0.15s, color 0.15s;
    }
    .notif-action:hover {
      color: var(--color-indigo-700);
      background-color: var(--color-indigo-50);
    }

    .notif-body {
      max-height: 20rem;
      overflow-y: auto;
    }
    .notif-item {
      width: 100%;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border: none;
      background: transparent;
      cursor: pointer;
      text-align: left;
      transition: background-color 0.15s;
    }
    .notif-item:hover {
      background-color: var(--color-gray-50);
    }
    .notif-item-no-leida {
      background-color: var(--color-indigo-50);
    }
    .notif-item-no-leida:hover {
      background-color: var(--color-indigo-100);
    }

    .notif-icon {
      width: 2rem;
      height: 2rem;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .notif-desc {
      display: block;
      font-size: 0.8125rem;
      line-height: 1.35;
      color: var(--color-gray-900);
      word-break: break-word;
    }
    .notif-time {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.6875rem;
      color: var(--color-gray-400);
    }
    .notif-dot {
      width: 0.5rem;
      height: 0.5rem;
      margin-top: 0.375rem;
      border-radius: 9999px;
      flex-shrink: 0;
      background-color: var(--color-rose-500);
    }
    .notif-empty {
      padding: 1.5rem 1rem;
      text-align: center;
      font-size: 0.8125rem;
      color: var(--color-gray-400);
    }
    .notif-footer {
      padding: 0.5rem 0.75rem;
      border-top: 1px solid var(--color-gray-200);
      display: flex;
    }

    .notif-backdrop {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background-color: rgba(0, 0, 0, 0.5);
    }
    .notif-panel-modal {
      position: relative;
      top: auto;
      right: auto;
      width: min(26rem, calc(100vw - 3rem));
      max-height: min(70dvh, 40rem);
      display: flex;
      flex-direction: column;
      animation: modal-in 0.2s ease-out;
    }
    .notif-panel-modal .notif-body {
      max-height: none;
      flex: 1;
      min-height: 0;
    }
    .notif-close {
      width: 2rem;
      height: 2rem;
      border: none;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--color-gray-400);
      background: transparent;
      transition: background-color 0.15s, color 0.15s;
    }
    .notif-close:hover {
      color: var(--color-gray-700);
      background-color: var(--color-gray-100);
    }
    @media (min-width: 768px) {
      .notif-close {
        display: none;
      }
    }
  `]
})
export class NotificacionesPanelComponent {
  protected readonly notificacionService = inject(NotificacionService);
  private readonly router = inject(Router);

  protected readonly abierto = signal(false);
  protected readonly panelEl = viewChild<ElementRef<HTMLElement>>('panel');

  protected readonly lista = this.notificacionService.notificaciones;
  protected readonly noLeidas = computed(() => this.notificacionService.noLeidas());
  protected readonly esMovil = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 767px)')
      .pipe(map((r) => r.matches)),
    {initialValue: false},
  );

  protected estilo(tipo: TipoNotificacion): TipoEstilo {
    return ESTILOS[tipo];
  }

  protected toggle(): void {
    this.abierto.update((v) => !v);
  }

  protected marcarTodasLeidas(): void {
    this.notificacionService.marcarTodasLeidas();
  }

  protected limpiar(): void {
    this.notificacionService.limpiar();
  }

  protected abrirNotificacion(n: Notificacion): void {
    this.notificacionService.eliminar(n.id);
    this.abierto.set(false);
    if (n.url) {
      this.router.navigateByUrl(n.url);
    }
  }

  protected tiempoRelativo(fecha: string): string {
    const diffMs = Date.now() - new Date(fecha).getTime();
    const minutos = Math.floor(diffMs / 60000);
    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `Hace ${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `Hace ${horas} h`;
    const dias = Math.floor(horas / 24);
    if (dias < 7) return `Hace ${dias} día${dias !== 1 ? 's' : ''}`;
    return new Date(fecha).toLocaleDateString([], {day: 'numeric', month: 'short', year: 'numeric'});
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const el = this.panelEl();
    if (el && !el.nativeElement.contains(event.target as Node)) {
      this.abierto.set(false);
    }
  }
}
