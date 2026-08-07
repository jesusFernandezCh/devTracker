export type CanalChat = 'general' | 'privado' | 'grupo';

export interface Mensaje {
  id: string;
  canal: CanalChat;
  autorId: string;
  /** Requerido cuando `canal === 'privado'`: id del otro participante. */
  destinoId?: string;
  /** Requerido cuando `canal === 'grupo'`: id del proyecto del grupo. */
  proyectoId?: string;
  texto: string;
  /** Fecha ISO. */
  fecha: string;
  leido: boolean;
}
