import {Component, inject} from '@angular/core';
import {RouterOutlet, RouterLink, RouterLinkActive} from '@angular/router';
import {MatIconRegistry} from '@angular/material/icon';
import {MatIconModule} from '@angular/material/icon';
import {MatSidenavModule} from '@angular/material/sidenav';
import {HeaderComponent} from './components/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, MatSidenavModule, HeaderComponent],
  template: `
    <mat-sidenav-container>
      <mat-sidenav #sidenav mode="over" position="start" class="w-64"
                   style="background-color: var(--color-surface);">
        <div class="flex items-center justify-between p-4 border-b" style="border-color: var(--color-gray-200);">
          <span class="text-lg font-bold" style="color: var(--color-gray-900);">DevTracker</span>
          <button mat-icon-button (click)="sidenav.close()" aria-label="Cerrar menú" style="color: var(--color-gray-400);">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <nav class="p-2 space-y-1">
          <a routerLink="/" routerLinkActive="bg-indigo-50 text-indigo-600" [routerLinkActiveOptions]="{exact: true}"
             (click)="sidenav.close()"
             class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors"
             style="color: var(--color-gray-700);">
            <mat-icon class="text-lg">dashboard</mat-icon>
            Tablero
          </a>
          <a routerLink="/proyectos" routerLinkActive="bg-indigo-50 text-indigo-600"
             (click)="sidenav.close()"
             class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors"
             style="color: var(--color-gray-700);">
            <mat-icon class="text-lg">folder</mat-icon>
            Proyectos
          </a>
          <a routerLink="/planning" routerLinkActive="bg-indigo-50 text-indigo-600"
             (click)="sidenav.close()"
             class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors"
             style="color: var(--color-gray-700);">
            <mat-icon class="text-lg">calendar_month</mat-icon>
            Planning
          </a>
          <a routerLink="/calendario" routerLinkActive="bg-indigo-50 text-indigo-600"
             (click)="sidenav.close()"
             class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors"
             style="color: var(--color-gray-700);">
            <mat-icon class="text-lg">calendar_view_week</mat-icon>
            Calendario
          </a>

          <div class="border-t my-2" style="border-color: var(--color-gray-200);"></div>

          <button (click)="mobileAdminOpen = !mobileAdminOpen"
                  class="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-colors"
                  style="color: var(--color-gray-700);">
            <span class="flex items-center gap-3">
              <mat-icon class="text-lg">admin_panel_settings</mat-icon>
              Administración
            </span>
            <mat-icon class="text-lg transition-transform" [class.rotate-90]="mobileAdminOpen">chevron_right</mat-icon>
          </button>
          @if (mobileAdminOpen) {
            <a routerLink="/usuarios" routerLinkActive="bg-indigo-50 text-indigo-600"
               (click)="sidenav.close(); mobileAdminOpen = false"
               class="flex items-center gap-3 pl-11 pr-3 py-2.5 text-sm font-medium rounded-lg transition-colors"
               style="color: var(--color-gray-700);">
              <mat-icon class="text-lg">group</mat-icon>
              Usuarios
            </a>
          }
        </nav>
      </mat-sidenav>

      <mat-sidenav-content>
        <app-header (toggleMenu)="sidenav.toggle()" />
        <main class="container py-8">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background-color: var(--color-gray-50);
    }
    mat-sidenav-container {
      min-height: 100vh;
    }
    mat-sidenav-content {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    main {
      flex: 1;
    }
  `]
})
export class AppComponent {
  protected mobileAdminOpen = false;

  constructor() {
    inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined');
  }
}
