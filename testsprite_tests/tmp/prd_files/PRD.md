# PRD — DevTracker

## 1. Resumen del producto

**DevTracker** es una aplicación web (single-page application) de **gestión de proyectos de desarrollo de software**, construida con **Angular 19** (standalone components) y **Tailwind CSS v4**. Permite a un equipo gestionar proyectos, planificaciones (plannings), tareas y su avance a lo largo de un pipeline (kanban) de ambientes como Desarrollo → Calidad → Producción.

Se trata de una aplicación **100% frontend** que persiste todos los datos en `localStorage` (sin backend). Incluye un sistema de **login y roles** para controlar el acceso a los distintos módulos.

## 2. Rutas y navegación

| Ruta | Módulo |
|---|---|
| `/login` | Pantalla de inicio de sesión |
| `/` | Dashboard (resumen general) |
| `/tablero` | Tablero kanban (board) |
| `/proyectos` | Gestión de proyectos |
| `/planning` | Planificaciones / plannings |
| `/calendario` | Calendario |
| `/usuarios` | Administración de usuarios y roles |
| `/tarea/nueva` | Crear tarea |
| `/tarea/:id` | Detalle de tarea |
| `/tarea/:id/editar` | Editar tarea |

Todas las rutas (excepto `/login`) están protegidas por `authGuard`.

## 3. Módulos y características

### 3.1 Autenticación (`LoginComponent`, `AuthService`, `authGuard`)
- Login con **correo + contraseña**.
- Login social simulado (Google / Facebook) que crea un usuario demo automáticamente.
- Sesión persistida en `localStorage` y restaurada al recargar.
- Logout que limpia la sesión y redirige a `/login`.
- **Credencial por defecto:** `admin@devtracker.app` / `admin123` (usuario `super-administrador`).

### 3.2 Roles (`AuthService`, `UsuariosComponent`, `UsuarioService`)
- 4 tipos de usuario: `usuario`, `supervisor`, `administrador`, `super-administrador`.
- Gestión de usuarios (crear, editar, eliminar) desde `/usuarios`.
- Guard de autenticación en todas las rutas privadas.

### 3.3 Dashboard (`DashboardComponent`) — `/`
- **Progreso general** en anillo SVG (porcentaje de tareas completadas).
- Métricas principales: total de tareas, completadas, pendientes y story points.
- **Progreso por proyecto** con barras de avance (top 5) y badge de prioridad.
- **Progreso por ambiente** (pipeline por columna con leyenda).
- **Planificación en curso / vencimientos próximos** con alerta `URGENT` (≤ 14 días) y conteo de días restantes.

### 3.4 Tablero kanban (`BoardComponent`, `ColumnComponent`, `ColumnService`) — `/tablero`
- Tablero de columnas con **drag & drop** (Angular CDK).
  - Drag de tareas entre columnas (`CdkDropList` conectados).
  - Drag de columnas para reordenar (con handle, sin anidar jerarquías CDK).
- Columnas precargadas por defecto: **Desarrollo, Calidad, Producción**.
- Gestión de columnas (crear, reordenar, eliminar) mediante modal **"Columnas"** con confirmación y conteo de tareas.
- Colores de columna en hex aplicados inline.
- Flechas de scroll horizontal visibles solo cuando hay desbordamiento.

### 3.5 Proyectos (`ProyectosComponent`, `ProyectoFormComponent`, `ProjectCardComponent`, `ProyectoService`) — `/proyectos`
- Listado de proyectos (cards).
- **Crear / editar / eliminar** proyectos.
- Datos por proyecto: nombre, descripción, cliente, estado, prioridad, columna, fechas (desde/hasta), documentación.

### 3.6 Planning (`PlanningComponent`, `PlanningFormComponent`, `PlanningTasksComponent`, `PlanningDetailComponent`, `PlanningService`) — `/planning`
- Tabla de plannings con descripción, fecha, proyecto, conteo de tareas, **estimación en días** y acciones.
- **Crear / editar / eliminar** plannings (con modal de confirmación).
- Gestión de **tareas del planning**: cada tarea tiene complejidad (`Simple`, `Media`, `Compleja`) y estado completada.
- Detalle de planning en modal.
- Acceso rápido desde un proyecto (`?proyectoId=...`).

