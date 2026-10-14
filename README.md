# bysellens-inventory-portal

> inventory bounded context: web UI (remote)

Part of the **LMS Library** distributed system — team `lms-library`, Grupo 2.
Governance and documentation live in [`library-docs`](https://github.com/code-corhuila/library-docs).

## Branching

Three permanent branches. **None of them accepts a direct commit** — you enter through a child
branch and leave through a Pull Request.

```
develop  <--PR--  feat/... fix/... chore/...
qa       <--PR--  qa/...
main     <--PR--  release/...  hotfix/...
```

Promotion happens **by re-application** (`git cherry-pick -x`), never by merging one permanent
branch into another: `merge develop -> qa` and `merge qa -> main` do not exist in this model.

`main` requires **1 approval from `ariel5253`**. On `develop` and `qa` the team sets its own review
rule.

Full policy: `00-governance/branching-policy.md` in `library-docs`.

## Bootstrap de Inventory Portal (promoción 1/5)

Base React 19, Ionic React 9, TypeScript y Vite. Reutiliza el arranque,
login MOCK, sesión y navegación de `@bysellens/frontend-core@1.0.0`.
Tras iniciar sesión muestra una pantalla temporal de Inventario.
El catálogo y las operaciones comerciales pertenecen a promociones posteriores.

### Desarrollo y validación

Requiere Node.js 22 y npm:

```sh
npm ci
npm run dev
npm run lint
npx tsc --noEmit
npm run test.unit
npm run build
```

Desarrollo: http://localhost:5175. Credenciales sintéticas MOCK:
`admin@bysellens.com` / `demo123`. La sesión usa `sessionStorage`.
No se ha validado integración con backend real ni aprobado MOCK para producción.
`VITE_DATA_MODE=real` y `VITE_API_BASE_URL` conservan el contrato de configuración.

El paquete `vendor/bysellens-frontend-core-1.0.0.tgz` es una dependencia local
indispensable del bootstrap, fijada en `package.json` y el lockfile.
Se conserva completo; su tamaño binario se reporta aparte del conteo textual.

### Contenedor y recursos compilados

```sh
docker build -t bysellens-inventory:local .
docker run --rm -d --name bysellens-inventory -p 8085:80 bysellens-inventory:local
curl http://localhost:8085/health
```

Nginx sirve la raíz y `/mfe/inventory/`, con fallback SPA y `/health`.
`DATA_MODE` y `API_BASE_URL` son argumentos de build; el modo predeterminado es MOCK.
Si se necesita una CA adicional, usar `--secret id=npm_ca,src=/ruta/ca.pem`.
Docker/Nginx quedan pendientes de ejecución mientras el motor no esté disponible.
Para comprobar el build con Vite, indicar la misma base de recursos:

```sh
node node_modules/vite/bin/vite.js preview --base=/mfe/inventory/
```

Esta promoción requiere revisión del CODEOWNER y las aprobaciones pendientes.
No representa el portal completo ni una autorización para fusionar en `main`.

## Servicios comerciales MOCK (promoción 2/5)

Esta entrega de By_Sellens incorpora exclusivamente los servicios aprobados en
QA mediante el PR #13, commit `03d0bcd48beec82bdc468f113f0dad56dad13135`.
`src/services/productoService.ts` y `mock.ts` reutilizan los tipos, semilla sintética
y persistencia de `@bysellens/frontend-core@1.0.0`, sin nuevas dependencias.

El contrato original permite consultar, registrar, actualizar y desactivar productos
con imagen opcional. Esas operaciones pertenecen al servicio aprobado; sus pantallas
comerciales, listado/búsqueda y gestión visual de imágenes no se promocionan aquí.
Después del login continúa la pantalla provisional del bootstrap.

Se conservan validaciones de precios/código único, persistencia MOCK y pruebas.
Los campos heredados `stock` y `stockMinimo` se mantienen por compatibilidad;
la administración de existencias corresponde a Product Portal. El adaptador original
no impide modificar cantidades en un payload: se conserva esa limitación heredada.
La prueba del contrato multipart REAL simula el transporte; no valida un backend.
La integración y aceptación de MOCK para producción siguen pendientes.

Se mantiene la documentación previa del bootstrap y el gobierno de ramas.
HU/tarea oficial: asociación pendiente, sin inventar identificadores.
