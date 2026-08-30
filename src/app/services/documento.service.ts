import {Injectable, signal, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {environment} from '../../environments/environment';
import {Documento} from '../models/documento.model';

interface DocumentoDto {
  id: string;
  nombre: string;
  descripcion: string | null;
  archivoBase64: string;
  tipoMime: string;
  proyectoId: string;
  fechaCreacion: string;
  fechaModificacion: string;
  autorId: string;
}

function aDocumento(d: DocumentoDto): Documento {
  return {
    id: d.id,
    nombre: d.nombre,
    descripcion: d.descripcion ?? '',
    archivoBase64: d.archivoBase64,
    tipoMime: d.tipoMime,
    proyectoId: d.proyectoId,
    fechaCreacion: d.fechaCreacion,
    fechaModificacion: d.fechaModificacion,
    autorId: d.autorId,
  };
}

@Injectable({providedIn: 'root'})
export class DocumentoService {
  private readonly _documentos = signal<Documento[]>([]);
  readonly documentos = this._documentos.asReadonly();
  private readonly http = inject(HttpClient);

  documentoPorId(id: string): Documento | undefined {
    return this._documentos().find((d) => d.id === id);
  }

  documentosPorProyecto(proyectoId: string): Documento[] {
    return this._documentos().filter((d) => d.proyectoId === proyectoId);
  }

  async cargar(): Promise<void> {
    try {
      const lista = await firstValueFrom(this.http.get<DocumentoDto[]>(`${environment.apiUrl}/documentos`));
      this._documentos.set((lista ?? []).map(aDocumento));
    } catch {
      /* sin permiso: mantener estado actual */
    }
  }

  async crear(data: Omit<Documento, 'id' | 'fechaCreacion' | 'fechaModificacion' | 'autorId'>): Promise<void> {
    try {
      const creado = await firstValueFrom(this.http.post<DocumentoDto>(`${environment.apiUrl}/documentos`, {
        nombre: data.nombre,
        descripcion: data.descripcion || undefined,
        archivoBase64: data.archivoBase64,
        tipoMime: data.tipoMime,
        proyectoId: data.proyectoId,
      }));
      this._documentos.update((list) => [...list, aDocumento(creado)]);
    } catch {
      /* ignorar */
    }
  }

  async actualizar(id: string, data: Partial<Omit<Documento, 'id' | 'fechaCreacion' | 'autorId'>>): Promise<void> {
    try {
      const actualizado = await firstValueFrom(this.http.patch<DocumentoDto>(`${environment.apiUrl}/documentos/${id}`, {
        nombre: data.nombre,
        descripcion: data.descripcion,
        archivoBase64: data.archivoBase64,
        tipoMime: data.tipoMime,
      }));
      this._documentos.update((list) => list.map((d) => (d.id === id ? aDocumento(actualizado) : d)));
    } catch {
      /* ignorar */
    }
  }

  async eliminar(id: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete(`${environment.apiUrl}/documentos/${id}`));
      this._documentos.update((list) => list.filter((d) => d.id !== id));
    } catch {
      /* ignorar */
    }
  }

  limpiar(): void {
    this._documentos.set([]);
  }
}
