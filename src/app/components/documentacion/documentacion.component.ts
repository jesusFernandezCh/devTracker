import {Component, inject, ChangeDetectionStrategy, signal, computed} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {DocumentoService} from '../../services/documento.service';
import {ProyectoService} from '../../services/proyecto.service';
import {AuthService} from '../../services/auth.service';
import {EquipoService} from '../../services/equipo.service';
import {NotificacionService} from '../../services/notificacion.service';
import {Documento, nombreTipoMime, iconoTipoMime, colorTipoMime} from '../../models/documento.model';
import {Proyecto} from '../../models/proyecto.model';
import {DocumentoFormComponent} from '../documento-form/documento-form.component';
import {DocumentoPreviewComponent} from '../documento-preview/documento-preview.component';
import {PermisoDirective} from '../../directives/permiso.directive';

interface ProyectoAccordion {
  proyecto: Proyecto;
  documentos: Documento[];
  expandido: boolean;
}

@Component({
  selector: 'app-documentacion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, DocumentoFormComponent, DocumentoPreviewComponent, PermisoDirective],
  template: `
    <div class="row align-items-center mb-8">
      <div class="col-12 col-md">
        <h1 class="text-3xl font-bold" style="color: var(--color-gray-900)">
          Documentación
        </h1>
        <p class="mt-1 text-sm" style="color: var(--color-gray-500)">
          {{ totalDocumentos() }} documento{{ totalDocumentos() !== 1 ? 's' : '' }} en {{ proyectosAccordion().length }} proyecto{{ proyectosAccordion().length !== 1 ? 's' : '' }}
        </p>
      </div>
      <div class="col-12 col-md-auto mt-3 mt-md-0 d-flex align-items-center gap-2">
        <button *appPermiso="'crear'; recurso: 'reportes'" (click)="abrirNuevo()"
                class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors shadow-sm bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-700)]">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          <span class="d-none d-sm-inline">Documento</span>
        </button>
      </div>
    </div>

    @if (proyectosAccordion().length === 0) {
      <div class="text-center py-20">
        <svg class="w-16 h-16 mx-auto mb-4" style="color: var(--color-gray-300)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m0-3h6m-6 6h6M5.625 4.5H14.25c.621 0 1.125.504 1.125 1.125v5.25c0 .621-.504 1.125-1.125 1.125H5.625c-.621 0-1.125-.504-1.125-1.125v-5.25c0-.621.504-1.125 1.125-1.125z"/>
        </svg>
        <h3 class="text-lg font-medium mb-2" style="color: var(--color-gray-500)">
          No hay documentos
        </h3>
        <p class="text-sm mb-6" style="color: var(--color-gray-400)">
          No tienes proyectos asociados con documentos.
        </p>
      </div>
    } @else {
      <div class="flex flex-col gap-2">
        @for (item of proyectosAccordion(); track item.proyecto.id) {
          <div class="rounded-xl border overflow-hidden transition-colors"
               style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
            <button (click)="toggleProyecto(item)"
                    class="w-full flex items-center gap-3 px-4 sm:px-6 py-2 text-left transition-colors hover:bg-[var(--color-gray-50)]"
                    [attr.aria-expanded]="item.expandido"
                    [attr.aria-controls]="'docs-' + item.proyecto.id">
              <svg class="w-5 h-5 shrink-0 transition-transform duration-200"
                   [class.rotate-90]="item.expandido"
                   style="color: var(--color-gray-400);"
                   fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
              </svg>
              <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                   style="background-color: var(--color-indigo-600) + '15';">
                <mat-icon class="text-lg" style="color: var(--color-indigo-600);">folder</mat-icon>
              </div>
              <div class="flex-1 min-w-0">
                <span class="text-sm font-semibold block truncate" style="color: var(--color-gray-900);">
                  {{ item.proyecto.nombre }}
                </span>
                <span class="text-xs" style="color: var(--color-gray-400);">
                  {{ item.documentos.length }} documento{{ item.documentos.length !== 1 ? 's' : '' }}
                </span>
              </div>
              <div class="shrink-0">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                      style="color: var(--color-indigo-600); background-color: var(--color-indigo-600) + '15';">
                  {{ item.documentos.length }}
                </span>
              </div>
            </button>

            @if (item.expandido) {
              <div [id]="'docs-' + item.proyecto.id"
                   class="border-t"
                   style="border-color: var(--color-gray-100);">
                @if (item.documentos.length === 0) {
                  <div class="px-6 py-8 text-center">
                    <p class="text-sm" style="color: var(--color-gray-400);">
                      Este proyecto no tiene documentos.
                    </p>
                  </div>
                } @else {
                  <div class="overflow-x-auto">
                    <table class="w-full min-w-[650px]">
                      <thead>
                        <tr style="border-bottom: 1px solid var(--color-gray-100);">
                          <th class="text-left px-4 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Nombre</th>
                          <th class="text-left px-4 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Tipo</th>
                          <th class="text-left px-4 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Fecha</th>
                          <th class="text-right px-4 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-gray-400);">Acciones</th>
                        </tr>
                      </thead>
                      <tbody style="border-top: 1px solid var(--color-gray-100);">
                        @for (doc of item.documentos; track doc.id) {
                          <tr class="doc-row" style="transition: background-color 0.15s;">
                            <td class="px-4 sm:px-6 py-2.5 border-l-2 transition-all duration-200 hover:border-[rgba(99,102,241,1)] hover:pl-7"
                                [style.border-color]="colorTipoMime(doc.tipoMime) + '80'">
                              <button (click)="abrirPreview(doc)"
                                      class="flex items-center gap-3 text-left group"
                                      [attr.aria-label]="'Ver ' + doc.nombre">
                                <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                     [style.background-color]="colorTipoMime(doc.tipoMime) + '15'">
                                  <mat-icon class="text-base" [style.color]="colorTipoMime(doc.tipoMime)">{{ iconoTipoMime(doc.tipoMime) }}</mat-icon>
                                </div>
                                <div class="min-w-0">
                                  <span class="text-sm font-medium transition-colors block truncate max-w-[280px] group-hover:text-[var(--color-indigo-600)]" style="color: var(--color-gray-900);">{{ doc.nombre }}</span>
                                  @if (doc.descripcion) {
                                    <span class="text-xs block truncate max-w-[280px]" style="color: var(--color-gray-400);">{{ doc.descripcion }}</span>
                                  }
                                </div>
                              </button>
                            </td>
                            <td class="px-4 sm:px-6 py-2.5">
                              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                                    [style.color]="colorTipoMime(doc.tipoMime)"
                                    [style.background-color]="colorTipoMime(doc.tipoMime) + '15'">
                                {{ nombreTipoMime(doc.tipoMime) }}
                              </span>
                            </td>
                            <td class="px-4 sm:px-6 py-2.5">
                              <span class="text-sm whitespace-nowrap" style="color: var(--color-gray-500);">{{ fechaCorta(doc.fechaCreacion) }}</span>
                            </td>
                            <td class="px-4 sm:px-6 py-2.5 text-right">
                              <div class="flex items-center justify-end gap-1">
                                <button (click)="abrirPreview(doc)"
                                        class="p-2 rounded-lg transition-colors text-[var(--color-gray-400)] hover:text-[var(--color-indigo-600)] hover:bg-[var(--color-gray-100)]"
                                        [attr.aria-label]="'Previsualizar ' + doc.nombre"
                                        title="Previsualizar">
                                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                  </svg>
                                </button>
                                <button (click)="descargar(doc)"
                                        class="p-2 rounded-lg transition-colors text-[var(--color-gray-400)] hover:text-[var(--color-teal-600)] hover:bg-[var(--color-gray-100)]"
                                        [attr.aria-label]="'Descargar ' + doc.nombre"
                                        title="Descargar">
                                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                                  </svg>
                                </button>
                                <button *appPermiso="'editar'; recurso: 'reportes'" (click)="abrirEditar(doc)"
                                        class="p-2 rounded-lg transition-colors text-[var(--color-gray-400)] hover:text-[var(--color-teal-600)] hover:bg-[var(--color-gray-100)]"
                                        [attr.aria-label]="'Editar ' + doc.nombre"
                                        title="Editar">
                                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/>
                                  </svg>
                                </button>
                                <button *appPermiso="'eliminar'; recurso: 'reportes'" (click)="confirmarEliminar(doc)"
                                        class="p-2 rounded-lg transition-colors text-[var(--color-gray-400)] hover:text-[var(--color-rose-600)] hover:bg-[var(--color-gray-100)]"
                                        [attr.aria-label]="'Eliminar ' + doc.nombre"
                                        title="Eliminar">
                                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>
    }

    @if (previewDoc()) {
      <app-documento-preview [documento]="previewDoc()!" (cerrar)="previewDoc.set(null)"/>
    }

    @if (showForm) {
      <app-documento-form [editando]="editandoDoc"
                          (guardar)="onGuardar($event)"
                          (cerrar)="cerrarForm()"/>
    }

    @if (deleteConfirmDoc(); as doc) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background-color: rgba(0,0,0,0.4);">
        <div class="modal-enter rounded-xl shadow-xl p-6 w-full max-w-sm border" style="background-color: var(--color-surface); border-color: var(--color-gray-200);">
          <h3 class="text-lg font-semibold mb-2" style="color: var(--color-gray-900);">Eliminar documento</h3>
          <p class="text-sm mb-6" style="color: var(--color-gray-500);">
            ¿Eliminar «{{ doc.nombre }}»? Esta acción no se puede deshacer.
          </p>
          <div class="flex justify-end gap-3">
            <button (click)="cancelarEliminar()"
                    class="px-4 py-2 text-sm font-medium rounded-lg transition-colors text-[var(--color-gray-700)] bg-[var(--color-gray-100)] hover:bg-[var(--color-gray-200)]">
              Cancelar
            </button>
            <button (click)="ejecutarEliminar()"
                    class="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors bg-[var(--color-rose-600)] hover:bg-[var(--color-rose-700)]">
              Eliminar
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .doc-row:hover {
      background-color: var(--color-gray-50);
    }
  `],
})
export class DocumentacionComponent {
  private documentoService = inject(DocumentoService);
  private proyectoService = inject(ProyectoService);
  private authService = inject(AuthService);
  private equipoService = inject(EquipoService);
  private notificacionService = inject(NotificacionService);

