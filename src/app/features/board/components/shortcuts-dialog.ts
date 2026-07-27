import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Button } from '../../../shared/ui/button';
import { Dialog } from '../../../shared/ui/dialog';

interface ShortcutGroup {
  readonly scope: string;
  readonly entries: readonly { readonly keys: readonly string[]; readonly action: string }[];
}

/** Only lists shortcuts that already work; phase 2 bindings stay out until they exist. */
const SHORTCUT_GROUPS: readonly ShortcutGroup[] = [
  {
    scope: 'General',
    entries: [
      { keys: ['/'], action: 'Enfocar el buscador' },
      { keys: ['N'], action: 'Nueva tarea' },
      { keys: ['L'], action: 'Nueva lista' },
      { keys: ['T'], action: 'Cambiar entre claro y oscuro' },
      { keys: ['?'], action: 'Abrir esta hoja de atajos' },
      { keys: ['Esc'], action: 'Cerrar el diálogo o vaciar el buscador' },
    ],
  },
  {
    scope: 'Tablero',
    entries: [
      { keys: ['↑', '↓'], action: 'Tarjeta anterior o siguiente' },
      { keys: ['←', '→'], action: 'Columna anterior o siguiente' },
      { keys: ['Inicio', 'Fin'], action: 'Primera o última tarjeta de la columna' },
      { keys: ['Enter'], action: 'Editar la tarea enfocada' },
      { keys: ['Espacio'], action: 'Completar o reabrir la tarea enfocada' },
      { keys: ['Supr'], action: 'Eliminar la tarea enfocada' },
    ],
  },
  {
    scope: 'Formulario',
    entries: [{ keys: ['Ctrl', 'Enter'], action: 'Guardar' }],
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

  protected readonly groups = SHORTCUT_GROUPS;
}
