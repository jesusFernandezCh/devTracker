export type TipoNotificacion = 'info' | 'exito' | 'alerta' | 'error';

export interface Notificacion {
  id: string;
  tipo: TipoNotificacion;
  leida: boolean;
  descripcion: string;
  /** Fecha ISO. */
  fecha: string;
  /** Ruta interna a la que navegar al pulsar sobre la notificación. */
  url?: string;
}
