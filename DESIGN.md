# Diseño — tareas-angular

Sistema visual y de interacción del tablero. Este documento es el contrato de la
interfaz: fija la familia de producto a la que pertenece y las convenciones que
hereda de ella, identidad, color, tipografía, tokens, movimiento, comportamiento
del teclado y del arrastre, la especificación de cada componente y la
composición de cada pantalla. Lo que no esté aquí, no se inventa al implementar:
se añade aquí primero.

Los valores viven una sola vez, en `src/styles.css` (§9). Las tablas de este
documento son la referencia legible de esos mismos valores.

---

## 1. Identidad y familia del producto

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

### 1.4 Familia de producto y referencias

Esta aplicación es un **tablero kanban personal**: tarjetas de tarea repartidas
en columnas que representan el estado del trabajo. No es una lista de pendientes
lineal ni un gestor de notas, y esa pertenencia decide el modelo de interacción
antes que cualquier decisión visual: quien la abre ya sabe cómo debería
comportarse porque ha visto otros tableros.

| Referencia | Qué aporta |
|---|---|
| **Trello** | El arquetipo del tablero para el público general: columnas a la vista, tarjeta que se arrastra de una a otra, clic en la tarjeta que abre su detalle. Fija el mínimo que cualquiera espera sin que se lo expliquen |
| **Jira (vista de tablero)** | El tablero como reflejo de un flujo de trabajo: la columna **es** el estado, lleva su contador, y los filtros actúan por encima del tablero sin alterar los datos |
| **Linear** | El nivel de acabado: teclado primero, respuesta inmediata, deshacer al alcance de la mano y densidad alta sin ruido. Es la referencia de artesanía, no de estructura |

### 1.5 Lo que cualquiera da por sentado en un tablero

Lista de comprobación, no de intenciones. Cada punto es verificable abriendo la
aplicación.

- **K1** — Las columnas se ven juntas y cada una está rotulada con el estado que representa.
- **K2** — La columna **es** el estado: la posición de la tarjeta es la única declaración de en qué punto está la tarea.
- **K3** — Las tarjetas se arrastran **entre columnas**; soltar en otra columna cambia el estado. Dentro de la misma, reordena.
- **K4** — Mientras se arrastra se ve qué se mueve, sobre qué columna está el puntero y en qué posición exacta caerá.
- **K5** — Soltar fuera de un destino válido no destruye nada: la tarjeta vuelve a su sitio. `Esc` cancela.
- **K6** — El orden dentro de la columna lo decide el usuario y se conserva entre sesiones.
- **K7** — Cada columna dice cuántas tarjetas tiene, incluido el cero.
- **K8** — Se crean tarjetas desde la propia columna, y la tarjeta nace en esa columna.
- **K9** — Al hacer clic en una tarjeta se abre su detalle completo; no se edita en línea ni se mueve por accidente.
- **K10** — Cada tarjeta tiene un menú con sus acciones, y las destructivas están separadas del resto.
- **K11** — El frente de la tarjeta muestra lo justo para decidir: título, prioridad, fecha límite y lista.
- **K12** — Lo que se mueve, completa o borra se puede deshacer, con el camino de vuelta a mano justo después de la acción.
- **K13** — Buscar y filtrar no cambia los datos, solo lo que se ve, y siempre se sabe qué criterio está activo.
- **K14** — El tablero se puede acotar a un proyecto o verlo entero.
- **K15** — Todo lo que se hace con el ratón tiene camino de teclado.
- **K16** — El texto que escribe el usuario se muestra dentro de su tarjeta o de su diálogo, sin romper la maquetación ni provocar desplazamiento horizontal.

### 1.6 Verificación del diseño contra la lista

| # | Veredicto | Detalle |
|---|---|---|
| K1 | Cumple | Tres columnas apiladas en móvil y lado a lado desde 768 px (§11.0) |
| K2 | **No cumplía → corregido** | La tarjeta llevaba una casilla que mandaba la tarea a «Completada» desde cualquier columna: dos portadores de la misma verdad, y un salto de columna inexplicable al marcarla. La casilla se elimina (§10.5, §11.0.1) |
| K3 | **No cumplía → corregido** | El arrastre solo reordenaba dentro de una columna. Las tres pasan a formar un grupo conectado y soltar en otra cambia el estado (§8) |
| K4 | Cumple con K3 | Vista previa, columna de destino resaltada y hueco de inserción (§8.2). Antes estaban especificados pero no llegaban a verse, porque no había más destino que el origen |
| K5 | Cumple con K3 | Cancelación con `Esc` y al soltar fuera de toda columna (§8.2) |
| K6 | Cumple | Orden propio dentro de cada columna, persistido |
| K7 | Cumple | Contador en el encabezado, visible también en cero (§3.2) |
| K8 | Cumple | Botón de añadir en el encabezado y en el pie de cada columna (§10.6) |
| K9 | **Parcial → corregido** | El detalle se abría con `Enter` y desde el menú, pero no estaba fijado que el cuerpo de la tarjeta fuera el disparador; quedaba a criterio de quien implementara. Ahora lo está (§10.5) |
| K10 | Cumple | Menú `⋯` con «Eliminar» tras un divisor (§10.5) |
| K11 | Cumple | §10.5 |
| K12 | Cumple | Toda mutación es deshacible y el aviso breve ofrece «Deshacer» (§10.12, §11.0.1) |
| K13 | Cumple | Segmentado de estado, filtro de prioridad y resumen siempre visible (§10.4) |
| K14 | Cumple | Panel de listas y ruta `/tablero/:listId` (§10.8, §11.1) |
| K15 | Cumple | Flechas dentro del tablero, «Mover a ›» en el menú y `Espacio` para completar (§7.3) |
| K16 | **No cumplía → corregido** | Una palabra larga sin espacios se pegaba al borde y abría desplazamiento horizontal dentro del diálogo de detalle. Se fija una regla única de tratamiento del texto (§10.18) |

**Desvíos conscientes.** Las columnas no son configurables, no hay carriles ni
límites de trabajo en curso: son tres estados fijos de un tablero personal, y
hacerlos configurables sería abstracción sin uso. El tablero tampoco se desplaza
lateralmente como el de Trello, porque tres columnas siempre caben (§15).

### 1.7 Segunda familia: la paleta de comandos

La superposición de `Ctrl`+`K` no es una invención de este proyecto: es un
**command palette**, la misma pieza que llevan los editores de código y las
herramientas de productividad modernas. Se hereda su comportamiento completo,
porque quien la abre ya sabe usarla y cualquier variación se lee como un fallo.

| Referencia | Qué aporta |
|---|---|
| **VS Code** (`Ctrl`+`Shift`+`P` y `Ctrl`+`P`) | El origen del patrón y el mínimo indiscutible: un campo, coincidencia difusa mientras se escribe, flechas para recorrer, `Enter` ejecuta, `Esc` cierra. También la distinción entre buscar *comandos* y buscar *cosas*, que aquí se resuelve con grupos en lugar de con dos paletas distintas |
| **Linear** (`Ctrl`+`K`) | La paleta dentro de un gestor de tareas, no de un editor: comandos que actúan sobre la entidad, resultados agrupados por tipo y acciones secundarias sobre el elemento resaltado. Es la referencia más cercana al problema |
| **Raycast** | El acabado del lanzador: pie con la leyenda de teclas siempre visible, una acción principal por fila y las secundarias anunciadas ahí mismo, en lugar de escondidas |

Se descartan Spotlight y Alfred como referencia: son buscadores del sistema
operativo, no paletas de acciones sobre un modelo propio, y su modelo de
resultados no aplica.

### 1.8 Lo que cualquiera da por sentado en una paleta, y verificación

Misma mecánica que §1.5–1.6: lista de comprobación y veredicto sobre el boceto
de partida, uno por uno. La especificación resultante es §10.19.

