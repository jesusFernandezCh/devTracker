import {Component, output} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <nav class="bottom-nav" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
      <a routerLink="/" routerLinkActive="bottom-nav-active" [routerLinkActiveOptions]="{exact: true}"
         (click)="onNavClick()"
         class="bottom-nav-item">
        <mat-icon>bar_chart</mat-icon>
        <span>Inicio</span>
      </a>
      <a routerLink="/tablero" routerLinkActive="bottom-nav-active"
         (click)="onNavClick()"
         class="bottom-nav-item">
        <mat-icon>dashboards</mat-icon>
        <span>Tablero</span>
      </a>
      <a routerLink="/proyectos" routerLinkActive="bottom-nav-active"
         (click)="onNavClick()"
         class="bottom-nav-item">
        <mat-icon>folder</mat-icon>
        <span>Proyectos</span>
      </a>
      <a routerLink="/planning" routerLinkActive="bottom-nav-active"
         (click)="onNavClick()"
         class="bottom-nav-item">
        <mat-icon>calendar_month</mat-icon>
        <span>Planning</span>
      </a>
      <a routerLink="/calendario" routerLinkActive="bottom-nav-active"
         (click)="onNavClick()"
         class="bottom-nav-item">
        <mat-icon>calendar_view_week</mat-icon>
        <span>Calendario</span>
      </a>
    </nav>
  `,
  styles: [`
    :host { display: block; }
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 30;
      height: 4rem;
      padding-bottom: env(safe-area-inset-bottom);
      display: flex;
      align-items: stretch;
      border-top: 1px solid;
      box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.06);
    }
    .bottom-nav-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.125rem;
      font-size: 0.625rem;
      font-weight: 500;
      text-decoration: none;
      color: var(--color-gray-500);
      transition: color 0.15s;
      min-width: 0;
    }
    .bottom-nav-item mat-icon {
      font-size: 1.375rem;
      width: 1.375rem;
      height: 1.375rem;
    }
    .bottom-nav-item span {
      line-height: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }
    .bottom-nav-item:hover {
      color: var(--color-gray-900);
    }
    .bottom-nav-active {
      color: var(--color-indigo-600);
    }
    .bottom-nav-active mat-icon {
      font-variation-settings: 'FILL' 1;
    }
    [data-theme="dark"] .bottom-nav-item:hover {
      color: var(--color-gray-700);
    }
    [data-theme="dark"] .bottom-nav-active {
      color: var(--color-indigo-500);
    }
  `]
})
export class BottomNavComponent {
  readonly navigate = output<void>();

  protected onNavClick(): void {
    this.navigate.emit();
  }
}