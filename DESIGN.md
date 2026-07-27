# Diseño — tareas-angular

Sistema visual y de interacción del tablero. Este documento es el contrato de la
interfaz: fija identidad, color, tipografía, tokens, movimiento, comportamiento
del teclado y del arrastre, la especificación de cada componente y la
composición de cada pantalla. Lo que no esté aquí, no se inventa al implementar:
se añade aquí primero.

Los valores viven una sola vez, en `src/styles.css` (§9). Las tablas de este
documento son la referencia legible de esos mismos valores.

---

## 1. Identidad

### 1.1 Concepto

**Un panel de control nocturno para trabajar con las manos en el teclado.** La
aplicación se presenta como una herramienta de escritorio: densa pero respirada,
de superficies planas y bordes finos, con un único color de marca —un violeta
saturado— que solo aparece donde hay acción, foco o trabajo en curso. Todo lo
demás es grafito frío.

La sensación buscada es la de un instrumento afilado: cada pulsación tiene una
respuesta inmediata y proporcionada, nada rebota ni parpadea, y el color se gana
su sitio. La sensación evitada es la del *to-do* de tutorial: fondos con
degradados, tarjetas enormes con mucho aire vacío, sombras difusas por todas
partes, emojis como iconografía y un arcoíris de colores decorativos.

### 1.2 Principios

1. **El teclado es ciudadano de primera.** Todo lo que se puede hacer con el
   ratón tiene camino de teclado, el foco siempre se ve, y los atajos se
   muestran en la propia interfaz junto a la acción que disparan.
2. **La densidad se gana con jerarquía, no con tamaño.** Texto de 14 px,
   interlineado corto y separaciones de 4 px como unidad; la jerarquía la marcan
   el peso, el color de tinta y el espacio, nunca cuerpos tipográficos enormes.
3. **El color es información.** Violeta = acción, marca y trabajo en curso.
   Verde = completado. Ámbar = atención. Rojo = urgencia o vencimiento. Cualquier
   otro uso decorativo del color está prohibido.
4. **Ningún estado se comunica solo con color.** Cada color va acompañado de
   icono, forma o texto (§3.5).
5. **Toda acción tiene reacción visible.** Si el resultado puede parecerse al
   estado anterior, se muestra igualmente qué cambió: contador actualizado,
   resumen del filtro activo, tarjeta resaltada durante un instante, aviso breve.
6. **Nada de funciones futuras a la vista.** Lo que no está construido no aparece
   en la interfaz, ni siquiera deshabilitado.

### 1.3 Identidad de aplicación (entregables)

| Entregable | Especificación |
|---|---|
| `public/favicon.svg` | Cuadrado redondeado (radio 22 %) relleno `#7E22CE`, con una marca de verificación de trazo 2.5, extremos redondeados, en `#F4F4F8`. Sin texto. Incluye `@media (prefers-color-scheme: dark)` dentro del SVG: el relleno pasa a `#C084FC` y el trazo a `#1A0B2E`, para que se lea sobre las pestañas oscuras del navegador |
| `public/favicon.ico` | Respaldo 32×32 y 16×16 con la versión clara, para navegadores sin favicon SVG |
| `public/apple-touch-icon.png` | 180×180, mismo glifo sin transparencia, fondo `#7E22CE` |
| `<title>` | Patrón `{contexto} · Tareas`. Tablero completo: `Tablero · Tareas`. Lista activa: `Trabajo · Tareas`. Ruta desconocida: `Página no encontrada · Tareas`. Se actualiza al cambiar de lista |
| `<meta name="theme-color">` | Dos etiquetas con `media`: `(prefers-color-scheme: light)` → `#F4F4F8`; `(prefers-color-scheme: dark)` → `#0D0D12` |
| `<meta name="description">` | «Tablero de tareas personal que funciona en tu navegador, con atajos de teclado y modo oscuro.» |
| `<html lang="es">` | Ya presente; se mantiene |

En la fase 2 se añaden los iconos de 192, 512 y *maskable* del manifiesto.

---

## 2. Color

### 2.1 Cómo funcionan los dos temas

El tema **no es una inversión** del otro. El modo claro apila superficies
*hacia arriba* desde un lienzo gris (el lienzo es gris, las tarjetas son
blancas); el modo oscuro apila *hacia arriba desde el negro* (cada nivel es un
punto más claro que el anterior) y además **eleva todos los acentos**: el mismo
rol semántico usa un tono oscuro y saturado en claro, y uno claro y luminoso en
oscuro, porque un violeta 700 sobre negro es ilegible y un violeta 400 sobre
blanco también.

El conmutador es manual y persistente (`claro` / `oscuro` / `sistema`), con
`sistema` como valor inicial. El tema se aplica poniendo o quitando la clase
`dark` en `<html>`; la variante de Tailwind se declara acorde
(`@custom-variant dark (&:where(.dark, .dark *));`) y `color-scheme` acompaña al
tema desde el propio CSS, para que las barras de desplazamiento y los controles
nativos de fecha no se queden en claro.

### 2.2 Superficies y fondos

| Token | Uso | Claro | Oscuro |
|---|---|---|---|
| `canvas` | Fondo de la aplicación | `#F4F4F8` | `#0D0D12` |
| `sunken` | Fondo de columna, pista de barra, franja del segmentado | `#EAEAF1` | `#131319` |
| `surface` | Tarjetas, barra superior, panel lateral | `#FFFFFF` | `#1B1B23` |
| `overlay` | Diálogos, menús, avisos breves, paleta de comandos | `#FFFFFF` | `#232330` |
| `field` | Fondo de campos de formulario y buscador | `#FFFFFF` | `#15151D` |
| `hover` | Velo de hover sobre cualquier superficie | `rgb(26 26 36 / 0.05)` | `rgb(237 237 242 / 0.06)` |
| `press` | Velo de pulsado | `rgb(26 26 36 / 0.09)` | `rgb(237 237 242 / 0.10)` |
| `scrim` | Fondo detrás de un diálogo | `rgb(20 20 30 / 0.45)` | `rgb(6 6 10 / 0.65)` |
| `tooltip` / `on-tooltip` | Descripción emergente | `#26262F` / `#F4F4F8` | `#31313F` / `#EDEDF2` |

Los velos `hover` y `press` son translúcidos a propósito: la misma clase
funciona sobre tarjeta, sobre columna y sobre menú sin definir una variante por
superficie.

### 2.3 Tinta y líneas

| Token | Uso | Claro | Oscuro |
|---|---|---|---|
| `ink` | Texto principal, títulos de tarea | `#1A1A24` | `#EDEDF2` |
| `ink-muted` | Texto secundario, etiquetas, iconos de apoyo | `#55556B` | `#ABABC0` |
| `ink-subtle` | Metadatos, contadores, marcador de posición | `#67677E` | `#8B8BA3` |
| `line` | Bordes decorativos y divisores | `#DFDFE8` | `#2A2A36` |
| `line-strong` | Bordes funcionales: campo, casilla, botón secundario | `#8A8AA0` | `#6B6B85` |

### 2.4 Marca y semánticos

| Token | Uso | Claro | Oscuro |
|---|---|---|---|
| `primary` | Botón principal, enlaces, anillo de foco, lista activa, columna «En progreso» | `#7E22CE` | `#C084FC` |
| `primary-hover` | Hover y pulsado sobre elementos de marca | `#6B21A8` | `#D8B4FE` |
| `primary-soft` | Fondo de elemento seleccionado, chip de marca, hueco de destino | `#F3E8FF` | `#2C1148` |
| `on-primary` | Texto e iconos sobre relleno `primary` | `#FFFFFF` | `#1A0B2E` |
| `success` | Columna «Completadas», casilla marcada, aviso de éxito | `#146C33` | `#4ADE80` |
| `success-soft` / `on-success` | Fondo del aviso de éxito / texto sobre relleno | `#E3F5E9` / `#FFFFFF` | `#0E2C1A` / `#06210F` |
| `warning` | Prioridad alta, vence hoy o mañana, aviso no bloqueante | `#A44E05` | `#FBBF24` |
| `warning-soft` / `on-warning` | Fondo del aviso / texto sobre relleno | `#FCEDD8` / `#FFFFFF` | `#3A2607` / `#2A1A02` |
| `danger` | Prioridad urgente, tarea vencida, acción destructiva, error | `#BE123C` | `#FB7185` |
| `danger-hover` | Hover de la acción destructiva | `#9F0F32` | `#FDA4AF` |
| `danger-soft` / `on-danger` | Fondo del aviso / texto sobre relleno | `#FDE6EB` / `#FFFFFF` | `#3A1119` / `#2A0A10` |
| `info` | Prioridad media, aviso informativo | `#0B6E99` | `#22D3EE` |
| `info-soft` / `on-info` | Fondo del aviso / texto sobre relleno | `#DCEEF7` / `#FFFFFF` | `#08303F` / `#04212B` |

El **anillo de foco** (`focus`) es un alias de `primary` en ambos temas: un solo
color de foco en toda la aplicación, sin excepciones (§7).

### 2.5 Colores de lista

Las listas tienen color propio (`slate`, `blue`, `emerald`, `amber`, `rose`,
`violet`). Se usan **solo como punto de 8 px junto al nombre** y como franja de
2 px en el borde superior de la tarjeta cuando se ven varias listas a la vez.
Nunca como fondo de tarjeta ni de columna: el color de lista no debe competir
con el color semántico.

| Lista | Claro | Oscuro |
|---|---|---|
| `slate` | `#64748B` | `#94A3B8` |
| `blue` | `#2563EB` | `#60A5FA` |
| `emerald` | `#047857` | `#34D399` |
| `amber` | `#B45309` | `#FBBF24` |
| `rose` | `#BE123C` | `#FB7185` |
| `violet` | `#7C3AED` | `#A78BFA` |

Todos superan 3:1 contra la superficie sobre la que se pintan. Como las clases
de color de lista se resuelven en tiempo de ejecución, la plantilla usa un
**mapa estático** de clases (`{ blue: 'bg-list-blue', ... }`); nunca se compone
el nombre de la clase por concatenación, porque entonces Tailwind no la genera.

### 2.6 Contraste verificado

Ratios calculados con la fórmula de luminancia relativa de la WCAG 2.1. Objetivo:
**AA (4.5:1)** en todo texto; **AAA (7:1)** en el texto de cuerpo.

**Modo claro**

