import { ApplicationConfig, provideZoneChangeDetection, provideEnvironmentInitializer } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHighcharts } from 'highcharts-angular';
import { provideNativeDateAdapter } from '@angular/material/core';

import { routes } from './app.routes';
import { jwtInterceptor } from './services/api/jwt.interceptor';
import { apiUrlInterceptor } from './services/api/api-url.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideHighcharts(),
    provideNativeDateAdapter(),
    provideHttpClient(withInterceptors([apiUrlInterceptor, jwtInterceptor])),
    provideEnvironmentInitializer(() => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .getRegistrations()
          .then((registrations) => registrations.forEach((r) => r.unregister()));
      }
    }),
  ]
};
