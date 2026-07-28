import {Component, inject, output, ChangeDetectionStrategy} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';
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
            <button mat-icon-button (click)="toggleMenu.emit()" style="color: var(--color-gray-500);" class="md:hidden" aria-label="Abrir menú">
              <mat-icon>menu</mat-icon>
            </button>
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
  readonly toggleMenu = output<void>();
}
