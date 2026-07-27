import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tablero' },
  {
    path: 'tablero',
    title: 'Tareas',
    loadComponent: () => import('./features/board/board-page').then((m) => m.BoardPage),
  },
  {
    path: 'tablero/:listId',
    title: 'Tareas',
    loadComponent: () => import('./features/board/board-page').then((m) => m.BoardPage),
  },
  {
    path: '**',
    title: 'Página no encontrada · Tareas',
    loadComponent: () => import('./features/not-found/not-found-page').then((m) => m.NotFoundPage),
  },
];
