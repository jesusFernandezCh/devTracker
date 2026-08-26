import {Directive, TemplateRef, ViewContainerRef, inject, effect, input, OnDestroy} from '@angular/core';
import {PermisoService} from '../services/permiso.service';
import {AuthService} from '../services/auth.service';
import {Accion, Recurso} from '../models/permiso.model';

/**
 * Directiva estructural de permisos. Oculta el contenido si el usuario actual
 * no tiene el permiso solicitado.
 *
 * Uso:
 *   <button *appPermiso="'editar'; recurso: 'tareas'">Editar</button>
 *
 * NOTA DE SEGURIDAD: es una medida de UX. La autorización real debe validarse
 * en el servidor.
 */
@Directive({selector: '[appPermiso]', standalone: true})
export class PermisoDirective implements OnDestroy {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly permisoService = inject(PermisoService);
  private readonly authService = inject(AuthService);

  readonly accion = input.required<Accion>({alias: 'appPermiso'});
  readonly recurso = input<Recurso | undefined>(undefined, {alias: 'appPermisoRecurso'});

  private readonly efecto = effect(() => {
    const accion = this.accion();
    const recurso = this.recurso();
    const tipo = this.authService.currentUser()?.tipo;
    const permitido = recurso && this.permisoService.puede(accion, recurso, tipo);
    this.viewContainer.clear();
    if (permitido) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  });

  ngOnDestroy(): void {
    this.viewContainer.clear();
  }
}