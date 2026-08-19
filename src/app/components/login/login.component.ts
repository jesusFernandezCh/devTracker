import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex" style="background-color: var(--color-gray-50);">
      <!-- Left panel: branding -->
      <div class="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12"
          style="background-image: url('./images/portada.jpeg'); background-size: cover; background-position: center;">
           
        <div class="absolute inset-0 opacity-10">
          <svg class="w-full h-full" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="40" fill="white"/>
            <circle cx="350" cy="80" r="60" fill="white"/>
            <circle cx="80" cy="350" r="30" fill="white"/>
            <circle cx="320" cy="320" r="50" fill="white"/>
            <circle cx="200" cy="200" r="80" fill="white" opacity="0.5"/>
            <rect x="150" y="100" width="100" height="100" rx="16" fill="white" opacity="0.3"/>
            <rect x="100" y="250" width="80" height="80" rx="12" fill="white" opacity="0.2"/>
            <rect x="250" y="250" width="70" height="70" rx="10" fill="white" opacity="0.25"/>
          </svg>
        </div>
        <div class="relative z-10 text-center max-w-md" style="text-shadow: 0 4px 6px rgb(0 0 0); margin-bottom: 546px;">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl text-indigo-700 backdrop-blur-sm mb-8">
            <svg class="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6m-3 4v6m-3-3h6"/>
            </svg>
          </div>
          <h1 class="text-4xl font-bold text-indigo-700 mb-4">DevTracker</h1>
          <p class="text-lg text-white leading-relaxed">
             Sistema de Gestión de Desarrollos. Organiza tus proyectos, planifica tareas y da seguimiento a tu equipo de trabajo.
          </p>
      </div>
      </div>

      <!-- Right panel: form -->
      <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10">
        <div class="w-full max-w-sm">
          <!-- Logo (mobile) -->
          <div class="lg:hidden flex items-center gap-3 mb-10">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: linear-gradient(135deg, var(--color-indigo-600), var(--color-purple-600));">
              <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6m-3 4v6m-3-3h6"/>
              </svg>
            </div>
            <span class="text-xl font-bold" style="color: var(--color-gray-900);">DevTracker</span>
          </div>

          <div class="mb-8">
            <h2 class="text-2xl font-bold mb-1" style="color: var(--color-gray-900);">Iniciar sesión</h2>
            <p style="color: var(--color-gray-500);" class="text-sm">Ingresa tus credenciales para acceder al sistema.</p>
          </div>

          @if (error()) {
            <div class="mb-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
                 style="background-color: var(--color-rose-50); color: var(--color-rose-700); border: 1px solid var(--color-rose-200);">
              <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
              </svg>
              {{ error() }}
            </div>
          }

          <form [formGroup]="loginForm" (ngSubmit)="onLogin()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1.5" style="color: var(--color-gray-700);">Correo electrónico</label>
              <input formControlName="correo" type="email" autocomplete="email"
                     class="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-colors"
                     style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);"
                     placeholder="ejemplo@correo.com">
              @if (loginForm.controls.correo.touched && loginForm.controls.correo.invalid) {
                <p class="mt-1 text-xs" style="color: var(--color-rose-500);">Ingresa un correo válido.</p>
              }
            </div>

            <div>
              <label class="block text-sm font-medium mb-1.5" style="color: var(--color-gray-700);">Contraseña</label>
              <input formControlName="clave" type="password" autocomplete="current-password"
                     class="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-colors"
                     style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);"
                     placeholder="••••••••">
              @if (loginForm.controls.clave.touched && loginForm.controls.clave.invalid) {
                <p class="mt-1 text-xs" style="color: var(--color-rose-500);">La contraseña debe tener al menos 4 caracteres.</p>
              }
            </div>

            <div class="flex items-center justify-between">
              <label class="flex items-center gap-2 cursor-pointer">
                <input formControlName="recordar" type="checkbox"
                       class="w-4 h-4 rounded"
                       style="accent-color: var(--color-indigo-600);">
                <span class="text-sm" style="color: var(--color-gray-600);">Recordar sesión</span>
              </label>
              <a href="#" class="text-sm font-medium transition-colors" style="color: var(--color-indigo-600);" (click)="$event.preventDefault()">¿Olvidaste tu contraseña?</a>
            </div>

            <button type="submit" [disabled]="loginForm.invalid || loading()"
                    class="w-full py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    style="background-color: var(--color-teal-600);"
                    [class.hover:bg-teal-700]="!loginForm.invalid && !loading()">
              @if (loading()) {
                <span class="flex items-center justify-center gap-2">
                  <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Iniciando sesión...
                </span>
              } @else {
                Iniciar sesión
              }
            </button>
          </form>

          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t" style="border-color: var(--color-gray-200);"></div>
            </div>
            <div class="relative flex justify-center">
              <span class="px-3 text-sm" style="background-color: var(--color-gray-50); color: var(--color-gray-400);">o continuar con</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <button (click)="onSocialLogin('google')" [disabled]="loading()"
                    class="flex items-center justify-center gap-2.5 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors border disabled:opacity-50 disabled:cursor-not-allowed"
                    style="border-color: var(--color-gray-300); color: var(--color-gray-700); background-color: var(--color-surface);">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button (click)="onSocialLogin('facebook')" [disabled]="loading()"
                    class="flex items-center justify-center gap-2.5 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors border disabled:opacity-50 disabled:cursor-not-allowed"
                    style="border-color: var(--color-gray-300); color: var(--color-gray-700); background-color: var(--color-surface);">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </button>
          </div>

          <p class="mt-8 text-center text-sm" style="color: var(--color-gray-500);">
            ¿No tienes cuenta?
            <a href="#" class="font-medium transition-colors" style="color: var(--color-indigo-600);" (click)="$event.preventDefault()">Crear una</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    input:focus { border-color: var(--color-indigo-400) !important; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15); }
    @keyframes spin { to { transform: rotate(360deg); } }
    .animate-spin { animation: spin 1s linear infinite; }
  `]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly loginForm = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    clave: ['', [Validators.required, Validators.minLength(4)]],
    recordar: [false],
  });

  constructor() {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
    }
  }

  protected onLogin(): void {
    if (this.loginForm.invalid) return;
    this.loading.set(true);
    this.error.set(null);

    const { correo, clave } = this.loginForm.getRawValue();

    setTimeout(async () => {
      const ok = await this.authService.login(correo, clave);
      if (!ok) {
        this.error.set('Correo o contraseña incorrectos.');
        this.loading.set(false);
      }
    }, 800);
  }

  protected onSocialLogin(proveedor: 'google' | 'facebook'): void {
    this.loading.set(true);
    this.error.set(null);

    setTimeout(() => {
      this.authService.loginSocial(proveedor);
      this.loading.set(false);
    }, 1000);
  }
}
