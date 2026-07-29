import {Routes} from '@angular/router';
import {DashboardComponent} from './components/dashboard/dashboard.component';
import {BoardComponent} from './components/board/board.component';
import {TaskFormComponent} from './components/task-form/task-form.component';
import {TaskDetailComponent} from './components/task-detail/task-detail.component';
import {ProyectosComponent} from './components/proyectos/proyectos.component';
import {PlanningComponent} from './components/planning/planning.component';
import {CalendarioComponent} from './components/calendario/calendario.component';
import {UsuariosComponent} from './components/usuarios/usuarios.component';
import {LoginComponent} from './components/login/login.component';
import {authGuard} from './guards/auth.guard';

export const routes: Routes = [
  {path: 'login', component: LoginComponent},
  {path: '', component: DashboardComponent, canActivate: [authGuard]},
  {path: 'tablero', component: BoardComponent, canActivate: [authGuard]},
  {path: 'proyectos', component: ProyectosComponent, canActivate: [authGuard]},
  {path: 'planning', component: PlanningComponent, canActivate: [authGuard]},
  {path: 'calendario', component: CalendarioComponent, canActivate: [authGuard]},
  {path: 'usuarios', component: UsuariosComponent, canActivate: [authGuard]},
  {path: 'tarea/nueva', component: TaskFormComponent, canActivate: [authGuard]},
  {path: 'tarea/:id', component: TaskDetailComponent, canActivate: [authGuard]},
  {path: 'tarea/:id/editar', component: TaskFormComponent, canActivate: [authGuard]},
  {path: '**', redirectTo: ''},
];
