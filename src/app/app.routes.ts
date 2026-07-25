import {Routes} from '@angular/router';
import {BoardComponent} from './components/board/board.component';
import {TaskFormComponent} from './components/task-form/task-form.component';
import {ProyectosComponent} from './components/proyectos/proyectos.component';
import {PlanningComponent} from './components/planning/planning.component';

export const routes: Routes = [
  {path: '', component: BoardComponent},
  {path: 'proyectos', component: ProyectosComponent},
  {path: 'planning', component: PlanningComponent},
  {path: 'tarea/nueva', component: TaskFormComponent},
  {path: '**', redirectTo: ''},
];