| Par | Ratio | Nivel |
|---|---|---|
| `ink` sobre `surface` | 17.3:1 | AAA |
| `ink` sobre `canvas` | 15.7:1 | AAA |
| `ink` sobre `sunken` | 14.4:1 | AAA |
| `ink-muted` sobre `surface` | 7.2:1 | AAA |
| `ink-muted` sobre `canvas` | 6.6:1 | AA |
| `ink-subtle` sobre `surface` | 5.7:1 | AA |
| `ink-subtle` sobre `sunken` | 4.8:1 | AA |
| `primary` sobre `surface` | 7.0:1 | AAA |
| `on-primary` sobre `primary` | 7.0:1 | AAA |
| `primary` sobre `primary-soft` | 5.9:1 | AA |
| `success` sobre `surface` | 6.5:1 | AA |
| `success` sobre `success-soft` | 5.7:1 | AA |
| `warning` sobre `surface` | 5.7:1 | AA |
| `warning` sobre `warning-soft` | 5.0:1 | AA |
| `danger` sobre `surface` | 6.3:1 | AA |
| `danger` sobre `danger-soft` | 5.3:1 | AA |
| `info` sobre `surface` | 5.7:1 | AA |
| `line-strong` sobre `surface` | 3.4:1 | AA (no textual) |
| Anillo de foco sobre `canvas` | 6.4:1 | AA (no textual) |

**Modo oscuro**

| Par | Ratio | Nivel |
|---|---|---|
| `ink` sobre `canvas` | 16.6:1 | AAA |
| `ink` sobre `surface` | 14.5:1 | AAA |
| `ink` sobre `overlay` | 13.5:1 | AAA |
| `ink-muted` sobre `surface` | 7.5:1 | AAA |
| `ink-muted` sobre `overlay` | 7.0:1 | AAA |
| `ink-subtle` sobre `surface` | 5.1:1 | AA |
| `ink-subtle` sobre `overlay` | 4.7:1 | AA |
| `primary` sobre `surface` | 6.4:1 | AA |
| `primary` sobre `canvas` | 7.3:1 | AAA |
| `on-primary` sobre `primary` | 7.0:1 | AAA |
| `primary` sobre `primary-soft` | 6.2:1 | AA |
| `success` sobre `surface` | 9.7:1 | AAA |
| `warning` sobre `surface` | 10.0:1 | AAA |
| `danger` sobre `surface` | 6.3:1 | AA |
| `info` sobre `surface` | 9.4:1 | AAA |
| `line-strong` sobre `surface` | 3.3:1 | AA (no textual) |
| Anillo de foco sobre `canvas` | 7.3:1 | AAA |

Ajustes que se hicieron para llegar a estas cifras, por si alguien se pregunta
por qué no son los valores «de catálogo»: el verde de éxito claro es `#146C33`
en lugar de un verde 700 estándar (que se quedaba en 4.5:1 sobre el lienzo), el
ámbar claro es `#A44E05` en vez de un ámbar 700 (4.6:1, demasiado justo) y la
tinta sutil clara se oscureció a `#67677E` para pasar 4.5:1 también sobre el
fondo de columna.

`line` **no alcanza 3:1 y no debe hacerlo**: es un borde decorativo que separa
bloques que ya se distinguen por su fondo. Todo borde que sea el único indicador
de un control interactivo usa `line-strong`.

---

## 3. Color semántico del dominio

### 3.1 Prioridad (cuatro niveles)

El modelo define cuatro prioridades. Se representan siempre con **tres portadores
a la vez**: color, un medidor de barras y texto.

| Prioridad | Color | Medidor | Texto |
|---|---|---|---|
| Baja | `priority-low` (= `ink-subtle`) | 1 barra de 4 llena | «Baja» |
| Media | `priority-medium` (= `info`) | 2 barras de 4 | «Media» |
| Alta | `priority-high` (= `warning`) | 3 barras de 4 | «Alta» |
| Urgente | `priority-urgent` (= `danger`) | 4 barras de 4 | «Urgente» |

- **Medidor**: cuatro barras verticales de 2×10 px con 2 px de separación,
  alineadas abajo, con las barras inactivas en `line-strong` al 40 %. Es
  legible en escala de grises y en monocromo.
- En la **tarjeta** el medidor va en la fila de metadatos; el texto de la
  prioridad viaja en `aria-label` y en el título emergente («Prioridad: alta»).
- En el **formulario** y en la **hoja de filtros** se muestra medidor + texto
  visible, nunca solo el color.
- La tarjeta lleva además una **franja izquierda de 3 px** con el color de la
  prioridad: es el único elemento que permite escanear una columna entera de un
  vistazo. La franja de prioridad baja se pinta en `line` para que no compita.

### 3.2 Estados de columna del tablero

Las columnas son exactamente los tres estados de la tarea. Cada una se
identifica con punto de color + icono + rótulo + contador:

| Columna | Color | Icono (20 px) | Rótulo |
|---|---|---|---|
| Por hacer | `status-todo` (= `ink-subtle`) | Círculo de trazo discontinuo | «Por hacer» |
| En progreso | `status-progress` (= `primary`) | Círculo con la mitad rellena | «En progreso» |
| Completadas | `status-done` (= `success`) | Círculo con marca de verificación | «Completadas» |

El contador va en una cápsula `sunken` con tinta `ink-muted`, tipografía
tabular, y su `aria-label` es explícito: «4 tareas». Un contador en 0 se muestra
igualmente (nunca se oculta): saber que una columna está vacía es información.

### 3.3 Estados de la tarea

| Estado | Portadores |
|---|---|
| **Vencida** | Cápsula `danger-soft` con texto `danger`, icono de triángulo de aviso de 14 px y **texto completo**: «Venció hace 2 días · 25 jul 2026». Además, la fecha nunca se muestra sola |
| **Vence hoy / mañana** | Cápsula `warning-soft` con texto `warning`, icono de reloj: «Vence hoy · 27 jul 2026», «Vence mañana · 28 jul 2026» |
| **Con fecha futura** | Sin cápsula: icono de calendario de 14 px en `ink-subtle` + fecha: «3 mar 2027» |
| **Completada** | Casilla marcada en `success` con la marca de verificación, título en `ink-subtle` con tachado de 1 px, y toda la tarjeta al 70 % de opacidad. La franja de prioridad pasa a `line` |
| **Sin fecha** | No se muestra nada. La ausencia no se rellena con guiones ni con «Sin fecha» |

**Regla de fechas**: toda fecha visible lleva día, mes abreviado y **año siempre
que no sea el año en curso**; en las cápsulas de vencida y de vence hoy el año se
escribe siempre, porque son las que se leen fuera de contexto. La distancia
relativa («hace 2 días») acompaña, pero nunca sustituye, a la fecha absoluta.
El atributo `datetime` del elemento `<time>` lleva la fecha ISO completa.

### 3.4 Coincidencia de rojos

`danger` designa dos cosas distintas —prioridad urgente y tarea vencida— y eso
es aceptable porque **nunca comparten forma ni posición**: la urgencia vive en la
franja izquierda y en el medidor de barras; el vencimiento vive en una cápsula
con icono y texto en la fila de metadatos. Una tarjeta urgente y vencida muestra
las dos cosas y se lee sin ambigüedad.

### 3.5 Regla dura

Ningún estado del sistema se comunica solo con color. La comprobación que debe
pasar cualquier pantalla: **en escala de grises, toda la información sigue
estando**. Los portadores admitidos son icono, forma (medidor, franja, tachado),
texto visible y posición.

---

## 4. Tipografía

### 4.1 Pila elegida y por qué no hay fuente web

Se usa la **pila del sistema**, no una fuente descargada:

```
--font-sans: ui-sans-serif, system-ui, -apple-system, 'Segoe UI Variable Text',
  'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif,
  'Apple Color Emoji', 'Segoe UI Emoji';

--font-mono: ui-monospace, 'SFMono-Regular', 'SF Mono', 'Cascadia Mono',
  'Segoe UI Mono', 'Roboto Mono', Menlo, Consolas, monospace;
```

Justificación, en orden de peso:

1. **No hay CDN de fuentes.** La aplicación se sirve como estáticos y en la fase
   2 debe funcionar sin conexión; una petición a un dominio de terceros es un
   punto de fallo y una fuga de privacidad innecesaria.
2. **Autoalojar tampoco compensa aquí.** Una familia variable son 60–120 KB
   adicionales en la ruta crítica de una aplicación cuyo primer pintado es todo
   texto; el coste se paga en cada carga para ganar matices tipográficos que en
   cuerpos de 12–14 px casi no se aprecian.
3. **Cero destello y cero salto de maquetación**: no hay `FOUT`, no hay
   `font-display`, no hay reserva de métricas.
4. La pila del sistema es, además, **la que usan las herramientas que este
   proyecto toma como referencia**: en una aplicación de productividad se espera
   la letra del sistema operativo.

La identidad tipográfica se construye entonces con **tratamiento**, no con
familia: interletrado ligeramente negativo (`-0.012em`) en todo el cuerpo,
números tabulares en fechas y contadores, monoespaciada exclusivamente para las
teclas de atajo, y una escala corta y disciplinada.

La monoespaciada solo se usa en el componente `kbd` (§10.14) y en el pie técnico
del aviso de datos corruptos. No se usa para texto de tarea.

### 4.2 Escala

Tamaño base del documento: 16 px (no se toca el `rem`). El cuerpo de la interfaz
es **14 px**: `body` arranca en `text-sm`.

| Token | Tamaño | Interlineado | Peso | Uso |
|---|---|---|---|---|
| `text-2xs` | 11 px | 16 px | 500–600 | Teclas `kbd`, contadores de columna, rótulos en versalitas |
| `text-xs` | 12 px | 16 px | 400–500 | Metadatos de tarjeta, fechas, texto de ayuda de campo |
| `text-sm` | 14 px | 20 px | 400–500 | **Cuerpo por defecto**: título de tarjeta, menús, botones, campos |
| `text-base` | 16 px | 24 px | 400 | Texto de párrafo en diálogos y estados vacíos |
| `text-lg` | 18 px | 26 px | 600 | Título de diálogo, título de estado vacío |
| `text-xl` | 22 px | 28 px | 600 | Título de la pantalla en móvil |
| `text-2xl` | 28 px | 34 px | 600 | Título de la página de ruta no encontrada |

Pesos disponibles: 400 (normal), 500 (medio), 600 (semibold), 700 (bold, solo en
el número de un contador destacado). **No se usa 300 ni 800**: en la pila del
sistema no están garantizados y el navegador los sintetiza mal.

### 4.3 Ajustes pensados para tarjetas densas

- **Título de tarea**: `text-sm`, peso 500, interlineado 20 px, máximo **2
  líneas** con recorte por elipsis (`line-clamp-2`). No se rompen palabras.
- **Descripción en la tarjeta**: `text-xs`, `ink-muted`, **1 línea** recortada.
  Si la tarea no tiene descripción, la línea no se reserva.
