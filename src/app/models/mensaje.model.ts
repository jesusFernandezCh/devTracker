export type CanalChat = 'general' | 'privado';

export interface Mensaje {
  id: string;
  canal: CanalChat;
  autorId: string;
  /** Requerido cuando `canal === 'privado'`: id del otro participante. */
  destinoId?: string;
  texto: string;
  /** Fecha ISO. */
  fecha: string;
  leido: boolean;
}