### 3.6b Tareas (`TaskFormComponent`, `TaskDetailComponent`) — `/tarea/*`
- Formulario para crear/editar tareas.
- Detalle de una tarea individual.

### 3.7 Calendario (`CalendarioComponent`) — `/calendario`
- Vista de calendario de fechas/actividades.

### 3.8 Modo oscuro (`ThemeService`, `ThemeService`)
- Toggle de tema claro/oscuro persistido en `localStorage` (`dev-tracker-theme`).
- Sin flash en la carga (script inline en `index.html`).

## 4. Datos y almacenamiento

- Sin backend; toda la información se guarda en `localStorage`.
- Claves de almacenamiento: `devtracker-session`, `devtracker-usuarios`, `devtracker-proyectos`, `devtracker-columnas`, `devtracker-theme`, etc.
- Datos demo cargados en el primer uso (proyectos de ejemplo, columnas por defecto y usuario admin).
- Las contraseñas de usuario se almacenan en Base64 (`btoa`).

## 5. Stack técnico

- **Angular 19** — standalone components, sin NgModules.
- **Signals / reactividad** (`signal`, `computed`, `effect`, `input`, `output`).
- **Angular CDK** `@angular/cdk/drag-drop` para el kanban.
- **Tailwind CSS v4** + estilos en línea por componente.
- Templates y estilos **inline** en cada componente.
- Persistencia en `localStorage` vía servicios `providedIn: 'root'`.

## 6. Alcance para TestSprite

### Cobertura funcional a testear (frontend)

1. **Login y seguridad**
   - Login correcto/incorrecto.
   - Login social (Google/Facebook).
   - Logout y limpieza de sesión.
   - Acceso a rutas privadas sin sesión → redirección a `/login`.
   - Persistencia de sesión tras recargar.
   - Credencial por defecto `admin@devtracker.app` / `admin123`.

2. **Dashboard** (`/`)
   - Renderizado de métricas (total, completadas, pendientes, story points).
   - Anillo de progreso general.
   - Progreso por proyecto y por ambiente.
   - Vencimientos próximos y alerta URGENT.

3. **Tablero kanban** (`/tablero`)
   - Carga de columnas por defecto (Desarrollo, Calidad, Producción).
   - Drag & drop de tareas entre columnas **persiste** el cambio (recargar → se mantiene).
   - Reordenación de columnas por drag y desde el modal.
   - Crear / reordenar / eliminar columnas con confirmación.

4. **Proyectos** (`/proyectos`)
   - Listado de proyectos.
   - Crear / editar / eliminar proyecto.
   - Los cambios persisten tras recargar.

5. **Planning** (`/planning`)
   - Crear / editar / eliminar planning (con modal de confirmación).
   - Gestión de tareas del planning (marcar completada, complejidad).
   - Cálculo de estimación en días.
   - Detalle de planning.

6. **Tareas** (`/tarea/*`)
   - Crear / editar / ver detalle de tarea.

7. **Calendario** (`/calendario`)
   - Renderizado básico y navegación.

8. **Usuarios y roles** (`/usuarios`)
   - Crear / editar / eliminar usuarios.
   - Cambio de rol.

9. **Modo oscuro**
   - Cambiar entre tema claro/oscuro.
   - Persistencia del tema tras recargar.

10. **Persistencia general**
   - Todas las operaciones CRUD deben sobrevivir a una recarga del navegador (validez de `localStorage`).

### Criterios clave
- La app es 100% frontend: **TestSprite debe ejecutar contra el servidor local de desarrollo** (`http://localhost:4200`).
- No hay backend ni endpoints que probar.
- Después de cada operación importante, validar **persistencia** recargando la página.