/**
 * Suite de humo del portafolio — adaptada a este proyecto.
 *
 * Comprueba mecánicamente los defectos que se repiten proyecto a proyecto y
 * que una captura estática no revela. Se escribe una vez, corre en CI para
 * siempre, y no depende de que nadie recuerde revisarlo.
 */
import { expect, test, type Page } from '@playwright/test';

const BASE_URL = process.env.SMOKE_BASE_URL ?? 'http://localhost:4300';

/** Rutas públicas que la app expone. Enumerarlas TODAS. */
const ROUTES = ['/', '/tablero', '/ruta-que-no-existe'];

const VIEWPORTS = {
  movil: { width: 390, height: 844 },
  escritorio: { width: 1280, height: 800 },
};

async function irA(page: Page, ruta: string) {
  const errores: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errores.push(m.text()));
  page.on('pageerror', (e) => errores.push(String(e)));
  await page.goto(`${BASE_URL}${ruta}`, { waitUntil: 'networkidle' });
  return errores;
}

for (const [nombre, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`${nombre} (${viewport.width}px)`, () => {
    test.use({ viewport });

    for (const ruta of ROUTES) {
      test(`${ruta} — sin errores de consola ni contenido vacío`, async ({ page }) => {
        const errores = await irA(page, ruta);
        expect(errores, `errores de consola en ${ruta}`).toEqual([]);
        // Una página sin encabezado suele ser una pantalla en blanco o un fallo de render.
        await expect(page.locator('h1, h2, [role="heading"]').first()).toBeVisible();
      });

      test(`${ruta} — la página no se desplaza en horizontal`, async ({ page }) => {
        await irA(page, ruta);
        const desborde = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          ancho: window.innerWidth,
          culpables: [...document.querySelectorAll('*')]
            .filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1)
            .slice(0, 5)
            .map(
              (e) =>
                `${e.tagName.toLowerCase()}.${(e.className || '').toString().slice(0, 40)}` +
                ` (${Math.round(e.getBoundingClientRect().width)}px)`,
            ),
        }));
        expect(
          desborde.scroll,
          `la página desborda a la derecha en ${ruta}: ${desborde.culpables.join(', ')}`,
        ).toBeLessThanOrEqual(desborde.ancho + 1);
      });

      test(`${ruta} — los campos muestran lo que se escribe`, async ({ page }) => {
        await irA(page, ruta);
        const campos = page.locator(
          'input:not([type=hidden]):not([type=checkbox]):not([type=radio]):visible, textarea:visible',
        );
        for (let i = 0; i < (await campos.count()); i++) {
          const campo = campos.nth(i);
          await campo.fill('prueba visible 12345');
          await expect(campo).toHaveValue('prueba visible 12345');
          // El texto escrito debe caber en el campo, no quedar recortado tras su borde.
          const caja = await campo.boundingBox();
          expect(caja, 'el campo debe ser visible al escribir').not.toBeNull();
          // Un campo que se encoge al recibir el foco deja al usuario escribiendo a ciegas.
          expect(caja!.width, 'campo demasiado estrecho para leer lo escrito').toBeGreaterThan(120);
          expect(caja!.x + caja!.width).toBeLessThanOrEqual(viewport.width + 1);
        }
      });

      test(`${ruta} — los menús y desplegables caben en pantalla`, async ({ page }) => {
        await irA(page, ruta);
        // Solo disparadores declarados: evita clics ciegos que navegan o abren
        // formularios y dejan la página en un estado imprevisible.
        const total = Math.min(await page.locator('[aria-haspopup]:visible').count(), 6);
        const problemas: string[] = [];
        for (let i = 0; i < total; i++) {
          // Recargar entre disparadores mantiene cada comprobación independiente.
          if (i > 0) await irA(page, ruta);
          const disparador = page.locator('[aria-haspopup]:visible').nth(i);
          const etiqueta = (await disparador.getAttribute('aria-label')) ?? `disparador ${i + 1}`;
          await disparador.click({ timeout: 5000 }).catch(() => {});
          const panel = page.locator('[role="menu"], [role="dialog"], [role="listbox"]').first();
          if (!(await panel.isVisible({ timeout: 2000 }).catch(() => false))) continue;
          const caja = await panel.boundingBox();
          if (caja) {
            if (caja.x < -1) problemas.push(`«${etiqueta}» se sale por la izquierda`);
            if (caja.x + caja.width > viewport.width + 1)
              problemas.push(`«${etiqueta}» se sale por la derecha`);
            if (caja.y + caja.height > viewport.height + 1)
              problemas.push(`«${etiqueta}» se corta por abajo`);
          }
          // Un menú puede caber en el viewport y aun así ser inservible si un
          // ancestro con overflow lo recorta: cada opción debe ser alcanzable.
          const opciones = panel.locator('[role="menuitem"], button, a');
          for (let j = 0; j < (await opciones.count()); j++) {
            const opcion = opciones.nth(j);
            const texto = ((await opcion.innerText().catch(() => '')) || `opción ${j + 1}`)
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 30);
            const alcanzable = await opcion
              .evaluate((el) => {
                const r = el.getBoundingClientRect();
                if (r.width === 0 || r.height === 0) return false;
                const x = r.x + r.width / 2;
                const y = r.y + r.height / 2;
                if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return false;
                const encima = document.elementFromPoint(x, y);
                return el === encima || el.contains(encima) || encima?.contains(el) || false;
              })
              .catch(() => false);
            if (!alcanzable)
              problemas.push(`«${etiqueta}»: la opción «${texto}» queda tapada o recortada`);
          }
          await page.keyboard.press('Escape').catch(() => {});
        }
        expect(problemas, problemas.join('; ')).toEqual([]);
      });
    }
  });
}

