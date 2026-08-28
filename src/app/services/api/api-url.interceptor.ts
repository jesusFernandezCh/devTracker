import {HttpInterceptorFn, HttpRequest} from '@angular/common/http';
import {environment} from '../../../environments/environment';

/**
 * Reescribe las URLs relativas `api/...` a la URL absoluta del backend en
 * producción. En desarrollo `environment.apiUrl` está vacío, así que las
 * peticiones quedan relativas y el proxy de Angular las redirige a :3000.
 */
export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (environment.apiUrl && req.url.startsWith('api/')) {
    return next(req.clone({url: `${environment.apiUrl}/${req.url}`}));
  }
  return next(req);
};
