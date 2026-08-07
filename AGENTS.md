# DevTracker — AGENTS.md

## Quick start

```bash
npm install      # requires Node.js >=18.19
npm start        # ng serve, dev server at localhost:4200
npm run build    # ng build (production)
npm test         # ng test (Karma + Jasmine)
```

No `lint` or `typecheck` scripts are configured.

## Architecture

- **Angular 19** standalone app (no NgModules). All components use `standalone: true`.
- **Tailwind CSS v4** via `@tailwindcss/postcss` — no config file, just `@use 'tailwindcss'` in `styles.scss`.
- **Inline templates** (`template:`) and **inline styles** (`styles: []`) in every component — no separate HTML/SCSS files. The files `app.component.html` and `app.component.scss` are stale leftovers from the CLI scaffold.
- **Angular CDK** `@angular/cdk/drag-drop` for the kanban board, `provideAnimations()` enabled in `app.config.ts`.
- **All services** (`providedIn: 'root'`) persist to `localStorage`.

## Routes

| Path | Component |
|---|---|
| `/` | BoardComponent (kanban) |
| `/proyectos` | ProyectosComponent |
| `/tarea/nueva` | TaskFormComponent |
| `/tarea/:id` | TaskDetailComponent |
| `/tarea/:id/editar` | TaskFormComponent |
| `/usuarios` | UsuariosComponent (guard `leer` + `usuarios`) |
| `/roles` | RolesComponent (guard `leer` + `roles`) |
| `/reportes` | ReportesComponent (guard `leer` + `reportes`) |

## Roles y permisos (RBAC)

- Roles **dinámicos** gestionados por `RolService` (persistido en `devtracker-roles`), sembrados con `ROLES_DEFAULT` de `models/permiso.model.ts` (usuario, qa, supervisor, administrador, super-administrador).
- `Usuario.tipo` es un `string` que referencia el id del rol. `RolService.nombreDe(id)` resuelve el nombre.
- Matriz de permisos por id de rol en `PermisoService` (persistido en `devtracker-permisos`). Acciones: `leer | crear | editar | eliminar`. Recursos: `tareas | proyectos | planning | calendario | tablero | usuarios | roles`.
- `RolService`: `crear(nombre)` (permisos vacíos), `renombrar(id, nombre)`, `eliminar(id)` → `'ok' | 'protegido' | 'en-uso'`. El super-administrador no se renombra ni elimina; un rol con usuarios asignados no se puede eliminar. Nombres únicos.
- `PermisoService.puede(accion, recurso, tipo?)` / `puedeUsuarioActual(...)` / `toggle` / `agregarRol` / `eliminarRol` / `restablecer`.
- `permisoGuard(accion, recurso)` (CanActivateFn) protege rutas sensibles (`/usuarios`, `/roles`, `/tarea/nueva`, `/tarea/:id/editar`).
- `PermisoDirective` (estructural): `<button *appPermiso="'editar'; recurso: 'tareas'">` oculta acciones sin permiso.
- Contraseñas: hash **SHA-256 + salt** (`salt:hash` en hex) vía `utils/cripto.ts` (Web Crypto). Las claves legacy en base64 se migran automáticamente al cargar.
- **Seguridad:** el RBAC se evalúa en el navegador y es solo UX. La autorización real debe validarse en un backend.

## Equipo de proyectos

- `EquipoService` (persistido en `devtracker-equipo-proyecto`) mantiene la relación N:N proyecto ↔ usuario como `Record<proyectoId, string[]>` (ids de `Usuario`). API: `miembrosDe`, `proyectosDe(usuarioId)`, `asignar`, `quitar`, `establecer`, `eliminarUsuarioDeTodos`.
- `UsuarioService.eliminar(id)` también llama `equipoService.eliminarUsuarioDeTodos(id)` para no dejar referencias huérfanas.
- Modal `EquipoModalComponent` (en `/proyectos`, botón personas con `*appPermiso="'editar'; recurso: 'proyectos'"`): toggle inmediato de usuarios (checkbox en fila + chips con botón quitar). Aplicación inmediata como el modal de columnas.
- La tabla de proyectos muestra stack de avatares (iniciales vía `utils/helpers.iniciales`) + contador. Filtro "Solo mis proyectos" (y toggle "Solo míos" en el dashboard) filtra por membresía del `AuthService.currentUser()`, aplicado antes de paginación (`proyectosFiltrados`/`proyectosVisibles`).
- `utils/helpers.ts` exporta `iniciales(nombre)` y `tipoColor(tipo)` (compartidos entre componentes; un identificador importado NO es visible en templates — aliasear como miembro de clase `protected readonly x = x`).

## Reportes

