/** Identificador de rol. Actualmente los roles son dinámicos y se referencian por su id. */
export type TipoUsuario = string;

export type Recurso =
  | 'tareas'
  | 'proyectos'
  | 'usuarios'
  | 'roles'
  | 'planning'
  | 'calendario'
  | 'tablero'
  | 'reportes';

export type Accion = 'leer' | 'crear' | 'editar' | 'eliminar';

export const ACCIONES: Accion[] = ['leer', 'crear', 'editar', 'eliminar'];

const TODAS: Accion[] = ['leer', 'crear', 'editar', 'eliminar'];

export type MatrizPermisos = Partial<Record<Recurso, Accion[]>>;

export const ROL_SUPER_ADMIN_ID = 'super-administrador';

export interface Rol {
  id: string;
  nombre: string;
  /** Rol de sistema (semilla). El super-administrador nunca se renombra ni elimina. */
  sistema: boolean;
}

export const ROLES_DEFAULT: Rol[] = [
  {id: ROL_SUPER_ADMIN_ID, nombre: 'Super Administrador', sistema: true},
  {id: 'administrador', nombre: 'Administrador', sistema: true},
  {id: 'supervisor', nombre: 'Supervisor', sistema: true},
  {id: 'qa', nombre: 'QA', sistema: true},
  {id: 'usuario', nombre: 'Usuario', sistema: true},
];

/**
 * Matriz de permisos por defecto (por id de rol).
 *
 * NOTA DE SEGURIDAD: Esta matriz se evalúa únicamente en el cliente. El control
 * de acceso del navegador es un filtro de UX (ocultar/mostrar) y nunca debe
 * considerarse una barrera de seguridad real. La autorización efectiva debe
 * validarse en un backend.
 */
export const PERMISOS: Record<TipoUsuario, MatrizPermisos> = {
  [ROL_SUPER_ADMIN_ID]: {
    tareas: TODAS,
    proyectos: TODAS,
    usuarios: TODAS,
    roles: TODAS,
    planning: TODAS,
    calendario: TODAS,
    tablero: TODAS,
    reportes: TODAS,
  },
  administrador: {
    tareas: TODAS,
    proyectos: TODAS,
    usuarios: TODAS,
    roles: ['leer', 'editar', 'eliminar'],
    planning: TODAS,
    calendario: TODAS,
    tablero: TODAS,
    reportes: TODAS,
  },
  supervisor: {
    tareas: TODAS,
    proyectos: TODAS,
    usuarios: ['leer'],
    roles: ['leer'],
    planning: TODAS,
    calendario: TODAS,
    tablero: TODAS,
    reportes: ['leer'],
  },
  qa: {
    tareas: TODAS,
    proyectos: ['leer'],
    usuarios: ['leer'],
    roles: [],
    planning: ['leer'],
    calendario: ['leer'],
    tablero: ['leer'],
    reportes: ['leer'],
  },
  usuario: {
    tareas: TODAS,
    proyectos: TODAS,
    usuarios: ['leer'],
    roles: [],
    planning: ['leer'],
    calendario: ['leer'],
    tablero: ['leer'],
    reportes: ['leer'],
  },
};

/** Nombre por defecto de un rol de sistema, si existe. */
export function labelRolDefault(id: string): string | undefined {
  return ROLES_DEFAULT.find(r => r.id === id)?.nombre;
}

export const RECURSOS_ORDEN: Recurso[] = [
  'tareas',
  'proyectos',
  'planning',
  'calendario',
  'tablero',
  'reportes',
  'usuarios',
  'roles',
];
