import {Component, input, output} from '@angular/core';
import {trigger, transition, style, animate} from '@angular/animations';
import {Task} from '../../models/task.model';
import {Columna} from '../../models/columna.model';
import {TaskCardComponent} from '../task-card/task-card.component';
import {CdkDropList, CdkDrag, CdkDragDrop, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-column',
  standalone: true,
  imports: [TaskCardComponent, CdkDropList, CdkDrag],
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
           [cdkDropListData]="tasks()"
           [cdkDropListConnectedTo]="connectedDropIds()"
           class="flex-1 space-y-3 overflow-y-auto min-h-[200px] p-1"
           (cdkDropListDropped)="onDrop($event)">
        @for (task of tasks(); track task.id) {
          <div cdkDrag [cdkDragData]="task" [@slideIn]>
            <app-task-card [tarea]="task" (viewDetail)="viewDetail.emit($event)" (deleteTask)="deleteTask.emit($event)"/>
          </div>
        }
        @empty {
          <div class="flex flex-col items-center justify-center h-32 text-gray-400">
            <svg class="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6m-3 4v6m-3-3h6"/>
            </svg>
            <span class="text-sm">Arrastra tareas aquí</span>
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
  tasks = input.required<Task[]>();
  connectedDropIds = input<string[]>([]);
  moveTask = output<{ taskId: string; newStatus: string }>();
  viewDetail = output<string>();
  deleteTask = output<string>();

  onDrop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      const taskId = event.item.data.id;
      this.moveTask.emit({ taskId, newStatus: this.columna().id });
    }
  }
}