- **Fila de metadatos**: `text-xs`, altura fija de 20 px, separación de 8 px
  entre elementos, para que todas las tarjetas alineen su base.
- **Interletrado**: `-0.012em` general; `0` en `text-2xs` y en la monoespaciada;
  `+0.06em` (`tracking-caps`) en los rótulos en versalitas de 11 px.
- **Números tabulares**: obligatorios en fechas, contadores y resultados de
  búsqueda, para que el ancho no baile al cambiar el valor. Se aplican
  automáticamente a `<time>` y a cualquier elemento con `data-numeric`.

---

## 5. Espaciado, radios y bordes

### 5.1 Espaciado

Unidad base **4 px**. La escala admitida es `4, 6, 8, 12, 16, 20, 24, 32, 48`;
todo lo demás hay que justificarlo.

| Medida | Uso |
|---|---|
| 4 px | Separación icono–texto dentro de un chip |
| 6 px | Relleno vertical de chips y cápsulas |
| 8 px | Separación entre tarjetas de una columna; separación entre metadatos |
| 12 px | Relleno interior de la tarjeta; separación entre campos de formulario |
| 16 px | Relleno de columna, de diálogo en móvil, separación entre columnas |
| 20 px | Relleno lateral de la barra superior en escritorio |
| 24 px | Relleno de diálogo en escritorio; margen del contenido del tablero |
| 32–48 px | Respiración vertical de los estados vacíos |

Alturas fijas: barra superior **56 px** en móvil y **60 px** en escritorio;
encabezado de columna **44 px**; fila de menú **36 px**; campo de formulario
**36 px** (`md`) y **44 px** en móvil.

### 5.2 Radios

| Token | Valor | Uso |
|---|---|---|
| `radius-xs` | 4 px | Teclas `kbd`, medidor de prioridad, casilla |
| `radius-sm` | 6 px | Botones, campos, filas de menú, chips |
| `radius-md` | 8 px | Tarjeta de tarea, avisos breves, banner |
| `radius-lg` | 12 px | Columna, diálogo, panel de menú, paleta de comandos |
| `radius-xl` | 16 px | Ilustración de estado vacío, panel del cajón móvil |
| `rounded-full` | — | Cápsulas de contador, punto de lista, avatar de color |

Regla de anidamiento: el radio interior es siempre igual o menor que el
exterior. Una tarjeta (8) dentro de una columna (12) nunca lleva radio 12.

### 5.3 Bordes

- Todo borde mide **1 px**. La única excepción es la franja de prioridad
  (3 px) y la franja de lista superior (2 px).
- Los bloques de contenido (tarjeta, columna, diálogo, menú) llevan borde
  `line`; en modo oscuro ese borde **es el principal recurso de separación**
  porque las sombras casi no se ven.
- Los controles (campo, casilla, botón secundario) llevan borde `line-strong`,
  que sí cumple 3:1.
- El borde nunca desaparece en hover; cambia de color o se le suma un velo, para
  que no haya saltos de 1 px en la maquetación.

### 5.4 Elevación

Cinco niveles, con dos definiciones distintas por tema:

| Token | Uso | Claro | Oscuro |
|---|---|---|---|
| `shadow-xs` | Tarjeta en reposo | `0 1px 2px rgb(23 23 35 / .06)` | `0 1px 2px rgb(0 0 0 / .40)` |
| `shadow-sm` | Tarjeta en hover, barra superior al hacer scroll | `0 1px 3px / .10` + `0 1px 2px -1px / .08` | `0 2px 6px -1px rgb(0 0 0 / .50)` + `0 1px 2px -1px / .40` |
| `shadow-md` | Menús, descripciones emergentes, avisos breves | `0 8px 20px -6px / .16` + `0 2px 6px -2px / .10` | `0 10px 24px -6px rgb(0 0 0 / .60)` + `0 2px 6px -2px / .45` |
| `shadow-lg` | Diálogos, paleta de comandos | `0 20px 44px -12px / .28` + `0 4px 12px -4px / .14` | `0 24px 56px -12px rgb(0 0 0 / .75)` + `0 6px 16px -6px / .55` |
| `shadow-drag` | Tarjeta arrastrada | `0 16px 32px -8px / .30` + `0 4px 8px -4px / .20` | `0 18px 36px -10px rgb(0 0 0 / .70)` + anillo `rgb(192 132 252 / .35)` |

**Cómo funciona la elevación en oscuro.** Una sombra negra sobre un fondo casi
negro no se percibe, así que en modo oscuro la profundidad la dan, por este
orden: (1) **el escalón de superficie** —`canvas` → `sunken` → `surface` →
`overlay`, cada uno más claro—, (2) **el borde `line`**, y (3) la sombra, que se
mantiene pero con opacidades mucho mayores y solo aporta separación del contorno.
Por eso el nivel `shadow-drag` en oscuro incluye un anillo violeta translúcido:
es lo único que de verdad despega la tarjeta del fondo.

---

## 6. Movimiento

### 6.1 Tokens

| Token | Valor | Uso |
|---|---|---|
| `--duration-instant` | 90 ms | Color de hover y pulsado, opacidad de iconos |
| `--duration-fast` | 150 ms | Menús, descripciones emergentes, salida de avisos |
| `--duration-base` | 200 ms | Entrada de diálogos y avisos, aparición de tarjetas |
| `--duration-slow` | 250 ms | Cajón lateral en móvil, reposicionado de tarjetas al arrastrar |
| `ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Movimiento entre dos posiciones (desplazamientos, cajón) |
| `ease-entrance` | `cubic-bezier(0.16, 1, 0.3, 1)` | Todo lo que aparece: rápido al entrar, frena suave |
| `ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Todo lo que desaparece: acelera y se va |

Regla: **nada dura más de 250 ms** y nada se anima que no sea `opacity`,
`transform` o `color`/`background-color`. No se animan `height`, `width` ni
`top`/`left`.

### 6.2 Qué se anima

| Elemento | Entrada | Salida |
|---|---|---|
| Diálogo | Velo: opacidad 0→1, 150 ms `ease-entrance`. Panel: opacidad 0→1 + `scale(.98)→1` + `translateY(4px)→0`, 200 ms `ease-entrance` | 150 ms `ease-exit`, mismos valores invertidos |
| Menú / desplegable | Opacidad 0→1 + `scale(.97)→1` con origen en el disparador, 150 ms `ease-entrance` | 90 ms `ease-exit` |
| Aviso breve (toast) | `translateY(8px)→0` + opacidad, 200 ms `ease-entrance` | `translateX(8px)` + opacidad, 150 ms `ease-exit`; la pila recoloca el resto en 200 ms `ease-standard` |
| Cajón de listas (móvil) | `translateX(-100%)→0`, 250 ms `ease-standard`; velo en paralelo | 200 ms `ease-exit` |
| Tarjeta creada | Opacidad 0→1 + `translateY(-4px)→0`, 200 ms, **más** un destello de fondo `primary-soft` que se desvanece en 1200 ms | — |
| Tarjeta eliminada | Opacidad 1→0 + `scale(.98)`, 150 ms; el hueco se cierra en 200 ms `ease-standard` | — |
| Casilla de completar | Marca dibujada en 150 ms `ease-entrance`; el título se atenúa y tacha en 150 ms | — |
| Hover / pulsado | `background-color` 90 ms lineal | igual |
| Anillo de foco | **Sin transición.** Aparece y desaparece de inmediato | — |
| Cambio de tema | `background-color` y `color` en 150 ms sobre `html`; se desactiva mientras el usuario no haya interactuado, para que la carga inicial no parpadee | — |
| Barra de columna al arrastrar | ver §8 | — |

### 6.3 Movimiento reducido

`prefers-reduced-motion: reduce` está atendido de forma global en la capa base:
todas las transiciones y animaciones se reducen a 1 ms y el desplazamiento pasa a
instantáneo. Consecuencias que hay que aceptar y que están bien:

- Los diálogos y avisos siguen apareciendo y desapareciendo, pero sin
  desplazamiento ni escalado.
- El destello de la tarjeta recién creada se mantiene como **cambio de color
  sostenido** durante 1,2 s y luego desaparece de golpe: sigue cumpliendo su
  función de señalar dónde quedó la tarjeta.
- El arrastre del CDK sigue funcionando; lo que se pierde es el reacomodo
  animado de las tarjetas vecinas, que saltan a su posición.

---

## 7. Foco y teclado

Es el rasgo distintivo del proyecto y por eso tiene reglas propias, más
estrictas que el resto del sistema.

### 7.1 Anillo de foco

- **Un solo estilo en toda la aplicación**: `outline: 2px solid primary` con
  `outline-offset: 2px`. Se declara una vez en la capa base sobre `:focus-visible`
  y no se sobrescribe salvo para ajustar el desplazamiento en elementos pegados a
  un borde.
- Se usa `:focus-visible`, no `:focus`: hacer clic en una tarjeta no dibuja el
  anillo; llegar con `Tab` o con las flechas, sí.
- **Nunca `outline: none`** sin sustituto. Si un contenedor recorta el anillo, se
  cambia el recorte, no el anillo.
- En claro el anillo alcanza 6.4:1 contra el lienzo; en oscuro, 7.3:1. Como el
  desplazamiento de 2 px deja ver la superficie de debajo, el anillo también se
  ve sobre un botón violeta relleno.
- En elementos con fondo `primary` el anillo se mantiene violeta: la separación
  de 2 px en color de superficie es lo que garantiza el contorno.

### 7.2 Foco frente a selección

Dos lenguajes visuales que jamás se mezclan:

| | Aspecto | Significado |
|---|---|---|
| **Foco** | Anillo de 2 px **por fuera** del elemento, sin cambio de fondo | Dónde está el teclado ahora mismo. Efímero |
| **Selección / activo** | Fondo `primary-soft` + barra izquierda de 3 px `primary` + peso 500, **sin anillo** | Qué está elegido: la lista activa, el filtro activo, la opción marcada del menú. Persistente |
| **Ambos a la vez** | Fondo de selección **y** anillo por fuera | El teclado está sobre el elemento ya seleccionado |

Además, la selección siempre se refuerza semánticamente: `aria-current="page"`
en la lista activa, `aria-pressed` en los filtros del segmentado, `aria-checked`
en las opciones de tema.

### 7.3 Navegación del tablero

- **Orden de tabulación** del documento: enlace de salto → marca → buscador →
  acciones de la barra → cajón/panel de listas → filtros → tablero → avisos.
- Dentro del tablero se usa **tabulación por grupos (roving tabindex)**: el
  tablero entero es **una sola parada de `Tab`**. Al entrar, el foco cae en la
  primera tarjeta de la primera columna no vacía; al volver a entrar, en la
  última tarjeta que tuvo el foco.
