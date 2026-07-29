import {Injectable, signal} from '@angular/core';
import {Usuario, USUARIOS_DEFAULT} from '../models/usuario.model';

const STORAGE_KEY = 'devtracker-usuarios';

@Injectable({providedIn: 'root'})
export class UsuarioService {
  private readonly _usuarios = signal<Usuario[]>([]);
  readonly usuarios = this._usuarios.asReadonly();

  constructor() { this._cargar(); }

  usuarioPorId(id: string): Usuario | undefined {
    return this._usuarios().find(u => u.id === id);
  }

  usuarioPorCorreo(correo: string): Usuario | undefined {
    return this._usuarios().find(u => u.correo === correo);
  }

  crear(data: Omit<Usuario, 'id'>): void {
    const nuevo: Usuario = {
      ...data,
      id: crypto.randomUUID(),
      clave: btoa(data.clave),
    };
    this._usuarios.update(list => [...list, nuevo]);
    this._guardar();
  }

  actualizar(id: string, data: Partial<Omit<Usuario, 'id'>>): void {
    this._usuarios.update(list =>
      list.map(u => {
        if (u.id !== id) return u;
        const cambios = {...data};
        if (cambios.clave) {
          cambios.clave = btoa(cambios.clave);
        }
        return {...u, ...cambios};
      })
    );
    this._guardar();
  }

  eliminar(id: string): void {
    this._usuarios.update(list => list.filter(u => u.id !== id));
    this._guardar();
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