| # | Convención | Veredicto sobre el boceto de partida |
|---|---|---|
| P1 | Se abre con `Ctrl`+`K` desde cualquier punto y también desde un disparador visible: no es una función secreta | **No cumplía → corregido.** El disparador visible se resolvió primero como un botón «Comandos» junto al buscador, y eran dos controles contiguos para la misma intención. Ya no hay botón aparte: el disparador **es** el buscador de la barra (§10.3), que abre la paleta al recibir el foco y muestra las teclas `Ctrl` `K` dentro del propio campo |
| P2 | El campo recibe el foco al abrir y todo se escribe ahí; no hay ningún otro sitio donde escribir | Cumple |
| P3 | La coincidencia es difusa y filtra con cada pulsación, sin botón de buscar, y se ve qué parte del texto coincidió | **No cumplía → corregido.** El boceto no decía cómo se busca. Se fija coincidencia por subsecuencia sin acentos, orden por calidad de coincidencia y realce de las letras acertadas |
| P4 | Los resultados van agrupados por tipo, con el rótulo del grupo a la vista | **Parcial → corregido.** Los grupos eran cuatro y dos de ellos —«Listas» e «Ir a»— significaban lo mismo. Quedan tres: Acciones, Ir a y Tareas |
| P5 | Siempre hay exactamente una fila resaltada; las flechas la mueven sin sacar el foco del campo y la lista envuelve por los extremos | Cumple. Se añade que el puntero mueve el mismo resaltado, para que nunca haya dos filas «actuales» |
| P6 | `Enter` ejecuta la fila resaltada y `Esc` cierra devolviendo el foco a donde estaba | **Parcial → corregido.** Faltaba decir a dónde vuelve el foco y qué ocurre con un diálogo ya abierto |
| P7 | No hace falta el ratón para nada, y el ratón tampoco estorba | **No cumplía → corregido.** No estaba dicho qué hace `Enter` sobre una tarea ni cómo se completa sin ratón, que es justo lo que pide el alcance (§10.19.4) |
| P8 | La paleta se cierra sola al ejecutar y al hacer clic fuera; no se queda flotando sobre el tablero | **No cumplía → corregido.** Ahora está fijado, con un único desvío justificado: la acción secundaria de completar no cierra |
| P9 | El pie recuerda las teclas disponibles para la fila resaltada | Cumple. La leyenda pasa a ser contextual, no fija |
| P10 | Sin consulta, la paleta ya ofrece algo útil; no abre en blanco | **No cumplía → corregido.** Al abrir muestra los comandos frecuentes y las listas |
| P11 | Sin resultados se dice citando la consulta y se ofrece una salida razonable | **Parcial → corregido.** El mensaje estaba; la salida —crear la tarea con ese mismo texto— no |
| P12 | No se listan comandos que ahora mismo no se pueden ejecutar | **No cumplía → corregido.** Cada comando declara su condición de disponibilidad; «Deshacer» sin historial, «Limpiar filtros» sin filtros o «Vaciar el tablero» con el tablero vacío no aparecen |

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
| `line-strong` | Bordes funcionales: campo, selector, botón secundario | `#8A8AA0` | `#6B6B85` |

### 2.4 Marca y semánticos

| Token | Uso | Claro | Oscuro |
|---|---|---|---|
| `primary` | Botón principal, enlaces, anillo de foco, lista activa, columna «En progreso» | `#7E22CE` | `#C084FC` |
| `primary-hover` | Hover y pulsado sobre elementos de marca | `#6B21A8` | `#D8B4FE` |
| `primary-soft` | Fondo de elemento seleccionado, chip de marca, hueco de destino | `#F3E8FF` | `#2C1148` |
| `on-primary` | Texto e iconos sobre relleno `primary` | `#FFFFFF` | `#1A0B2E` |
| `success` | Columna «Completadas», marca de tarea completada, aviso de éxito | `#146C33` | `#4ADE80` |
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
| **Completada** | Marca de verificación de 16 px en `success` delante del título, título en `ink-subtle` con tachado de 1 px, y toda la tarjeta al 70 % de opacidad. La franja de prioridad pasa a `line`. La marca es un indicador, no un control: no responde al clic |
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
  líneas** con recorte por elipsis (`line-clamp-2`); una palabra que no quepa
  entera se parte antes que desbordar (§10.18).
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
| `radius-xs` | 4 px | Teclas `kbd`, medidor de prioridad, muestras de color |
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
- Los controles (campo, selector, botón secundario) llevan borde `line-strong`,
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
| Paleta de comandos | Velo: opacidad 0→1, 150 ms. Panel: opacidad 0→1 + `scale(.98)→1` + `translateY(-4px)→0`, 150 ms `ease-entrance` —más rápida que un diálogo: es un lanzador y se abre muchas veces seguidas | 90 ms `ease-exit`. Los resultados **no se animan** al filtrar: la lista cambia en el mismo fotograma que la letra escrita |
| Cajón de listas (móvil) | `translateX(-100%)→0`, 250 ms `ease-standard`; velo en paralelo | 200 ms `ease-exit` |
| Tarjeta creada | Opacidad 0→1 + `translateY(-4px)→0`, 200 ms, **más** un destello de fondo `primary-soft` que se desvanece en 1200 ms | — |
| Tarjeta eliminada | Opacidad 1→0 + `scale(.98)`, 150 ms; el hueco se cierra en 200 ms `ease-standard` | — |
| Tarea completada desde el menú o el teclado | La tarjeta sale de su columna con opacidad 1→0 + `translateY(-4px)` en 150 ms y reaparece en «Completadas» con su destello; el hueco se cierra en 200 ms `ease-standard` y los dos contadores se actualizan al terminar | — |
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
- **Una única excepción, y es puntual**: el campo de la paleta de comandos. Se
  autoenfoca al abrir —quien abre un lanzador quiere escribir de inmediato— y el
  anillo quedaba dibujado justo por dentro del borde del panel, dos marcos
  concéntricos para un solo control. Ese campo usa un tratamiento propio, un
  cambio de borde (§10.19). No se generaliza: el resto de la aplicación mantiene
  el anillo, incluida la **fila resaltada** de la propia paleta, que conserva su
  indicador completo de §10.19 (fondo, barra izquierda y peso).
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

- **Orden de tabulación** del documento: enlace de salto → marca → disparador de
  búsqueda y comandos → acciones de la barra → cajón/panel de listas → filtros →
  tablero → avisos. Llegar con `Tab` al disparador **abre la paleta** (§10.3);
  `Esc` la cierra y devuelve el foco al disparador sin reabrirla, de modo que el
  siguiente `Tab` continúa por la barra: recorrerla con el teclado nunca queda
  atrapado.
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
| `Espacio` | Completar la tarea, o reabrirla si ya estaba completada (§11.0.1) |
| `Supr` | Eliminar la tarea (abre confirmación) |
| `Esc` | Salir del tablero hacia la barra de herramientas |

- Al pulsar `Tab` dentro de una tarjeta enfocada, el foco entra en sus controles
  internos (asidero, menú) en orden; `Esc` vuelve a la tarjeta.
- El desplazamiento sigue al foco: la tarjeta enfocada siempre queda visible
  dentro de su columna (`scroll-margin` de 8 px arriba y abajo).

### 7.4 Inventario de atajos

La columna **Fase** dice si el atajo ya funciona (`1`) o si todavía no se ha
construido (`2`). **La hoja de atajos de la aplicación solo lista los de fase 1**
(§11.3). `Ctrl`+`K`, `Ctrl`+`Z` y `Ctrl`+`Shift`+`Z` estuvieron marcados como
fase 2 y **ahora son fase 1**: la paleta (§10.19) y deshacer/rehacer (§10.20)
existen, así que entran también en la hoja de atajos.

