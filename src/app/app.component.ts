import {Component, inject, signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {MatIconRegistry} from '@angular/material/icon';
import {MatSidenavModule} from '@angular/material/sidenav';
import {BreakpointObserver} from '@angular/cdk/layout';
import {SidebarComponent} from './components/sidebar/sidebar.component';
import {HeaderComponent} from './components/header/header.component';
import {AuthService} from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatSidenavModule, SidebarComponent, HeaderComponent],
  template: `
    @if (authService.isLoggedIn()) {
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
        <main class="w-full px-5 md:max-w-7xl md:mx-auto py-8">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
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
}