- `ReporteService` (persistencia de filtros en signals, no en localStorage): `proyectosDetalle`, `productividadPorProyecto`, `estimacionPorComplejidad`, `estimacionPorProyecto`, `vencimientos`, `pipelinePorColumna`, `calidadPorColumna` y `datosMensuales` (todos `computed`), filtros `fechaDesde`/`fechaHasta`/`proyectoId` (comparación de strings ISO, no de Date) y `exportarCSV(nombre, filas, columnas)` con BOM + Blob.
- `datosMensuales` devuelve serie contigua de meses `{mes, etiqueta, completadas, pendientes, puntos, proyectosProduccion, proyectosActivos}`. Las tareas no guardan fecha de cierre: se agrupan por el mes de su `Planning.fecha`. "En producción" = proyectos en la columna Producción (id `produccion` o nombre normalizado), agrupados por mes de `fechaHasta`.
- **Highcharts** (`highcharts` + `highcharts-angular` v5): `provideHighcharts()` en `app.config.ts`; en el componente se importa el standalone `HighchartsChartComponent` (ya no existe `HighchartsChartModule` ni el input `[Highcharts]`). La pestaña "Gráficas" de ReportesComponent genera `HighchartsOptions` en un `computed` (`graficas()`), con colores según `themeService.isDark()` (paletas `PALETA_CLARA`/`PALETA_OSCURA`). Se usa `import type {Options as HighchartsOptions, SeriesOptionsType} from 'highcharts'` para tipado (sin import de runtime).
- Helpers exportados: `diasRestantes(fechaHasta)` y `urgenciaDe(dias)` (`<=14` urgente, `<=30` alerta, si no normal).
- Los templates de ReportesComponent usan `@let` para los computeds y métodos de clase (`sumarPuntos`, `colorPorcentaje`, `nombreColumna`) — **no usar arrow functions en expresiones de template** (el parser de Angular no las soporta).
- Story points: Simple=1, Media=3, Compleja=5 (coincide con `utils/estimacion.ts`).
- Impresión: botones "Imprimir" llaman `window.print()`; `@media print` global en `styles.scss` oculta `mat-sidenav`, `app-header` y `.no-print`, dejando visible `.print-area`.

## Chat

- `ChatService` (persistido en `devtracker-chat`) guarda mensajes como `Mensaje[]` (`{id, canal:'general'|'privado', autorId, destinoId?, texto, fecha ISO, leido}`). API: `mensajes`, `abierto`, `noLeidosTotal(yoId)`, `noLeidosEn(yoId, canal, destinoId?)`, `mensajesGeneral(yoId)`, `mensajesPrivados(yoId, otroId)` (pareja simétrica), `enviarGeneral/Privado`, `marcarLeidosGeneral/Privados`, `toggle/abrir/cerrar`. Sync entre pestañas vía evento `storage`.
- `ChatWidgetComponent` (montado en `AppComponent` dentro de `@if (authService.isLoggedIn())`): FAB flotante con badge de no leídos, lista de conversaciones (canal General + contactos con badge), burbujas mías/otras, input con Enter. `effect` marca leído al abrir una conversación y hace auto-scroll. `@for` con `@empty` para contactos y mensajes.
- Item "Chat" en `sidebar.component.ts` (icono `forum`): botón que llama `chatService.toggle()` + badge `noLeidosChat` (total del usuario actual). No es `RouterLink` — abre el widget flotante.
- Contactos = todos los usuarios salvo el actual (de `UsuarioService.usuarios()`), ordenados por no-leídos desc y luego nombre; el rol se resuelve con `RolService.nombreDe`.

## Dark mode

- `ThemeService` stores boolean in `localStorage` key `dev-tracker-theme`.
- Flash prevention: inline `<script>` in `index.html` reads `localStorage` and sets `data-theme` on `<html>` before Angular boots.
- `data-theme="dark"` toggles CSS custom properties in `styles.scss` (gray/indigo/red scales, priority badges, surface).
- Priority badge classes (`.badge-priority-*`) rely on CSS variables, not Tailwind utilities — they work in both modes.

## Kanban specifics

- **Task status** is a free `string` (not an enum). `TaskService.tareasPorColumna` is a `computed<Map<string, Task[]>>` keyed by column ID.
- **Column colors** are hex values applied via inline `[style.background-color]` on dots and `hexToRgba()` for badge backgrounds.
- **Drag-drop for tasks**: `CdkDropList` inside `ColumnComponent` with explicit `[cdkDropListConnectedTo]` — no `cdkDropListGroup`.
- **Drag-drop for columns**: Board-level horizontal `CdkDropList` wraps each column in `CdkDrag` with `cdkDragHandle` on the header. Column drag handle and task drop lists are in separate CDK hierarchies (no nesting).
- Column reorder also available via the "Columnas" modal (drag handles in the modal list).
- Delete column shows confirmation with task count; inline delete uses `confirm()` dialog.
- `ColumnService` seeds 3 default columns on first load: Desarrollo, Calidad, Produccion.
- Scroll arrows on column container only visible when `scrollWidth > clientWidth` (checked via `effect` + `HostListener('window:resize')`).

## Drag & drop CSS

Global styles in `styles.scss`:
- `.cdk-drag-preview` — rotated, shadowed
- `.cdk-drag-placeholder` — dashed border, low opacity
- `.cdk-drop-list-receiving` — indigo tint (light/dark variants)
- `.cdk-drag-animating` / `.cdk-drop-list-dragging .cdk-drag` — smooth transitions

## Key conventions

- All component TS files are `@Component` with `template:` and `styles: []` — never separate template/style files.
- All imports use `inject()` (no constructor injection).
- Component class members: `protected readonly` for services, `protected` for template-accessible bindings, `private` for internals.
- Outputs use output functions (`output()`, `output.required()`).
- Signal-based reactivity: `signal`, `computed`, `effect`, `input`, `output` throughout.
- New columns get a color from `coloresPaleta` via `columnService.obtenerColorPorDefecto()`.
- `TaskPriority` uses `.badge-priority-*` CSS classes; `TaskStatus` is dynamic via `ColumnService` column lookup.
