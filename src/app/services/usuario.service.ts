import {Injectable, signal, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {Usuario} from '../models/usuario.model';
import {EquipoService} from './equipo.service';
import {aUsuario, UsuarioDto} from './auth.service';

@Injectable({providedIn: 'root'})
export class UsuarioService {
  private readonly _usuarios = signal<Usuario[]>([]);
  readonly usuarios = this._usuarios.asReadonly();
  private readonly http = inject(HttpClient);
  private readonly equipoService = inject(EquipoService);

  usuarioPorId(id: string): Usuario | undefined {
    return this._usuarios().find(u => u.id === id);
  }

  usuarioPorCorreo(correo: string): Usuario | undefined {
    return this._usuarios().find(u => u.correo === correo);
  }

  async cargar(): Promise<void> {
    try {
      const lista = await firstValueFrom(this.http.get<UsuarioDto[]>('api/usuarios'));
      this._usuarios.set((lista ?? []).map(aUsuario));
    } catch {
      /* sin permiso para usuarios: dejar la lista como está */
    }
  }

  async crear(data: Omit<Usuario, 'id'> & {clave: string}): Promise<Usuario> {
    const creado = await firstValueFrom(
      this.http.post<UsuarioDto>('api/usuarios', this.aPayload(data)),
    );
    const usuario = aUsuario(creado);
    this._usuarios.update(list => [...list, usuario]);
    return usuario;
  }

  async actualizar(id: string, data: Partial<Omit<Usuario, 'id'>>): Promise<Usuario> {
    const actualizado = await firstValueFrom(
      this.http.patch<UsuarioDto>(`api/usuarios/${id}`, this.aPayload(data as Omit<Usuario, 'id'> & {clave?: string})),
    );
    const usuario = aUsuario(actualizado);
    this._usuarios.update(list => list.map(u => (u.id === id ? usuario : u)));
    return usuario;
  }

  async eliminar(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`api/usuarios/${id}`));
    this._usuarios.update(list => list.filter(u => u.id !== id));
    this.equipoService.eliminarUsuarioDeTodos(id);
  }

  limpiar(): void {
    this._usuarios.set([]);
  }

  private aPayload(data: Omit<Usuario, 'id'> & {clave?: string}): Record<string, unknown> {
    return {
      usuario: data.usuario,
      correo: data.correo,
      clave: data.clave,
      rolId: data.tipo,
      nombres: data.nombres,
      apellidos: data.apellidos,
      cedula: data.cedula,
      telefono: data.telefono,
      telefonoContacto: data.telefonoContacto,
      direccion: data.direccion,
      foto: data.foto,
      curriculum: data.curriculum as unknown,
    };
  }
}
