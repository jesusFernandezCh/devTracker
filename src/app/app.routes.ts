import {Routes} from '@angular/router';
import {DashboardComponent} from './components/dashboard/dashboard.component';
import {BoardComponent} from './components/board/board.component';
import {TaskFormComponent} from './components/task-form/task-form.component';
import {TaskDetailComponent} from './components/task-detail/task-detail.component';
import {ProyectosComponent} from './components/proyectos/proyectos.component';
import {PlanningComponent} from './components/planning/planning.component';
import {CalendarioComponent} from './components/calendario/calendario.component';
import {ReportesComponent} from './components/reportes/reportes.component';
import {UsuariosComponent} from './components/usuarios/usuarios.component';
import {RolesComponent} from './components/roles/roles.component';
import {LoginComponent} from './components/login/login.component';
import {PerfilComponent} from './components/perfil/perfil.component';
import {authGuard} from './guards/auth.guard';
import {permisoGuard} from './guards/permiso.guard';

export const routes: Routes = [
  {path: 'login', component: LoginComponent},
  {path: '', component: DashboardComponent, canActivate: [authGuard]},
  {path: 'tablero', component: BoardComponent, canActivate: [authGuard]},
  {path: 'proyectos', component: ProyectosComponent, canActivate: [authGuard]},
  {path: 'planning', component: PlanningComponent, canActivate: [authGuard]},
  {path: 'calendario', component: CalendarioComponent, canActivate: [authGuard]},
  {path: 'reportes', component: ReportesComponent, canActivate: [authGuard, permisoGuard('leer', 'reportes')]},
  {path: 'usuarios', component: UsuariosComponent, canActivate: [authGuard, permisoGuard('leer', 'usuarios')]},
  {path: 'roles', component: RolesComponent, canActivate: [authGuard, permisoGuard('leer', 'roles')]},
  {path: 'tarea/nueva', component: TaskFormComponent, canActivate: [authGuard, permisoGuard('crear', 'tareas')]},
  {path: 'tarea/:id', component: TaskDetailComponent, canActivate: [authGuard]},
  {path: 'tarea/:id/editar', component: TaskFormComponent, canActivate: [authGuard, permisoGuard('editar', 'tareas')]},
  {path: 'perfil', component: PerfilComponent, canActivate: [authGuard]},
  {path: '**', redirectTo: ''},
];
