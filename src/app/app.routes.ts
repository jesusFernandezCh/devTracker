import {Routes} from '@angular/router';
import {BoardComponent} from './components/board/board.component';
import {TaskFormComponent} from './components/task-form/task-form.component';
import {TaskDetailComponent} from './components/task-detail/task-detail.component';
import {ProyectosComponent} from './components/proyectos/proyectos.component';

export const routes: Routes = [
  {path: '', component: BoardComponent},
  {path: 'proyectos', component: ProyectosComponent},
  {path: 'tarea/nueva', component: TaskFormComponent},
  {path: 'tarea/:id', component: TaskDetailComponent},
  {path: 'tarea/:id/editar', component: TaskFormComponent},
  {path: '**', redirectTo: ''},
];
