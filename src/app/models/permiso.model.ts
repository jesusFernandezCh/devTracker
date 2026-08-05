export type TipoUsuario = 'usuario' | 'supervisor' | 'qa' | 'administrador' | 'super-administrador';

export type Recurso =
  | 'tareas'
  | 'proyectos'
  | 'usuarios'
  | 'roles'
  | 'planning'
  | 'calendario'
  | 'tablero';

export type Accion = 'leer' | 'crear' | 'editar' | 'eliminar';

export const ACCIONES: Accion[] = ['leer', 'crear', 'editar', 'eliminar'];

const TODAS: Accion[] = ['leer', 'crear', 'editar', 'eliminar'];

export type MatrizPermisos = Partial<Record<Recurso, Accion[]>>;

/**
 * Matriz estática de permisos por rol.
 *
 * NOTA DE SEGURIDAD: Esta matriz se evalúa únicamente en el cliente. El control
 * de acceso del navegador es un filtro de UX (ocultar/mostrar) y nunca debe
 * considerarse una barrera de seguridad real. La autorización efectiva debe
 * validarse en un backend.
 */
export const PERMISOS: Record<TipoUsuario, MatrizPermisos> = {
  'super-administrador': {
    tareas: TODAS,
    proyectos: TODAS,
    usuarios: TODAS,
    roles: TODAS,
    planning: TODAS,
    calendario: TODAS,
    tablero: TODAS,
  },
  administrador: {
    tareas: TODAS,
    proyectos: TODAS,
    usuarios: TODAS,
    roles: ['leer', 'editar', 'eliminar'],
    planning: TODAS,
    calendario: TODAS,
    tablero: TODAS,
  },
  supervisor: {
    tareas: TODAS,
    proyectos: TODAS,
    usuarios: ['leer'],
    roles: ['leer'],
    planning: TODAS,
    calendario: TODAS,
    tablero: TODAS,
  },
  qa: {
    tareas: TODAS,
    proyectos: ['leer'],
    usuarios: ['leer'],
    roles: [],
    planning: ['leer'],
    calendario: ['leer'],
    tablero: ['leer'],
  },
  usuario: {
    tareas: TODAS,
    proyectos: TODAS,
    usuarios: ['leer'],
    roles: [],
    planning: ['leer'],
    calendario: ['leer'],
    tablero: ['leer'],
  },
};

const ROL_LABEL: Record<TipoUsuario, string> = {
  usuario: 'Usuario',
  supervisor: 'Supervisor',
  qa: 'QA',
  administrador: 'Administrador',
  'super-administrador': 'Super Administrador',
};

export function labelTipoUsuario(tipo: TipoUsuario): string {
  return ROL_LABEL[tipo];
}

export const ROLES_ORDEN: TipoUsuario[] = [
  'usuario',
  'qa',
  'supervisor',
  'administrador',
  'super-administrador',
];

export const RECURSOS_ORDEN: Recurso[] = [
  'tareas',
  'proyectos',
  'planning',
  'calendario',
  'tablero',
  'usuarios',
  'roles',
];

export function validarTipoUsuario(value: string): value is TipoUsuario {
  return value in ROL_LABEL;
}