- Dentro del tablero mandan las flechas:

| Tecla | Acción |
|---|---|
| `↑` `↓` | Tarjeta anterior / siguiente dentro de la columna |
| `←` `→` | Columna anterior / siguiente, conservando la posición vertical aproximada |
| `Inicio` `Fin` | Primera / última tarjeta de la columna |
| `Enter` | Abrir el detalle de la tarea |
| `Espacio` | Marcar o desmarcar como completada |
| `Supr` | Eliminar la tarea (abre confirmación) |
| `Esc` | Salir del tablero hacia la barra de herramientas |

- Al pulsar `Tab` dentro de una tarjeta enfocada, el foco entra en sus controles
  internos (casilla, menú) en orden; `Esc` vuelve a la tarjeta.
- El desplazamiento sigue al foco: la tarjeta enfocada siempre queda visible
  dentro de su columna (`scroll-margin` de 8 px arriba y abajo).

### 7.4 Inventario de atajos

La columna **Fase** indica en qué versión existe el atajo. **La hoja de atajos
de la aplicación solo lista los atajos que ya funcionan**: los de la fase 2 no
aparecen hasta que se construyen.

| Atajo | Acción | Ámbito | Fase |
|---|---|---|---|
| `/` | Enfocar el buscador | Global | 1 |
| `N` | Nueva tarea | Global | 1 |
| `L` | Nueva lista | Global | 1 |
| `?` | Abrir la hoja de atajos | Global | 1 |
| `T` | Cambiar entre claro y oscuro | Global | 1 |
| `Esc` | Cerrar diálogo, menú o cajón; con el buscador enfocado, vaciarlo | Global | 1 |
| `↑` `↓` `←` `→` | Navegar entre tarjetas y columnas | Tablero | 1 |
| `Enter` | Abrir el detalle de la tarea enfocada | Tablero | 1 |
| `Espacio` | Completar o reabrir la tarea enfocada | Tablero | 1 |
| `Supr` | Eliminar la tarea enfocada | Tablero | 1 |
| `Ctrl`+`Enter` | Guardar el formulario | Diálogo | 1 |
| `Ctrl`+`K` | Abrir la paleta de comandos | Global | 2 |
| `Ctrl`+`Z` / `Ctrl`+`Shift`+`Z` | Deshacer / rehacer | Global | 2 |
| `Ctrl`+`↑` `↓` | Mover la tarjeta dentro de su columna | Tablero | 2 |
| `Ctrl`+`←` `→` | Mover la tarjeta a la columna contigua | Tablero | 2 |

Reglas de comportamiento:

- Los atajos de una sola tecla **se ignoran mientras el foco está en un campo de
  texto** o hay un diálogo modal abierto (salvo `Esc` y `Ctrl`+`Enter`).
- En macOS, `Ctrl` se muestra y se escucha como `⌘`. La hoja de atajos detecta
  la plataforma y pinta el símbolo correcto.
- Ningún atajo pisa uno del navegador (`Ctrl`+`T`, `Ctrl`+`N`, `Ctrl`+`W`): por
  eso los atajos de una tecla no llevan modificador.

### 7.5 Cómo se muestran los atajos

- El componente `kbd` (§10.14): 11 px monoespaciada, altura 20 px, relleno
  lateral 6 px, fondo `sunken`, borde 1 px `line-strong`, radio `xs`, tinta
  `ink-muted`.
- Una combinación se pinta como **teclas separadas con 2 px de espacio, sin
  signo `+`**: `Ctrl` `K`.
- Dónde aparecen:
  - En la **hoja de atajos** (`?`), agrupados por ámbito. Es el lugar donde se
    aprenden.
  - En los **títulos emergentes** de los controles: «Nueva tarea (N)». Es el
    lugar donde se recuerdan, justo sobre el control al que pertenecen.
  - En las **filas de menú**, alineados a la derecha en `ink-subtle`.
- **Nunca estampados dentro de un botón.** Una tecla incrustada en la etiqueta
  compite con ella por la atención, ensancha el control y no aporta nada a quien
  usa el ratón —que es quien está leyendo el botón—. Quien usa el teclado no
  necesita ver la tecla en pantalla: la busca una vez en la hoja de atajos y ya
  no vuelve a mirar. El título emergente cubre el caso intermedio sin ocupar
  espacio permanente.
- En dispositivos táctiles sin teclado (`pointer: coarse` y sin `hover`) las
  teclas de los títulos emergentes no se pintan; la hoja de atajos sigue
  accesible desde el menú.

---

## 8. Arrastrar y soltar

Se implementa con el CDK de Angular. En la fase 1 el arrastre **reordena dentro
de la misma columna**; en la fase 2 se conectan las tres columnas y se admite
soltar entre ellas. La especificación visual es la misma; lo que cambia es qué
destinos aceptan la tarjeta.

### 8.1 Asidero y cursor

- Cada tarjeta tiene un **asidero explícito** (`cdkDragHandle`): rejilla de seis
  puntos, 20 px, en `ink-subtle`, arriba a la derecha de la tarjeta.
- En escritorio el asidero está al 0 % de opacidad en reposo y pasa al 100 % en
  hover o foco de la tarjeta, **pero su espacio siempre está reservado**: no hay
  salto de maquetación.
- En dispositivos táctiles el asidero es visible siempre y mide 44×44 px.
- Cursores: `grab` sobre el asidero; `grabbing` en todo el documento mientras se
  arrastra (clase `cdk-drag-dragging` sobre `<body>`); el resto de la interfaz
  mantiene su cursor normal.
- Arrastrar desde el cuerpo de la tarjeta también funciona en escritorio; el
  asidero existe para el táctil y para dejar clara la afordancia.

### 8.2 Estados

| Elemento | Aspecto |
|---|---|
| **Tarjeta arrastrada** (`.cdk-drag-preview`) | `shadow-drag`, `scale(1.02)`, `rotate(1.5deg)`, borde `primary` al 40 %, opacidad 1. Conserva el ancho original de la columna |
| **Hueco de destino** (`.cdk-drag-placeholder`) | Misma altura que la tarjeta, fondo `primary-soft`, borde discontinuo de 1.5 px `primary` al 45 %, radio `md`, sin contenido. Aparece con 150 ms de opacidad |
| **Tarjeta de origen** | Desaparece de su sitio: el hueco ocupa exactamente su lugar, así que no hay salto |
| **Vecinas** | Se recolocan con `transform` en 250 ms `ease-standard` (`.cdk-drag-animating`) |
| **Columna activa** (recibe el puntero) | Fondo pasa de `sunken` a `sunken` + velo `hover`; anillo interior de 1 px `primary` al 40 %; el encabezado sube su punto de color al 100 % de opacidad. Transición 150 ms |
| **Columna no elegible** (fase 2, destino inválido) | Contenido al 55 % de opacidad, sin anillo. Nunca se atenúa la columna de origen |
| **Soltar válido** | La tarjeta cae en su sitio en 200 ms `ease-entrance` y recibe el destello `primary-soft` de 1200 ms, para que se vea dónde quedó |
| **Soltar cancelado** (`Esc` o fuera) | La tarjeta vuelve a su origen en 250 ms `ease-standard` sin destello |
| **Movimiento reducido** | Sin rotación ni escalado en la vista previa; el hueco aparece sin transición; las vecinas saltan |

### 8.3 Desplazamiento automático

Las columnas tienen su propio desplazamiento vertical y `cdkDropListAutoScroll`
activo: al acercar la tarjeta a 48 px del borde superior o inferior, la columna
se desplaza. En móvil, donde las columnas están apiladas, el desplazamiento es
el de la página.

### 8.4 Accesibilidad del arrastre

- El arrastre por puntero **no es el único camino**: la tarjeta se mueve de
  columna desde su menú («Mover a › En progreso») y, en la fase 2, con
  `Ctrl`+flechas.
- El asidero es un `<button>` real con `aria-label` «Reordenar la tarea
  {título}» y `aria-describedby` apuntando a una instrucción invisible:
  «Usa el menú de la tarea para moverla de columna».
- Se anuncia por región activa (`LiveAnnouncer` del CDK, `assertive`):
  - al empezar: «Tarea “Preparar informe” tomada. Posición 2 de 5 en Por hacer.»
  - al soltar: «Tarea “Preparar informe” soltada. Posición 1 de 5 en Por hacer.»
  - al cancelar: «Movimiento cancelado. La tarea vuelve a su posición.»
- Mientras se arrastra, el `aria-live` de contadores y filtros **no** se
  actualiza, para no encadenar anuncios.

---

## 9. Tokens

Los tokens viven en `src/styles.css`, en la sintaxis de Tailwind CSS 4: el tema
se declara con `@theme`, no con un archivo de configuración JavaScript.

### 9.1 Mecanismo de los dos temas

```css
@import 'tailwindcss';

@custom-variant dark (&:where(.dark, .dark *));

:root {
  color-scheme: light;
  --surface: #ffffff;
  --ink: #1a1a24;
  /* ...resto de valores claros y sombras --elev-* */
}

.dark {
  color-scheme: dark;
  --surface: #1b1b23;
  --ink: #ededf2;
  /* ...resto de valores oscuros */
}

@theme inline {
  --color-surface: var(--surface);
  --color-ink: var(--ink);
  --shadow-md: var(--elev-3);
  /* ... */
}
```

Tres decisiones que conviene entender antes de tocar el archivo:

1. **La variante oscura es por clase**, no por `prefers-color-scheme`, porque hay
   conmutador manual. La preferencia del sistema solo decide el valor inicial.
2. **`@theme inline` es obligatorio** para los tokens que cambian con el tema.
   Sin `inline`, Tailwind emitiría `background-color: var(--color-surface)` y esa
   variable quedaría resuelta en `:root` con el valor claro para todo el
   documento. Con `inline`, la utilidad emite `background-color: var(--surface)`
   y la variable se resuelve en cada elemento, de modo que la clase `dark` del
   `<html>` la cambia por herencia. Los tokens que **no** dependen del tema
   (tipografía, escala, radios, curvas) van en un `@theme` normal.
3. **`color-scheme` se declara en el propio CSS** (`light` en `:root`, `dark` en
   `.dark`), así que basta con conmutar la clase para que las barras de
   desplazamiento y el selector de fecha nativo acompañen al tema.

4. **El rastreo de clases se limita a `src/`** (`@import 'tailwindcss'
   source('.')`). Por defecto Tailwind recorre todo el repositorio y acabaría
   generando utilidades a partir de los nombres de clase citados en la
   documentación; acotarlo mantiene la hoja de estilos ceñida a lo que la
   aplicación usa de verdad.