| Atajo | Acción | Ámbito | Fase |
|---|---|---|---|
| `/` | Abrir la paleta de comandos para buscar | Global | 1 |
| `N` | Nueva tarea | Global | 1 |
| `L` | Nueva lista | Global | 1 |
| `?` | Abrir la hoja de atajos | Global | 1 |
| `T` | Cambiar entre claro y oscuro | Global | 1 |
| `Ctrl`+`K` | Abrir la paleta de comandos | Global | 1 |
| `Ctrl`+`Z` | Deshacer la última acción | Global | 1 |
| `Ctrl`+`Shift`+`Z` | Rehacer la última acción deshecha | Global | 1 |
| `Esc` | Cerrar diálogo, paleta, menú o cajón | Global | 1 |
| `↑` `↓` `←` `→` | Navegar entre tarjetas y columnas | Tablero | 1 |
| `Enter` | Abrir el detalle de la tarea enfocada | Tablero | 1 |
| `Espacio` | Completar o reabrir la tarea enfocada | Tablero | 1 |
| `Supr` | Eliminar la tarea enfocada | Tablero | 1 |
| `Ctrl`+`Enter` | Guardar el formulario | Diálogo | 1 |
| `↑` `↓` | Mover el resaltado entre resultados | Paleta | 1 |
| `Enter` | Ejecutar la fila resaltada | Paleta | 1 |
| `Ctrl`+`Enter` | Completar o reabrir la tarea resaltada, sin cerrar la paleta | Paleta | 1 |
| `Ctrl`+`↑` `↓` | Mover la tarjeta dentro de su columna | Tablero | 2 |
| `Ctrl`+`←` `→` | Mover la tarjeta a la columna contigua | Tablero | 2 |

Reglas de comportamiento:

- **`/` y `Ctrl`+`K` llevan al mismo sitio** desde que buscar y ejecutar
  comparten punto de entrada (§10.3): `/` es la costumbre de las aplicaciones
  web y `Ctrl`+`K` la de los lanzadores, y se mantienen las dos porque cada
  usuario llega con una en los dedos. La paleta se abre igual y el campo queda
  listo para escribir. `Esc` ya no vacía la búsqueda: eso lo hace el botón de
  limpiar del propio disparador.
- Los atajos de una sola tecla **se ignoran mientras el foco está en un campo de
  texto** o hay un diálogo modal abierto (salvo `Esc` y `Ctrl`+`Enter`).
- Los atajos con modificador **sí funcionan dentro de un campo de texto**, con
  dos excepciones: con un diálogo modal abierto, `Ctrl`+`K` no hace nada —no se
  apilan capas modales— y `Ctrl`+`Enter` guarda el formulario, que es lo que ese
  ámbito espera.
- `Ctrl`+`Z` dentro de un campo de texto lo deja al navegador: deshacer lo que
  se está escribiendo es lo que el usuario quiere ahí. Fuera de un campo,
  deshace la última acción del tablero.
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
  - En el **disparador de búsqueda y comandos** (§10.3), en su ranura derecha.
    Es la excepción reconocida a la regla siguiente, y solo esa: el control
    tiene forma de campo, no de botón de acción, y en esa ranura la tecla es
    justo lo que buscan quienes lo miran para preguntarse cómo se abre la
    paleta. Es lo que hacen Linear, Notion, GitHub y Slack en su buscador.
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

Es la interacción central del tablero (K3). Se implementa con el CDK de Angular
y **las tres columnas forman un único grupo conectado**
(`cdkDropListGroup`): cualquier tarjeta se puede soltar en cualquiera de ellas,
incluida la suya.

| Gesto | Efecto |
|---|---|
| Soltar sobre otra columna | La tarea pasa al estado de esa columna y queda en la posición donde se soltó |
| Soltar sobre la propia columna | Solo cambia el orden dentro de ella |
| Soltar fuera de toda columna, o `Esc` | No cambia nada: la tarjeta vuelve a su origen |

Pasar a «Completadas» arrastrando cuenta como completar y muestra el aviso breve
con «Deshacer» (§11.0.1). El resto de movimientos no muestra aviso: el usuario
acaba de ver el resultado con su propia mano.

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
- Arrastrar desde el cuerpo de la tarjeta también funciona en escritorio, y
  convive con el clic que abre el detalle: si el puntero se desplaza más de 4 px
  con el botón pulsado, es un arrastre y no un clic (§10.5).
- **En táctil se arrastra solo desde el asidero**: sobre la tarjeta, tocar abre
  el detalle y deslizar desplaza la página, que es lo que espera el dedo.

### 8.2 Qué se ve mientras se arrastra

| Elemento | Aspecto |
|---|---|
| **Tarjeta arrastrada** (`.cdk-drag-preview`) | `shadow-drag`, `scale(1.02)`, `rotate(1.5deg)`, borde `primary` al 40 %, opacidad 1. Conserva el ancho de la columna de origen, aunque el puntero esté sobre otra |
| **Tarjeta de origen** | Desaparece de su sitio: el hueco ocupa exactamente su lugar, así que no hay salto |
| **Hueco de destino** (`.cdk-drag-placeholder`) | Misma altura que la tarjeta, fondo `primary-soft`, borde discontinuo de 1.5 px `primary` al 45 %, radio `md`, sin contenido. **Es único y viaja con el puntero**: al entrar en otra columna desaparece de la anterior y se abre en la nueva, entre las dos tarjetas donde caerá. Aparece con 150 ms de opacidad |
| **Hueco en una columna vacía** | Sustituye al bloque «Sin tareas en …» (§12.5) conservando sus 88 px, de modo que la columna vacía es un destino tan visible como las demás |
| **Columna bajo el puntero** (destino) | Fondo `sunken` + velo `hover`, anillo interior de 1 px `primary` al 40 %, y en el encabezado el punto y el icono de estado al 100 % de opacidad con el rótulo en `ink`. Transición 150 ms. **Solo una columna a la vez**; si el puntero vuelve a la de origen, es esa la que se resalta |
| **Columnas restantes** | Sin cambio alguno. No se atenúan: las tres son destinos válidos y atenuar sugeriría lo contrario |
| **Puntero fuera de toda columna** | Ninguna columna resaltada y el hueco regresa a la posición de origen, así se ve de antemano que soltar ahí no cambiará nada |
| **Vecinas** | Se recolocan con `transform` en 250 ms `ease-standard` (`.cdk-drag-animating`) |
| **Contadores de columna** | No se tocan durante el arrastre; ambos —origen y destino— se actualizan al soltar, para que no parpadeen a cada movimiento del puntero |
| **Soltar válido** | La tarjeta cae en su sitio en 200 ms `ease-entrance` y recibe el destello `primary-soft` de 1200 ms. Si el destino es «Completadas», adopta a la vez el aspecto de completada (§3.3) |
| **Soltar cancelado** (`Esc` o fuera de toda columna) | La tarjeta vuelve a su origen en 250 ms `ease-standard`, sin destello y sin aviso |
| **Movimiento reducido** | Sin rotación ni escalado en la vista previa; el hueco aparece sin transición; las vecinas saltan |

### 8.3 Desplazamiento automático

Las columnas tienen su propio desplazamiento vertical y `cdkDropListAutoScroll`
activo: al acercar la tarjeta a 48 px del borde superior o inferior, la columna
se desplaza. En móvil, donde las columnas están apiladas, el desplazamiento es
el de la página.

### 8.4 Accesibilidad del arrastre

- El arrastre por puntero **no es el único camino**: la tarjeta cambia de columna
  desde su menú («Mover a › En progreso», «Completar») y, en la fase 2, con
  `Ctrl`+flechas.
- El asidero es un `<button>` real con `aria-label` «Mover la tarea {título}» y
  `aria-describedby` apuntando a una instrucción invisible: «Para moverla sin
  arrastrar, usa “Mover a” en el menú de la tarea».
