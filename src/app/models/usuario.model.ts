export type TipoUsuario = 'usuario' | 'supervisor' | 'administrador' | 'super-administrador';

export interface Usuario {
  id: string;
  usuario: string;
  correo: string;
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
