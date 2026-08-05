import {TipoUsuario} from './permiso.model';

export type {TipoUsuario} from './permiso.model';

export interface Usuario {
  id: string;
  usuario: string;
  correo: string;
  /** Hash `salt:hash` (SHA-256). Se mantienen claves base64 legacy hasta migrar. */
  clave: string;
  tipo: TipoUsuario;
}

export const USUARIOS_DEFAULT: Usuario[] = [
  {
    id: 'super-admin',
    usuario: 'admin',
    correo: 'admin@devtracker.app',
    clave: btoa('admin123'),
    tipo: 'super-administrador',
  },
];