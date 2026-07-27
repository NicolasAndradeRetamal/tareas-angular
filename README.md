# Tareas

[![CI](https://github.com/NicolasAndradeRetamal/tareas-angular/actions/workflows/ci.yml/badge.svg)](https://github.com/NicolasAndradeRetamal/tareas-angular/actions/workflows/ci.yml)

Gestor de tareas estilo kanban pensado para trabajar sin soltar el teclado:
crear, buscar, filtrar y recorrer el tablero con atajos, con la fluidez y el
pulido de una herramienta profesional (Linear, Trello) en lugar de un *to-do*
de tutorial.

## Qué lo hace distinto

- **El teclado es un ciudadano de primera**, no un añadido: el tablero entero
  es una sola parada de tabulación y se recorre con las flechas, con atajos
  globales para buscar, crear y cambiar de tema, y una hoja de atajos dentro
  de la propia aplicación.
- **Foco y selección son lenguajes visuales distintos**: el foco es un anillo
  efímero, la selección es persistente. Confundirlos es el error más común en
  interfaces que se navegan con teclado.
- **Orden por rangos fraccionales**: arrastrar una tarjeta modifica esa
  tarjeta y ninguna más, en vez de reescribir el índice de toda la columna.
- **Tema oscuro con jerarquía propia**, no una inversión del claro, y con los
  contrastes calculados y verificados en ambos temas.
- **Cero backend**: es una SPA 100 % cliente. No hay servidor, ni base de
  datos, ni llamadas de red en tiempo de ejecución.

## Demo

`https://nicolasandraderetamal.github.io/tareas-angular/`

La sección [§11 de DESIGN.md](DESIGN.md#11-vistas) describe en detalle la
composición de cada pantalla (tablero, diálogos, estados vacíos).

## Tus datos, solo en tu navegador

La aplicación no tiene backend ni cuentas: todo lo que creas se guarda en el
`localStorage` de tu navegador, en tu dispositivo. Nada viaja a ningún
servidor. Eso significa que los datos no se sincronizan entre dispositivos ni
tienen copia de seguridad automática, y que borrar los datos del sitio (o
usar otro navegador/perfil) los elimina. La propia interfaz lo explica y
permite vaciar el tablero cuando quieras. Más detalle en
[ARCHITECTURE.md §1.1](ARCHITECTURE.md#11-por-qué-frontend-only) y
[§8](ARCHITECTURE.md#8-capa-de-persistencia).

En la primera visita, si no hay datos guardados, la app siembra un tablero de
ejemplo para que la demo no se vea vacía; puedes vaciarlo desde el propio menú
de la aplicación y empezar de cero.

## Stack

| Tecnología | Versión |
|---|---|
| Angular (standalone, signals, zoneless) | 22.0.8 |
| Angular CDK (drag & drop) | 22.0.6 |
| TypeScript (modo estricto) | 6.0.3 |
| Tailwind CSS | 4.3.3 |
| Vitest (runner de tests del CLI) | 4.1.10 |
| Node.js | 24.18.0 |
| pnpm | 11.1.2 |

## Qué hace

- CRUD de tareas: título, descripción, cuatro niveles de prioridad y fecha
  límite, con aviso de vencimiento.
- Listas para agrupar tareas, con color propio y su propio CRUD.
- Filtros por estado (pendientes, completadas, vencidas) y por prioridad, más
  búsqueda por texto que ignora tildes y mayúsculas.
- Tablero de tres columnas por estado, con reordenamiento por arrastre dentro
  de cada columna y cambio de estado desde el menú de la tarjeta.
- Navegación completa por teclado: flechas entre tarjetas y columnas, `Enter`
  para editar, `Espacio` para completar, `Supr` para eliminar, y atajos
  globales `/`, `N`, `L`, `T` y `?`.
- Modo claro, oscuro o el del sistema, con conmutador manual.
- Datos de ejemplo en la primera visita, vaciables desde la propia interfaz.

## En camino

La base ya está preparada para lo siguiente, que aún no está construido:

- Arrastre **entre** columnas, además del reordenamiento dentro de cada una.
- Paleta de comandos con `Ctrl`+`K`.
- Deshacer y rehacer expuestos en la interfaz. El historial ya existe y está
  cubierto por tests: todas las mutaciones pasan por un único punto de
  escritura que lo alimenta, pero todavía no hay controles que lo usen.
- Instalable y utilizable sin conexión.

## Cómo levantarlo en local

Requisitos: Node.js 24.15 o superior (fijado en `.nvmrc` y en el campo
`engines` de `package.json`) y pnpm 11.

```bash
git clone https://github.com/NicolasAndradeRetamal/tareas-angular.git
cd tareas-angular
pnpm install
pnpm start
```

La aplicación queda disponible en `http://localhost:4200/`.

No hace falta ningún archivo `.env`: al ser una aplicación 100 % cliente sin
llamadas de red, no hay variables de entorno ni credenciales que configurar.

## Comandos disponibles

| Comando | Descripción |
|---|---|
| `pnpm start` | Servidor de desarrollo con recarga automática |
| `pnpm build` | Compilación de producción en `dist/tareas-angular/browser/` |
| `pnpm test` | Tests unitarios (Vitest, entorno jsdom) |
| `pnpm watch` | Build de desarrollo en modo observación |

## Tests

```bash
pnpm test
```

En integración continua se ejecutan en modo no interactivo:

```bash
pnpm test --watch=false
```

## Despliegue

El sitio se publica como estático en **GitHub Pages**, bajo el subdirectorio
`/tareas-angular/`. El flujo es automático: el workflow
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) compila con
`--base-href /tareas-angular/`, copia `index.html` a `404.html` (para que las
rutas del router funcionen al recargar, ya que Pages no reescribe rutas
desconocidas) y publica el resultado con `actions/upload-pages-artifact` +
`actions/deploy-pages` en cada push a `main`.

Para activarlo por primera vez, en un repositorio con permisos de
administrador:

1. En GitHub, ir a **Settings → Pages**.
2. En **Build and deployment → Source**, elegir **GitHub Actions**.
3. Hacer push (o merge) a `main`: el workflow de despliegue se ejecuta solo y
   publica el sitio.

## Arquitectura y diseño

- [ARCHITECTURE.md](ARCHITECTURE.md) — decisiones de arquitectura: por qué
  frontend-only, signals como modelo de estado, modelo de datos, capa de
  persistencia, deshacer/rehacer y estrategia de distribución.
- [DESIGN.md](DESIGN.md) — sistema visual y de interacción: identidad, color,
  tipografía, movimiento, comportamiento del teclado y del arrastre,
  especificación de cada pantalla y componente.
