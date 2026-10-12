# By_Sellens — revisión previa a QA

Revisión sobre develop d5f89aa, con PR #1, #5, #6, #7, #8, #9 y #10
fusionados y sin correcciones abiertas equivalentes al iniciar.
Entorno: Windows, Node 22, npm/lockfile, Vite en 127.0.0.1:5175 y MOCK.
Navegador real: Chrome 154 headless controlado mediante DevTools Protocol.
Tamaños: escritorio 1365×900 y móvil emulado 390×844, sin dispositivo físico.

## Hallazgos y correcciones

| ID | Reproducción y observado | Esperado | Severidad | Corrección |
|---|---|---|---|---|
| QA-01 | Abrir creación en móvil: panel debajo de navegación, fuera del viewport | Panel completo y botones alcanzables | Alta | Portal en document.body fuera del contenedor Ionic |
| QA-02 | Abrir formulario y pulsar Tab al final: foco fuera del formulario | Foco contenido y retorno al activador | Alta | Diálogo modal, fondo inert, foco inicial, Tab/Shift+Tab y Escape |
| QA-03 | Contador, error y botón principal: contraste 3,07/3,76/3,61:1 | Al menos 4,5:1 en texto normal | Media | Tonos oscuros de la misma paleta |
| QA-04 | Subtítulo y pie del login: contraste 3,13/3,35:1 | Al menos 4,5:1 | Media | CSS local para textos, placeholder y botón del login |

No se cambia el paquete frontend-core ni el frontend original.
Escape y Cancelar permanecen bloqueados mientras se guarda.
Las pruebas comprueban restauración de foco e inert, incluido desmontaje.

## Recorridos reales en Chrome

Ejecutados en ambos tamaños tras las correcciones:

| Flujo | Comprobación | Resultado |
|---|---|---|
| Acceso | Login MOCK y cierre de sesión | Correcto |
| A | Listado, búsqueda por código y sin resultados | Correcto |
| B | Campos obligatorios, creación y actualización del listado | Correcto |
| C | Edición y conservación de stock, mínimo, estado e imagen | Correcto |
| D | PNG válido y preview, GIF inválido, más de 5 MB, persistencia e imagen no disponible | Correcto |
| E | Confirmación nativa de desactivación, listado y actualización | Correcto |
| F | Ambos tamaños, scroll interno, botón guardar alcanzable y sin overflow de página | Correcto |
| Teclado | Foco inicial, Tab/Shift+Tab, Escape y fondo inerte | Correcto |

Panel corregido: y=0, altura 900 px en escritorio y 844 px en móvil.
Ancho/scroll interno: 680/680 px y aproximadamente 359/359 px.
Página: scrollWidth 1365 y 390 px, igual al viewport.
Contraste corregido: botón principal 5,95:1 y contador 5,56:1.
Las capturas antes/después y registros se conservan como artefactos locales
temporales de la revisión; no se incorporan binarios o perfiles al repositorio.

## Validaciones y límites

npm ci, ESLint, TypeScript/build, Vitest y Docker se ejecutan para este incremento.
La suite añade tres regresiones de accesibilidad y conserva las pruebas anteriores.
Los resultados finales y el conteo exacto de líneas se detallan en el PR.
Cypress/Playwright no están configurados; Chrome/CDP se ejecutó por separado.
Archivos de imagen inyectados mediante File/DataTransfer en el navegador;
no se automatizó el selector nativo del sistema operativo.
No se evaluaron lector de pantalla, teclado virtual móvil, otros navegadores
ni backend REAL. Persisten avisos de bundle, Router y dependencias heredadas.
Las imágenes MOCK siguen sujetas a la cuota de localStorage.

## Repetición manual y recomendación

Ejecutar npm ci y npm run dev; entrar con las credenciales MOCK del README.
Repetir A–F, recorrer el formulario con teclado y comprobar el retorno del foco.
Comprobar JPG/PNG/WEBP reales y lectura asistida durante QA.
Tras aprobar y fusionar este PR, se recomienda promocionar a QA en modo MOCK.
Esta revisión no constituye aprobación de producción ni validación del backend.
No se promociona ni fusiona automáticamente ninguna rama.
