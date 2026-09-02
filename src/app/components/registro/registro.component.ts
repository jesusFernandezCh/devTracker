import {Component, inject, ChangeDetectionStrategy, signal, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors} from '@angular/forms';
import {Router, ActivatedRoute} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';

@Component({
  selector: 'app-registro',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-6" style="background-color: var(--color-gray-50);">
      <div class="w-full max-w-sm">
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
               style="background: linear-gradient(135deg, var(--color-indigo-600), var(--color-purple-600));">
            <svg class="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6m-3 4v6m-3-3h6"/>
            </svg>
          </div>
          <h1 class="text-2xl font-bold" style="color: var(--color-gray-900);">Crear cuenta</h1>
          <p class="text-sm mt-1" style="color: var(--color-gray-500);">
            {{ token ? 'Completa tu registro con la invitación.' : 'Regístrate para acceder al sistema.' }}
          </p>
        </div>

        @if (exito()) {
          <div class="mb-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
               style="background-color: var(--color-emerald-50); color: var(--color-emerald-700); border: 1px solid var(--color-emerald-200);">
            <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ exito() }}
          </div>
          <button (click)="irLogin()"
                  class="w-full py-2.5 text-sm font-medium text-white rounded-lg transition-colors"
                  style="background-color: var(--color-teal-600);">
            Ir a iniciar sesión
          </button>
        } @else {
          @if (error()) {
            <div class="mb-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
                 style="background-color: var(--color-rose-50); color: var(--color-rose-700); border: 1px solid var(--color-rose-200);">
              <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
              </svg>
              {{ error() }}
            </div>
          }

          <form [formGroup]="registroForm" (ngSubmit)="onRegistro()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1.5" style="color: var(--color-gray-700);">Correo electrónico</label>
              <input formControlName="correo" type="email" autocomplete="email"
                     class="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-colors"
                     style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);"
                     placeholder="ejemplo@correo.com"
                     [readonly]="!!token">
              @if (registroForm.controls.correo.touched && registroForm.controls.correo.invalid) {
                <p class="mt-1 text-xs" style="color: var(--color-rose-500);">Ingresa un correo válido.</p>
              }
            </div>

            <div>
              <label class="block text-sm font-medium mb-1.5" style="color: var(--color-gray-700);">Usuario</label>
              <input formControlName="usuario" type="text" autocomplete="username"
                     class="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-colors"
                     style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);"
                     placeholder="Ej: jperez">
              @if (registroForm.controls.usuario.touched && registroForm.controls.usuario.invalid) {
                <p class="mt-1 text-xs" style="color: var(--color-rose-500);">El usuario debe tener entre 3 y 60 caracteres.</p>
              }
            </div>

            <div>
              <label class="block text-sm font-medium mb-1.5" style="color: var(--color-gray-700);">Contraseña</label>
              <input formControlName="clave" type="password" autocomplete="new-password"
                     class="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-colors"
                     style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);"
                     placeholder="Mínimo 6 caracteres">
              @if (registroForm.controls.clave.touched && registroForm.controls.clave.invalid) {
                <p class="mt-1 text-xs" style="color: var(--color-rose-500);">La contraseña debe tener al menos 6 caracteres.</p>
              }
            </div>

            <div>
              <label class="block text-sm font-medium mb-1.5" style="color: var(--color-gray-700);">Confirmar contraseña</label>
              <input formControlName="claveConfirmacion" type="password" autocomplete="new-password"
                     class="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-colors"
                     style="background-color: var(--color-surface); color: var(--color-gray-900); border: 1px solid var(--color-gray-300);"
                     placeholder="Repite tu contraseña">
              @if (registroForm.controls.claveConfirmacion.touched && registroForm.hasError('clavesNoCoinciden')) {
                <p class="mt-1 text-xs" style="color: var(--color-rose-500);">Las contraseñas no coinciden.</p>
              }
            </div>

            <button type="submit" [disabled]="registroForm.invalid || loading()"
                    class="w-full py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    style="background-color: var(--color-teal-600);">
              @if (loading()) {
                <span class="flex items-center justify-center gap-2">
                  <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Registrando...
                </span>
              } @else {
                Crear cuenta
              }
            </button>
          </form>

          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t" style="border-color: var(--color-gray-200);"></div>
            </div>
            <div class="relative flex justify-center">
              <span class="px-3 text-sm" style="background-color: var(--color-gray-50); color: var(--color-gray-400);">o registrarse con</span>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <button (click)="onOAuth('google')" [disabled]="loading()"
                    class="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors border disabled:opacity-50 disabled:cursor-not-allowed"
                    style="border-color: var(--color-gray-300); color: var(--color-gray-700); background-color: var(--color-surface);">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </button>
            <button (click)="onOAuth('github')" [disabled]="loading()"
                    class="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors border disabled:opacity-50 disabled:cursor-not-allowed"
                    style="border-color: var(--color-gray-300); color: var(--color-gray-700); background-color: var(--color-surface);">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </button>
            <button (click)="onOAuth('facebook')" [disabled]="loading()"
                    class="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors border disabled:opacity-50 disabled:cursor-not-allowed"
                    style="border-color: var(--color-gray-300); color: var(--color-gray-700); background-color: var(--color-surface);">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>
          </div>

          <p class="mt-8 text-center text-sm" style="color: var(--color-gray-500);">
            ¿Ya tienes cuenta?
            <a routerLink="/login" class="font-medium transition-colors" style="color: var(--color-indigo-600);">Iniciar sesión</a>
          </p>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .animate-spin { animation: spin 1s linear infinite; }
  `]
})
export class RegistroComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly exito = signal<string | null>(null);

  protected token: string | null = null;
  protected correoDesdeToken: string | null = null;

  protected readonly registroForm = this.fb.nonNullable.group(
    {
      correo: ['', [Validators.required, Validators.email]],
      usuario: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(60)]],
      clave: ['', [Validators.required, Validators.minLength(6)]],
      claveConfirmacion: ['', [Validators.required]],
    },
    { validators: this.validarClaves },
  );

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] ?? null;
      this.correoDesdeToken = params['correo'] ?? null;
      if (this.correoDesdeToken) {
        this.registroForm.patchValue({ correo: this.correoDesdeToken });
      }
    });
  }

  validarClaves(control: AbstractControl): ValidationErrors | null {
    const clave = control.get('clave')?.value;
    const confirmacion = control.get('claveConfirmacion')?.value;
    if (clave && confirmacion && clave !== confirmacion) {
      return {clavesNoCoinciden: true};
    }
    return null;
  }

  async onRegistro(): Promise<void> {
    if (this.registroForm.invalid) return;
    this.loading.set(true);
    this.error.set(null);

    const raw = this.registroForm.getRawValue();

    try {
      const response = await firstValueFrom(
        this.http.post<{mensaje: string}>('api/auth/registro', {
          correo: raw.correo,
          usuario: raw.usuario,
          clave: raw.clave,
          claveConfirmacion: raw.claveConfirmacion,
          token: this.token,
        }),
      );
      this.exito.set(response.mensaje);
    } catch (e: any) {
      const msg = e?.error?.message ?? 'Error al registrar. Intenta de nuevo.';
      this.error.set(Array.isArray(msg) ? msg.join('. ') : msg);
    } finally {
      this.loading.set(false);
    }
  }

  onOAuth(proveedor: 'google' | 'github' | 'facebook'): void {
    const clientId = this.obtenerClientId(proveedor);
    if (!clientId) {
      this.error.set(`OAuth no configurado para ${proveedor}`);
      return;
    }
    const redirectUri = `${window.location.origin}/registro?oauth=${proveedor}`;
    const url = this.obtenerAuthUrl(proveedor, clientId, redirectUri);
    window.location.href = url;
  }

  irLogin(): void {
    this.router.navigate(['/login']);
  }

  private obtenerClientId(proveedor: string): string | null {
    const ids: Record<string, string> = {
      google: 'YOUR_GOOGLE_CLIENT_ID',
      github: 'YOUR_GITHUB_CLIENT_ID',
      facebook: 'YOUR_FACEBOOK_CLIENT_ID',
    };
    return ids[proveedor] ?? null;
  }

  private obtenerAuthUrl(proveedor: string, clientId: string, redirectUri: string): string {
    const state = crypto.randomUUID();
    switch (proveedor) {
      case 'google':
        return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email+profile&state=${state}`;
      case 'github':
        return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email&state=${state}`;
      case 'facebook':
        return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=email&state=${state}`;
      default:
        return '#';
    }
  }
}