  protected readonly documentos = this.documentoService.documentos;

  protected readonly nombreTipoMime = nombreTipoMime;
  protected readonly iconoTipoMime = iconoTipoMime;
  protected readonly colorTipoMime = colorTipoMime;

  protected showForm = false;
  protected editandoDoc: Documento | null = null;

  protected readonly previewDoc = signal<Documento | null>(null);
  protected readonly deleteConfirmDoc = signal<Documento | null>(null);

  private readonly _expandedIds = signal<Set<string>>(new Set());

  private readonly _proyectosAsociados = computed(() => {
    const userId = this.authService.currentUser()?.id;
    if (!userId) return [];
    const ids = this.equipoService.proyectosDe(userId);
    return this.proyectoService.proyectos().filter((p) => ids.includes(p.id));
  });

  protected readonly proyectosAccordion = computed<ProyectoAccordion[]>(() => {
    const proyectos = this._proyectosAsociados();
    const docs = this.documentos();
    const expanded = this._expandedIds();
    return proyectos.map((proyecto) => ({
      proyecto,
      documentos: docs.filter((d) => d.proyectoId === proyecto.id),
      expandido: expanded.has(proyecto.id),
    }));
  });

  protected readonly totalDocumentos = computed(() =>
    this.proyectosAccordion().reduce((sum, p) => sum + p.documentos.length, 0)
  );

