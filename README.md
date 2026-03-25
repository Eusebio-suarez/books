# Evaluacion de Arquitectura y Puntos de Mejora

## Resumen ejecutivo

La aplicacion actual es valida como MVP: resuelve el caso de uso, tiene pocos archivos y no introduce sobreingenieria innecesaria. Para una app pequena de una sola pantalla, la base es correcta.

El principal problema estructural es que `App.jsx` concentra demasiadas responsabilidades:

- estado del formulario
- flujo de consulta
- validacion
- transformacion de resultados
- mensajes de estado
- composicion visual de casi toda la pagina

Eso no rompe la app hoy, pero si complica mantenerla, probarla y extenderla.

## Evaluacion general

### Lo que esta bien

- La app tiene una separacion inicial entre vista (`components`) y acceso a API (`lib/nyt.js`).
- El numero de componentes es bajo, lo cual mantiene simple el proyecto.
- La integracion con NYT esta encapsulada en un solo archivo y no dispersa por toda la UI.
- `BookCard` y `QueryMenu` ya representan responsabilidades visibles y entendibles.
- No hay dependencias innecesarias como Redux, React Query o routers que no aporten al alcance actual.

### Lo que hoy limita la estructura

- `src/App.jsx` funciona como pagina, controlador, contenedor de estado y vista al mismo tiempo.
- `src/lib/nyt.js` mezcla constantes de dominio, logica de fechas, fetch, manejo de errores y mapeo de respuesta.
- Hay estado derivado que podria calcularse en vez de guardarse, por ejemplo `summary`.
- Los tipos de consulta (`latest`, `date`, `title`, `author`) estan repartidos en varias funciones y componentes.
- La UI de resultados sigue demasiado acoplada a `App.jsx`.

## Hallazgos y mejoras recomendadas

### 1. Reducir responsabilidades de `App.jsx`

#### Problema

`src/App.jsx` centraliza casi toda la aplicacion: estado, side effects, validaciones, resumenes, mensajes, layout y renderizado de resultados.

#### Impacto

- dificulta leer el flujo completo
- hace mas caro agregar nuevas consultas
- vuelve mas dificil testear la logica sin renderizar toda la pagina

#### Mejora

Convertir `App.jsx` en un shell delgado y mover la logica principal a una pagina o feature dedicada, por ejemplo:

- `BooksPage.jsx` para la composicion principal
- `useBooksQuery.js` para el flujo de consulta
- `books.utils.js` para validacion, filtros y textos derivados

### 2. Separar estado de formulario y estado de consulta

#### Problema

Hoy el formulario y la ejecucion de la consulta viven en el mismo componente y comparten demasiada logica.

#### Impacto

- el submit depende de detalles internos de `App.jsx`
- cuesta distinguir entre "lo que el usuario esta escribiendo" y "lo que la app ya consulto"

#### Mejora

Mantener dos capas claras:

- `formState`: lo que el usuario edita
- `queryState`: loading, error, data, meta

Eso simplifica el flujo y evita efectos secundarios inesperados.

### 3. Extraer la logica de consulta a un hook

#### Problema

`runQuery()` en `App.jsx` concentra validacion, request, filtrado, mensajes y actualizacion de estado.

#### Mejora

Crear un hook como `useBooksQuery()` con una interfaz simple:

```js
const {
  books,
  meta,
  status,
  isLoading,
  runQuery,
} = useBooksQuery();
```

#### Beneficio

- `App.jsx` queda mas corto
- la logica asincrona queda encapsulada
- es mas facil probar y reutilizar

### 4. Separar infraestructura de dominio en `src/lib/nyt.js`

#### Problema

Ese archivo mezcla:

- constantes de la lista
- validacion de API key
- normalizacion de fechas
- construccion de URL
- request HTTP
- traduccion de errores
- mapeo de datos

#### Mejora

Sin volverlo complejo, conviene dividirlo en piezas pequenas:

- `books.constants.js`
- `nytBooks.service.js`
- `books.utils.js`

#### Regla practica

Si una funcion no necesita hacer `fetch`, no deberia vivir en el archivo del servicio HTTP.

### 5. Separar mejor los bloques visuales de resultados

#### Problema

La cabecera de resultados, el panel de detalle, el estado vacio y el banner de mensajes siguen incrustados en `App.jsx`.

#### Mejora

Extraer componentes presentacionales pequenos:

- `StatusBanner.jsx`
- `ResultsHeader.jsx`
- `QueryDetails.jsx`
- `BooksGrid.jsx`
- `EmptyState.jsx`

#### Beneficio

`App.jsx` deja de ser una pagina gigante y pasa a ser una composicion legible.

### 6. Centralizar constantes de consulta

#### Problema

Los ids `latest`, `date`, `title` y `author` aparecen en varias funciones y archivos.

#### Riesgo

Si un valor cambia, hay que actualizarlo manualmente en varios lugares.

#### Mejora

Crear un archivo unico:

