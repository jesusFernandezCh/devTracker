import {Injectable, signal, inject} from '@angular/core';
import {Documento} from '../models/documento.model';
import {AuthService} from './auth.service';

const STORAGE_KEY = 'devtracker-documentos';

@Injectable({providedIn: 'root'})
export class DocumentoService {
  private readonly _documentos = signal<Documento[]>([]);
  readonly documentos = this._documentos.asReadonly();
  private readonly authService = inject(AuthService);

  constructor() {
    this._cargar();
  }

  documentoPorId(id: string): Documento | undefined {
    return this._documentos().find((d) => d.id === id);
  }

  documentosPorProyecto(proyectoId: string): Documento[] {
    return this._documentos().filter((d) => d.proyectoId === proyectoId);
  }

  crear(data: Omit<Documento, 'id' | 'fechaCreacion' | 'fechaModificacion' | 'autorId'>): void {
    const now = new Date().toISOString();
    const autorId = this.authService.currentUser()?.id ?? '';
    const documento: Documento = {
      ...data,
      id: crypto.randomUUID(),
      fechaCreacion: now,
      fechaModificacion: now,
      autorId,
    };
    this._documentos.update((list) => [...list, documento]);
    this._guardar();
  }

  actualizar(id: string, data: Partial<Omit<Documento, 'id' | 'fechaCreacion' | 'autorId'>>): void {
    this._documentos.update((list) =>
      list.map((d) => (d.id === id ? {...d, ...data, fechaModificacion: new Date().toISOString()} : d)),
    );
    this._guardar();
  }

  eliminar(id: string): void {
    this._documentos.update((list) => list.filter((d) => d.id !== id));
    this._guardar();
  }

  private _guardar(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._documentos()));
  }

  private _cargar(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const data = JSON.parse(raw) as Documento[];
        this._documentos.set(data);
        return;
      } catch {
        /* ignorar */
      }
    }
    this._documentos.set([]);
  }
}