- Se anuncia por región activa (`LiveAnnouncer` del CDK). El anuncio **siempre
  nombra la columna**, porque el estado es lo que cambia:
  - al empezar (`assertive`): «Tarea “Preparar informe” tomada. Por hacer, posición 2 de 5.»
  - al cambiar de columna o de posición de destino (`polite`, solo cuando el
    destino cambia de verdad): «En progreso, posición 1 de 4.»
  - al salir de toda columna (`polite`): «Fuera de las columnas. Si sueltas aquí, la tarea no se moverá.»
  - al soltar (`assertive`): «Tarea “Preparar informe” movida a En progreso, posición 1 de 4.» Si el destino es la misma columna: «…reordenada en Por hacer, posición 1 de 5.»
  - al cancelar (`assertive`): «Movimiento cancelado. La tarea vuelve a Por hacer, posición 2 de 5.»
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

La validación se muestra **al intentar enviar** y, a partir de ahí, se actualiza
al escribir. Nunca se marca en rojo un campo que el usuario todavía no ha
terminado: salir de un campo vacío no es un error, es no haber llegado aún. El contador de caracteres aparece a partir del 80 % del máximo y pasa a
`danger` al superarlo.

**Área de texto**: mismas reglas, altura mínima de 3 líneas, redimensionable solo
en vertical. **Selector de fecha**: `<input type="date">` nativo con
`color-scheme` heredado, más un botón sutil «Quitar fecha» cuando hay valor.

### 10.3 Disparador de búsqueda y comandos

Buscar y ejecutar comparten **un único punto de entrada**, como en Linear y en
Notion. **No es un campo editable**: es un botón con forma de campo que abre la
paleta (§10.19), y se escribe allí dentro. Aquí no se filtra el tablero letra a
letra; la búsqueda llega al tablero desde la paleta.

**Anatomía** (barra de escritorio; en móvil, ver el último punto): marco de campo
—fondo `field`, borde 1 px `line-strong`, radio `sm`, alto 36 px (44 en táctil),
relleno lateral 10 px— con lupa de 20 px
`ink-subtle` a la izquierda · etiqueta · ranura derecha con `Ctrl` `K` en `kbd`
(`⌘` `K` en macOS; no se pinta en táctil) o con el botón de limpiar. Ancho fijo
de 320 px en escritorio: ya no crece al enfocarse, porque el foco no se queda
aquí.

| Estado | Aspecto y contenido |
|---|---|
| Reposo, sin búsqueda | Etiqueta «Buscar o ejecutar…» en `ink-subtle`; a la derecha, las teclas en `kbd` |
| Reposo, con búsqueda activa | Fondo `primary-soft`, borde `primary`, la consulta como etiqueta en `ink` peso 500 y entre comillas, recortada a una línea (§10.18); a la derecha, en lugar del `kbd`, el botón de icono `×` de 20 px «Limpiar la búsqueda» (44×44 táctil). Es el mismo lenguaje del filtro de prioridad activo (§10.4), así que la barra se lee de un vistazo: hay algo aplicado |
| Hover | Borde `ink-subtle`; con búsqueda activa, velo `hover` sobre `primary-soft` |
| Foco | **Abre la paleta.** El anillo global (§7.1) se dibuja igualmente: es lo que se ve en el instante previo y al volver de la paleta |
| Activo (pulsado) | Velo `press` durante 90 ms, antes de que suba la paleta |
| Deshabilitado / cargando | No existen: siempre se puede buscar, y el filtrado es síncrono |

- **Se abre al recibir el foco** por clic, por `Tab`, con `Enter`/`Espacio` o con
  los atajos `/` y `Ctrl`+`K`. En cambio, el foco que le **devuelve** la paleta
  al cerrarse no la reabre: la apertura la dispara la interacción del usuario, no
  el foco restablecido por programa. Sin esa distinción, cerrar sería imposible.
- La **búsqueda activa** se aplica desde la paleta, con la fila «Ver los {n}
  resultados en el tablero» (§10.19), y se retira desde el botón de limpiar o
  desde «Limpiar filtros» (§10.4). Al limpiar, el foco se queda en el disparador
  —sin reabrir la paleta— y el resumen del tablero vuelve a su forma sin
  búsqueda.
- El resultado se refleja siempre en el **resumen del tablero**: «5 de 12 tareas
  coinciden con “informe”», región activa `polite`, para que el cambio también se
  anuncie. Sin resultados, el tablero pinta el estado vacío de §12.4.
- **Roles y nombre accesible**: `<button>` con `aria-haspopup="dialog"`,
  `aria-expanded` según esté la paleta abierta y `aria-keyshortcuts="Control+K"`.
  Nombre accesible «Buscar o ejecutar un comando» y, con búsqueda activa,
  «Buscar o ejecutar un comando. Búsqueda activa: informe». El botón de limpiar
  es un `<button>` **hermano** dentro del mismo marco, nunca anidado dentro del
  disparador —un botón dentro de otro no es HTML válido—, con `aria-label`
  «Limpiar la búsqueda».
