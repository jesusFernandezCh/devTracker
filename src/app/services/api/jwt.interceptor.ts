import {HttpErrorResponse, HttpInterceptorFn, HttpRequest} from '@angular/common/http';
import {inject} from '@angular/core';
import {Router} from '@angular/router';
import {catchError, from, switchMap, throwError} from 'rxjs';
import {TokenService} from './token.service';
import {RefreshService} from './refresh.service';

function conCredenciales(req: HttpRequest<unknown>): HttpRequest<unknown> {
  return req.clone({withCredentials: true});
}

/**
 * Añade `Authorization: Bearer` y `withCredentials` (cookie de refresh).
 * En un 401 renueva el token una vez y reintenta; si falla limpia la sesión
 * y redirige a /login. Los endpoints públicos de auth quedan excluidos.
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const refreshService = inject(RefreshService);
  const router = inject(Router);

  const esAuthPublico =
    req.url.includes('/auth/login') || req.url.includes('/auth/refresh');

  const token = tokenService.token();
  const autenticada = token
    ? conCredenciales(req).clone({setHeaders: {Authorization: `Bearer ${token}`}})
    : conCredenciales(req);

  if (esAuthPublico) return next(autenticada);

  return next(autenticada).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/logout')) {
        return from(refreshService.refrescar()).pipe(
          switchMap((ok) => {
            if (!ok) {
              tokenService.setToken(null);
              if (!req.url.includes('/auth/me')) {
                router.navigate(['/login']);
              }
              return throwError(() => error);
            }
            const nuevo = tokenService.token();
            const reintento = nuevo
              ? conCredenciales(req).clone({setHeaders: {Authorization: `Bearer ${nuevo}`}})
              : conCredenciales(req);
            return next(reintento);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};
