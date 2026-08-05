import {Injectable, signal} from '@angular/core';
import {Usuario, USUARIOS_DEFAULT} from '../models/usuario.model';
import {esClaveLegacy, hashClave} from '../utils/cripto';

const STORAGE_KEY = 'devtracker-usuarios';

@Injectable({providedIn: 'root'})
export class UsuarioService {
  private readonly _usuarios = signal<Usuario[]>([]);
  readonly usuarios = this._usuarios.asReadonly();

  constructor() {
    this._cargar();
    this._migrarClavesLegacy();
  }

  usuarioPorId(id: string): Usuario | undefined {
    return this._usuarios().find(u => u.id === id);
  }

  usuarioPorCorreo(correo: string): Usuario | undefined {
    return this._usuarios().find(u => u.correo === correo);
  }

  async crear(data: Omit<Usuario, 'id' | 'clave'> & {clave: string}): Promise<void> {
    const nuevo: Usuario = {
      ...data,
      id: crypto.randomUUID(),
      clave: await hashClave(data.clave),
    };
    this._usuarios.update(list => [...list, nuevo]);
    this._guardar();
  }

  async actualizar(id: string, data: Partial<Omit<Usuario, 'id'>>): Promise<void> {
    const usados = {...data};
    if (data.clave) {
      usados.clave = await hashClave(data.clave);
    }
    this._usuarios.update(list =>
      list.map(u => (u.id === id ? {...u, ...usados} : u))
    );
    this._guardar();
  }

  eliminar(id: string): void {
    this._usuarios.update(list => list.filter(u => u.id !== id));
    this._guardar();
  }

  private async _migrarClavesLegacy(): Promise<void> {
    const legacy = this._usuarios().filter(u => esClaveLegacy(u.clave));
    if (legacy.length === 0) return;
    let hayCambios = false;
    for (const u of legacy) {
      if (!esClaveLegacy(u.clave)) continue;
      u.clave = await hashClave(atob(u.clave));
      hayCambios = true;
    }
    if (hayCambios) this._guardar();
  }

  private _guardar(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._usuarios()));
  }

  private _cargar(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const data = JSON.parse(raw) as Usuario[];
        this._usuarios.set(data);
        return;
      } catch { /* ignorar */ }
    }
    this._usuarios.set(USUARIOS_DEFAULT);
    this._guardar();
  }
}