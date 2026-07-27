# Tareas

[![CI](https://github.com/NicolasAndradeRetamal/tareas-angular/actions/workflows/ci.yml/badge.svg)](https://github.com/NicolasAndradeRetamal/tareas-angular/actions/workflows/ci.yml)

Gestor de tareas estilo kanban pensado para trabajar sin soltar el teclado:
crear, buscar, filtrar, mover entre columnas y deshacer cualquier acción con
atajos, todo con la fluidez y el pulido de una herramienta profesional
(Linear, Trello) en lugar de un *to-do* de tutorial.

## Qué lo hace distinto

- **Experiencia de teclado de primera**: paleta de comandos (`Ctrl`+`K`),
  atajos documentados en la propia interfaz y foco visible en todo momento.
- **Deshacer/rehacer global**: cualquier mutación —crear, completar, borrar,
  mover una tarjeta entre columnas— se puede deshacer, con historial en
  memoria.
- **Arrastrar y soltar real** entre las tres columnas del tablero (Angular
  CDK), con reordenamiento por rangos fraccionales para que mover una tarjeta
  no reescriba las demás.
- **Cero backend**: es una SPA 100 % cliente. No hay servidor, ni base de
  datos, ni llamadas de red en tiempo de ejecución.

## Demo

**URL de la demo**: _pendiente de publicar en GitHub Pages_ (ver
[Despliegue](#despliegue)). Una vez activada, quedará disponible en
`https://nicolasandraderetamal.github.io/tareas-angular/`.

**Capturas**: pendientes. Mientras tanto, la sección [§11 de
DESIGN.md](DESIGN.md#11-vistas) describe en detalle la composición de cada
pantalla (tablero, diálogos, estados vacíos).

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

## Features

- CRUD de tareas: título, descripción, prioridad y fecha límite.
- Listas para agrupar tareas, con color e identidad propia.
- Filtros por estado (pendientes, completadas, vencidas) y prioridad, más
  búsqueda por texto.
- Vista kanban con arrastre entre columnas y reordenamiento dentro de cada
  una.
- Paleta de comandos (`Ctrl`+`K`) y atajos de teclado globales.
- Deshacer/rehacer de cualquier acción sobre el tablero.
- Modo claro/oscuro con conmutador manual.
- Datos de ejemplo en la primera visita, sustituibles desde la UI.

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
