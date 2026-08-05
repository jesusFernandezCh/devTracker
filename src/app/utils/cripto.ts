/**
 * Utilidades para el almacenamiento seguro de contraseñas.
 *
 * Almacenamos la contraseña como `SHA-256(salt + ':' + clave)` con un salt
 * aleatorio por usuario, en formato `salt:hash` (hex). Este formato sustituye
 * al antiguo base64 (`btoa`), que NO es cifrado y no debe usarse para guardar
 * credenciales.
 *
 * Formato de almacenamiento: `"<saltHex>:<hashHex>"`.
 * La base64 nunca contiene `:`, por lo que `esClaveLegacy` distingue ambos.
 */

export function esClaveLegacy(clave: string): boolean {
  return !clave.includes(':');
}

function generarSaltHex(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

export function hashClave(clave: string): Promise<string> {
  const salt = generarSaltHex();
  return sha256Hex(`${salt}:${clave}`).then(hash => `${salt}:${hash}`);
}

export async function verificarClave(clave: string, almacenada: string): Promise<boolean> {
  if (esClaveLegacy(almacenada)) {
    return atob(almacenada) === clave;
  }
  const separador = almacenada.indexOf(':');
  const salt = almacenada.slice(0, separador);
  const hash = almacenada.slice(separador + 1);
  const hashCalculado = await sha256Hex(`${salt}:${clave}`);
  return hash === hashCalculado;
}