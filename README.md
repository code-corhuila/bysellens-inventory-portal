# By_Sellens · Portal de Inventario

Aplicación independiente de información descriptiva y comercial de productos.
React 19, Ionic React 9, TypeScript y Vite; no administra cantidades de stock.
Documentación oficial: https://github.com/code-corhuila/bysellens-docs.

## Primer incremento

Arranque, login, sesión y navegación reutilizados de `@bysellens/frontend-core@1.0.0`.
La pantalla ya consulta el catálogo comercial y permite buscar y actualizar el listado.
También permite eliminar con confirmación: desactiva el producto sin borrarlo físicamente.
Conserva los errores originales y bloquea acciones mientras se procesa la eliminación.
Permite editar los campos comerciales con validaciones originales, conservando
cantidades, estado e imagen. El formulario bloquea sus acciones mientras guarda.
HU/tarea oficial: pendiente de identificar.

## Servicios y MOCK

`src/services/productoService.ts`, `mock.ts` y `dominio.test.ts` se trasladan
sin cambios desde `apps/inventory/src/services/` del frontend original.
Permiten listar, consultar, crear, editar y desactivar productos, con imagen opcional.
Se conservan las validaciones originales de precios y código único y el borrado lógico.
Tipos `Producto`/`ProductoRequest`, semilla sintética y persistencia MOCK se reutilizan
de `frontend-core@1.0.0`, sin duplicar el paquete ni datos de otros dominios.

Los tipos heredados incluyen `stock`/`stockMinimo` y el adaptador valida `stock`;
se conserva ese contrato por compatibilidad. No hay operaciones específicas
para ajustar existencias: esa responsabilidad pertenece a Product Portal.
La edición conserva las cantidades cuando se envían sin cambios; el adaptador
original no impide modificarlas en el payload. Esta limitación heredada permanece.
Las pruebas cubren operaciones comerciales, persistencia, errores e imágenes
sin backend; el contrato multipart REAL se prueba con el transporte simulado.

## Desarrollo y verificación

Node.js 22 y npm. Desde este repositorio:

```sh
npm ci
npm run dev
npm run test.unit
npm run lint
npm run build
```

Desarrollo: http://localhost:5175. MOCK es el modo predeterminado, sin backend.
Credenciales sintéticas: `admin@bysellens.com` / `demo123`.
El core conserva la sesión en `sessionStorage`; no sincroniza microservicios.
`VITE_DATA_MODE=real` y `VITE_API_BASE_URL` conservan la configuración REAL,
que no se ha validado contra un backend.

El paquete compartido se distribuye mediante `vendor/bysellens-frontend-core-1.0.0.tgz`,
copiado del portal original, y su dependencia `file:` queda fijada en el lockfile.
No requiere rutas externas ni publicar paquetes.

## Contenedor independiente

```sh
docker build -t bysellens-inventory:local .
docker run --rm -d --name bysellens-inventory -p 8085:80 bysellens-inventory:local
curl http://localhost:8085/health
```

Abrir http://localhost:8085. Nginx sirve el portal y los recursos bajo
`/mfe/inventory/`, con fallback de navegación y healthcheck `/health`.
Las variables se incorporan al construir: `--build-arg DATA_MODE=mock` y
`--build-arg API_BASE_URL=http://localhost:8080`; no son configuración en ejecución.
Si la red exige una CA adicional, pasar `--secret id=npm_ca,src=/ruta/ca.pem`
al build. El certificado se monta temporalmente y no se guarda en la imagen.

## Siguientes PR

1. Creación de productos, gestión de imágenes y estilos restantes del formulario.
   Se ajustará la división funcional al límite de 400 líneas por PR,
   contando también pruebas y documentación; se dividirá en bloques funcionales.

El segundo incremento incorpora los servicios mediante una rama nueva desde
`origin/develop`, con un PR directo a `develop` tras la fusión del PR #1.
El conteo conservador incluye adiciones y eliminaciones de código, pruebas y README.
Los PR se dejan abiertos para revisión, sin commits directos a `develop`, `qa` o `main`.
