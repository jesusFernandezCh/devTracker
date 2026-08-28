# DevTracker

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.27.

## Backend (NestJS + Prisma + PostgreSQL)

El backend vive en `backend/`. Requiere PostgreSQL (local o vía Docker):

```bash
# 1. Levantar PostgreSQL 16 (opcional si ya tienes uno)
docker compose -f backend/docker-compose.yml up -d

# 2. Instalar dependencias y aplicar migración + seed
cd backend
npm install
npm run db:migrate:deploy
npm run db:seed

# 3. Arrancar la API (http://localhost:3000)
npm run start:dev
```

El dev server de Angular (`ng serve`) proxya `/api` y `/socket.io` hacia `:3000` vía `proxy.conf.json`. El usuario admin demo es `admin@devtracker.app` / `admin123`.

Comandos útiles del backend: `npm run db:migrate` (crea/despliega migraciones en dev), `npm run db:seed`, `npm run build`, `npm test`.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
