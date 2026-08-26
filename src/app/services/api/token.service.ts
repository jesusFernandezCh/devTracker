import {Injectable, signal} from '@angular/core';

const TOKEN_KEY = 'devtracker-access-token';

/**
 * Custodia el access token JWT en memoria + localStorage (para que socket.io
 * pueda reconectarse tras un refresh). La cookie httpOnly `devtracker_refresh`
 * la gestiona el navegador; aquí solo vive el token de acceso.
 */
@Injectable({providedIn: 'root'})
export class TokenService {
  private readonly _token = signal<string | null>(null);
  readonly token = this._token.asReadonly();

  constructor() {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (raw) this._token.set(raw);
  }

  setToken(token: string | null): void {
    this._token.set(token);
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }
}
