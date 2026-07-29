import {Component, inject, output, ChangeDetectionStrategy, signal, HostListener, viewChild, ElementRef} from '@angular/core';
import {Router, RouterLink, RouterLinkActive} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {ThemeService} from '../../services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, MatButtonModule, MatIconModule],
  template: `
    <header style="background-color: var(--color-surface); border-color: var(--color-gray-200);" class="border-b shadow-sm">
      <div class="container">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-8">
            <a routerLink="/" class="flex items-center space-x-2">
              <svg class="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6m-3 4v6m-3-3h6"/>
              </svg>
              <span class="text-xl font-bold" style="color: var(--color-gray-900);">DevTracker</span>
            </a>
            <nav class="hidden md:flex space-x-4">
              <div class="relative" #adminMenu>
                <button (click)="toggleAdminMenu()"
                        class="flex items-center gap-1 px-3 py-2 text-sm font-medium border-b-2 transition-colors"
                        [class.text-indigo-600]="router.url.startsWith('/usuarios')"
                        [class.border-indigo-600]="router.url.startsWith('/usuarios')"
                        [class.border-transparent]="!router.url.startsWith('/usuarios')"
                        style="color: var(--color-gray-500);">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  Administración
                  <svg class="w-3.5 h-3.5 transition-transform" [class.rotate-180]="showAdminMenu()" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
                  </svg>
                </button>
                @if (showAdminMenu()) {
                  <div class="absolute top-full left-0 mt-1 w-48 rounded-xl border shadow-lg py-1 z-50"
                       style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
                    <a routerLink="/usuarios" (click)="showAdminMenu.set(false)"
                       class="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors"
                       routerLinkActive="text-indigo-600 font-semibold"
                       [class.text-indigo-600]="router.url.startsWith('/usuarios')"
                       style="color: var(--color-gray-700);">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
                      </svg>
                      Usuarios
                    </a>
                  </div>
                }
              </div>
              <a routerLink="/" routerLinkActive="text-indigo-600 border-indigo-600" [routerLinkActiveOptions]="{exact: true}"
                 class="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent transition-colors">
                Tablero
              </a>
              <a routerLink="/proyectos" routerLinkActive="text-indigo-600 border-indigo-600"
                 class="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent transition-colors">
                Proyectos
              </a>
              <a routerLink="/planning" routerLinkActive="text-indigo-600 border-indigo-600"
                 class="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent transition-colors">
                Planning
              </a>
              <a routerLink="/calendario" routerLinkActive="text-indigo-600 border-indigo-600"
                 class="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent transition-colors">
                Calendario
              </a>
            </nav>
          </div>
          <div class="flex items-center space-x-1 sm:space-x-2">
            <span class="text-sm hidden sm:block" style="color: var(--color-gray-500);">Sistema de Gestión de Desarrollos</span>
            <button mat-icon-button (click)="themeService.toggle()"
                    style="color: var(--color-gray-500);"
                    [attr.aria-label]="themeService.isDark() ? 'Activar modo claro' : 'Activar modo oscuro'">
              <mat-icon>{{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
            </button>
            <span class="md:hidden">
              <button mat-icon-button (click)="toggleMenu.emit()" style="color: var(--color-gray-500);" aria-label="Abrir menú">
                <mat-icon>menu</mat-icon>
              </button>
            </span>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    :host { display: block; }
    header [mat-icon-button] { transition: color 0.15s; }
    header [mat-icon-button]:hover { color: var(--color-gray-700) !important; }
  `]
})
export class HeaderComponent {
  protected readonly themeService = inject(ThemeService);
  protected readonly router = inject(Router);
  protected readonly showAdminMenu = signal(false);
  private readonly adminMenuEl = viewChild<ElementRef<HTMLElement>>('adminMenu');
  readonly toggleMenu = output<void>();

  protected toggleAdminMenu(): void {
    this.showAdminMenu.update(v => !v);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const el = this.adminMenuEl();
    if (el && !el.nativeElement.contains(event.target as Node)) {
      this.showAdminMenu.set(false);
    }
  }
}