Consecuencia práctica: **la variante `dark:` casi no se usa en las plantillas**.
Un `bg-surface text-ink` ya es correcto en los dos temas. `dark:` queda reservado
para diferencias estructurales (una opacidad distinta, un borde que solo existe
en oscuro), y cada uso debería poder explicarse.

### 9.2 Inventario de tokens

| Espacio | Tokens |
|---|---|
| Color | `canvas`, `sunken`, `surface`, `overlay`, `field`, `hover`, `press`, `scrim`, `tooltip`, `on-tooltip`, `line`, `line-strong`, `ink`, `ink-muted`, `ink-subtle`, `primary`, `primary-hover`, `primary-soft`, `on-primary`, `focus`, `success`, `success-soft`, `on-success`, `warning`, `warning-soft`, `on-warning`, `danger`, `danger-hover`, `danger-soft`, `on-danger`, `info`, `info-soft`, `on-info` |
| Color de dominio | `priority-low`, `priority-medium`, `priority-high`, `priority-urgent`, `status-todo`, `status-progress`, `status-done`, `list-slate`, `list-blue`, `list-emerald`, `list-amber`, `list-rose`, `list-violet` |
| Tipografía | `font-sans`, `font-mono`, `text-2xs`…`text-2xl` con su interlineado, `tracking-tight`, `tracking-caps` |
| Forma | `radius-xs`, `radius-sm`, `radius-md`, `radius-lg`, `radius-xl` |
| Elevación | `shadow-xs`, `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-drag` |
| Movimiento | `ease-standard`, `ease-entrance`, `ease-exit`, y `--duration-instant/fast/base/slow` |

Los tokens de dominio son alias de los semánticos (`priority-high` apunta al
mismo valor que `warning`). Existen para que la plantilla diga lo que significa,
no lo que parece: `text-priority-high` se lee mejor que `text-warning` sobre un
medidor de prioridad, y si algún día la prioridad alta deja de ser ámbar, se
cambia en un sitio.

Las duraciones no tienen espacio de nombres propio en Tailwind 4: son variables
CSS normales y se consumen como `duration-[var(--duration-fast)]` o desde el CSS
del componente.

### 9.3 Capa base

La capa base es deliberadamente corta: fondo y tinta del documento, familia y
cuerpo tipográfico, interletrado, suavizado, el anillo de foco global, el color
de selección de texto, las barras de desplazamiento teñidas con el tema, los
números tabulares de `<time>` y `[data-numeric]`, y el bloque de movimiento
reducido. **No hay estilos de componente en la capa global**: cada componente
vive en su propio archivo.

---

## 10. Componentes base

Convención de estados: todo componente interactivo define **reposo, hover, foco,
activo (pulsado), deshabilitado y cargando**. Cuando un estado no aplica, se dice
por qué.

Sobre el estado **cargando**: todas las mutaciones del tablero son síncronas
—los datos están en el navegador—, así que en la práctica ningún botón del MVP
llega a mostrarlo. El estado está especificado igualmente porque el componente
de botón lo soporta y porque la única espera real de la aplicación (la carga
diferida de la pantalla del tablero) sí se cubre, con esqueletos (§10.17).

### 10.1 Botón

**Anatomía**: `[icono 16-20px] [etiqueta] [kbd opcional]`, todo centrado, con
8 px entre elementos.

**Tamaños**

| Tamaño | Altura | Relleno lateral | Texto | Icono | Uso |
|---|---|---|---|---|---|
| `sm` | 28 px | 8 px | `text-xs` 500 | 16 px | Acciones dentro de una tarjeta o de un banner |
| `md` | 36 px | 12 px | `text-sm` 500 | 16 px | Por defecto en escritorio |
| `lg` | 44 px | 16 px | `text-sm` 500 | 20 px | Móvil y acción principal de un diálogo |

En pantallas táctiles (`pointer: coarse`) todos los botones suben a 44 px de
altura mínima.

**Variantes**

| Variante | Reposo | Hover | Activo | Uso |
|---|---|---|---|---|
| Primario | Fondo `primary`, texto `on-primary`, sin borde | Fondo `primary-hover` | `primary-hover` + `scale(.98)` | Una por pantalla: «Nueva tarea», «Guardar» |
| Secundario | Fondo `surface`, borde `line-strong`, texto `ink` | Fondo + velo `hover` | + velo `press` | «Cancelar», acciones de la barra |
| Sutil | Sin fondo ni borde, texto `ink-muted` | Fondo `hover`, texto `ink` | Fondo `press` | Acciones de tarjeta y de menú |
| Peligro | Fondo `danger`, texto `on-danger` | `danger-hover` | + `scale(.98)` | Confirmar borrado, «Vaciar el tablero» |
| Peligro sutil | Texto `danger`, sin fondo | Fondo `danger-soft` | Fondo `danger-soft` + velo `press` | «Eliminar» dentro de un menú |
| Enlace | Texto `primary`, subrayado a 2 px de distancia | Subrayado más grueso, `primary-hover` | — | Enlaces dentro de párrafos |

**Estados comunes**

- **Foco**: anillo global de §7.1. No cambia el fondo.
- **Deshabilitado**: opacidad 45 %, `cursor: not-allowed`, sin hover, sin foco
  visible pero **sí anunciable** (`aria-disabled` en vez de `disabled` cuando
  conviene explicar por qué). Todo botón deshabilitado tiene título emergente
  que dice el motivo.
- **Cargando**: la etiqueta permanece, el icono se sustituye por un círculo
  giratorio de 16 px (o 20 px en `lg`) del color del texto, `aria-busy="true"`,
  el botón queda inerte y **el ancho no cambia**.

**Botón de solo icono**: icono de **20 px** siempre —nunca 14 o 16—, área
visual de 36×36 px en escritorio y **área táctil de 44×44 px garantizada** por
un pseudo-elemento que extiende la zona sensible 4 px por lado. En
`pointer: coarse` el área visual es directamente 44×44. Es obligatorio
`aria-label` y título emergente con el atajo si lo tiene.

### 10.2 Campo de texto

**Anatomía**: etiqueta (`text-xs` 500, `ink-muted`, arriba, siempre visible —no
hay etiquetas flotantes) · campo · texto de ayuda o de error (`text-xs`) ·
contador de caracteres opcional a la derecha del texto de ayuda.

| Estado | Aspecto |
|---|---|
| Reposo | Fondo `field`, borde 1 px `line-strong`, radio `sm`, alto 36 px (44 en móvil), texto `text-sm` `ink`, relleno lateral 10 px |
| Marcador de posición | `ink-subtle`, con mayúscula inicial: «Título de la tarea» |
| Hover | Borde `ink-subtle` |
| Foco | Anillo global + borde `primary` |
| Deshabilitado | Fondo `sunken`, texto `ink-subtle`, borde `line`, `cursor: not-allowed` |
| Inválido | Borde `danger`, icono de aviso de 16 px dentro del campo a la derecha, mensaje en `danger` debajo con el mismo icono, `aria-invalid="true"` y `aria-describedby` al mensaje |
| Solo lectura | Sin borde, fondo transparente, texto `ink` |

La validación se muestra **al salir del campo** y se actualiza al escribir una
vez mostrada. Nunca se marca en rojo un campo que el usuario todavía no ha
tocado. El contador de caracteres aparece a partir del 80 % del máximo y pasa a
`danger` al superarlo.

**Área de texto**: mismas reglas, altura mínima de 3 líneas, redimensionable solo
en vertical. **Selector de fecha**: `<input type="date">` nativo con
`color-scheme` heredado, más un botón sutil «Quitar fecha» cuando hay valor.

### 10.3 Buscador

**Anatomía**: lupa de 20 px a la izquierda en `ink-subtle` · campo · a la
derecha, la tecla `/` en reposo o un botón de icono «Limpiar búsqueda» (20 px)
cuando hay texto.

- Ancho: completo en móvil; en escritorio ocupa 320 px y crece hasta 420 px al
  enfocarse. El crecimiento se resuelve con `flex-grow` y no animando `width`.
- Escribir dispara la búsqueda con 200 ms de espera; el resultado se refleja en
  el resumen del tablero: «5 de 12 tareas coinciden con “informe”».
- El resumen es una región activa `polite`, para que un lector de pantalla lo
  anuncie sin interrumpir la escritura.
- `Esc` con el campo enfocado vacía la búsqueda; si ya está vacío, devuelve el
  foco al tablero.
- Estados: los del campo de texto, más **sin resultados**, que no cambia el
  aspecto del buscador sino que pinta el estado vacío correspondiente (§12.4).

### 10.4 Filtros

Dos controles y un resumen, en la barra de herramientas del tablero:

1. **Segmentado de estado**: cuatro opciones —Todas · Pendientes · Completadas ·
   Vencidas— dentro de una pista `sunken` con radio `sm` y 2 px de relleno. La
   activa lleva fondo `surface`, `shadow-xs`, texto `ink` peso 500 y
   `aria-pressed="true"`; las demás, texto `ink-muted`. Se navega con flechas.
   En móvil el segmentado se desplaza horizontalmente sin cortar.
2. **Prioridad**: botón secundario con menú; en reposo dice «Prioridad»; con
   valor, muestra el medidor y el nombre —«Prioridad: alta»— y una `×` de 20 px
   para quitarlo. El botón activo se pinta con fondo `primary-soft` y borde
   `primary`.
3. **Resumen del filtro**: siempre visible, `text-xs` `ink-muted`, a la derecha:
   «12 tareas · 3 vencidas» o, con filtros activos, «Mostrando 5 de 12 · Lista:
   Trabajo». Junto a él, el botón sutil «Limpiar filtros», que solo aparece
   cuando hay algo que limpiar.

El resumen existe justamente para cumplir el principio 5: si al aplicar un
filtro la pantalla apenas cambia, el texto deja constancia de qué se aplicó.

### 10.5 Tarjeta de tarea

**Anatomía** (de arriba abajo, dentro de un relleno de 12 px):

```
┌─┬──────────────────────────────────────────────┐
│ │ [casilla 20px] Título de la tarea      [⠿]  │   ← franja de prioridad 3px
│ │                                              │
│ │ Descripción recortada a una línea            │
│ │                                              │
│ │ [medidor] [cápsula de fecha] [• Lista]  [⋯] │
└─┴──────────────────────────────────────────────┘
```

- Fondo `surface`, borde `line`, radio `md`, `shadow-xs`, ancho completo de la
  columna, separación de 8 px con la siguiente.
- **Franja de prioridad**: 3 px a la izquierda, de borde a borde, con el color de
  la prioridad (§3.1).