  fechaCorta(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', {day: 'numeric', month: 'short', year: 'numeric'});
  }

  toggleProyecto(item: ProyectoAccordion): void {
    this._expandedIds.update((set) => {
      const next = new Set(set);
      if (next.has(item.proyecto.id)) {
        next.delete(item.proyecto.id);
      } else {
        next.add(item.proyecto.id);
      }
      return next;
    });
  }

  abrirNuevo(): void {
    this.editandoDoc = null;
    this.showForm = true;
  }

  abrirEditar(doc: Documento): void {
    this.editandoDoc = doc;
    this.showForm = true;
  }

  abrirPreview(doc: Documento): void {
    this.previewDoc.set(doc);
  }

  cerrarForm(): void {
    this.showForm = false;
    this.editandoDoc = null;
  }

  onGuardar(data: {nombre: string; descripcion: string; proyectoId: string; archivoBase64: string; tipoMime: string}): void {
    if (this.editandoDoc) {
      this.documentoService.actualizar(this.editandoDoc.id, data);
      this.notificacionService.notificar({tipo: 'info', descripcion: `Documento «${data.nombre}» actualizado`, url: '/documentacion'});
    } else {
      this.documentoService.crear(data);
      this.notificacionService.notificar({tipo: 'exito', descripcion: `Documento «${data.nombre}» subido`, url: '/documentacion'});
    }
    this.cerrarForm();
  }

  confirmarEliminar(doc: Documento): void {
    this.deleteConfirmDoc.set(doc);
  }

  ejecutarEliminar(): void {
    const doc = this.deleteConfirmDoc();
    if (doc) {
      this.documentoService.eliminar(doc.id);
      this.notificacionService.notificar({tipo: 'alerta', descripcion: `Documento «${doc.nombre}» eliminado`});
    }
    this.deleteConfirmDoc.set(null);
  }

  cancelarEliminar(): void {
    this.deleteConfirmDoc.set(null);
  }

  descargar(doc: Documento): void {
    if (!doc.archivoBase64) return;
    const link = document.createElement('a');
    link.href = doc.archivoBase64;
    link.download = doc.nombre;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
