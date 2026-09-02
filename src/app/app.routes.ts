import {Routes} from '@angular/router';
import {authGuard} from './guards/auth.guard';
import {permisoGuard} from './guards/permiso.guard';

export const routes: Routes = [
  {path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)},
  {path: 'registro', loadComponent: () => import('./components/registro/registro.component').then(m => m.RegistroComponent)},
  {path: '', loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [authGuard]},
  {path: 'tablero', loadComponent: () => import('./components/board/board.component').then(m => m.BoardComponent), canActivate: [authGuard]},
  {path: 'proyectos', loadComponent: () => import('./components/proyectos/proyectos.component').then(m => m.ProyectosComponent), canActivate: [authGuard]},
  {path: 'planning', loadComponent: () => import('./components/planning/planning.component').then(m => m.PlanningComponent), canActivate: [authGuard]},
  {path: 'calendario', loadComponent: () => import('./components/calendario/calendario.component').then(m => m.CalendarioComponent), canActivate: [authGuard]},
  {path: 'reportes', loadComponent: () => import('./components/reportes/reportes.component').then(m => m.ReportesComponent), canActivate: [authGuard, permisoGuard('leer', 'reportes')]},
  {path: 'documentacion', loadComponent: () => import('./components/documentacion/documentacion.component').then(m => m.DocumentacionComponent), canActivate: [authGuard]},
  {path: 'usuarios', loadComponent: () => import('./components/usuarios/usuarios.component').then(m => m.UsuariosComponent), canActivate: [authGuard, permisoGuard('leer', 'usuarios')]},
  {path: 'roles', loadComponent: () => import('./components/roles/roles.component').then(m => m.RolesComponent), canActivate: [authGuard, permisoGuard('leer', 'roles')]},
  {path: 'tarea/nueva', loadComponent: () => import('./components/task-form/task-form.component').then(m => m.TaskFormComponent), canActivate: [authGuard, permisoGuard('crear', 'tareas')]},
  {path: 'tarea/:id', loadComponent: () => import('./components/task-detail/task-detail.component').then(m => m.TaskDetailComponent), canActivate: [authGuard]},
  {path: 'tarea/:id/editar', loadComponent: () => import('./components/task-form/task-form.component').then(m => m.TaskFormComponent), canActivate: [authGuard, permisoGuard('editar', 'tareas')]},
  {path: 'perfil', loadComponent: () => import('./components/perfil/perfil.component').then(m => m.PerfilComponent), canActivate: [authGuard]},
  {path: '**', redirectTo: ''},
];
