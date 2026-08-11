import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {AuthService} from '../services/auth.service';
import {PermisoService} from '../services/permiso.service';
import {Accion, Recurso} from '../models/permiso.model';

/**
 * Guard de permisos: permite la navegación solo si el usuario autenticado tiene
 * el permiso solicitado. En caso contrario redirige al dashboard.
 *
 * NOTA DE SEGURIDAD: este guard es una medida de UX. La autorización real debe
 * validarse en el servidor.
 */
export function permisoGuard(accion: Accion, recurso: Recurso): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const permiso = inject(PermisoService);
    const router = inject(Router);

    if (!auth.isLoggedIn()) {
      return router.parseUrl('/login');
    }
    if (permiso.puedeUsuarioActual(accion, recurso)) {
      return true;
    }
    return router.parseUrl('/');
  };
}