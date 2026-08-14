import {Component, inject, output, ChangeDetectionStrategy} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {CdkDropList, CdkDrag, CdkDragHandle, CdkDragDrop} from '@angular/cdk/drag-drop';
import {Dialog} from 'primeng/dialog';
import {InputText} from 'primeng/inputtext';
import {Button} from 'primeng/button';
import {ConfirmationService} from 'primeng/api';
import {ColumnService} from '../../services/column.service';
import {ProyectoService} from '../../services/proyecto.service';
import {PlanningService} from '../../services/planning.service';
import {Columna} from '../../models/columna.model';

@Component({
  selector: 'app-column-manager',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CdkDropList, CdkDrag, CdkDragHandle, Dialog, InputText, Button],
  template: `
    <p-dialog
      header="Columnas"
      [visible]="true"
      (onHide)="cerrar()"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [closeOnEscape]="true"
      [dismissableMask]="true"
      [style]="{width: '32rem'}"
      styleClass="column-manager">

      <div class="max-h-64 overflow-y-auto mb-6 -mr-2 pr-2">
        <div cdkDropList
             [id]="'column-reorder'"
             [cdkDropListData]="columnService.columnas()"
             (cdkDropListDropped)="onDropColumna($event)"
             class="space-y-2">
        @for (col of columnService.columnas(); track col.id) {
          <div cdkDrag [cdkDragData]="col" class="column-row">
            <div class="w-3 h-3 rounded-full shrink-0" [style.background-color]="col.color"></div>

            @if (editandoColumnaId === col.id) {
              <input pInputText [(ngModel)]="editandoColumnaNombre"
                     (keydown.enter)="guardarEditColumna()"
                     (blur)="guardarEditColumna()"
                     (keydown.escape)="cancelarEditColumna()"
                     class="flex-1"
                     autofocus>
            } @else {
              <span class="column-nombre" (click)="iniciarEditColumna(col)">
                {{ col.nombre }}
              </span>
            }

            <button cdkDragHandle class="handle-btn" aria-label="Arrastrar para reordenar">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 8h16M4 16h16"/>
              </svg>
            </button>
            <button (click)="confirmarEliminarColumna(col)" class="handle-btn handle-delete" aria-label="Eliminar columna">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        }
      </div>
      </div>

      <div class="flex items-center gap-2 mb-4 p-3 border rounded-lg nueva-columna-box">
        <input pInputText [(ngModel)]="nuevaColumnaNombre"
               (keydown.enter)="agregarColumna()"
               placeholder="Nombre de la nueva columna"
               class="flex-1">
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

      <div class="flex justify-end gap-2 pt-3">
        <p-button label="Añadir"
                  [disabled]="!nuevaColumnaNombre.trim()"
                  (onClick)="agregarColumna()" />
        <p-button label="Cerrar"
                  [text]="true"
                  severity="secondary"
                  (onClick)="cerrar()" />
      </div>
    </p-dialog>
  `,
  styles: [`
    :host { display: contents; }

    .column-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      border-radius: 0.5rem;
      border: 1px solid var(--color-gray-200);
      background-color: var(--color-surface);
    }

    .column-nombre {
      flex: 1;
      font-size: 0.875rem;
      color: var(--color-gray-700);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: pointer;
      border-radius: 0.375rem;
      padding: 0.125rem 0.25rem;
      transition: background-color 0.15s;
    }
    .column-nombre:hover {
      background-color: var(--color-gray-100);
    }

    .handle-btn {
      padding: 0.25rem;
      color: var(--color-gray-300);
      opacity: 0;
      transition: color 0.15s, opacity 0.15s;
      cursor: grab;
    }
    .column-row:hover .handle-btn {
      opacity: 1;
    }
    .handle-btn:hover {
      color: var(--color-gray-500);
    }
    .handle-delete {
      cursor: pointer;
    }
    .handle-delete:hover {
      color: var(--color-red-500);
    }

    .nueva-columna-box {
      border-color: var(--color-gray-200);
      background-color: var(--color-surface);
    }
  `]
})
export class ColumnManagerComponent {
  closeColumnManager = output<void>();

  protected readonly columnService = inject(ColumnService);
  private readonly proyectoService = inject(ProyectoService);
  private readonly planningService = inject(PlanningService);
  private readonly confirmationService = inject(ConfirmationService);

  protected readonly coloresPaleta = ['#EAB308', '#3B82F6', '#22C55E', '#A855F7', '#EC4899', '#06B6D4'];

  protected nuevaColumnaNombre = '';
  protected nuevaColumnaColor = '#EAB308';
  protected editandoColumnaId: string | null = null;
  protected editandoColumnaNombre = '';

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
    const count = this.proyectosEnColumna(col.id);
    this.confirmationService.confirm({
      header: 'Eliminar columna',
      message: `«${col.nombre}» tiene ${count} proyecto(s) y sus tareas. Se eliminarán junto con la columna. ¿Continuar?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.ejecutarEliminarColumna(col.id),
    });
  }

  private ejecutarEliminarColumna(colId: string): void {
    this.proyectoService.proyectos()
      .filter(p => p.columnaId === colId)
      .forEach(p => {
        const plannings = this.planningService.plannings().filter(pl => pl.proyectoId === p.id);
        plannings.forEach(pl => this.planningService.eliminar(pl.id));
        this.proyectoService.eliminar(p.id);
      });
    this.columnService.eliminarColumna(colId);
  }

  protected proyectosEnColumna(columnaId: string): number {
    return this.columnService.columnas().find(c => c.id === columnaId)
      ? this.proyectoService.proyectos().filter(p => p.columnaId === columnaId).length
      : 0;
  }
}