# Estructura del Proyecto

## Objetivo de este documento

Este README explica como esta organizado el proyecto, cual es la responsabilidad de cada carpeta y archivo principal, como fluye la informacion dentro de la app y cuales son las limitaciones actuales de la solucion.

## Resumen de la arquitectura

La aplicacion esta construida con una arquitectura simple por feature. En lugar de repartir archivos por tipo de forma global, la mayor parte de la logica del dominio de libros vive dentro de `src/features/books`.

La separacion actual sigue esta idea:

- `app`: punto de entrada visual de la aplicacion
- `features/books`: toda la funcionalidad de la pantalla de libros
- `assets`: recursos visuales estaticos
- `index.css`: estilos globales y clases reutilizables

## Flujo general de la aplicacion

1. `src/main.tsx` monta React y carga los estilos globales.
2. `src/app/App.tsx` actua como shell y renderiza la pagina de libros.
3. `src/features/books/BooksPage.tsx` controla el estado editable del formulario y compone la interfaz.
4. `src/features/books/hooks/useBooksQuery.ts` ejecuta la consulta, administra `loading`, errores, cancelacion y datos recibidos.
5. `src/features/books/services/nytBooks.service.ts` se conecta con la API del New York Times.
6. `src/features/books/books.utils.ts` valida entradas, normaliza fechas, filtra libros y genera textos derivados.
7. Los componentes de `src/features/books/components` renderizan la UI en bloques pequenos y especializados.

## Arbol actual del proyecto

```text
src/
  app/
    App.tsx
  assets/
    book-placeholder.svg
  features/
    books/
      BooksPage.tsx
      books.constants.ts
      books.utils.ts
      books.utils.test.ts
      types/
        index.ts
      components/
        BookCard.tsx
        BooksGrid.tsx
        EmptyState.tsx
        QueryDetails.tsx
        QueryMenu.tsx
        ResultsHeader.tsx
        StatusBanner.tsx
      hooks/
        useBooksQuery.ts
      services/
        nytBooks.service.ts
  index.css
  main.tsx
  vite-env.d.ts
tsconfig.json
vite.config.ts
```

## Responsabilidad de cada carpeta

### `src/app`

Contiene el shell de la aplicacion. Su responsabilidad es minima: montar la pagina principal y evitar que la logica de negocio viva en el componente raiz.

### `src/assets`

Guarda recursos estaticos. En este proyecto se usa para la portada generica que aparece cuando NYT no devuelve imagen.

### `src/features/books`

Es la carpeta principal del negocio. Todo lo relacionado con la experiencia de consulta de libros vive aqui.

Su objetivo es que la feature pueda entenderse casi sin mirar el resto del proyecto.

### `src/features/books/components`

Contiene componentes presentacionales. Deben enfocarse en renderizar UI y recibir props, no en hacer peticiones HTTP ni manejar reglas complejas del dominio.

### `src/features/books/hooks`

Contiene hooks con logica reutilizable de estado y efectos. En este proyecto el hook principal encapsula toda la consulta a la API.

### `src/features/books/services`

Contiene acceso a datos externos. Aqui se construyen URLs, se ejecuta `fetch`, se mapea la respuesta del NYT y se traducen errores.

## Responsabilidad de cada archivo principal

### `src/main.tsx`

- crea la raiz de React
- importa `App`
- carga `index.css`

### `src/app/App.tsx`

- actua como componente raiz
- renderiza `BooksPage`
- no contiene logica de negocio

### `src/features/books/BooksPage.tsx`

Es la pagina principal de la feature.

Responsabilidades:

- mantener el estado editable del formulario
- conectar el formulario con el hook `useBooksQuery`
- componer los bloques visuales principales
- calcular el resumen derivado mostrado en pantalla

No deberia:

- hablar directamente con la API
- validar reglas complejas
- mapear respuestas HTTP

### `src/features/books/books.constants.ts`

Centraliza constantes del dominio:

- tipos de consulta
- codigos de estado
- configuracion de la lista `Mass Market Paperback`
- estado inicial
- opciones del menu principal

Su objetivo es evitar strings repetidos y reglas dispersas.

### `src/features/books/types`

Centraliza todos los tipos e interfaces de la feature.

Incluye:

- tipos del dominio
- tipos del servicio HTTP
- tipos del hook
- props de componentes

Su objetivo es que los contratos no queden repartidos entre archivos de implementacion.

### `src/features/books/books.utils.ts`

Agrupa funciones puras del dominio.

Responsabilidades:

- crear estado inicial del formulario
- resolver la fecha real a consultar
- validar titulo o autor cuando aplica
- normalizar fechas al domingo anterior
- filtrar libros por titulo o autor
- generar el resumen de resultados

Este archivo es importante porque concentra la logica mas facil de probar.

### `src/features/books/books.utils.test.ts`

Contiene pruebas unitarias sobre la logica pura del dominio.

Actualmente cubre:

- normalizacion de fechas
- validacion del formulario
- filtros por titulo y autor
- generacion de resumenes

### `src/features/books/hooks/useBooksQuery.ts`

Es el centro del flujo asincrono.

Responsabilidades:

- lanzar la consulta inicial al montar la pantalla
- validar el formulario antes de consultar
- cancelar peticiones anteriores con `AbortController`
- llamar al servicio HTTP
- aplicar filtros locales
- exponer `books`, `meta`, `status`, `isLoading`, `lastQuery` y `runQuery`

