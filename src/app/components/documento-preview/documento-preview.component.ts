import {Component, input, output, ChangeDetectionStrategy, computed} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {Documento, nombreTipoMime, iconoTipoMime, colorTipoMime} from '../../models/documento.model';

@Component({
  selector: 'app-documento-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background-color: rgba(0,0,0,0.5);" (click)="cerrar.emit()">
      <div class="modal-enter rounded-xl shadow-xl w-full max-w-4xl h-[85vh] flex flex-col border overflow-hidden"
           style="background-color: var(--color-surface); border-color: var(--color-gray-200);"
           (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between px-4 py-3 border-b shrink-0" style="border-color: var(--color-gray-200);">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                 [style.background-color]="bgColor()">
              <mat-icon class="text-lg" [style.color]="textColor()">{{ icono() }}</mat-icon>
            </div>
            <div class="min-w-0">
              <h2 class="text-sm font-bold truncate" style="color: var(--color-gray-900);">{{ documento().nombre }}</h2>
              <p class="text-xs" style="color: var(--color-gray-500);">{{ tipoLabel() }} · {{ fechaFormateada() }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button (click)="descargar()"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-[var(--color-indigo-600)] text-white hover:bg-[var(--color-indigo-700)]">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
              </svg>
              Descargar
            </button>
            <button (click)="cerrar.emit()"
                    class="p-1.5 rounded-lg transition-colors text-[var(--color-gray-400)] hover:text-[var(--color-gray-700)] hover:bg-[var(--color-gray-100)]"
                    aria-label="Cerrar">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="flex-1 min-h-0">
          @if (esPdf()) {
            <iframe [src]="archivoUrl()" class="w-full h-full border-0"></iframe>
          } @else {
            <div class="flex flex-col items-center justify-center h-full gap-4" style="color: var(--color-gray-500);">
              <mat-icon class="text-5xl" [style.color]="textColor()">{{ icono() }}</mat-icon>
              <div class="text-center">
                <p class="text-sm font-medium" style="color: var(--color-gray-700);">Vista previa no disponible</p>
                <p class="text-xs mt-1" style="color: var(--color-gray-400);">
                  Los archivos de Word no se pueden previsualizar directamente en el navegador.
                </p>
              </div>
              <button (click)="descargar()"
                      class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors bg-[var(--color-indigo-600)] hover:bg-[var(--color-indigo-700)]">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                </svg>
                Descargar para abrir
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: contents; }
  `],
})
export class DocumentoPreviewComponent {
  readonly documento = input.required<Documento>();
  readonly cerrar = output();

  protected readonly icono = computed(() => iconoTipoMime(this.documento().tipoMime));
  protected readonly tipoLabel = computed(() => nombreTipoMime(this.documento().tipoMime));
  protected readonly esPdf = computed(() => this.documento().tipoMime === 'application/pdf');
  protected readonly archivoUrl = computed(() => this.documento().archivoBase64 ?? '');
  protected readonly bgColor = computed(() => `${colorTipoMime(this.documento().tipoMime)}15`);
  protected readonly textColor = computed(() => colorTipoMime(this.documento().tipoMime));

  protected readonly fechaFormateada = computed(() => {
    const fecha = this.documento().fechaCreacion;
    if (!fecha) return '';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES', {day: 'numeric', month: 'short', year: 'numeric'});
  });

  protected descargar(): void {
    const doc = this.documento();
    if (!doc.archivoBase64) return;

    const link = document.createElement('a');
    link.href = doc.archivoBase64;
    link.download = doc.nombre;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