- **En móvil** el disparador es el botón de solo icono de la barra (§10.7), que
  abre la misma paleta; con búsqueda activa el icono lleva un punto `primary` de
  6 px arriba a la derecha y su nombre accesible cita la consulta.

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
│ │ Título de la tarea, hasta dos líneas    [⠿] │   ← franja de prioridad 3px
│ │ Descripción recortada a una línea            │
│ │ [medidor] [cápsula de fecha] [• Lista]  [⋯] │
└─┴──────────────────────────────────────────────┘
```

- Fondo `surface`, borde `line`, radio `md`, `shadow-xs`, ancho completo de la
  columna, separación de 8 px con la siguiente.
- **La tarjeta entera abre el detalle** (K9): su cuerpo es el disparador, con
  `role="button"` sobre el `article`, `aria-labelledby` al título y respuesta a
  clic, `Enter` y `Espacio`… salvo `Espacio`, que completa (§7.3). El asidero y
  el menú detienen la propagación para no abrir el detalle al usarlos. Un
  arrastre nunca cuenta como clic: se abre el detalle solo si el puntero no se
  desplazó más de 4 px.
- **Título**: empieza en el borde izquierdo del relleno. Ese espacio lo ocupaba
  antes una casilla de completar; ahora es ancho de título, que es lo que de
  verdad se lee al escanear una columna.
- **Franja de prioridad**: 3 px a la izquierda, de borde a borde, con el color de
  la prioridad (§3.1).
- **Franja de lista**: 2 px arriba con el color de la lista, **solo cuando se ven
  varias listas a la vez** (`/tablero` sin lista activa).
- **Asidero** (`⠿`): 20 px, arriba a la derecha, según §8.1.
- **Menú** (`⋯`): 20 px, abajo a la derecha; contiene **Completar** (o
  **Reabrir** si ya está completada, `Espacio`), Editar (`Enter`), Duplicar,
  Mover a › (los otros dos estados), Cambiar prioridad ›, y —separado por un
  divisor— Eliminar en peligro sutil (`Supr`).
- **Fila de metadatos**: medidor de prioridad, cápsula de fecha si la hay, punto
  y nombre de la lista cuando procede. Altura fija de 20 px.
- **No hay casilla ni interruptor de estado en la tarjeta**: el estado tiene un
  solo portador, que es la columna (§11.0.1).

| Estado | Aspecto |
|---|---|
| Reposo | El descrito |
| Hover | `shadow-sm`, borde `line-strong`, asidero y menú al 100 % |
| Foco | Anillo global de 2 px por fuera; no cambia la sombra |
| Activo (pulsando) | `scale(.995)` durante 90 ms |
| Arrastrando | §8.2 |
| Completada | Marca de verificación de 16 px en `success` delante del título, título tachado en `ink-subtle`, tarjeta al 70 %, franja de prioridad en `line` |
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
marca «Tareas» · botón de icono «Buscar o ejecutar» (abre la paleta, §10.3) ·
botón de icono «Nueva tarea» · menú `⋯`.

**Escritorio (`md`+)**: marca «Tareas» + nombre de la lista activa · grupo de
**deshacer y rehacer** (§10.20) · **disparador de búsqueda y comandos** centrado
(§10.3) · a la derecha: botón primario «Nueva tarea» · conmutador de tema ·
botón de icono «Atajos de teclado» (`?`) · menú `⋯`.

El grupo de deshacer/rehacer va pegado al disparador por la izquierda, separado
de la marca por 12 px: las dos cosas son formas de volver o de llegar a algo y se
leen juntas. **No hay un botón «Comandos» aparte**: la paleta se abre desde el
propio disparador de búsqueda (§10.19).

El menú `⋯` agrupa lo que no cabe. En escritorio: «Atajos de teclado», «Acerca de
tus datos», divisor, y «Vaciar el tablero» en peligro sutil, **siempre separada
del resto por un divisor** por ser destructiva. **En móvil el menú encabeza con
«Deshacer» y «Rehacer»** —con su icono de 16 px y el nombre de la acción
concreta—, seguidos de un divisor y del resto: la barra móvil ya lleva cinco
controles y añadir dos flechas más dejaría áreas táctiles pegadas.

### 10.8 Panel de listas

Ancho 240 px, fijo a la izquierda desde `xl`; por debajo es un cajón que entra
desde la izquierda con velo (`scrim`), foco atrapado y cierre con `Esc`, clic
en el velo o deslizamiento.

- Rótulo «Listas» en versalitas de 11 px `ink-subtle`.
- Fila «Todas las tareas» (icono de bandeja) siempre primera.
- Cada fila: punto de color de 8 px · nombre · contador a la derecha en
  `ink-subtle` · menú `⋯` al hacer hover o al enfocar (Renombrar o cambiar el
  color, divisor, Eliminar en peligro sutil). Nombre y color se editan en el
  mismo diálogo: son dos campos, no merecen dos caminos.
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
- Foco atrapado. **Regla general: al abrir, el foco va al título del diálogo**,
  que lleva `tabindex="-1"` y no entra en el orden normal de tabulación. Dos
  razones: el cuerpo se ve desde arriba —dejarlo al navegador acababa en el
  último botón del pie y abría el panel con su desplazamiento interno al final,
  como si el diálogo empezara por el final— y el lector de pantalla anuncia de
  qué diálogo se trata antes que su contenido. La regla vive en el componente
  compartido, no en cada diálogo. Al cerrar, el foco vuelve al disparador.
- **Excepciones, que cada diálogo declara explícitamente.** Solo estas:

| Diálogo | Foco inicial | Por qué |
|---|---|---|
| Nueva / editar tarea, nueva / renombrar lista | Campo «Título» o «Nombre» | Se abre para escribir; el título del diálogo lo repite el propio encabezado |
| Confirmación destructiva | Botón «Cancelar» | `Enter` a ciegas no puede destruir nada (§11.3) |
| Paleta de comandos (§10.19) | Su campo de búsqueda | Es un lanzador: se abre para escribir de inmediato |
| Detalle de la tarea, hoja de atajos, acerca de tus datos | Título (regla general) | Se abren para leer |

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
  El reloj se detiene mientras el puntero esté encima o el foco esté dentro, y se
  reanuda al salir: nadie debe perseguir un «Deshacer» que huye.
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

### 10.18 Texto de origen del usuario

Regla transversal, no de un componente: **todo texto que escribe el usuario se
trata igual en toda la aplicación**. Afecta al título de la tarea, a su
descripción, al nombre de la lista y a cada eco de esos textos en diálogos,
menús, avisos breves, confirmaciones y títulos emergentes.

- **El relleno interior es intocable.** Ningún glifo llega al borde del
  contenedor: el texto se parte antes de invadir el relleno.
- **Corte de palabra como último recurso**: `overflow-wrap: anywhere` en todo
  contenedor de texto del usuario. Las palabras se reparten por espacios mientras
  se pueda; solo la que no cabe entera se parte.
- **Los contenedores flexibles llevan `min-width: 0`.** Sin eso el hijo se niega
  a encoger y el corte no llega a ocurrir: es la causa habitual del desbordamiento.
- **Nunca hay desplazamiento horizontal.** Ni en el diálogo, ni en la tarjeta, ni
  en la columna. El único desplazamiento admitido es el vertical del cuerpo del
  diálogo y el de la columna.
- **Multilínea** (descripción en el detalle): se muestra íntegra, con
  `white-space: pre-wrap` para respetar los saltos de línea que escribió el
  usuario, y con el corte de palabra activo.
- **Una sola línea** (nombre de lista en su fila, título en un menú, contexto de
  un resultado): elipsis con `text-overflow`, y el texto completo disponible en
  el título emergente y en el nombre accesible.
- **Citas dentro de mensajes** (avisos y confirmaciones que nombran la tarea o la
  lista): entre comillas y recortadas a una línea con elipsis, para que el
  mensaje no se convierta en un párrafo.
- Los límites del modelo (120 caracteres de título, 2000 de descripción, 60 de
  nombre de lista) ponen el techo; esta regla cubre lo que el techo no evita: una
  única palabra larguísima dentro del límite.
- **Comprobación**: pegar 200 caracteres sin espacios en el título, en la
  descripción y en el nombre de una lista no debe producir desplazamiento
  horizontal en ninguna pantalla ni en ningún ancho, ni descolocar la tarjeta, el
  detalle, el panel de listas o el aviso que los cita.

### 10.19 Paleta de comandos (`Ctrl`+`K`)

Un único sitio para hacer cualquier cosa sin tocar el ratón: crear una tarea,
encontrarla, completarla, cambiar de lista o cambiar de tema. Cumple §1.8.

**Disparador visible: el buscador de la barra.** No hay un botón «Comandos»
aparte. El disparador es el **disparador de búsqueda y comandos** (§10.3), que
abre esta paleta al recibir el foco y muestra `Ctrl` `K` en su ranura derecha. Un
solo punto de entrada, como en Linear y en Notion: dos controles contiguos que
sirven a la misma intención —escribir para encontrar o para hacer algo— repartían
la misma función y obligaban a elegir entre ellos sin ningún criterio. Además, la
paleta no se descubre con un botón dedicado: se descubre desde el campo de
búsqueda, que ya es el elemento con más presencia visual de la barra. En móvil y
en táctil, el disparador es el botón de icono «Buscar o ejecutar» (§10.7).

**Anatomía**

| Parte | Especificación |
|---|---|
| Superposición | Velo `scrim`; panel `overlay`, radio `lg`, `shadow-lg`, ancho máximo 560 px, centrado y anclado al 15 % de la altura. En móvil: ancho de la ventana menos 16 px por lado, anclado a 8 %, altura máxima 70 vh |
| Cabecera (52 px) | Lupa de 20 px `ink-subtle` · campo sin borde de 44 px, `text-base`, marcador de posición «Buscar tareas o escribir un comando» · a la derecha, `Esc` en `kbd` (no se pinta en táctil). **Foco propio**: el campo no dibuja el anillo global —se autoenfoca al abrir y el anillo quedaba encima del borde del panel, dos marcos concéntricos—, sino que el borde inferior de la cabecera pasa de 1 px `line` a 2 px `primary`. Excepción puntual de §7.1, no un cambio de la regla |
| Cuerpo | Altura máxima 360 px con desplazamiento propio; grupos de resultados con rótulo en versalitas de 11 px `ink-subtle` con `tracking-caps`, 8 px de aire sobre cada rótulo |
| Fila (44 px; 48 en táctil) | Icono de 16 px · etiqueta · contexto a la derecha en `text-xs` `ink-subtle` · `kbd` del atajo si lo tiene. Relleno lateral 12 px, radio `sm` |
| Pie (36 px) | Fondo `sunken`, borde superior `line`, `text-2xs` `ink-subtle`, leyenda **contextual** de teclas alineada a la izquierda y recuento de resultados a la derecha («8 resultados») |

**Grupos**, en este orden fijo. Nunca se muestra un grupo vacío ni su rótulo.

| Grupo | Contenido | Qué hace `Enter` | Tope |
|---|---|---|---|
| **Acciones** | Con consulta, encabeza **«Crear la tarea “{consulta}”»**. Luego: Nueva tarea, Nueva lista, Deshacer: {acción}, Rehacer: {acción}, Tema claro / oscuro / seguir al sistema, Atajos de teclado, Limpiar filtros, Vaciar el tablero | Ejecuta el comando y cierra la paleta. Los que abren un diálogo (crear tarea o lista, vaciar) lo dejan abierto con su foco inicial (§10.10) | 6 |
| **Ir a** | «Todas las tareas» y cada lista, con su punto de color y su contador | Navega a `/tablero` o `/tablero/{id}` y cierra | 6 |
| **Tareas** | Tareas que coinciden, ordenadas por calidad de coincidencia y, a igualdad, por prioridad descendente | Va a la tarea: cierra la paleta, navega a su lista si hacía falta, desplaza su tarjeta a la vista con destello `primary-soft` y abre su detalle (§11.3) | 8 filas de tarea. Con consulta y al menos una coincidencia, el grupo **cierra siempre** con «Ver los {n} resultados en el tablero», que aplica la consulta como búsqueda del tablero y cierra la paleta: es el único camino para llevar la búsqueda al tablero, así que no depende de que sobren resultados |

- **Comandos no disponibles no se listan** (P12): sin historial no hay «Deshacer»,
  sin filtros activos no hay «Limpiar filtros», con el tablero ya vacío no hay
  «Vaciar el tablero». Nunca se muestra una fila deshabilitada: en una lista que
  se recorre con flechas, una fila inerte es una trampa.
- **Sin consulta** la paleta abre con Acciones (los comandos frecuentes) e «Ir a».
  Nunca en blanco.
- **Fila de tarea**: medidor de prioridad (§10.15) · título en una línea con
  elipsis · a la derecha, columna y lista en `ink-subtle`, más la cápsula de fecha
  solo si la tarea está vencida o vence hoy. Una tarea completada se pinta con su
  marca de verificación de 16 px `success` y el título tachado, igual que en la
  tarjeta (§3.3).

**Estados**

| Estado | Aspecto |
|---|---|
| Fila en reposo | Sin fondo; etiqueta `ink`, contexto `ink-subtle` |
| Fila resaltada | Fondo `primary-soft`, barra izquierda de 3 px `primary`, etiqueta peso 500. Es el lenguaje de selección de §7.2, sin anillo: el foco está en el campo |
| Hover del puntero | **Mueve el resaltado** a esa fila; no existe un realce aparte. Así nunca hay dos filas «actuales» |
| Pulsada | Velo `press` durante 90 ms |
| Coincidencia | Las letras acertadas de la consulta se pintan en peso 600 y `ink`; el resto de la etiqueta, en `ink-muted`. Nunca solo color |
| Sin resultados | Bloque centrado de 96 px: icono de 20 px `ink-subtle`, texto `text-sm` «Sin resultados para “xyz”» y, debajo, la única fila disponible —«Crear la tarea “xyz”»— ya resaltada, para que `Enter` siga sirviendo de algo |
| Cargando | **No existe.** Todo el estado vive en memoria y el filtrado es síncrono; una barra de progreso aquí sería teatro |
| Deshabilitado | **No existe** a nivel de fila (ver arriba). El disparador nunca se deshabilita |

**Comportamiento**

- **Apertura**: `Ctrl`+`K` o `/` desde cualquier punto, también con el foco dentro
  de un campo de texto, y al enfocar el disparador de la barra (§10.3). Con un
  diálogo modal abierto no hace nada (§7.4). El campo arranca **vacío**, con una
  sola excepción: si hay una búsqueda activa en el tablero, se abre con esa
  consulta escrita y **seleccionada entera**, de modo que escribir la sustituye y
  `Retroceso` la borra. Una consulta que no llegó a aplicarse al tablero no se
  recuerda.
- **Búsqueda difusa** sobre título y descripción de la tarea, nombre de lista y
  etiqueta de comando: coincidencia por subsecuencia sobre el texto normalizado
  sin acentos y sin distinguir mayúsculas —«info» encuentra «Informe» y «cafe»
  encuentra «café»—, ordenada por prefijo, luego por inicio de palabra, luego por
  subsecuencia suelta. Filtra con cada pulsación, sin espera ni botón de buscar.
- **Navegación**: `↑` `↓` mueven el resaltado y **envuelven** por los extremos;
  `Inicio` y `Fin` van a la primera y a la última fila; el foco no sale nunca del
  campo (`aria-activedescendant`). El cuerpo se desplaza para mantener visible la
  fila resaltada.
- **Cierre**: al ejecutar la acción principal, con `Esc` y al hacer clic en el
  velo. Siempre devuelve el foco a donde estaba antes de abrir; si era el
  disparador de la barra, este lo recibe **sin volver a abrirse** (§10.3).
  Cambiar de pestaña no la cierra: al volver, sigue como estaba.
- **Anuncio**: región `polite` con el recuento («8 resultados», «Sin
  resultados») que también se ve en el pie, para que la reacción sea visible y
  audible.
- **Roles**: contenedor `role="dialog"` `aria-modal="true"` con nombre «Paleta de
  comandos»; campo `role="combobox"` con `aria-expanded` y `aria-controls`; lista
  `role="listbox"`; grupos `role="group"` con `aria-labelledby` a su rótulo; filas
  `role="option"` con `aria-selected`.

#### 10.19.4 Completar una tarea desde la paleta

Sobre un resultado de tarea hay dos intenciones distintas —**ir a ella** y
**completarla**— y hay que elegir cómo conviven.

**Decisión: una sola fila por tarea, con acción principal y acción secundaria.**
`Enter` va a la tarea; `Ctrl`+`Enter` la completa (o la reabre si ya estaba
completada) **sin cerrar la paleta**. Mientras la fila resaltada es una tarea, el
pie lo dice con todas las letras: «`↑` `↓` navegar · `Enter` ir a la tarea ·
`Ctrl` `Enter` completar · `Esc` cerrar». Es el modelo de Raycast y de Linear:
una fila, una acción principal, las secundarias anunciadas en el pie.

Por qué así, y qué se descartó:

- **Dos filas por tarea («Ir a X» / «Completar X»)**: duplica la lista, obliga a
  leer el mismo título dos veces y hace que buscar «informe» devuelva el doble de
  resultados. Descartado.
- **Un comando en dos pasos («Completar una tarea…» y luego elegirla)**: es
  idiomático, pero cuesta una pulsación más y obliga a decidir la acción antes de
  saber si la tarea existe, que es al revés de como se piensa. Se descarta porque
  el pie contextual ya hace visible la acción secundaria justo cuando aplica.
- **Que `Enter` complete y algo secundario lleve a la tarea**: sería la única
  paleta del mundo en la que `Enter` sobre un resultado no lo abre. Descartado.

**Desvío consciente de P8** (la paleta se cierra al ejecutar): `Ctrl`+`Enter`
**no** cierra, porque completar varias tareas seguidas es el caso de uso real y
volver a abrir y reescribir la consulta por cada una sería un castigo. Para que
no parezca que no ha pasado nada, la acción tiene tres reacciones visibles a la
vez: la fila cambia al aspecto de completada en el sitio, el contexto de la fila
pasa a «Completadas», y sube el aviso breve «Tarea completada · **Deshacer**»
(§11.0.1), que se dibuja **por encima** de la paleta para que su «Deshacer» sea
alcanzable con el ratón y con `Tab`.

### 10.20 Deshacer y rehacer

Cualquier acción sobre los datos —crear, editar, completar, mover, eliminar,
vaciar— se puede deshacer. Lo que **no** entra en el historial es lo que se ve:
filtros, búsqueda, lista activa y tema. Deshacer nunca cambia lo que estás
mirando, solo lo que hiciste.

**Botones de la barra superior** (escritorio `md`+): dos botones de solo icono
—flecha curva antihoraria y horaria, **20 px**, área visual 36×36, área táctil
44×44 garantizada—, agrupados con 4 px entre ellos y 12 px del resto, a la
izquierda del disparador de búsqueda y comandos (§10.7).

| Estado | Aspecto y texto |
|---|---|
| Reposo | Icono `ink-muted`, sin fondo (variante sutil) |
| Hover | Velo `hover`, icono `ink` |
| Foco | Anillo global (§7.1) |
| Activo | Velo `press` |
| Deshabilitado | Opacidad 45 %, `cursor: not-allowed`, `aria-disabled="true"` —anunciable, no saltado por el `Tab`— y el motivo en el título emergente: «No hay nada que deshacer» / «No hay nada que rehacer» |
| Cargando | **No existe**: la operación es síncrona |

- **Título emergente y nombre accesible nombran la acción concreta**: «Deshacer:
  mover tarea (`Ctrl` `Z`)», «Rehacer: eliminar tarea (`Ctrl` `Shift` `Z`)». El
  nombre sale de la etiqueta en español de la mutación; las teclas viven solo en
  el título emergente (§7.5).
- **En móvil** no ocupan la barra: son las dos primeras filas del menú `⋯`, con
  el mismo texto («Deshacer: mover tarea») y su `kbd` a la derecha (§10.9).
- No hay lista desplegable de historial ni contador de pasos: no está construido
  y por tanto no se insinúa.

**Qué se ve al deshacer o rehacer**

- Aviso breve **sin acción**: «Se deshizo: mover tarea» / «Se rehizo: eliminar
  tarea». No lleva «Deshacer» dentro, porque el camino de vuelta es el botón de
  rehacer, que acaba de habilitarse a la vista.
- La tarjeta afectada se desplaza a la vista y recibe el destello `primary-soft`
  de 1200 ms. Si la acción tocó muchas tarjetas (eliminar una lista, vaciar el
  tablero) no hay destello individual: hablan el aviso y los contadores.
- **Si lo restaurado no es visible con los filtros o la lista activos**, el aviso
  lo dice para que la acción no parezca perdida: «Se deshizo: eliminar tarea · No
  coincide con los filtros activos».
- El foco no se mueve: deshacer no debe robar el sitio al teclado.
- El historial guarda las **50 últimas acciones** y vive solo mientras la pestaña
  está abierta; al recargar, los dos botones arrancan deshabilitados con su
  motivo en el título emergente.

**Acciones destructivas.** Eliminar una tarea, eliminar una lista y vaciar el
tablero pasan a mostrar aviso breve con «Deshacer», en la misma ranura y con el
mismo formato que ya usa completar (§10.12, §11.0.1). Textos exactos:

| Acción | Aviso |
|---|---|
| Eliminar tarea | Tarea «Preparar informe» eliminada · **Deshacer** |
| Eliminar lista | Lista «Trabajo» y sus 7 tareas eliminadas · **Deshacer** |
| Vaciar el tablero | Tablero vaciado: 12 tareas eliminadas · **Deshacer** |

Sigue habiendo confirmación previa (§11.3): el aviso es la red de seguridad, no
el sustituto de la pregunta. La cita del título se recorta a una línea (§10.18) y
«Deshacer» hereda la tinta del aviso; nunca se pinta en violeta.

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

### 11.0.1 Modelo de estado: una sola verdad, la columna

Una tarea tiene **un solo estado** (`Por hacer`, `En progreso`, `Completada`) y
la columna en la que está **es** ese estado (K2). Completar una tarea no es
marcar una propiedad aparte: es moverla a «Completadas».

De ahí la regla dura: **la tarjeta no lleva ningún control que declare el estado
por su cuenta**. La casilla que tuvo antes duplicaba la verdad de la columna y,
al marcarla, la tarjeta saltaba a otra columna sin que nada lo anunciara; se
retira. Las formas de cambiar el estado son estas y todas dejan a la vista dónde
acabó la tarjeta:

| Camino | Qué hace | Por qué existe |
|---|---|---|
| **Arrastrar a otra columna** | La tarea pasa al estado de esa columna, en la posición donde se suelte | Es el gesto directo: el destino se elige mirándolo (§8) |
| **«Completar» / «Reabrir»** del menú de la tarjeta | Lleva la tarea a «Completadas», o la devuelve al inicio de «Por hacer» | Completar es la acción más frecuente; merece una pulsación desde cualquier columna, sin arrastrar |
| **«Mover a ›»** del menú | Lleva la tarea a cualquiera de los otros dos estados | El camino explícito, y el único que llega a «En progreso» en un paso sin ratón |
| **`Espacio`** sobre la tarjeta enfocada | Igual que «Completar» / «Reabrir» | El equivalente de teclado de la acción más frecuente |

**Aviso breve al completar y al reabrir.** Cambiar a «Completadas» o salir de
ahí mueve la tarjeta fuera de donde el usuario estaba mirando, así que **por
cualquiera de los cuatro caminos —arrastre incluido— aparece el aviso** (§10.12):

> Tarea completada · **Deshacer**
>
> Tarea reabierta en «Por hacer» · **Deshacer**

- «Deshacer» revierte la acción entera, incluida la posición exacta que la tarea
  tenía en su columna de origen.
- Los movimientos que **no** entran ni salen de «Completadas» (por ejemplo, de
  «Por hacer» a «En progreso») no muestran aviso: el destello de la tarjeta al
  soltar (§8.2) y la orden del menú, que nombra el destino, ya lo dicen todo.
- El aspecto de tarea completada (marca de verificación, tachado, opacidad) llega
  a la vez que el movimiento; el color nunca va solo (§3.5).

### 11.1 Tablero (`/tablero` y `/tablero/:listId`)

**Propósito**: ver, filtrar y mover las tareas. Es la aplicación.

**Contenido, de arriba abajo**

1. **Barra superior** con marca, deshacer/rehacer, disparador de búsqueda y
   comandos, «Nueva tarea», tema, atajos y menú.
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

Foco inicial declarado: el campo «Título» (excepción de §10.10; el diálogo se
abre para escribir). Título del diálogo: «Nueva tarea» o «Editar tarea». Pie: «Cancelar» (secundario)
y «Crear tarea» / «Guardar cambios» (primario, con `kbd` `Ctrl` `Enter`). Al
editar, aparece además en el pie a la izquierda «Eliminar» en peligro sutil.
Bajo el pie, en `text-2xs` `ink-subtle`: «Creada el 12 jul 2026 · Editada hace
2 h» — con año, siempre.

**Detalle de la tarea**, 520 px: abrir una tarjeta (K9) muestra primero el
detalle, no el formulario. Es una lectura cómoda —descripción íntegra, estado,
prioridad, lista, fecha límite y marcas de tiempo— con las acciones al pie:
«Eliminar», «Duplicar», «Completar»/«Reabrir» y «Editar», que abre este mismo
diálogo en modo edición.

Se separa la lectura de la edición porque son dos intenciones distintas y la
frecuente es leer: abrir una tarjeta para consultar un detalle no debería dejar
al usuario dentro de un formulario con el texto seleccionado y el riesgo de
cambiarlo sin querer. Es lo que hacen Trello y Jira, donde la tarjeta abre una
ficha y cada campo se edita al pulsarlo.

El título y la descripción se rigen por §10.18: el texto se parte, respeta el
relleno y jamás produce desplazamiento horizontal dentro del panel; si la
descripción es larga, el que se desplaza es el cuerpo del diálogo, en vertical.

**Lista (crear/renombrar)**, 420 px: nombre (1–60) y selector de color con seis
muestras de 28 px, marcadas con verificación y nombre accesible («Color azul»).
Foco inicial declarado: el campo «Nombre».

**Confirmaciones**, 420 px: eliminar tarea, eliminar lista y vaciar el tablero.
Cada una dice exactamente qué se pierde: «Se eliminarán la lista “Trabajo” y sus
7 tareas.» / «Se eliminarán las 12 tareas del tablero y quedará una lista vacía.»
Botón de peligro con la acción nombrada y **foco inicial declarado en
«Cancelar»**, para que un `Enter` de inercia no borre nada (§10.10).

**Hoja de atajos** (`?`), 520 px: tabla de dos columnas agrupada por ámbito, con
la descripción a la izquierda y las teclas a la derecha en `kbd` (§10.14). Es el
lugar donde se aprenden los atajos; en la interfaz nunca van estampados sobre un
botón, solo en el título emergente del control (§7.5). **Solo lista atajos que ya
funcionan** —los de fase 1 de §7.4—, en cuatro grupos:

| Grupo | Atajos |
|---|---|
| Global | `Ctrl` `K` paleta de comandos · `/` buscar (abre la misma paleta) · `Ctrl` `Z` deshacer · `Ctrl` `Shift` `Z` rehacer · `N` nueva tarea · `L` nueva lista · `T` cambiar de tema · `?` esta hoja · `Esc` cerrar |
| Tablero | `↑` `↓` `←` `→` navegar · `Enter` abrir el detalle · `Espacio` completar o reabrir · `Supr` eliminar |
| Paleta de comandos | `↑` `↓` navegar · `Enter` ejecutar · `Ctrl` `Enter` completar la tarea resaltada · `Esc` cerrar |
| Diálogo | `Ctrl` `Enter` guardar · `Esc` cerrar |

En macOS se pinta `⌘` en lugar de `Ctrl` (§7.4). Todavía no aparece `Ctrl`+
flechas para mover tarjetas: aún no existe. La hoja no tiene ningún campo, así
que sigue la regla general de §10.10: el foco inicial va a su título y la tabla
se ve desde la primera fila.

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
- **Etiquetas en español y explícitas**: «Buscar o ejecutar un comando», «Nueva tarea»,
  «Filtrar por prioridad», «Abrir el menú de la tarea {título}», «Eliminar la
  lista {nombre}», «Mover la tarea {título}».
- **Regiones activas**: `polite` para el resumen de resultados y los contadores;
  `assertive` para errores y para los anuncios de arrastre; nunca dos anuncios a
  la vez.
- **Foco**: visible siempre (§7.1), atrapado en diálogos y cajón, llevado al
  título del diálogo al abrir salvo excepción declarada (§10.10), devuelto al
  disparador al cerrar, y nunca perdido al eliminar un elemento —al borrar una
  tarjeta el foco pasa a la siguiente, o a la anterior si era la última, o al
  encabezado de la columna si era la única.
- **Movimiento**: `prefers-reduced-motion` respetado globalmente (§6.3).
- **Nada depende solo del color** (§3.5) y nada depende solo del puntero:
  mover una tarea entre columnas se puede hacer desde su menú.
- **Zoom**: la interfaz aguanta 200 % sin desplazamiento horizontal en móvil;
  las columnas se apilan por debajo de 768 px equivalentes, que es lo que ocurre
  al ampliar. El texto del usuario nunca abre desplazamiento horizontal (§10.18).

---

## 14. Lo que todavía no existe

No se construye ahora y **no aparece en la interfaz** hasta que exista: ni
deshabilitado, ni como «próximamente». Se anota aquí para que el sistema actual
lo admita sin rediseño.

- **Mover tarjetas con `Ctrl`+flechas** (§7.4, fase 2): el modelo ya lo soporta
  —es la misma llamada que el arrastre— y se anunciará por región activa igual
  que él (§8.4). Hasta entonces, el camino sin ratón es «Mover a ›» del menú de
  la tarjeta.
- **Instalación y uso sin conexión**: además de los iconos del manifiesto (§1.3),
  hará falta un aviso de «hay una versión nueva» como banner (§10.13). Se
  especificará cuando se construya.

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
| 10 | El aviso de completar y reabrir lleva «Deshacer» | Aviso sin acción | Ese cambio mueve la tarjeta fuera de la vista del usuario; el camino de vuelta tiene que estar donde se mira. El mecanismo de deshacer existe desde el primer día |
| 11 | Las tres columnas son destinos de arrastre conectados entre sí | Arrastrar solo dentro de la columna | Mover una tarjeta de columna es *la* interacción de un tablero; sin ella, las columnas son decoración (K3) |
| 12 | La tarjeta no lleva casilla de completar | Casilla como atajo a «Completadas» | La columna ya expresa el estado. Dos portadores de la misma verdad se contradicen, y una casilla que hace saltar la tarjeta de columna no se explica sola (K2) |
| 13 | Completar tiene su entrada propia en el menú de la tarjeta | Obligar a arrastrar o a usar «Mover a ›» | Es la acción más frecuente; quitarle la casilla no puede significar encarecerla |
| 14 | Corte de palabra en todo texto escrito por el usuario | Recortar con elipsis y aceptar el desbordamiento | Una sola palabra larga no puede romper un diálogo ni abrir desplazamiento horizontal (K16) |
| 15 | Una fila por tarea en la paleta: `Enter` va a ella, `Ctrl`+`Enter` la completa | Dos filas por tarea; un comando en dos pasos «Completar una tarea…» | Dos filas duplican la lista y el título; el comando en dos pasos obliga a elegir la acción antes de saber si la tarea existe. La acción secundaria se anuncia en el pie justo cuando aplica (§10.19.4) |
| 16 | La acción secundaria de la paleta no la cierra | Cerrar siempre al ejecutar, como manda la convención | Completar varias tareas seguidas es el caso real; reabrir y reescribir la consulta cada vez sería un castigo. A cambio, la acción deja tres señales visibles a la vez |
| 17 | El buscador de la barra **es** el disparador de la paleta: enfocarlo la abre | Un botón «Comandos» separado junto al buscador | Dos controles contiguos para la misma intención —escribir para encontrar o hacer algo— obligan a elegir sin criterio, y una paleta no se descubre por un botón dedicado sino desde el campo de búsqueda, que es el control con más presencia de la barra. Es el patrón de Linear y Notion (§10.3) |
| 18 | Deshacer y rehacer viven en el menú `⋯` en móvil, no en la barra | Dos botones más en la barra móvil | La barra ya lleva cinco controles; dos flechas más dejarían áreas táctiles pegadas por debajo del mínimo |
| 19 | El aviso de «Se deshizo: X» no ofrece «Deshacer» | Encadenar deshacer dentro del propio aviso | El camino de vuelta es el botón de rehacer, que se acaba de habilitar a la vista; un «Deshacer» dentro de un aviso de deshacer no se entiende |
| 20 | El foco inicial de un diálogo va a su título, con las excepciones declaradas | Dejarlo al primer elemento enfocable | Sin campos previos, el navegador acababa en el último botón del pie y el panel se abría desplazado hasta abajo, como si empezara por el final; el título, además, hace que el lector de pantalla anuncie qué diálogo se abrió. La regla vive en el componente compartido (§10.10) |
| 21 | El campo de la paleta marca el foco con un cambio de borde, no con el anillo | Mantener el anillo global también ahí | Se autoenfoca al abrir y el anillo quedaba dibujado sobre el borde del panel: dos marcos concéntricos para un único control. Es una excepción puntual; el resto de la aplicación, incluida la fila resaltada de la paleta, conserva su indicador (§7.1) |
