import {Routes} from '@angular/router';
import {BoardComponent} from './components/board/board.component';
import {TaskFormComponent} from './components/task-form/task-form.component';
import {TaskDetailComponent} from './components/task-detail/task-detail.component';

export const routes: Routes = [
  {path: '', component: BoardComponent},
  {path: 'tarea/nueva', component: TaskFormComponent},
  {path: 'tarea/:id', component: TaskDetailComponent},
  {path: 'tarea/:id/editar', component: TaskFormComponent},
  {path: '**', redirectTo: ''},
];
