import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { modifierKeyLabel } from '../../../core/util/platform';
import { Button } from '../../../shared/ui/button';
import { Dialog } from '../../../shared/ui/dialog';
import { nextDomId } from '../../../shared/ui/dom-id';

interface ShortcutGroup {
  readonly scope: string;
  readonly entries: readonly { readonly keys: readonly string[]; readonly action: string }[];
}

/** 'Ctrl' is a placeholder substituted with the real modifier key at render time. */
const SHORTCUT_GROUPS: readonly ShortcutGroup[] = [
  {
    scope: 'Global',
    entries: [
      { keys: ['Ctrl', 'K'], action: 'Abrir la paleta de comandos' },
      { keys: ['Ctrl', 'Z'], action: 'Deshacer' },
      { keys: ['Ctrl', 'Shift', 'Z'], action: 'Rehacer' },
      { keys: ['/'], action: 'Abrir la paleta de comandos' },
      { keys: ['N'], action: 'Nueva tarea' },
      { keys: ['L'], action: 'Nueva lista' },
      { keys: ['T'], action: 'Cambiar entre claro y oscuro' },
      { keys: ['?'], action: 'Abrir esta hoja de atajos' },
      { keys: ['Esc'], action: 'Cerrar diálogo, paleta o menú' },
    ],
  },
  {
    scope: 'Tablero',
    entries: [
      { keys: ['↑', '↓', '←', '→'], action: 'Navegar entre tarjetas y columnas' },
      { keys: ['Enter'], action: 'Abrir el detalle de la tarea enfocada' },
      { keys: ['Espacio'], action: 'Completar o reabrir la tarea enfocada' },
      { keys: ['Supr'], action: 'Eliminar la tarea enfocada' },
    ],
  },
  {
    scope: 'Paleta de comandos',
    entries: [
      { keys: ['↑', '↓'], action: 'Mover el resaltado entre resultados' },
      { keys: ['Enter'], action: 'Ejecutar la fila resaltada' },
      { keys: ['Ctrl', 'Enter'], action: 'Completar o reabrir la tarea resaltada, sin cerrar' },
      { keys: ['Esc'], action: 'Cerrar' },
    ],
  },
  {
    scope: 'Diálogo',
    entries: [
      { keys: ['Ctrl', 'Enter'], action: 'Guardar' },
      { keys: ['Esc'], action: 'Cerrar' },
    ],
  },
];

@Component({
  selector: 'app-shortcuts-dialog',
  imports: [Dialog, Button],
  templateUrl: './shortcuts-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShortcutsDialog {
  readonly open = input.required<boolean>();
  readonly closed = output<void>();

  protected readonly titleId = nextDomId('shortcuts-title');
  private readonly modKey = modifierKeyLabel();

  protected readonly groups = SHORTCUT_GROUPS.map((group) => ({
    scope: group.scope,
    entries: group.entries.map((entry) => ({
      action: entry.action,
      keys: entry.keys.map((key) => (key === 'Ctrl' ? this.modKey : key)),
    })),
  }));
}
