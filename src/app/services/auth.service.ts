import {Injectable, signal, computed, inject} from '@angular/core';
import {Router} from '@angular/router';
import {UsuarioService} from './usuario.service';
import {Usuario} from '../models/usuario.model';

const SESSION_KEY = 'devtracker-session';

@Injectable({providedIn: 'root'})
export class AuthService {
  private readonly _currentUser = signal<Usuario | null>(null);
  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this._currentUser() !== null);
  private readonly router = inject(Router);
  private readonly usuarioService = inject(UsuarioService);

  constructor() { this._cargarSesion(); }

  login(correo: string, clave: string): boolean {
    const usuario = this.usuarioService.usuarioPorCorreo(correo);
    if (usuario && atob(usuario.clave) === clave) {
      this._iniciarSesion(usuario);
      return true;
    }
    return false;
  }

  loginSocial(proveedor: 'google' | 'facebook'): void {
    const email = proveedor === 'google'
      ? 'usuario.google@demo.com'
      : 'usuario.facebook@demo.com';
    const nombre = proveedor === 'google' ? 'Usuario Google' : 'Usuario Facebook';

    let usuario = this.usuarioService.usuarioPorCorreo(email);
    if (!usuario) {
      this.usuarioService.crear({
        usuario: nombre,
        correo: email,
        clave: crypto.randomUUID(),
        tipo: 'usuario',
      });
      usuario = this.usuarioService.usuarioPorCorreo(email);
    }
    if (usuario) this._iniciarSesion(usuario);
  }

  logout(): void {
    this._currentUser.set(null);
    localStorage.removeItem(SESSION_KEY);
    this.router.navigate(['/login']);
  }

  private _iniciarSesion(usuario: Usuario): void {
    this._currentUser.set(usuario);
    localStorage.setItem(SESSION_KEY, JSON.stringify(usuario));
    this.router.navigate(['/']);
  }

  private _cargarSesion(): void {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      try {
        const usuario = JSON.parse(raw) as Usuario;
        this._currentUser.set(usuario);
      } catch { /* ignorar */ }
    }
  }
}
