import {Injectable, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {TokenService} from './token.service';
import {Usuario} from '../../models/usuario.model';

interface RefreshResponse {
  accessToken: string | null;
  user: Usuario | null;
}

/**
 * Renueva el access token usando la cookie httpOnly de refresh. Compartido por
 * AuthService (bootstrap) y JwtInterceptor (401). Evita llamadas concurrentes.
 */
@Injectable({providedIn: 'root'})
export class RefreshService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private enProceso: Promise<boolean> | null = null;

  refrescar(): Promise<boolean> {
    if (this.enProceso) return this.enProceso;
    const resultado = firstValueFrom(
      this.http.post<RefreshResponse>('api/auth/refresh', {}, {withCredentials: true}),
    )
      .then((r) => {
        if (r.accessToken && r.user) {
          this.tokenService.setToken(r.accessToken);
          return true;
        }
        this.tokenService.setToken(null);
        return false;
      })
      .catch(() => {
        this.tokenService.setToken(null);
        return false;
      });
    this.enProceso = resultado;
    resultado.finally(() => {
      this.enProceso = null;
    });
    return resultado;
  }
}
