import {Injectable, signal, computed, inject} from '@angular/core';
import {Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {Usuario} from '../models/usuario.model';
import {Accion, Recurso} from '../models/permiso.model';
import {TokenService} from './api/token.service';
import {RefreshService} from './api/refresh.service';
import {PermisoService} from './permiso.service';
import {UsuarioService} from './usuario.service';
import {RolService} from './rol.service';
import {ProyectoService} from './proyecto.service';
import {ColumnService} from './column.service';
import {PlanningService} from './planning.service';
import {EquipoService} from './equipo.service';
import {NotificacionService} from './notificacion.service';
import {ChatService} from './chat.service';
import {ClienteService} from './cliente.service';
import {DocumentoService} from './documento.service';

export interface UsuarioDto {
  id: string;
  usuario: string;
  correo: string;
  rolId: string;
  rol: string;
  nombres?: string | null;
  apellidos?: string | null;
  cedula?: string | null;
  telefono?: string | null;
  telefonoContacto?: string | null;
  direccion?: string | null;
  foto?: string | null;
  curriculum?: unknown;
}

export interface MeResponse extends UsuarioDto {
  permisos: Partial<Record<Recurso, Accion[]>>;
}

export function aUsuario(dto: UsuarioDto): Usuario {
  return {
    id: dto.id,
    usuario: dto.usuario,
    correo: dto.correo,
    tipo: dto.rolId,
    rol: dto.rol,
    nombres: dto.nombres ?? undefined,
    apellidos: dto.apellidos ?? undefined,
    cedula: dto.cedula ?? undefined,
    telefono: dto.telefono ?? undefined,
    telefonoContacto: dto.telefonoContacto ?? undefined,
    direccion: dto.direccion ?? undefined,
    foto: dto.foto ?? undefined,
    curriculum: dto.curriculum as Usuario['curriculum'],
  };
}

@Injectable({providedIn: 'root'})
export class AuthService {
  private readonly _currentUser = signal<Usuario | null>(null);
  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this._currentUser() !== null);
  private readonly _sesionCargada = signal(false);
  readonly sesionCargada = this._sesionCargada.asReadonly();

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenService = inject(TokenService);
  private readonly refreshService = inject(RefreshService);
  private readonly permisoService = inject(PermisoService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly rolService = inject(RolService);
  private readonly proyectoService = inject(ProyectoService);
  private readonly columnService = inject(ColumnService);
  private readonly planningService = inject(PlanningService);
  private readonly equipoService = inject(EquipoService);
  private readonly notificacionService = inject(NotificacionService);
  private readonly chatService = inject(ChatService);
  private readonly clienteService = inject(ClienteService);
  private readonly documentoService = inject(DocumentoService);

  private _promesaCarga: Promise<void> | null = null;

  constructor() {
    this.recargarSesion();
  }

  /** Espera a que termine el bootstrap de sesión (refresh + /auth/me). */
  sesionLista(): Promise<void> {
    return this._promesaCarga ?? Promise.resolve();
  }

  async recargarSesion(): Promise<void> {
    if (!this._promesaCarga) {
      this._promesaCarga = this._cargarSesionDesdeServidor();
    }
    await this._promesaCarga;
    this._promesaCarga = null;
  }

  async login(correo: string, clave: string): Promise<boolean> {
    try {
      const r = await firstValueFrom(
        this.http.post<{accessToken: string; user: UsuarioDto}>('api/auth/login', {correo, clave}, {withCredentials: true}),
      );
      this.tokenService.setToken(r.accessToken);
      await this._aplicarSesion();
      return true;
    } catch {
      return false;
    }
  }

  /** Login social: el backend no tiene proveedores OAuth, así que devuelve false. */
  async loginSocial(_proveedor: 'google' | 'facebook'): Promise<void> {
    return;
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post('api/auth/logout', {}, {withCredentials: true}));
    } catch {
      /* ignorar: la cookie puede no existir */
    }
    this._limpiarSesion();
    this.router.navigate(['/login']);
  }

  private async _cargarSesionDesdeServidor(): Promise<void> {
    try {
      const ok = await this.refreshService.refrescar();
      if (!ok) return;
      await this._aplicarSesion();
    } catch {
      this._limpiarSesion();
    } finally {
      this._sesionCargada.set(true);
    }
  }

  private async _aplicarSesion(): Promise<void> {
    const me = await firstValueFrom(this.http.get<MeResponse>('api/auth/me', {withCredentials: true}));
    const usuario = aUsuario(me);
    this._currentUser.set(usuario);
    this.permisoService.hidratar({[me.rolId]: me.permisos});
    this._sesionCargada.set(true);
    await this._hidratarDatos(usuario);
    this.notificacionService.notificar({tipo: 'info', descripcion: `Sesión iniciada como «${usuario.usuario}»`, url: '/'});
    this.router.navigate(['/']);
  }

  private async _hidratarDatos(usuario: Usuario): Promise<void> {
    await Promise.all([
      this.usuarioService.cargar(),
      this.rolService.cargar(),
      this.proyectoService.cargar(),
      this.columnService.cargar(),
      this.planningService.cargar(),
      this.equipoService.cargar(),
      this.notificacionService.cargar(),
      this.clienteService.cargar(),
      this.documentoService.cargar(),
    ]);
    await this.chatService.conectar(usuario.id, this.tokenService.token());
  }

  private _limpiarSesion(): void {
    this.tokenService.setToken(null);
    this._currentUser.set(null);
    this.usuarioService.limpiar();
    this.rolService.limpiar();
    this.proyectoService.limpiar();
    this.columnService.limpiar();
    this.planningService.limpiar();
    this.equipoService.limpiar();
    this.notificacionService.limpiar();
    this.clienteService.limpiar();
    this.documentoService.limpiar();
    this.chatService.desconectar();
  }
}
