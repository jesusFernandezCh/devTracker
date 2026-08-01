import {Component, input, output, ChangeDetectionStrategy} from '@angular/core';
import {trigger, transition, style, animate} from '@angular/animations';
import {ProyectoConDatos} from '../../models/proyecto.model';
import {Columna} from '../../models/columna.model';
import {ProjectCardComponent} from '../project-card/project-card.component';
import {CdkDropList, CdkDrag, CdkDragDrop, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-column',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProjectCardComponent, CdkDropList, CdkDrag],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({opacity: 0, transform: 'translateY(-8px) scale(0.98)'}),
        animate('200ms ease-out', style({opacity: 1, transform: 'translateY(0) scale(1)'})),
      ]),
    ]),
  ],
  template: `
    <div cdkDropList
           [id]="columna().id"
           [cdkDropListData]="proyectos()"
           [cdkDropListConnectedTo]="connectedDropIds()"
           class="flex-1 space-y-3 overflow-y-auto custom-scrollbar min-h-[200px] p-1"
           (cdkDropListDropped)="onDrop($event)">
        @for (proj of proyectos(); track proj.proyecto.id) {
          <div cdkDrag [cdkDragData]="proj" [@slideIn]>
            <app-project-card
              [proyecto]="proj.proyecto"
              [plannings]="proj.plannings"
              [tareas]="proj.tareas"
              (viewDetail)="viewDetail.emit($event)"
              (deleteProject)="deleteProject.emit($event)"
              (toggleCompletada)="toggleCompletada.emit($event)"/>
          </div>
        }
        @empty {
          <div class="flex flex-col items-center justify-center h-32 text-gray-400">
            <svg class="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
            <span class="text-sm">Arrastra proyectos aquí</span>
          </div>
        }
      </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }
  `]
})
export class ColumnComponent {
  columna = input.required<Columna>();
  proyectos = input.required<ProyectoConDatos[]>();
  connectedDropIds = input<string[]>([]);
  moveProject = output<{ proyectoId: string; newStatus: string }>();
  viewDetail = output<string>();
  deleteProject = output<string>();
  toggleCompletada = output<string>();

  onDrop(event: CdkDragDrop<ProyectoConDatos[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      const proyectoId = event.item.data.proyecto.id;
      this.moveProject.emit({ proyectoId, newStatus: this.columna().id });
    }
  }
}
