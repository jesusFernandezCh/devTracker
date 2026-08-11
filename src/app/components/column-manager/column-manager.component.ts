import {Component, inject, output, ChangeDetectionStrategy} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {CdkDropList, CdkDrag, CdkDragHandle, CdkDragDrop} from '@angular/cdk/drag-drop';
import {ColumnService} from '../../services/column.service';
import {ProyectoService} from '../../services/proyecto.service';
import {PlanningService} from '../../services/planning.service';
import {Columna} from '../../models/columna.model';

@Component({
  selector: 'app-column-manager',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CdkDropList, CdkDrag, CdkDragHandle],
  template: `
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="cerrar()">
      <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-bold text-gray-900">Columnas</h2>
          <button (click)="cerrar()" class="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="max-h-64 overflow-y-auto mb-6 -mr-2 pr-2">
          <div cdkDropList
               [id]="'column-reorder'"
               [cdkDropListData]="columnService.columnas()"
               (cdkDropListDropped)="onDropColumna($event)"
               class="space-y-2">
          @for (col of columnService.columnas(); track col.id) {
            <div cdkDrag [cdkDragData]="col" class="flex items-center gap-2 p-2 rounded-lg bg-white border border-gray-200 group">
              <div class="w-3 h-3 rounded-full shrink-0" [style.background-color]="col.color"></div>

              @if (editandoColumnaId === col.id) {
                <input [(ngModel)]="editandoColumnaNombre"
                       (keydown.enter)="guardarEditColumna()"
                       (blur)="guardarEditColumna()"
                       (keydown.escape)="cancelarEditColumna()"
                       class="flex-1 px-2 py-1 text-sm bg-white text-gray-900 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                       autofocus>
              } @else {
                <span class="flex-1 text-sm text-gray-700 truncate cursor-pointer rounded px-1 py-0.5 hover:bg-gray-100 transition-colors"
                      (click)="iniciarEditColumna(col)">
                  {{ col.nombre }}
                </span>
              }

              <button cdkDragHandle
                      class="p-1 text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-all cursor-grab"
                      aria-label="Arrastrar para reordenar">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 8h16M4 16h16"/>
                </svg>
              </button>
              <button (click)="confirmarEliminarColumna(col)"
                      class="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      aria-label="Eliminar columna">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          }
        </div>
        </div>

        <div class="flex items-center gap-2 mb-4 p-3 bg-white border border-gray-200 rounded-lg">
          <input [(ngModel)]="nuevaColumnaNombre"
                 (keydown.enter)="agregarColumna()"
                 placeholder="Nombre de la nueva columna"
                 class="flex-1 px-3 py-2 text-sm bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
          <div class="flex gap-1 shrink-0">
            @for (color of coloresPaleta; track color) {
              <button (click)="nuevaColumnaColor = color"
                      class="w-6 h-6 rounded-full transition-transform hover:scale-110"
                      [class.ring-2]="nuevaColumnaColor === color"
                      [class.ring-indigo-500]="nuevaColumnaColor === color"
                      [class.ring-offset-2]="nuevaColumnaColor === color"
                      [style.background-color]="color"
                      [attr.aria-label]="'Color ' + color">
              </button>
            }
          </div>
        </div>

        @if (deleteConfirmColumna) {
          <div class="border border-red-200 bg-red-50 rounded-lg p-3 mb-4">
            <p class="text-sm text-red-600 mb-3">
              <strong>{{ deleteConfirmColumna.nombre }}</strong> tiene
              <strong>{{ proyectosEnColumna(deleteConfirmColumna.id) }}</strong> proyecto(s) y sus tareas.
              Se eliminarán junto con la columna. ¿Continuar?
            </p>
            <div class="flex justify-end gap-2">
              <button (click)="cancelarEliminarColumna()"
                      class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button (click)="ejecutarEliminarColumna()"
                      class="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        }

        <div class="flex justify-end gap-2 border-t border-gray-200 pt-4">
          <button (click)="agregarColumna()"
                  [disabled]="!nuevaColumnaNombre.trim()"
                  class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            Añadir
          </button>
          <button (click)="cerrar()"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: contents; }
  `]
})
export class ColumnManagerComponent {
  closeColumnManager = output<void>();

  protected readonly columnService = inject(ColumnService);
  private readonly proyectoService = inject(ProyectoService);
  private readonly planningService = inject(PlanningService);

  protected readonly coloresPaleta = ['#EAB308', '#3B82F6', '#22C55E', '#A855F7', '#EC4899', '#06B6D4'];

  protected nuevaColumnaNombre = '';
  protected nuevaColumnaColor = '#EAB308';
  protected editandoColumnaId: string | null = null;
  protected editandoColumnaNombre = '';
  protected deleteConfirmColumna: Columna | null = null;

  constructor() {
    this.nuevaColumnaColor = this.columnService.obtenerColorPorDefecto();
  }

  protected cerrar(): void {
    this.closeColumnManager.emit();
  }

  protected onDropColumna(event: CdkDragDrop<Columna[]>): void {
    this.columnService.reordenarColumnas(event.previousIndex, event.currentIndex);
  }

  protected agregarColumna(): void {
    const nombre = this.nuevaColumnaNombre.trim();
    if (!nombre) return;
    this.columnService.agregarColumna(nombre, this.nuevaColumnaColor);
    this.nuevaColumnaNombre = '';
    this.nuevaColumnaColor = this.columnService.obtenerColorPorDefecto();
  }

  protected iniciarEditColumna(col: Columna): void {
    this.editandoColumnaId = col.id;
    this.editandoColumnaNombre = col.nombre;
  }

  protected guardarEditColumna(): void {
    if (this.editandoColumnaId && this.editandoColumnaNombre.trim()) {
      this.columnService.renombrarColumna(this.editandoColumnaId, this.editandoColumnaNombre.trim());
    }
    this.editandoColumnaId = null;
  }

  protected cancelarEditColumna(): void {
    this.editandoColumnaId = null;
  }

  protected confirmarEliminarColumna(col: Columna): void {
    this.deleteConfirmColumna = col;
  }

  protected cancelarEliminarColumna(): void {
    this.deleteConfirmColumna = null;
  }

  protected ejecutarEliminarColumna(): void {
    if (!this.deleteConfirmColumna) return;
    const colId = this.deleteConfirmColumna.id;
    this.proyectoService.proyectos()
      .filter(p => p.columnaId === colId)
      .forEach(p => {
        const plannings = this.planningService.plannings().filter(pl => pl.proyectoId === p.id);
        plannings.forEach(pl => this.planningService.eliminar(pl.id));
        this.proyectoService.eliminar(p.id);
      });
    this.columnService.eliminarColumna(colId);
    this.deleteConfirmColumna = null;
  }

  protected proyectosEnColumna(columnaId: string): number {
    return this.columnService.columnas().find(c => c.id === columnaId)
      ? this.proyectoService.proyectos().filter(p => p.columnaId === columnaId).length
      : 0;
  }
}
