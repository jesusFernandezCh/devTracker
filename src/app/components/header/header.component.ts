import {Component, inject, output, ChangeDetectionStrategy, signal, HostListener, viewChild, ElementRef} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {ThemeService} from '../../services/theme.service';
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <header style="background-color: var(--color-surface); border-color: var(--color-gray-200);" class="border-b shadow-sm">
      <div class="container">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center gap-3 min-w-0">
            <span class="text-xs sm:text-sm hidden sm:block truncate" style="color: var(--color-indigo-700); text-align:left !important;">
              Sistema de Gestión de Desarrollos
            </span>
          </div>
          <div class="flex items-center space-x-1 sm:space-x-2">
            <button mat-icon-button (click)="themeService.toggle()"
                    style="color: var(--color-gray-500);"
                    [attr.aria-label]="themeService.isDark() ? 'Activar modo claro' : 'Activar modo oscuro'">
              <mat-icon>{{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
            </button>

            <!-- User avatar -->
            <div class="relative" #userMenu>
              <button (click)="toggleUserMenu()"
                      class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                      [style.background-color]="'var(--color-indigo-100)'"
                      style="color: var(--color-indigo-700);"
                      [attr.aria-label]="'Menú de usuario'">
                {{ authService.currentUser()?.usuario?.charAt(0)?.toUpperCase() || 'U' }}
              </button>
              @if (showUserMenu()) {
                <div class="absolute top-full right-0 mt-1.5 w-52 rounded-xl border shadow-lg py-1 z-50"
                     style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
                  <div class="px-4 py-2.5 border-b" style="border-color: var(--color-gray-100);">
                    <p class="text-sm font-medium truncate" style="color: var(--color-gray-900);">{{ authService.currentUser()?.usuario }}</p>
                    <p class="text-xs truncate" style="color: var(--color-gray-500);">{{ authService.currentUser()?.correo }}</p>
                  </div>
                  <button (click)="cerrarSesion()"
                          class="flex items-center gap-2 w-full px-4 py-2.5 text-sm transition-colors"
                          style="color: var(--color-gray-700);">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"/>
                    </svg>
                    Cerrar sesión
                  </button>
                </div>
              }
            </div>

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
  protected readonly authService = inject(AuthService);
  protected readonly showUserMenu = signal(false);
  private readonly userMenuEl = viewChild<ElementRef<HTMLElement>>('userMenu');
  readonly toggleMenu = output<void>();

  protected toggleUserMenu(): void {
    this.showUserMenu.update(v => !v);
  }

  protected cerrarSesion(): void {
    this.showUserMenu.set(false);
    this.authService.logout();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const userEl = this.userMenuEl();
    if (userEl && !userEl.nativeElement.contains(event.target as Node)) {
      this.showUserMenu.set(false);
    }
  }
}
