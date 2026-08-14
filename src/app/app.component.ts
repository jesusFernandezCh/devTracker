import {Component, inject, signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {MatIconRegistry} from '@angular/material/icon';
import {MatSidenavModule} from '@angular/material/sidenav';
import {BreakpointObserver} from '@angular/cdk/layout';
import {SwUpdate} from '@angular/service-worker';
import {ConfirmationService} from 'primeng/api';
import {ConfirmDialog} from 'primeng/confirmdialog';
import {SidebarComponent} from './components/sidebar/sidebar.component';
import {HeaderComponent} from './components/header/header.component';
import {ChatWidgetComponent} from './components/chat-widget/chat-widget.component';
import {BottomNavComponent} from './components/bottom-nav/bottom-nav.component';
import {AuthService} from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatSidenavModule, SidebarComponent, HeaderComponent, ChatWidgetComponent, BottomNavComponent, ConfirmDialog],
  providers: [ConfirmationService],
  template: `
    @if (actualizacionDisponible()) {
    <div class="fixed top-0 inset-x-0 z-[100] flex items-center justify-between gap-4 px-4 py-2.5 shadow-lg"
         style="background-color: var(--color-indigo-600); color: #fff;">
      <div class="flex items-center gap-2 min-w-0">
        <span class="material-symbols-outlined text-xl shrink-0">system_update_alt</span>
        <p class="text-sm font-medium truncate">Nueva versión disponible. Recarga para aplicar los últimos cambios.</p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button (click)="recargarAplicacion()" [disabled]="recargando()"
                class="rounded-lg bg-white text-indigo-700 px-3 py-1.5 text-sm font-semibold shadow hover:bg-indigo-50 disabled:opacity-60 disabled:cursor-not-allowed">
          {{ recargando() ? 'Actualizando…' : 'Actualizar' }}
        </button>
        <button (click)="actualizacionDisponible.set(false)" aria-label="Descartar"
                class="text-white/80 hover:text-white text-xl leading-none">&times;</button>
      </div>
    </div>
    }
    @if (authService.isLoggedIn()) {
    <p-confirmDialog />
    <mat-sidenav-container>
      <mat-sidenav #sidenav
                   [mode]="isMobile() ? 'over' : 'side'"
                   [opened]="isMobile() ? sidenavOpened() : true"
                   [disableClose]="!isMobile()"
                   position="start"
                   class="w-40">
        <app-sidebar [isMobile]="isMobile()" (navigate)="onSidenavNavigate()" />
      </mat-sidenav>

      <mat-sidenav-content>
        <app-header (toggleMenu)="toggleSidenav()" />
        <main class="w-full px-2 md:max-w-7xl md:mx-auto pt-8 pb-24 md:pb-8" style="padding-top: 21px;">
          <router-outlet />
        </main>
        @if (isMobile()) {
          <app-bottom-nav (navigate)="onSidenavNavigate()" />
        }
      </mat-sidenav-content>
    </mat-sidenav-container>
    <app-chat-widget />
    } @else {
      <router-outlet />
    }
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
  protected readonly authService = inject(AuthService);
  protected readonly isMobile = signal(false);
  protected readonly sidenavOpened = signal(false);
  protected readonly actualizacionDisponible = signal(false);
  protected readonly recargando = signal(false);
  private readonly swUpdate = inject(SwUpdate);

  constructor() {
    inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined');

    const breakpointObserver = inject(BreakpointObserver);
    breakpointObserver.observe(['(max-width: 767px)']).subscribe(result => {
      this.isMobile.set(result.matches);
      if (!result.matches) {
        this.sidenavOpened.set(true);
      } else {
        this.sidenavOpened.set(false);
      }
    });

    this.swUpdate.versionUpdates.subscribe(event => {
      if (event.type === 'VERSION_READY') {
        this.actualizacionDisponible.set(true);
      }
    });
  }

  protected toggleSidenav(): void {
    if (this.isMobile()) {
      this.sidenavOpened.update(v => !v);
    }
  }

  protected onSidenavNavigate(): void {
    if (this.isMobile()) {
      this.sidenavOpened.set(false);
    }
  }

  protected async recargarAplicacion(): Promise<void> {
    this.recargando.set(true);
    await this.swUpdate.activateUpdate();
    window.location.reload();
  }
}