- **Franja de lista**: 2 px arriba con el color de la lista, **solo cuando se ven
  varias listas a la vez** (`/tablero` sin lista activa).
- **Casilla**: 20 px, alineada con la primera línea del título, área táctil
  44×44 px. Marcar completa la tarea.
- **Asidero** (`⠿`): 20 px, arriba a la derecha, según §8.1.
- **Menú** (`⋯`): 20 px, abajo a la derecha; contiene Editar (`Enter`),
  Duplicar, Mover a › (los otros dos estados), Cambiar prioridad ›, y —separado
  por un divisor— Eliminar en peligro sutil (`Supr`).
- **Fila de metadatos**: medidor de prioridad, cápsula de fecha si la hay, punto
  y nombre de la lista cuando procede. Altura fija de 20 px.

| Estado | Aspecto |
|---|---|
| Reposo | El descrito |
| Hover | `shadow-sm`, borde `line-strong`, asidero y menú al 100 % |
| Foco | Anillo global de 2 px por fuera; no cambia la sombra |
| Activo (pulsando) | `scale(.995)` durante 90 ms |
| Arrastrando | §8.2 |
| Completada | Título tachado en `ink-subtle`, tarjeta al 70 %, franja de prioridad en `line`, casilla en `success` |
| Vencida | Cápsula de fecha en rojo con icono de aviso; la tarjeta no cambia de fondo |
| Recién creada / movida | Destello `primary-soft` de 1200 ms |
| Eliminándose | §6.2 |

La tarjeta **no** tiene estado deshabilitado ni cargando: no existe ninguna
operación asíncrona sobre ella.

### 10.6 Columna del tablero

**Anatomía**: encabezado pegajoso (44 px) + cuerpo con desplazamiento + pie.

- Encabezado: punto e icono de estado (20 px) · rótulo en `text-xs` 600
  versalitas con `tracking-caps` · cápsula de contador · a la derecha, botón de
  icono «Añadir tarea a {columna}» (20 px, 44×44 táctil).
- Fondo de columna `sunken`, borde `line`, radio `lg`, relleno 12 px, separación
  entre columnas 16 px.
- El cuerpo tiene desplazamiento propio en escritorio (`overflow-y: auto`,
  barra fina teñida) y crece con el contenido en móvil.
- Pie: botón sutil de ancho completo «+ Añadir tarea», visible siempre, con
  texto `ink-muted` que pasa a `ink` en hover.
- Estados de arrastre en §8.2. Columna vacía en §12.5.

### 10.7 Barra superior

Altura 56 px en móvil, 60 px desde `md`. Fondo `surface`, borde inferior `line`,
pegajosa; al desplazar la página gana `shadow-sm` (transición 150 ms).

**Móvil** (de izquierda a derecha): botón de icono «Abrir listas» (hamburguesa) ·
marca «Tareas» · botón de icono «Buscar» (abre el buscador a pantalla completa
sobre la barra) · botón de icono «Nueva tarea» · menú `⋯`.

**Escritorio (`md`+)**: marca «Tareas» + nombre de la lista activa · buscador
centrado · a la derecha: botón primario «Nueva tarea» con su `kbd` `N` ·
conmutador de tema · botón de icono «Atajos de teclado» (`?`) · menú `⋯`.

El menú `⋯` agrupa lo que no cabe: «Atajos de teclado», «Acerca de tus datos»,
divisor, y «Vaciar el tablero» en peligro sutil, **siempre separada del resto por
un divisor** por ser destructiva.

En la fase 2 se añaden a la izquierda del buscador los botones de deshacer y
rehacer, y el disparador de la paleta de comandos (§14).

### 10.8 Panel de listas

Ancho 240 px, fijo a la izquierda desde `xl`; por debajo es un cajón que entra
desde la izquierda con velo (`scrim`), foco atrapado y cierre con `Esc`, clic
en el velo o deslizamiento.

- Rótulo «Listas» en versalitas de 11 px `ink-subtle`.
- Fila «Todas las tareas» (icono de bandeja) siempre primera.
- Cada fila: punto de color de 8 px · nombre · contador a la derecha en
  `ink-subtle` · menú `⋯` al hacer hover o al enfocar (Renombrar, Cambiar color
  ›, divisor, Eliminar en peligro sutil).
- Altura de fila 36 px en escritorio, 44 px en móvil; radio `sm`.
- **Activa**: fondo `primary-soft`, barra izquierda de 3 px `primary`, texto
  peso 500, `aria-current="page"`. Es selección, no foco (§7.2).
- Pie del panel: botón sutil de ancho completo «+ Nueva lista» con `kbd` `L`.
- La última lista no se puede eliminar: su opción aparece deshabilitada con el
  motivo en el título emergente («El tablero necesita al menos una lista»).

### 10.9 Menú

Panel `overlay`, borde `line`, radio `lg`, `shadow-md`, relleno vertical 4 px,
ancho mínimo 200 px, máximo 320 px.

- Fila: 36 px de alto (44 en móvil), relleno lateral 12 px, `text-sm`, icono
  opcional de 16 px a la izquierda, `kbd` opcional a la derecha.
- Hover y foco comparten el mismo velo `hover` **más** el anillo cuando llega por
  teclado.
- Opción marcada: marca de verificación de 16 px a la izquierda y `aria-checked`;
  no se usa fondo de selección en los menús para no confundirlo con el hover.
- Divisor: 1 px `line` con 4 px de margen vertical.
- Se abre con `Enter`/`Espacio`/`↓`, se recorre con flechas, se cierra con `Esc`
  devolviendo el foco al disparador. Escritura rápida salta a la opción cuyo
  texto empieza por esas letras.
- Si no cabe abajo, se abre hacia arriba (posicionamiento del CDK Overlay).

### 10.10 Diálogo

- Velo `scrim` a pantalla completa; panel `overlay`, radio `lg`, `shadow-lg`,
  ancho máximo 520 px (formulario) o 420 px (confirmación), centrado y con 16 px
  de margen mínimo. En móvil se ancla abajo, ocupa el ancho completo y solo
  redondea las esquinas superiores.
- **Cabecera**: título `text-lg` 600 + botón de cierre de icono (20 px, 44×44
  táctil, `aria-label` «Cerrar»). **Cuerpo**: 24 px de relleno (16 en móvil).
  **Pie**: acciones alineadas a la derecha, la principal la última; en móvil se
  apilan a ancho completo con la principal arriba.
- Foco atrapado; al abrir, el foco va al primer campo (o al botón menos
  destructivo en una confirmación); al cerrar, vuelve al disparador.
- `Esc` cierra; si hay cambios sin guardar, pide confirmación.
  `Ctrl`+`Enter` guarda desde cualquier campo.
- Variante **confirmación**: icono de 20 px en `danger` o `warning` junto al
  título, texto explicativo de la consecuencia con `text-base`, y botón de
  peligro cuya etiqueta nombra la acción («Eliminar la tarea», no «Aceptar»).

### 10.11 Conmutador de tema

Botón de icono en la barra superior —donde lo pone todo el mundo—, **no suelto
junto a acciones destructivas**. Como la preferencia tiene tres valores (claro,
oscuro, sistema), no es un interruptor de dos posiciones sino un botón que abre
un menú de tres opciones; un interruptor perdería «seguir al sistema», que es el
valor inicial.

- Icono: sol si el tema resuelto es claro, luna si es oscuro; 20 px, área táctil
  44×44 px.
- `aria-label`: «Tema: oscuro (sigue al sistema)» — refleja preferencia y
  resultado.
- Menú con tres filas —Claro · Oscuro · Sistema—, cada una con su icono, marca de
  verificación en la activa y `role="menuitemradio"` con `aria-checked`.
- El atajo `T` alterna directamente entre claro y oscuro fijando una preferencia
  explícita; para volver a «Sistema» hay que usar el menú.
- La elección se guarda y se aplica antes del primer pintado, de modo que no hay
  destello claro al recargar en oscuro.

### 10.12 Aviso breve (toast)

Confirma una acción que **ya ocurrió** y ofrece el camino de vuelta. No pide
decisiones ni informa de errores: eso es del diálogo y del banner (§10.13).

Centrado abajo, a 24 px del borde inferior, por encima de todo el contenido.
Uno solo a la vez: si llega otro, sustituye al anterior y reinicia el reloj.
Apilar avisos de una acción que se repite —completar tres tareas seguidas— llena
la pantalla de ruido y entierra el «Deshacer» que importa, que es el último.

**Anatomía**: `[mensaje] · [acción]`, sobre superficie `tooltip` con tinta
`on-tooltip`, radio `md`, `shadow-lg`, relleno de 10 px por 14 px, ancho máximo
igual al viewport menos 32 px. Sin icono y sin botón de cerrar: el aviso se va
solo y el único control que ofrece es el que deshace.

- La acción va subrayada y en peso 600, heredando la tinta del aviso; es el
  único elemento interactivo, así que no compite con nada.
- **Auto-cierre a los 6 s**, tiempo suficiente para leer y alcanzar «Deshacer».
- La superficie oscura (`tooltip`) es deliberada: hace que el aviso se lea como
  una capa del sistema y no como una tarjeta más del tablero.
- Región `role="status"` con `aria-live="polite"`: se anuncia sin interrumpir.
- **No se usa para errores.** Un fallo que el usuario debe conocer permanece en
  un banner hasta que deja de ser cierto.

### 10.13 Banner persistente

Para lo que no debe desaparecer solo: fallo de guardado, almacenamiento no
disponible, datos ilegibles recuperados, y el aviso de tablero de ejemplo.

- Ancho completo bajo la barra superior, fondo `*-soft` de la variante, borde
  inferior de 1 px del color de la variante, relleno 12 px 16 px, `text-sm`.
- `[icono 20px] [texto] [acción sutil] [cerrar 20px opcional]`.
- Solo son descartables los informativos; los de error de persistencia se quedan
  hasta que la causa desaparece.
- Textos exactos en §12.6.

### 10.14 Tecla (`kbd`)

11 px monoespaciada, altura 20 px, relleno lateral 6 px, fondo `sunken`, borde
1 px `line-strong`, radio `xs`, tinta `ink-muted`. Sin sombra ni relieve. Una
combinación son teclas separadas por 2 px, sin `+` (§7.5). Es un elemento
decorativo: siempre acompaña a una etiqueta de texto, nunca la sustituye, y va
marcado con `aria-hidden` porque el atajo ya viaja en el `aria-keyshortcuts` del
control.

### 10.15 Cápsulas y medidores

- **Cápsula de fecha**: altura 20 px, radio `full`, relleno lateral 8 px,
  `text-xs`, icono de 14 px. Variantes en §3.3.