```js
export const QUERY_TYPES = {
  LATEST: 'latest',
  DATE: 'date',
  TITLE: 'title',
  AUTHOR: 'author',
};
```

Esto evita strings duplicados y ordena las reglas de negocio.

### 7. Reducir estado derivado

#### Problema

`summary` se guarda en estado, aunque depende directamente de `meta`, `books` y el tipo de consulta.

#### Mejora

Calcularlo en render o en una funcion pura.

#### Beneficio

- menos estados que sincronizar
- menos riesgo de inconsistencias
- menos ramas de actualizacion en `runQuery()`

### 8. Mejorar la estrategia de errores

#### Problema

El manejo de errores esta bien para un MVP, pero hoy solo existe como texto listo para UI.

#### Mejora

Estandarizar la salida del hook o servicio:

```js
{
  tone: 'error',
  code: 'RATE_LIMIT',
  message: '...'
}
```

#### Beneficio

Permite que la UI reaccione por tipo de error y no solo por string.

### 9. Agregar cancelacion o proteccion contra respuestas tardias

#### Problema

Si el usuario dispara varias consultas seguidas, una respuesta vieja podria sobrescribir una mas nueva.

#### Mejora

Usar `AbortController` o una marca de request activa dentro del hook.

#### Beneficio

Hace mas robusta la app sin sumar demasiada complejidad.

### 10. Incorporar pruebas en la logica critica

#### Problema

No hay pruebas sobre las piezas mas sensibles:

- ajuste de fechas al domingo
- validacion de formulario
- filtrado por titulo y autor
- traduccion de errores de API

#### Mejora

Agregar tests unitarios sobre funciones puras antes de testear componentes completos.

#### Prioridad

Alta para `books.utils.js` y media para componentes visuales.

### 11. Preparar el contrato de datos para crecer

#### Problema

La app depende de la forma del JSON de NYT sin una capa de validacion formal.

#### Mejora

Opciones razonables:

- seguir en JavaScript pero con JSDoc fuerte
- migrar a TypeScript si la app va a crecer

#### Recomendacion

Si sigue siendo una app academica o pequena, JSDoc es suficiente. Si va a sumar mas categorias o vistas, TypeScript ya vale la pena.

### 12. Simplificar estilos repetidos

#### Problema

Hay varias combinaciones largas de clases Tailwind repetidas en tarjetas y paneles.

#### Mejora

Extraer algunos patrones visuales a clases semanticas pequenas en `index.css`, por ejemplo:

- `.panel`
- `.panel-soft`
- `.section-title`

#### Cuidado

No mover todo a CSS tradicional. Solo los patrones repetidos de verdad.

## Estructura sugerida: simple pero ordenada

La siguiente estructura mantiene la app pequena y evita fragmentarla de mas:

```text
src/
  app/
    App.jsx
  features/
    books/
      BooksPage.jsx
      books.constants.js
      books.utils.js
      hooks/
        useBooksQuery.js
      services/
        nytBooks.service.js
      components/
        QueryMenu.jsx
        StatusBanner.jsx
        ResultsHeader.jsx
        QueryDetails.jsx
        BooksGrid.jsx
        BookCard.jsx
        EmptyState.jsx
  assets/
    book-placeholder.svg
  index.css
  main.jsx
```

## Orden recomendado de refactor

### Fase 1: limpieza minima

- mover `runQuery()` a `useBooksQuery.js`
- mover helpers de `App.jsx` a `books.utils.js`
- extraer `StatusBanner`, `ResultsHeader`, `QueryDetails` y `EmptyState`
- centralizar `QUERY_TYPES`

### Fase 2: ordenar dominio e infraestructura

- dividir `src/lib/nyt.js` en `books.constants.js`, `books.utils.js` y `nytBooks.service.js`
- dejar `App.jsx` como shell y `BooksPage.jsx` como pagina real

### Fase 3: robustez

- agregar tests unitarios
- agregar cancelacion de requests
- definir mejor el contrato de datos con JSDoc o TypeScript

## Que mantendria tal como esta

- React sin estado global
- pocos componentes
- un servicio dedicado a NYT
- `BookCard` como componente aislado
- una sola feature principal enfocada en libros

## Que evitaria

- Redux o Zustand para esta app
- una carpeta por componente sin necesidad
- hooks demasiado genericos
- separar en demasiados archivos de utilidades triviales
- meter toda la logica de negocio dentro de los componentes visuales

## Conclusion

La arquitectura actual sirve para una entrega funcional y pequena, pero necesita una separacion mas clara entre:

- pagina
- logica de consulta
- servicio HTTP
- reglas de negocio
- componentes presentacionales

La mejor mejora posible, manteniendo la app sencilla, es esta:

1. dejar `App.jsx` casi vacio
2. crear `useBooksQuery.js`
3. dividir `src/lib/nyt.js`
4. extraer los bloques visuales grandes de resultados

Con esos cambios la app seguiria siendo simple, pero mucho mas ordenada, escalable y facil de mantener.
