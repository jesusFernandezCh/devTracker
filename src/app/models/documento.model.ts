export interface Documento {
  id: string;
  nombre: string;
  descripcion: string;
  archivoBase64: string;
  tipoMime: string;
  proyectoId: string;
  fechaCreacion: string;
  fechaModificacion: string;
  autorId: string;
}

export const TIPOS_ARCHIVO_PERMITIDOS: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

export const ARCHIVO_EXTENSIONS = '.pdf,.doc,.docx';

export const TAMANO_MAXIMO_BYTES = 10 * 1024 * 1024;

export function nombreTipoMime(tipoMime: string): string {
  switch (tipoMime) {
    case 'application/pdf': return 'PDF';
    case 'application/msword': return 'DOC';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': return 'DOCX';
    default: return 'Otro';
  }
}

export function iconoTipoMime(tipoMime: string): string {
  switch (tipoMime) {
    case 'application/pdf': return 'picture_as_pdf';
    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': return 'description';
    default: return 'insert_drive_file';
  }
}

export function colorTipoMime(tipoMime: string): string {
  switch (tipoMime) {
    case 'application/pdf': return '#ef4444';
    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': return '#3b82f6';
    default: return '#6b7280';
  }
}
