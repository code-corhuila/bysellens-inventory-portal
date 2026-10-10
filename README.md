# By_Sellens · Portal de Inventario

Aplicación independiente de información descriptiva y comercial de productos.
React 19, Ionic React 9, TypeScript y Vite; no administra cantidades de stock.
Documentación oficial: https://github.com/code-corhuila/bysellens-docs.

## Primer incremento

Arranque, login, sesión y navegación reutilizados de `@bysellens/frontend-core@1.0.0`.
La pantalla tras iniciar sesión es un aviso temporal, no la pantalla comercial final.
HU/tarea oficial: pendiente de identificar.

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

1. Servicios, modelos, adaptadores MOCK y pruebas de Inventario.
2. Pantalla, búsqueda, formulario, validaciones y estilos originales.
   Se ajustará la división funcional al límite de 400 líneas por PR,
   excluyendo pruebas y archivos generados; no se recortarán funcionalidades.

Cada rama parte de `origin/develop` después de fusionarse el PR anterior.
Los PR se dejan abiertos para revisión, sin commits directos a `develop`, `qa` o `main`.
