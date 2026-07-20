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
| `/tarea/nueva` | TaskFormComponent |
| `/tarea/:id` | TaskDetailComponent |
| `/tarea/:id/editar` | TaskFormComponent |

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
- Column reorder also available via the "Gestionar columnas" modal (drag handles in the modal list).
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