Este hook separa claramente:

- `formState`: vive en `BooksPage`
- `queryState`: vive en `useBooksQuery`

### `src/features/books/services/nytBooks.service.ts`

Es la capa de acceso al NYT.

Responsabilidades:

- verificar existencia de `VITE_NYT_API_KEY`
- construir la URL del endpoint
- ejecutar la peticion HTTP
- traducir errores tecnicos a errores de dominio
- mapear la respuesta del API a un formato mas estable para la UI

Este archivo no renderiza nada y no deberia depender de componentes.

## Responsabilidad de cada componente visual

### `QueryMenu.tsx`

- muestra el menu principal de tipos de consulta
- recoge los campos del formulario
- dispara `onSubmit`
- no conoce nada del API ni del estado global

### `StatusBanner.tsx`

- muestra el mensaje de estado actual
- cambia estilo segun el `tone`

### `ResultsHeader.tsx`

- muestra el titulo del bloque de resultados
- presenta el resumen de la consulta ejecutada

### `QueryDetails.tsx`

- muestra metadatos de la consulta
- enseña fechas y cantidad de libros

### `BooksGrid.tsx`

- recibe un arreglo de libros
- solo se encarga de renderizar la grilla

### `BookCard.tsx`

- presenta un libro individual
- muestra portada, autor, ranking, descripcion, ISBN y enlace de compra
- usa imagen placeholder cuando falta la portada

### `EmptyState.tsx`

- muestra el estado vacio cuando no hay resultados

## Responsabilidad de `index.css`

Este archivo contiene:

- estilos globales base
- fondo general de la app
- clases visuales reutilizables como `.panel` y `.section-title`

La idea es no mover toda la UI a CSS tradicional, pero si evitar repetir patrones visuales largos una y otra vez en Tailwind.

## Archivos de soporte TypeScript

### `tsconfig.json`

- define las reglas del compilador
- activa `strict`
- habilita JSX con React
- incluye tipos de `vite/client` y `node`

### `vite.config.ts`

- configura Vite con React y Tailwind
- mantiene la herramienta de build alineada con el resto del proyecto en TypeScript

### `src/vite-env.d.ts`

- registra los tipos de Vite para `import.meta.env`
- permite que TypeScript entienda variables como `VITE_NYT_API_KEY`

## Decisiones de arquitectura tomadas

### 1. Estructura por feature

Se eligio agrupar la mayor parte del codigo dentro de `features/books` para que la logica relacionada con libros viva junta.

### 2. Estado separado por responsabilidad

- el formulario editable vive en la pagina
- los datos consultados viven en el hook

Esto evita mezclar "lo que el usuario escribe" con "lo que la app ya consulto".

### 3. Hook para orquestacion

La consulta asincrona se encapsulo en `useBooksQuery` para que la pagina no mezcle render y efectos.

### 4. Servicio HTTP aislado

Toda interaccion con NYT se mueve a un servicio dedicado, lo que facilita cambiar el origen de datos si fuera necesario.

### 5. Componentes pequenos y orientados a presentacion

Cada componente visual resuelve una pieza concreta de la pantalla. Esto mejora lectura y mantenimiento sin fragmentar de mas la app.

## Limitaciones actuales

### Limitaciones funcionales

- la app esta enfocada a una sola categoria: `Mass Market Paperback`
- la categoria es archivada, por eso la app trabaja con fechas historicas y no con un endpoint `current`
- no hay multiples vistas ni navegacion entre paginas

### Limitaciones tecnicas

- la API key vive en el frontend mediante `VITE_NYT_API_KEY`, por lo tanto queda expuesta al cliente
- no existe backend ni proxy para proteger credenciales
- el contrato de datos depende del JSON del NYT y no tiene validacion de esquema formal
- no hay cache persistente entre sesiones
- no hay paginacion
- no hay analitica ni observabilidad

### Limitaciones de calidad

- las pruebas actuales cubren logica pura, no componentes React ni flujo completo de UI
- no hay pruebas end to end
- no hay pruebas visuales o de accesibilidad automatizadas
- aunque ya usa TypeScript, el contrato todavia depende del tipado estatico y no de validacion runtime

## Cuando esta estructura deja de ser suficiente

La estructura actual sigue siendo adecuada mientras:

- exista una sola pantalla principal
- solo haya una feature fuerte
- las consultas sigan concentradas en la Books API

Dejaria de ser suficiente si el proyecto empieza a incluir:

- multiples categorias con comportamiento distinto
- autenticacion
- favoritos o persistencia local
- dashboard con varias paginas
- mas de una fuente de datos externa

En ese caso convendria agregar:

- router
- validacion runtime del contrato de datos
- validacion de contrato de datos
- una estrategia de cache o sincronizacion mas robusta

## Conclusion

El proyecto esta estructurado para ser pequeno, entendible y mantenible sin sobreingenieria. La mayor parte del valor arquitectonico hoy esta en esta separacion:

- `BooksPage` compone
- `useBooksQuery` orquesta
- `nytBooks.service` consulta
- `books.utils` resuelve reglas puras
- `components` renderiza

Esa division permite mantener la funcionalidad actual y deja una base razonable para crecer si el proyecto lo necesita.
