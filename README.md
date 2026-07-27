# Tareas

Gestor de tareas estilo kanban con foco en la experiencia de teclado y en el
detalle de la interfaz. Aplicación web sin backend: los datos viven en el
navegador.

## Stack

- Angular 22 (standalone, signals, zoneless, control flow `@if` / `@for`)
- TypeScript en modo estricto
- Tailwind CSS 4
- Angular CDK para arrastrar y soltar
- Vitest para los tests unitarios

## Requisitos

- Node.js 24.15 o superior
- pnpm 11

## Puesta en marcha

```bash
pnpm install
pnpm start
```

La aplicación queda disponible en `http://localhost:4200/`.

## Comandos

| Comando | Descripción |
|---|---|
| `pnpm start` | Servidor de desarrollo con recarga automática |
| `pnpm build` | Compilación de producción en `dist/` |
| `pnpm test` | Tests unitarios |

## Documentación

- [ARCHITECTURE.md](ARCHITECTURE.md) — modelo de datos, estado y estructura
- [DESIGN.md](DESIGN.md) — identidad visual y sistema de diseño