test.describe('tablero', () => {
  test.use({ viewport: VIEWPORTS.escritorio });

  test('el panel de listas está a la vista en escritorio, sin abrir nada', async ({ page }) => {
    await irA(page, '/tablero');

    // En escritorio no hay botón que abra el cajón: si no se ve solo, no hay forma de llegar.
    const panel = page.locator('.sidebar');
    await expect(panel).toBeVisible();
    await expect(panel.getByRole('button', { name: /todas las tareas/i })).toBeVisible();

    const caja = await panel.boundingBox();
    expect(caja!.x + caja!.width, 'el panel debe quedar dentro de la pantalla').toBeGreaterThan(0);
  });

  test('abrir una tarjeta muestra el detalle completo de la tarea', async ({ page }) => {
    await irA(page, '/tablero');

    const tarjeta = page.locator('.task-card').first();
    const titulo = (await tarjeta.locator('h3').innerText()).trim();
    await tarjeta.click();

    const detalle = page.locator('[role="dialog"]:visible').first();
    await expect(detalle).toBeVisible();
    await expect(detalle).toContainText(titulo);
  });

  test('completar desde la tarjeta avisa y permite deshacer', async ({ page }) => {
    await irA(page, '/tablero');

    const pendiente = page.locator('.task-card:not(.task-card--done)').first();
    const titulo = (await pendiente.locator('h3').innerText()).trim();
    await pendiente.locator('[role="checkbox"]').click();

    const aviso = page.getByRole('status').filter({ hasText: 'Tarea completada' });
    await expect(aviso).toBeVisible();

    await aviso.getByRole('button', { name: /deshacer/i }).click();
    await expect(page.locator('.task-card', { hasText: titulo }).first()).not.toHaveClass(
      /task-card--done/,
    );
  });

  test('el error del título no aparece antes de intentar enviar', async ({ page }) => {
    await irA(page, '/tablero');
    await page
      .getByRole('button', { name: /nueva tarea/i })
      .first()
      .click();

    const dialogo = page.locator('[role="dialog"]:visible').first();
    const titulo = dialogo.locator('#task-title');
    await titulo.click();
    await dialogo.locator('#task-description').click();

    await expect(dialogo.getByText(/el título es obligatorio/i)).toBeHidden();

    await dialogo.getByRole('button', { name: /crear tarea/i }).click();
    await expect(dialogo.getByText(/el título es obligatorio/i)).toBeVisible();

    // Desde el primer intento la validación va en vivo.
    await titulo.fill('Con título');
    await expect(dialogo.getByText(/el título es obligatorio/i)).toBeHidden();
  });

  test('se puede reordenar arrastrando en la vista de todas las tareas', async ({ page }) => {
    await irA(page, '/tablero');

    const columna = page.locator('.task-column').first();
    const tarjetas = columna.locator('.task-card');
    await expect(tarjetas.nth(1)).toBeVisible();

    const primeroAntes = (await tarjetas.nth(0).locator('h3').innerText()).trim();
    const asa = tarjetas.nth(1).locator('.task-card__handle');
    await expect(asa, 'el asa de arrastre debe existir en la vista por defecto').toBeVisible();

    const origen = await asa.boundingBox();
    const destino = await tarjetas.nth(0).boundingBox();
    await page.mouse.move(origen!.x + origen!.width / 2, origen!.y + origen!.height / 2);
    await page.mouse.down();
    await page.mouse.move(destino!.x + destino!.width / 2, destino!.y - 8, { steps: 20 });
    await page.mouse.up();

    await expect(tarjetas.nth(0).locator('h3')).not.toHaveText(primeroAntes);

    // El nuevo orden tiene que sobrevivir a una recarga, no solo verse en pantalla.
    const primeroDespues = (await tarjetas.nth(0).locator('h3').innerText()).trim();
    await page.reload({ waitUntil: 'networkidle' });
    await expect(
      page.locator('.task-column').first().locator('.task-card').nth(0).locator('h3'),
    ).toHaveText(primeroDespues);
  });
});
