import {Component, inject, ViewChild, ElementRef, HostListener, effect, AfterViewInit} from '@angular/core';
import {Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {TaskService} from '../../services/task.service';
import {ColumnService} from '../../services/column.service';
import {TaskStatus} from '../../models/task.model';
import {Columna} from '../../models/columna.model';
import {ColumnComponent} from '../column/column.component';
import {CdkDropList, CdkDrag, CdkDragHandle, CdkDragDrop} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [ColumnComponent, CdkDropList, CdkDrag, CdkDragHandle, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Tablero de tareas</h1>
          <p class="text-sm text-gray-500 mt-1">Arrastra las tareas entre columnas para cambiar su estado</p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="openColumnManager()"
                  class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            Gestionar columnas
          </button>
          <button (click)="nuevaTarea()"
                  class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
            <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Nueva Tarea
          </button>
        </div>
      </div>

      <div class="relative">
        @if (hasScroll) {
          <button (click)="scrollIzquierda()"
                  class="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-xl border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:scale-105 transition-all -ml-6"
                  aria-label="Desplazar a la izquierda">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
        }
        <div #columnasScroll
             cdkDropList
             [cdkDropListData]="columnService.columnas()"
             (cdkDropListDropped)="onDropColumna($event)"
             cdkDropListOrientation="horizontal"
             class="flex gap-6 overflow-x-auto custom-scrollbar scroll-smooth">
        @for (col of columnService.columnas(); track col.id) {
          <div cdkDrag [cdkDragData]="col" class="w-[320px] shrink-0 group">
            <div class="bg-gray-50 rounded-xl border border-gray-200 min-h-[calc(100vh-220px)] flex flex-col">
              <div cdkDragHandle
                   class="flex items-center justify-between px-4 pt-4 cursor-grab active:cursor-grabbing">
                <div class="flex items-center space-x-2 min-w-0">
                  <div class="w-3 h-3 rounded-full shrink-0" [style.background-color]="col.color"></div>
                  @if (editandoColumnaId === col.id) {
                    <input [(ngModel)]="editandoColumnaNombre"
                           (keydown.enter)="guardarEditColumna()"
                           (blur)="guardarEditColumna()"
                           (keydown.escape)="cancelarEditColumna()"
                           class="flex-1 min-w-0 px-1 py-0.5 text-lg font-semibold text-gray-800 bg-transparent border-0 border-b-2 border-indigo-500 focus:ring-0 outline-none"
                           autofocus>
                  } @else {
                    <h2 class="text-lg font-semibold text-gray-800 truncate cursor-pointer rounded px-1 py-0.5 hover:bg-gray-100 transition-colors"
                        (click)="iniciarEditColumna(col)">
                      {{ col.nombre }}
                    </h2>
                  }
                  <span class="bg-gray-200 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full shrink-0">{{ (tareasPorColumna().get(col.id) ?? []).length }}</span>
                </div>
                <div class="flex items-center gap-0.5">
                <button (mousedown)="$event.stopPropagation()" (click)="nuevaTareaEnColumna(col.id)"
                        class="p-1 text-gray-400 hover:text-indigo-500 transition-all shrink-0"
                        aria-label="Nueva tarea en esta columna">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                  </svg>
                </button>
                <button (mousedown)="$event.stopPropagation()" (click)="onEliminarColumna(col)"
                        class="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                        aria-label="Eliminar columna">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
                </div>
              </div>
              <div class="flex-1 p-4 pt-3 min-h-0">
                <app-column [columna]="col"
                            [tasks]="(tareasPorColumna().get(col.id) ?? [])"
                            [connectedDropIds]="connectedDropIds(col.id)"
                            (moveTask)="onMoverTarea($event)"
                            (viewDetail)="onViewDetail($event)"
                            (deleteTask)="onEliminarTarea($event)"/>
              </div>
            </div>
          </div>
        }
      </div>
        @if (hasScroll) {
          <button (click)="scrollDerecha()"
                  class="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-xl border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:scale-105 transition-all -mr-6"
                  aria-label="Desplazar a la derecha">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        }
      </div>
    </div>

    @if (showColumnManager) {
      <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="closeColumnManager()">
        <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-bold text-gray-900">Gestionar columnas</h2>
            <button (click)="closeColumnManager()" class="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
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
            <button (click)="agregarColumna()"
                    [disabled]="!nuevaColumnaNombre.trim()"
                    class="px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0">
              Añadir
            </button>
          </div>

          @if (deleteConfirmColumna) {
            <div class="border border-red-200 bg-red-50 rounded-lg p-4 mb-4">
              <p class="text-sm text-red-600 mb-3">
                <strong>{{ deleteConfirmColumna.nombre }}</strong> tiene
                <strong>{{ tareasEnColumna(deleteConfirmColumna.id) }}</strong> tarea(s).
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

          <div class="flex justify-end border-t border-gray-200 pt-4">
            <button (click)="closeColumnManager()"
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class BoardComponent implements AfterViewInit {
  private readonly router = inject(Router);
  protected readonly taskService = inject(TaskService);
  protected readonly columnService = inject(ColumnService);

  protected readonly tareasPorColumna = this.taskService.tareasPorColumna;

  protected readonly coloresPaleta = ['#EAB308', '#3B82F6', '#22C55E', '#A855F7', '#EC4899', '#06B6D4'];

  protected hasScroll = false;

  constructor() {
    effect(() => {
      this.columnService.columnas();
      setTimeout(() => this.actualizarEstadoScroll());
    });
  }

  ngAfterViewInit(): void {
    this.actualizarEstadoScroll();
  }

  @HostListener('window:resize')
  protected actualizarEstadoScroll(): void {
    const el = this.columnasScrollEl?.nativeElement;
    this.hasScroll = el ? el.scrollWidth > el.clientWidth : false;
  }

  protected showColumnManager = false;
  protected nuevaColumnaNombre = '';
  protected nuevaColumnaColor = '#EAB308';
  protected editandoColumnaId: string | null = null;
  protected editandoColumnaNombre = '';
  protected deleteConfirmColumna: Columna | null = null;

  @ViewChild('columnasScroll', {static: false}) columnasScrollEl!: ElementRef<HTMLElement>;

  protected scrollIzquierda(): void {
    this.columnasScrollEl?.nativeElement.scrollBy({left: -340, behavior: 'smooth'});
  }

  protected scrollDerecha(): void {
    this.columnasScrollEl?.nativeElement.scrollBy({left: 340, behavior: 'smooth'});
  }

  openColumnManager(): void {
    this.showColumnManager = true;
    this.nuevaColumnaNombre = '';
    this.nuevaColumnaColor = this.columnService.obtenerColorPorDefecto();
    this.deleteConfirmColumna = null;
    this.editandoColumnaId = null;
  }

  closeColumnManager(): void {
    this.showColumnManager = false;
    this.editandoColumnaId = null;
    this.deleteConfirmColumna = null;
  }

  agregarColumna(): void {
    const nombre = this.nuevaColumnaNombre.trim();
    if (!nombre) return;
    this.columnService.agregarColumna(nombre, this.nuevaColumnaColor);
    this.nuevaColumnaNombre = '';
    this.nuevaColumnaColor = this.columnService.obtenerColorPorDefecto();
  }

  iniciarEditColumna(col: Columna): void {
    this.editandoColumnaId = col.id;
    this.editandoColumnaNombre = col.nombre;
  }

  guardarEditColumna(): void {
    if (this.editandoColumnaId && this.editandoColumnaNombre.trim()) {
      this.columnService.renombrarColumna(this.editandoColumnaId, this.editandoColumnaNombre.trim());
    }
    this.editandoColumnaId = null;
  }

  cancelarEditColumna(): void {
    this.editandoColumnaId = null;
  }

  confirmarEliminarColumna(col: Columna): void {
    this.deleteConfirmColumna = col;
  }

  cancelarEliminarColumna(): void {
    this.deleteConfirmColumna = null;
  }

  ejecutarEliminarColumna(): void {
    if (!this.deleteConfirmColumna) return;
    this.taskService.eliminarTareasPorColumna(this.deleteConfirmColumna.id);
    this.columnService.eliminarColumna(this.deleteConfirmColumna.id);
    this.deleteConfirmColumna = null;
  }

  onDropColumna(event: CdkDragDrop<Columna[]>): void {
    this.columnService.reordenarColumnas(event.previousIndex, event.currentIndex);
  }

  protected connectedDropIds(columnaId: string): string[] {
    return this.columnService.columnas()
      .filter(c => c.id !== columnaId)
      .map(c => c.id);
  }

  protected tareasEnColumna(columnaId: string): number {
    return this.tareasPorColumna().get(columnaId)?.length ?? 0;
  }

  onMoverTarea(event: { taskId: string; newStatus: TaskStatus }): void {
    this.taskService.moverTarea(event.taskId, event.newStatus);
  }

  onViewDetail(id: string): void {
    this.router.navigate(['/tarea', id]);
  }

  onEliminarTarea(id: string): void {
    if (confirm('¿Estás seguro de eliminar esta tarea?')) {
      this.taskService.eliminarTarea(id);
    }
  }

  onEliminarColumna(col: Columna): void {
    const count = this.tareasEnColumna(col.id);
    if (count > 0) {
      if (!confirm(`"${col.nombre}" tiene ${count} tarea(s). ¿Eliminar columna y todas sus tareas?`)) return;
      this.taskService.eliminarTareasPorColumna(col.id);
    }
    this.columnService.eliminarColumna(col.id);
  }

  nuevaTarea(): void {
    this.router.navigate(['/tarea/nueva']);
  }

  nuevaTareaEnColumna(columnaId: string): void {
    this.router.navigate(['/tarea/nueva'], {queryParams: {columna: columnaId}});
  }
}