- **Contador de columna**: altura 20 px, radio `full`, fondo `sunken`, texto
  `text-2xs` 600 tabular `ink-muted`.
- **Medidor de prioridad**: cuatro barras de 2×10 px, 2 px de separación, radio
  `xs`, alineadas abajo (§3.1).
- **Punto de lista**: círculo de 8 px con el color de la lista.

### 10.16 Estado vacío

- Centrado en su contenedor, ancho máximo 360 px, 32–48 px de aire vertical.
- **Icono de 40 px** con trazo de 1.5 px en `ink-subtle` dentro de un círculo
  `sunken` de 72 px. Sin ilustraciones de archivo ni emojis.
- Título `text-lg` 600 `ink`; texto `text-base` `ink-muted`, dos líneas como
  máximo; una acción principal y, como mucho, una secundaria de tipo enlace.
- Cada estado vacío **explica dónde está el usuario y qué puede hacer**; ninguno
  dice solo «No hay datos». Contenido concreto en §12.

### 10.17 Esqueleto de carga

Bloques con fondo `sunken`, radio `sm` y un barrido de brillo de 1200 ms que
respeta `prefers-reduced-motion` (sin barrido, opacidad fija). Se usa en un solo
sitio: mientras se descarga el fragmento diferido de la pantalla del tablero, se
pintan tres columnas con su encabezado real y dos tarjetas fantasma cada una. El
contenedor lleva `aria-busy="true"` y un texto invisible «Cargando el tablero».
No se usan esqueletos para los datos: se leen del navegador de forma síncrona.

### 10.18 Casilla de completar

20×20 px, radio `xs`, borde 1.5 px `line-strong`, área táctil 44×44 px.

| Estado | Aspecto |
|---|---|
| Reposo | Vacía, borde `line-strong` |
| Hover | Borde `success`, fondo `success-soft` |
| Foco | Anillo global |
| Marcada | Fondo `success`, marca de verificación `on-success` dibujada en 150 ms |
| Deshabilitada | No existe |

Su `aria-label` es explícito: «Marcar como completada: {título}» / «Reabrir:
{título}».

---

## 11. Vistas

La aplicación tiene **dos pantallas reales** y una redirección, exactamente las
rutas previstas: `/` redirige a `/tablero`; `/tablero` y `/tablero/:listId`
comparten pantalla y componente; `**` es la página de ruta no encontrada. No hay
página de bienvenida separada: la propia pantalla del tablero se presenta sola.

### 11.0 Armazón común

Todas las pantallas comparten el armazón: **enlace de salto** («Saltar al
tablero», visible solo al enfocarlo, posicionado sobre la barra) · **barra
superior** (§10.7) · zona de **banners** · contenido · pila de **avisos breves**.

Rejilla, de móvil a escritorio:

| Ancho | Composición |
|---|---|
| `< 768 px` | Una columna. Barra superior 56 px. Listas en cajón. Barra de herramientas con desplazamiento horizontal. Las tres columnas del tablero **apiladas verticalmente**, cada una con su encabezado pegajoso. Desplazamiento de la página |
| `768–1279 px` | Las tres columnas **lado a lado** en una rejilla de tres partes iguales, cada una con desplazamiento propio; la altura del tablero es la ventana menos la barra y la herramienta. Listas todavía en cajón |
| `≥ 1280 px` | Panel de listas fijo de 240 px a la izquierda; tablero a la derecha con 24 px de margen y columnas de 280–360 px |

Se descarta el desplazamiento horizontal del tablero: con tres columnas fijas
—los tres estados del modelo— siempre caben, y una barra horizontal en una
aplicación de teclado es una molestia.

### 11.0.1 Modelo de estado: qué significa cada control

Una tarea tiene **un solo estado** (`Por hacer`, `En progreso`, `Completada`) y
la columna en la que está **es** ese estado. No hay un «completada» paralelo a
la columna: marcar una tarea como completada es moverla a `Completada`.

De ahí se derivan las tres formas de cambiarlo, que hacen cosas distintas a
propósito:

| Control | Qué hace | Por qué existe |
|---|---|---|
| **Arrastrar** | Mueve la tarjeta a donde se suelte | Es el gesto directo: la posición final es la que se ve |
| **«Mover a …»** del menú | Lleva la tarea al estado elegido | El camino explícito y accesible sin ratón, y el único que va a `En progreso` en un paso |
| **Casilla de la tarjeta** | Atajo a `Completada` desde cualquier columna | Completar es la acción más frecuente con diferencia; obligar a arrastrar hasta la tercera columna para algo tan común sería un castigo |

La casilla es un **atajo**, no un interruptor de una propiedad independiente, y
por eso mueve la tarjeta de columna. Ese salto sorprende si ocurre en silencio:
la tarjeta desaparece de donde estaba mirando el usuario. Por eso la casilla
**siempre va acompañada de un aviso breve** (§10.12):

> Tarea completada · **Deshacer**

Reglas del aviso:

- Aparece al completar **y** al reabrir, con el texto correspondiente («Tarea
  completada» / «Tarea reabierta»): el movimiento sorprende en ambos sentidos.
- «Deshacer» revierte la acción entera, incluida la posición que tenía la tarea
  en su columna de origen.
- Arrastrar **no** muestra aviso: ahí el usuario ve el resultado en el mismo
  gesto, y anunciar lo que acaba de hacer con la mano sobra. El destello de la
  tarjeta al soltar (§8.2) ya confirma el resultado.
- «Mover a …» tampoco lo muestra: la orden nombra el destino antes de ejecutarse.

La casilla marcada usa el verde `success` con la marca de verificación, y el
título pasa a tachado en `ink-subtle`; el color nunca va solo (§3).

### 11.1 Tablero (`/tablero` y `/tablero/:listId`)

**Propósito**: ver, filtrar y mover las tareas. Es la aplicación.

**Contenido, de arriba abajo**

1. **Barra superior** con marca, buscador, «Nueva tarea», tema, atajos y menú.
2. **Banners**, si los hay (§12.6).
3. **Barra de herramientas del tablero**: a la izquierda el título de contexto
   —«Todas las tareas» o el nombre de la lista con su punto de color—; en el
   centro los filtros de estado y prioridad; a la derecha el resumen y «Limpiar
   filtros». En móvil, el título ocupa su propia línea y los filtros van debajo
   con desplazamiento horizontal.
4. **Tablero**: tres columnas —Por hacer, En progreso, Completadas— en el orden
   del modelo. Cada una con su encabezado, sus tarjetas y su botón de añadir.

**Comportamiento**

- La lista activa vive en la URL: elegirla en el panel navega a
  `/tablero/{id}`, y el botón «atrás» del navegador funciona. La búsqueda y los
  filtros no ensucian la URL.
- Con lista activa, la tarjeta oculta el nombre de la lista y la franja superior
  de color: sería ruido redundante.
- «Nueva tarea» abre el diálogo con la lista activa preseleccionada y estado «Por
  hacer»; el botón `+` de una columna preselecciona además ese estado.
- Al guardar, el diálogo se cierra, la tarjeta aparece con su destello y sube un
  aviso breve de éxito.

**Estados de la pantalla**: normal · cargando el fragmento (§10.17) · tablero de
ejemplo (§12.1) · vacío real (§12.2) · sin resultados (§12.4) · error de
persistencia (§12.6).

### 11.2 Ruta no encontrada (`**`)

**Propósito**: recuperar al usuario que llegó a una URL que no existe —lo más
probable, un enlace a una lista ya eliminada.

Pantalla centrada, sin panel de listas ni barra de herramientas, con la barra
superior reducida a la marca y el conmutador de tema:

- Icono de brújula de 40 px en el círculo `sunken` de 72 px.
- Título `text-2xl` 600: «Aquí no hay nada».
- Texto: «La dirección que abriste no corresponde a ninguna pantalla de Tareas.
  Puede que la lista que buscabas ya no exista.»
- Botón primario «Volver al tablero» y, debajo, la ruta pedida en monoespaciada
  `text-xs` `ink-subtle`, para que se entienda qué pasó.
- Título de pestaña: «Página no encontrada · Tareas».

### 11.3 Diálogos (sobre el tablero)

No son rutas, pero sí composiciones que hay que fijar.

**Tarea (crear/editar)**, 520 px:

| Campo | Control | Notas |
|---|---|---|
| Título | Campo de texto | Obligatorio, 1–120, contador desde 96 |
| Descripción | Área de texto de 3 líneas | Opcional, hasta 2000 |
| Prioridad | Segmentado de cuatro con medidor + texto | Por defecto «Media» |
| Estado | Menú desplegable | Por defecto el de la columna de origen |
| Lista | Menú desplegable con punto de color | Por defecto la lista activa |
| Fecha límite | Campo de fecha + «Quitar fecha» | Opcional; debajo, la lectura en claro: «Vence el jueves 3 de marzo de 2027» |

Título del diálogo: «Nueva tarea» o «Editar tarea». Pie: «Cancelar» (secundario)
y «Crear tarea» / «Guardar cambios» (primario, con `kbd` `Ctrl` `Enter`). Al
editar, aparece además en el pie a la izquierda «Eliminar» en peligro sutil.
Bajo el pie, en `text-2xs` `ink-subtle`: «Creada el 12 jul 2026 · Editada hace
2 h» — con año, siempre.

**Lista (crear/renombrar)**, 420 px: nombre (1–60) y selector de color con seis
muestras de 28 px, marcadas con verificación y nombre accesible («Color azul»).

**Confirmaciones**, 420 px: eliminar tarea, eliminar lista y vaciar el tablero.
Cada una dice exactamente qué se pierde: «Se eliminarán la lista “Trabajo” y sus
7 tareas.» / «Se eliminarán las 12 tareas del tablero y quedará una lista vacía.»
Botón de peligro con la acción nombrada.

**Hoja de atajos** (`?`), 520 px: tabla de dos columnas agrupada por ámbito
—Global, Tablero, Diálogo—, con la descripción a la izquierda y las teclas a la
derecha. Solo lista atajos existentes.

**Acerca de tus datos**, 520 px, abierto desde el menú `⋯`: explica en tres
frases que todo se guarda en este navegador, que no viaja a ningún servidor, que
no está cifrado y que borrar los datos del sitio lo borra todo. Incluye el
recuento actual («12 tareas en 2 listas») y el botón «Vaciar el tablero» en
peligro sutil.

---

## 12. Estados vacíos y primera visita

### 12.1 Primera visita: tablero de ejemplo

Quien abre la aplicación desplegada **nunca ve un tablero vacío**: se siembra un
tablero de muestra con dos listas y una decena de tareas repartidas por las tres
columnas, con prioridades variadas, alguna vencida y alguna para hoy.

