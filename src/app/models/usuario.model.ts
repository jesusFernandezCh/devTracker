import {TipoUsuario} from './permiso.model';

export type {TipoUsuario} from './permiso.model';

export interface Curriculum {
  /** Nombre original del archivo. */
  nombre: string;
  /** MIME type (pdf/doc/docx). */
  tipo: string;
  /** Tamaño en bytes. */
  tamano: number;
  /** Contenido codificado como data URL base64. */
  datos: string;
}

export interface Usuario {
  id: string;
  usuario: string;
  correo: string;
  /** Id del rol (`tipo` mapea a `rolId` del backend). */
  tipo: TipoUsuario;
  /** Nombre del rol (lo resuelve el backend). */
  rol?: string;
  /** Solo se usa al crear/actualizar; el backend nunca lo devuelve. */
  clave?: string;
  nombres?: string;
  apellidos?: string;
  cedula?: string;
  telefono?: string;
  telefonoContacto?: string;
  direccion?: string;
  /** Foto de perfil como data URL (imagen JPEG redimensionada). */
  foto?: string;
  /** Curriculum vitae adjunto. */
  curriculum?: Curriculum;
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