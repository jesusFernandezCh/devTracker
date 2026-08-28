import {Component, inject, input, output, computed} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {AuthService} from '../../services/auth.service';
import {ThemeService} from '../../services/theme.service';
import {PermisoService} from '../../services/permiso.service';
import {ChatService} from '../../services/chat.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <div class="flex flex-col h-full select-none" style="background-color: var(--color-surface);">
      <!-- Logo + close (close only in mobile overlay) -->
      <div class="flex items-center justify-between gap-2 px-4 h-16 border-b shrink-0" style="border-color: var(--color-gray-200);">
        <div class="flex items-center gap-2.5 min-w-0">
          <svg class="w-7 h-7 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6m-3 4v6m-3-3h6"/>
          </svg>
          <span class="text-lg font-bold truncate" style="color: var(--color-gray-900);">DevTracker</span>
        </div>
        @if (isMobile()) {
          <button (click)="onNavClick()" class="p-1 rounded-lg transition-colors" style="color: var(--color-gray-400);" aria-label="Cerrar menú">
            <mat-icon>close</mat-icon>
          </button>
        }
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-0.5">
        <a routerLink="/" routerLinkActive="sidebar-active" [routerLinkActiveOptions]="{exact: true}"
           (click)="onNavClick()"
           class="sidebar-nav-item">
          <mat-icon class="sidebar-nav-icon">bar_chart</mat-icon>
          <span>Dashboard</span>
        </a>
        <a routerLink="/tablero" routerLinkActive="sidebar-active"
           (click)="onNavClick()"
           class="sidebar-nav-item">
          <mat-icon class="sidebar-nav-icon">dashboard</mat-icon>
          <span>Tablero</span>
        </a>
        <a routerLink="/proyectos" routerLinkActive="sidebar-active"
           (click)="onNavClick()"
           class="sidebar-nav-item">
          <mat-icon class="sidebar-nav-icon">folder</mat-icon>
          <span>Proyectos</span>
        </a>
        <a routerLink="/planning" routerLinkActive="sidebar-active"
           (click)="onNavClick()"
           class="sidebar-nav-item">
          <mat-icon class="sidebar-nav-icon">calendar_month</mat-icon>
          <span>Planning</span>
        </a>
        <a routerLink="/calendario" routerLinkActive="sidebar-active"
           (click)="onNavClick()"
           class="sidebar-nav-item">
          <mat-icon class="sidebar-nav-icon">calendar_view_week</mat-icon>
          <span>Calendario</span>
        </a>
        <a routerLink="/reportes" routerLinkActive="sidebar-active"
           (click)="onNavClick()"
           class="sidebar-nav-item">
          <mat-icon class="sidebar-nav-icon">query_stats</mat-icon>
          <span>Reportes</span>
        </a>
        <a routerLink="/documentacion" routerLinkActive="sidebar-active"
           (click)="onNavClick()"
           class="sidebar-nav-item">
          <mat-icon class="sidebar-nav-icon">folder_open</mat-icon>
          <span>Documentación</span>
        </a>
        <button (click)="onChatClick()" class="sidebar-nav-item w-full">
          <mat-icon class="sidebar-nav-icon">forum</mat-icon>
          <span class="flex-1 text-left">Chat</span>
          @if (noLeidosChat() > 0) {
            <span class="sidebar-chat-badge">{{ noLeidosChat() }}</span>
          }
        </button>

        <div class="border-t my-2" style="border-color: var(--color-gray-200);"></div>

        <button (click)="mobileAdminOpen = !mobileAdminOpen"
                class="sidebar-nav-item w-full">
          <span class="flex items-center gap-3 min-w-0">
            <mat-icon class="sidebar-nav-icon shrink-0">admin_panel_settings</mat-icon>
            <span class="truncate">Administración</span>
          </span>
          <mat-icon class="text-base shrink-0 transition-transform" [class.rotate-90]="mobileAdminOpen">chevron_right</mat-icon>
        </button>
        @if (mobileAdminOpen) {
          <a routerLink="/usuarios" routerLinkActive="sidebar-active"
             (click)="onNavClick(); mobileAdminOpen = false"
             class="sidebar-nav-item pl-11">
            <mat-icon class="sidebar-nav-icon">group</mat-icon>
            <span>Usuarios</span>
          </a>
          @if (permisoService.puede('leer', 'roles', authService.currentUser()?.tipo)) {
            <a routerLink="/roles" routerLinkActive="sidebar-active"
               (click)="onNavClick(); mobileAdminOpen = false"
               class="sidebar-nav-item pl-11">
              <mat-icon class="sidebar-nav-icon">admin_panel_settings</mat-icon>
              <span>Roles</span>
            </a>
          }
        }
      </nav>

      <!-- Footer: user + theme -->
      <div class="border-t p-3 shrink-0" style="border-color: var(--color-gray-200);">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold shrink-0"
                 [style.background-color]="'var(--color-indigo-100)'"
                 style="color: var(--color-indigo-700);">
              @if (authService.currentUser()?.foto) {
                <img [src]="authService.currentUser()!.foto" alt="Foto de perfil" class="w-full h-full object-cover">
              } @else {
                {{ authService.currentUser()?.usuario?.charAt(0)?.toUpperCase() || 'U' }}
              }
            </div>
            <div class="min-w-0 leading-tight">
              <p class="text-sm font-medium truncate" style="color: var(--color-gray-900);">{{ authService.currentUser()?.usuario }}</p>
              <p class="text-xs truncate" style="color: var(--color-gray-500);">{{ authService.currentUser()?.correo }}</p>
            </div>
          </div>
          <button (click)="themeService.toggle()"
                  class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors hover:bg-gray-100"
                  style="color: var(--color-gray-500);"
                  [attr.aria-label]="themeService.isDark() ? 'Activar modo claro' : 'Activar modo oscuro'">
            <mat-icon class="text-lg">{{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .sidebar-nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      font-weight: 500;
      border-radius: 0.375rem;
      transition: all 0.15s ease;
      border-left: 3px solid transparent;
      text-decoration: none;
      cursor: pointer;
      color: var(--color-gray-600);
    }
    .sidebar-nav-item:hover {
      color: var(--color-gray-900);
      border-left-color: rgba(99, 102, 241, 0.3);
      background-color: var(--color-gray-50);
    }
    .sidebar-active {
      color: var(--color-gray-900);
      border-left-color: var(--color-indigo-500);
      background-color: rgba(99, 102, 241, 0.06);
    }
    .sidebar-active .sidebar-nav-icon {
      color: var(--color-indigo-600);
    }
    .sidebar-nav-icon {
      font-size: 1.25rem;
      width: 1.25rem;
      height: 1.25rem;
      color: var(--color-gray-400);
    }
    .sidebar-nav-item:hover .sidebar-nav-icon {
      color: var(--color-gray-600);
    }
    .sidebar-chat-badge {
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
      background-color: var(--color-rose-500);
    }
    [data-theme="dark"] .sidebar-nav-item:hover {
      background-color: var(--color-gray-100);
    }
    [data-theme="dark"] .sidebar-active {
      border-left-color: var(--color-indigo-600);
      background-color: rgba(129, 140, 248, 0.1);
    }
    [data-theme="dark"] .sidebar-active .sidebar-nav-icon {
      color: var(--color-indigo-500);
    }
  `]
})
export class SidebarComponent {
  protected readonly authService = inject(AuthService);
  protected readonly themeService = inject(ThemeService);
  protected readonly permisoService = inject(PermisoService);
  protected readonly chatService = inject(ChatService);
  protected mobileAdminOpen = false;
  readonly isMobile = input(false);
  readonly navigate = output<void>();

  protected readonly noLeidosChat = computed(() =>
    this.chatService.noLeidosTotal(this.authService.currentUser()?.id ?? ''),
  );

  protected onNavClick(): void {
    this.navigate.emit();
  }

  protected onChatClick(): void {
    this.chatService.toggle();
    this.navigate.emit();
  }
}