Para que nadie confunda la muestra con sus datos, mientras el tablero siga siendo
el sembrado se muestra un **banner informativo descartable**:

> **i** **Esto es un tablero de ejemplo.** Tareas guarda todo en este navegador,
> sin cuentas ni servidor. Edita lo que quieras o empieza de cero.
> **[Vaciar el tablero]** **[×]**

- Variante informativa (§10.13); la acción es un botón sutil que abre la
  confirmación de vaciado.
- El banner desaparece solo en cuanto el usuario crea, edita o mueve algo: a
  partir de ahí el tablero ya es suyo.
- Descartarlo con `×` lo oculta durante la sesión sin tocar los datos.

### 12.2 Tablero vacío de verdad

Tras vaciar el tablero (o si el usuario borra todas sus tareas), el área del
tablero se sustituye por un estado vacío único —no tres columnas vacías—:

- Icono de tablero con un `+`.
- Título: «Tu tablero está vacío».
- Texto: «Crea tu primera tarea y aparecerá en “Por hacer”. Todo se guarda en
  este navegador.»
- Botón primario «Crear la primera tarea», con la tecla `N` al lado.

No se ofrece «restaurar el ejemplo»: la siembra es de la primera visita y no
vuelve. Prometer lo contrario sería una función que no existe.

### 12.3 Lista sin tareas

Cuando hay una lista activa y esa lista no tiene ninguna tarea:

- Título: «“Trabajo” no tiene tareas todavía».
- Texto: «Añade la primera o mira el resto del tablero.»
- Acciones: «Añadir tarea a esta lista» (primario) y «Ver todas las tareas»
  (enlace).

### 12.4 Sin resultados de búsqueda o filtro

Hay tareas, pero ninguna pasa el filtro. Es un estado distinto y con mensaje
distinto:

- Título: «Ninguna tarea coincide».
- Texto que **repite los criterios activos** con sus valores exactos: «Buscando
  “informe” · Estado: vencidas · Prioridad: alta · Lista: Trabajo.»
- Acción: «Limpiar filtros» (secundario). Si solo hay búsqueda, «Limpiar la
  búsqueda».
- Los encabezados de columna siguen visibles con su contador en 0, para que se
  entienda que el tablero no ha desaparecido.

### 12.5 Columna vacía

Dentro de un tablero con tareas, una columna sin ninguna muestra un bloque de
88 px de alto, borde discontinuo `line`, radio `md`, centrado, con `text-xs`
`ink-subtle`: «Sin tareas en “En progreso”». Debajo, el botón sutil de añadir de
la propia columna. Este bloque es además el destino de arrastre visible cuando la
columna está vacía.

### 12.6 Errores y avisos de persistencia

Todos como banner (§10.13), con texto exacto:

| Situación | Variante | Texto | Acción |
|---|---|---|---|
| Cuota superada | Error | «No se pudieron guardar los últimos cambios: el almacenamiento del navegador está lleno. Tu trabajo sigue en pantalla, pero se perderá al cerrar la pestaña.» | «Vaciar el tablero» |
| Almacenamiento no disponible | Aviso | «Este navegador no permite guardar datos del sitio (puede ser una ventana privada). Puedes trabajar con normalidad, pero nada se guardará al cerrar.» | — |
| Fallo desconocido al guardar | Error | «No se pudieron guardar los últimos cambios. Vuelve a intentar la acción; si sigue fallando, recarga la página.» | — |
| Datos ilegibles | Aviso | «No pudimos leer el tablero guardado y empezamos uno nuevo. Guardamos una copia del contenido anterior por si la necesitas.» | «×» descartable |

El banner de error de guardado permanece mientras el fallo persista y desaparece
en cuanto una escritura vuelve a funcionar; ese cambio se acompaña de un aviso
breve de éxito: «Los cambios se están guardando de nuevo.»

---

## 13. Accesibilidad

Objetivos comprobables, además de los contrastes de §2.6:

- **Áreas táctiles**: mínimo 44×44 px en todo control, sin excepción. Cuando el
  tamaño visual es menor (36×36 en escritorio), la zona sensible se extiende con
  un pseudo-elemento. Entre dos controles adyacentes hay al menos 8 px.
- **Iconos**: mínimo 20 px en cualquier botón de solo icono; 16 px solo cuando
  acompañan a una etiqueta de texto; 14 px solo dentro de cápsulas. Todo icono
  decorativo lleva `aria-hidden="true"`; todo icono que sea la única etiqueta
  lleva `aria-label` en español.
- **Estructura semántica**: `header` · `nav` (panel de listas, `aria-label`
  «Listas») · `main` (tablero) · cada columna es una `section` con
  `aria-labelledby` a su encabezado · cada tarjeta es un `article` con
  `aria-labelledby` al título. Un solo `h1` por pantalla («Tablero» o el nombre
  de la lista, visualmente el título de la barra de herramientas); los rótulos de
  columna son `h2`.
- **Etiquetas en español y explícitas**: «Buscar tareas», «Nueva tarea»,
  «Filtrar por prioridad», «Abrir el menú de la tarea {título}», «Eliminar la
  lista {nombre}», «Reordenar la tarea {título}».
- **Regiones activas**: `polite` para el resumen de resultados y los contadores;
  `assertive` para errores y para los anuncios de arrastre; nunca dos anuncios a
  la vez.
- **Foco**: visible siempre (§7.1), atrapado en diálogos y cajón, devuelto al
  disparador al cerrar, y nunca perdido al eliminar un elemento —al borrar una
  tarjeta el foco pasa a la siguiente, o a la anterior si era la última, o al
  encabezado de la columna si era la única.
- **Movimiento**: `prefers-reduced-motion` respetado globalmente (§6.3).
- **Nada depende solo del color** (§3.5) y nada depende solo del puntero:
  mover una tarea entre columnas se puede hacer desde su menú.
- **Zoom**: la interfaz aguanta 200 % sin desplazamiento horizontal en móvil;
  las columnas se apilan por debajo de 768 px equivalentes, que es lo que ocurre
  al ampliar.

---

## 14. Adelanto de la fase 2

No se construye ahora y **no aparece en la interfaz** hasta que exista. Se
documenta para que el sistema de hoy la admita sin rediseño.

### 14.1 Paleta de comandos (`Ctrl`+`K`)

- Superposición centrada horizontalmente y anclada a 15 % de la altura, ancho
  máximo 560 px, panel `overlay`, radio `lg`, `shadow-lg`, velo `scrim`.
- **Cabecera**: campo de entrada sin bordes, 44 px de alto, `text-base`, con la
  lupa de 20 px a la izquierda y `Esc` en `kbd` a la derecha.
- **Cuerpo**: resultados agrupados con rótulos en versalitas de 11 px
  («Acciones», «Tareas», «Listas», «Ir a»), filas de 40 px con icono de 16 px,
  etiqueta, contexto a la derecha en `ink-subtle` y `kbd` si el comando tiene
  atajo. La fila resaltada usa fondo `primary-soft` con barra izquierda
  `primary` —el mismo lenguaje de «selección» de §7.2— y se mueve con flechas
  sin perder el foco del campo (`aria-activedescendant`).
- **Pie**: leyenda con `↑` `↓` navegar · `Enter` ejecutar · `Esc` cerrar.
- Reutiliza las tarjetas y cápsulas ya definidas para mostrar tareas en los
  resultados, y el estado vacío pequeño («Sin resultados para “xyz”») dentro del
  panel.
- Su disparador visible es un botón secundario en la barra superior con la lupa
  y las teclas `Ctrl` `K`: la paleta no puede ser una función secreta.

### 14.2 Deshacer y rehacer

- Dos botones de solo icono (flechas curvas, 20 px, 36×36 visual, 44×44 táctil)
  en la barra superior, a la izquierda del buscador, **agrupados y separados del
  resto por 12 px**. Deshabilitados cuando no hay nada que deshacer o rehacer,
  con el motivo en el título emergente.
- El título emergente nombra la acción concreta: «Deshacer: mover tarea
  (`Ctrl` `Z`)».
- Al deshacer, aviso breve informativo: «Se deshizo: eliminar tarea», y la
  tarjeta afectada recibe el destello `primary-soft` para que se vea dónde
  reapareció.
- A partir de esta fase, los avisos breves de acciones destructivas usan la
  ranura de acción ya prevista en §10.12: «Tarea eliminada — **Deshacer**». El
  botón de acción se pinta en el color de la variante, nunca en violeta.
- El movimiento de tarjetas con `Ctrl`+flechas se anuncia por región activa igual
  que el arrastre (§8.4).

---

## 15. Decisiones de diseño

| # | Decisión | Alternativa descartada | Motivo |
|---|---|---|---|
| 1 | Violeta de marca sobre grafito frío | Azul corporativo, verde de productividad | El violeta no colisiona con ningún color semántico del dominio (verde completado, ámbar atención, rojo urgencia) y da identidad propia |
| 2 | Pila tipográfica del sistema | Fuente web autoalojada o por CDN | Sin conexión y sin destello; el peso de la ruta crítica no compensa en cuerpos de 12–14 px |
| 3 | Tema oscuro con jerarquía propia | Invertir el tema claro | Sobre negro hacen falta escalones de superficie y acentos más luminosos; invertir produce grises sucios y acentos ilegibles |
| 4 | Tokens con `@theme inline` + variables por clase | `light-dark()` o duplicar utilidades con `dark:` | Un solo juego de clases sirve para los dos temas y el conmutador manual funciona sin depender de `prefers-color-scheme` |
| 5 | Prioridad con color + medidor + texto | Solo color | Legible en escala de grises y con daltonismo; el color por sí solo nunca es suficiente |
| 6 | Foco = anillo exterior; selección = fondo con barra | Usar fondo también para el foco | Se distingue de un vistazo dónde está el teclado y qué está elegido |
| 7 | Tres columnas fijas y responsivas, sin desplazamiento horizontal | Tablero con desplazamiento lateral estilo Trello | Los estados son tres y siempre caben; el desplazamiento lateral estorba en una aplicación de teclado |
| 8 | Conmutador de tema como menú de tres opciones en la barra | Interruptor de dos posiciones | Un interruptor no puede expresar «seguir al sistema», que es el valor inicial |
| 9 | Fechas siempre con año en cápsulas de vencimiento | Solo distancia relativa («hace 2 días») | La tarjeta se lee fuera de contexto; la distancia acompaña, no sustituye |
| 10 | Los avisos breves del MVP no llevan «Deshacer» | Anunciar la función desde ya | Deshacer no está expuesto todavía; no se muestran funciones que no existen |
