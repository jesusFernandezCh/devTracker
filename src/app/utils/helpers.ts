export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function generarId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
  return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
}

export function tipoColor(tipo: string): {text: string; bg: string} {
  switch (tipo) {
    case 'super-administrador': return {text: '#ffffff', bg: 'var(--color-header)'};
    case 'administrador': return {text: '#ffffff', bg: 'var(--color-header)'};
    case 'supervisor': return {text: '#ffffff', bg: 'var(--color-header)'};
    case 'qa': return {text: '#ffffff', bg: 'var(--color-blue-500)'};
    case 'usuario': return {text: '#ffffff', bg: 'var(--color-blue-500)'};
    default: return {text: '#ffffff', bg: 'var(--color-teal-200)'};
  }
}
