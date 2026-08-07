import {Injectable, signal, computed, inject} from '@angular/core';
import {Router} from '@angular/router';
import {UsuarioService} from './usuario.service';
import {Usuario} from '../models/usuario.model';
import {verificarClave} from '../utils/cripto';

const SESSION_KEY = 'devtracker-session';

@Injectable({providedIn: 'root'})
export class AuthService {
  private readonly _currentUserId = signal<string | null>(null);
  readonly currentUser = computed<Usuario | null>(() => {
    const id = this._currentUserId();
    return id ? this.usuarioService.usuarioPorId(id) ?? null : null;
  });
  readonly isLoggedIn = computed(() => this._currentUserId() !== null);
  private readonly router = inject(Router);
  private readonly usuarioService = inject(UsuarioService);

  constructor() { this._cargarSesion(); }

  async login(correo: string, clave: string): Promise<boolean> {
    const usuario = this.usuarioService.usuarioPorCorreo(correo);
    if (usuario && await verificarClave(clave, usuario.clave)) {
      this._iniciarSesion(usuario);
      return true;
    }
    return false;
  }

  async loginSocial(proveedor: 'google' | 'facebook'): Promise<void> {
    const email = proveedor === 'google'
      ? 'usuario.google@demo.com'
      : 'usuario.facebook@demo.com';
    const nombre = proveedor === 'google' ? 'Usuario Google' : 'Usuario Facebook';

    let usuario = this.usuarioService.usuarioPorCorreo(email);
    if (!usuario) {
      await this.usuarioService.crear({
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
    this._currentUserId.set(null);
    localStorage.removeItem(SESSION_KEY);
    this.router.navigate(['/login']);
  }

  private _iniciarSesion(usuario: Usuario): void {
    this._currentUserId.set(usuario.id);
    localStorage.setItem(SESSION_KEY, JSON.stringify(usuario.id));
    this.router.navigate(['/']);
  }

  private _cargarSesion(): void {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Usuario | string;
      const id = typeof parsed === 'string' ? parsed : parsed.id;
      if (id && this.usuarioService.usuarioPorId(id)) {
        this._currentUserId.set(id);
      }
    } catch { /* ignorar */ }
  }
}
