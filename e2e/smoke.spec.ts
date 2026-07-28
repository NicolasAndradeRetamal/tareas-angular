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

for (const [nombre, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`${nombre} — contenido largo`, () => {
    test.use({ viewport });

    test('una palabra muy larga no rompe ningún contenedor', async ({ page }) => {
      await irA(page, '/tablero');
      // Texto sin espacios: el caso que revienta cajas mal configuradas.
      // El título se queda por debajo de su límite de 120 caracteres a propósito:
      // aquí se prueba el corte de palabra, no la validación de longitud.
      const tituloLargo = 'Interminable'.repeat(9);
      const descripcionLarga = 'Interminable'.repeat(20);

      await page
        .getByRole('button', { name: /nueva tarea/i })
        .first()
        .click();
      const formulario = page.locator('[role="dialog"]:visible').first();
      await formulario.locator('#task-title').fill(tituloLargo);
      await formulario.locator('#task-description').fill(descripcionLarga);
      await formulario.getByRole('button', { name: /crear tarea/i }).click();
      await expect(formulario).toBeHidden();

      // Y el mismo texto en el detalle, que es donde se ve entero.
      await page.locator('.task-card', { hasText: 'Interminable' }).first().click();
      const detalle = page.locator('[role="dialog"]:visible').first();
      await expect(detalle).toBeVisible();

      // Se miden los elementos que llevan el texto, no los contenedores de
      // maquetación: los botones de icono amplían su área táctil con un
      // pseudo-elemento que desborda unos píxeles dentro del relleno, a propósito.
      const desbordes = await page.evaluate(() =>
        [...document.querySelectorAll('p, h1, h2, h3, span, time, li, td')]
          .filter((e) => {
            if (!e.textContent?.includes('Interminable')) return false;
            const est = getComputedStyle(e);
            if (est.overflowX === 'auto' || est.overflowX === 'scroll') return false;
            return e.scrollWidth > e.clientWidth + 1 && e.clientWidth > 0;
          })
          .slice(0, 5)
          .map(
            (e) =>
              `${e.tagName.toLowerCase()}.${(e.className || '').toString().slice(0, 30)} ` +
              `(${e.scrollWidth} > ${e.clientWidth})`,
          ),
      );
      expect(desbordes, `contenedores desbordados: ${desbordes.join(', ')}`).toEqual([]);

      // Ni el diálogo ni la página admiten desplazamiento lateral (DESIGN §10.18).
      const panel = detalle.locator('.dialog__panel');
      const panelDesborda = await panel.evaluate((e) => e.scrollWidth > e.clientWidth + 1);
      expect(panelDesborda, 'el detalle no debe desplazarse en horizontal').toBe(false);

      const scroll = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scroll).toBeLessThanOrEqual(viewport.width + 1);
    });
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

  test('las tarjetas no llevan casilla: el estado lo dice la columna', async ({ page }) => {
    await irA(page, '/tablero');
    await expect(page.locator('.task-card [role="checkbox"]')).toHaveCount(0);
  });

  test('completar desde el menú de la tarjeta avisa y permite deshacer', async ({ page }) => {
    await irA(page, '/tablero');

    const pendiente = page.locator('.task-card:not(.task-card--done)').first();
    const titulo = (await pendiente.locator('h3').innerText()).trim();
    await pendiente.locator('.task-card__menu-trigger').click();
    await page.getByRole('menuitem', { name: /^completar$/i }).click();

    const aviso = page.getByRole('status').filter({ hasText: 'Tarea completada' });
    await expect(aviso).toBeVisible();

    await aviso.getByRole('button', { name: /deshacer/i }).click();
    await expect(page.locator('.task-card', { hasText: titulo }).first()).not.toHaveClass(
      /task-card--done/,
    );
  });

  test('se arrastra una tarjeta de una columna a otra', async ({ page }) => {
    await irA(page, '/tablero');

    const origen = page.locator('.task-column').first();
    const destino = page.locator('.task-column').nth(1);
    const tarjeta = origen.locator('.task-card').first();
    const titulo = (await tarjeta.locator('h3').innerText()).trim();
    const enDestinoAntes = await destino.locator('.task-card').count();

    const asa = tarjeta.locator('.task-card__handle');
    const cajaAsa = await asa.boundingBox();
    const cajaDestino = await destino.locator('.task-column__body').boundingBox();

    await page.mouse.move(cajaAsa!.x + cajaAsa!.width / 2, cajaAsa!.y + cajaAsa!.height / 2);
    await page.mouse.down();
    // Pasos intermedios: sin ellos el CDK no llega a registrar la entrada en la columna.
    await page.mouse.move(cajaDestino!.x + cajaDestino!.width / 2, cajaDestino!.y + 20, {
      steps: 25,
    });
    // La columna bajo el puntero tiene que decir que es el destino.
    await expect(destino).toHaveClass(/task-column--drop-target/);
    await page.mouse.up();

    await expect(destino.locator('.task-card', { hasText: titulo })).toHaveCount(1);
    expect(await destino.locator('.task-card').count()).toBe(enDestinoAntes + 1);
    await expect(origen.locator('.task-card', { hasText: titulo })).toHaveCount(0);

    // El cambio de estado debe sobrevivir a una recarga, no solo verse en pantalla.
    // Se espera al guardado real: las aserciones de arriba pasan sobre el DOM que
    // mueve el CDK, que existe aunque el estado no haya cambiado.
    await expect
      .poll(() =>
        page.evaluate((t) => {
          const raw = localStorage.getItem('tareas-angular:board');
          const doc = raw
            ? (JSON.parse(raw) as { tasks: { title: string; status: string }[] })
            : null;
          return doc?.tasks.find((task) => task.title === t)?.status ?? null;
        }, titulo),
      )
      .toBe('in-progress');

    await page.reload({ waitUntil: 'networkidle' });
    await expect(
      page.locator('.task-column').nth(1).locator('.task-card', { hasText: titulo }),
    ).toHaveCount(1);
  });

  test('soltar fuera de las columnas no mueve nada', async ({ page }) => {
    await irA(page, '/tablero');

    const origen = page.locator('.task-column').first();
    const tarjeta = origen.locator('.task-card').first();
    const titulo = (await tarjeta.locator('h3').innerText()).trim();
    const cajaAsa = await tarjeta.locator('.task-card__handle').boundingBox();
    const barra = await page.locator('.topbar').boundingBox();

    await page.mouse.move(cajaAsa!.x + cajaAsa!.width / 2, cajaAsa!.y + cajaAsa!.height / 2);
    await page.mouse.down();
    // Hacia arriba, sobre la barra superior: no es una columna.
    await page.mouse.move(barra!.x + barra!.width / 2, barra!.y + barra!.height / 2, { steps: 25 });
    await page.mouse.up();

    await expect(origen.locator('.task-card', { hasText: titulo })).toHaveCount(1);
    await expect(page.locator('.task-column--drop-target')).toHaveCount(0);
  });

  test('«Esc» durante el arrastre cancela el movimiento', async ({ page }) => {
    await irA(page, '/tablero');

    const origen = page.locator('.task-column').first();
    const destino = page.locator('.task-column').nth(1);
    const tarjeta = origen.locator('.task-card').first();
    const titulo = (await tarjeta.locator('h3').innerText()).trim();

    const cajaAsa = await tarjeta.locator('.task-card__handle').boundingBox();
    const cajaDestino = await destino.locator('.task-column__body').boundingBox();

    await page.mouse.move(cajaAsa!.x + cajaAsa!.width / 2, cajaAsa!.y + cajaAsa!.height / 2);
    await page.mouse.down();
    await page.mouse.move(cajaDestino!.x + cajaDestino!.width / 2, cajaDestino!.y + 20, {
      steps: 25,
    });
    await page.keyboard.press('Escape');
    await page.mouse.up();

    await expect(origen.locator('.task-card', { hasText: titulo })).toHaveCount(1);
    await expect(destino.locator('.task-card', { hasText: titulo })).toHaveCount(0);
  });

  test('«Espacio» sobre una tarjeta avisa igual que el menú', async ({ page }) => {
    await irA(page, '/tablero');

    const tarjeta = page.locator('.task-card:not(.task-card--done)').first();
    await tarjeta.focus();
    await page.keyboard.press(' ');

    await expect(page.getByRole('status').filter({ hasText: 'Tarea completada' })).toBeVisible();
  });

  test('cambiar el color de una lista lo guarda', async ({ page }) => {
    await irA(page, '/tablero');

    // La primera fila es «Todas las tareas», que no es una lista y no tiene menú.
    const fila = page
      .locator('.sidebar li')
      .filter({ has: page.locator('.list-row__menu-trigger') })
      .first();
    await fila.hover();
    await fila.locator('.list-row__menu-trigger').click();
    await page.getByRole('menuitem', { name: /renombrar/i }).click();

    const dialogo = page.locator('[role="dialog"]:visible').first();
    // El quinto color de la paleta es «rose».
    await dialogo.locator('.color-picker__option').nth(4).click();
    await dialogo.getByRole('button', { name: /guardar/i }).click();
    await expect(dialogo).toBeHidden();

    await page.reload({ waitUntil: 'networkidle' });
    const guardado = await page.evaluate(() => {
      const raw = localStorage.getItem('tareas-angular:board');
      const doc = raw ? (JSON.parse(raw) as { lists: { color: string }[] }) : null;
      return doc?.lists[0]?.color ?? null;
    });
    expect(guardado, 'el color elegido debe persistir').toBe('rose');
  });

  test('arrastrar hasta «Completada» avisa y permite deshacer', async ({ page }) => {
    await irA(page, '/tablero');

    const origen = page.locator('.task-column').first();
    const completadas = page.locator('.task-column').nth(2);
    const tarjeta = origen.locator('.task-card').first();
    const titulo = (await tarjeta.locator('h3').innerText()).trim();

    const cajaAsa = await tarjeta.locator('.task-card__handle').boundingBox();
    const cajaDestino = await completadas.locator('.task-column__body').boundingBox();

    await page.mouse.move(cajaAsa!.x + cajaAsa!.width / 2, cajaAsa!.y + cajaAsa!.height / 2);
    await page.mouse.down();
    await page.mouse.move(cajaDestino!.x + cajaDestino!.width / 2, cajaDestino!.y + 20, {
      steps: 25,
    });
    await page.mouse.up();

    const aviso = page.getByRole('status').filter({ hasText: 'Tarea completada' });
    await expect(aviso).toBeVisible();

    await aviso.getByRole('button', { name: /deshacer/i }).click();
    await expect(origen.locator('.task-card', { hasText: titulo })).toHaveCount(1);
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

test.describe('paleta de comandos', () => {
  test.use({ viewport: VIEWPORTS.escritorio });

  test('Ctrl+K la abre desde cualquier sitio, incluso con el buscador enfocado', async ({
    page,
  }) => {
    await irA(page, '/tablero');
    await page.locator('.topbar__search-input').click();

    await page.keyboard.press('Control+K');

    const paleta = page.getByRole('dialog', { name: /paleta de comandos/i });
    await expect(paleta).toBeVisible();
    await expect(paleta.locator('.cmdpalette__input')).toBeFocused();
  });

  test('Esc la cierra y devuelve el foco a donde estaba', async ({ page }) => {
    await irA(page, '/tablero');
    const disparador = page.getByRole('button', { name: /^comandos$/i });
    await disparador.focus();
    await page.keyboard.press('Enter');

    const paleta = page.getByRole('dialog', { name: /paleta de comandos/i });
    await expect(paleta).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(paleta).toBeHidden();
    await expect(disparador).toBeFocused();
  });

  test('filtra mientras se escribe y salta a la tarea con Enter', async ({ page }) => {
    await irA(page, '/tablero');
    const tarjeta = page.locator('.task-card').first();
    const titulo = (await tarjeta.locator('h3').innerText()).trim();

    await page.keyboard.press('Control+K');
    const paleta = page.getByRole('dialog', { name: /paleta de comandos/i });
    // "Crear la tarea…" también contiene cualquier subcadena de la consulta.
    await paleta.locator('.cmdpalette__input').fill(titulo);

    const fila = paleta
      .locator('[role="option"]')
      .filter({ hasText: titulo })
      .filter({ hasNotText: 'Crear la tarea' });
    await expect(fila).toBeVisible();
    await fila.click();

    await expect(paleta).toBeHidden();
    const detalle = page.locator('[role="dialog"]:visible').first();
    await expect(detalle).toContainText(titulo);
  });

  test('Ctrl+Enter completa la tarea resaltada sin cerrar la paleta', async ({ page }) => {
    await irA(page, '/tablero');
    const pendiente = page.locator('.task-card:not(.task-card--done)').first();
    const titulo = (await pendiente.locator('h3').innerText()).trim();

    await page.keyboard.press('Control+K');
    const paleta = page.getByRole('dialog', { name: /paleta de comandos/i });
    await paleta.locator('.cmdpalette__input').fill(titulo.slice(0, 8));
    await page.waitForTimeout(50);

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Control+Enter');

    await expect(paleta).toBeVisible();
    const aviso = page.getByRole('status').filter({ hasText: 'Tarea completada' });
    await expect(aviso).toBeVisible();
  });

  test('crea una tarea con el texto escrito cuando nada coincide', async ({ page }) => {
    await irA(page, '/tablero');
    const titulo = `Tarea nueva ${Date.now()}`;

    await page.keyboard.press('Control+K');
    const paleta = page.getByRole('dialog', { name: /paleta de comandos/i });
    await paleta.locator('.cmdpalette__input').fill(titulo);
    await expect(paleta.getByRole('option').first()).toContainText(titulo);
    await page.keyboard.press('Enter');

    const formulario = page.locator('[role="dialog"]:visible').first();
    await expect(formulario.locator('#task-title')).toHaveValue(titulo);
  });

  test('cambia de lista y de tema desde la paleta', async ({ page }) => {
    await irA(page, '/tablero');

    await page.keyboard.press('Control+K');
    let paleta = page.getByRole('dialog', { name: /paleta de comandos/i });
    await paleta.locator('.cmdpalette__input').fill('trabajo');
    // "Crear la tarea "trabajo"" también contiene la palabra: se excluye por texto.
    await paleta
      .locator('[role="option"]')
      .filter({ hasText: 'Trabajo' })
      .filter({ hasNotText: 'Crear la tarea' })
      .click();
    await expect(page.locator('h1, h2').filter({ hasText: 'Trabajo' })).toBeVisible();

    const temaAntes = await page.evaluate(() =>
      document.documentElement.classList.contains('dark'),
    );
    await page.keyboard.press('Control+K');
    paleta = page.getByRole('dialog', { name: /paleta de comandos/i });
    await paleta.locator('.cmdpalette__input').fill('tema');
    await paleta.getByRole('option', { name: /cambiar a tema/i }).click();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains('dark')))
      .not.toBe(temaAntes);
  });
});

test.describe('deshacer y rehacer', () => {
  test.use({ viewport: VIEWPORTS.escritorio });

  test('Ctrl+Z deshace y Ctrl+Shift+Z rehace, con un aviso que nombra la acción', async ({
    page,
  }) => {
    await irA(page, '/tablero');
    const antes = await page.locator('.task-card').count();

    await page
      .getByRole('button', { name: /nueva tarea/i })
      .first()
      .click();
    const formulario = page.locator('[role="dialog"]:visible').first();
    await formulario.locator('#task-title').fill('Tarea para deshacer');
    await formulario.getByRole('button', { name: /crear tarea/i }).click();
    await expect(page.locator('.task-card')).toHaveCount(antes + 1);

    await page.keyboard.press('Control+Z');
    await expect(page.getByRole('status').filter({ hasText: 'Se deshizo' })).toBeVisible();
    await expect(page.locator('.task-card')).toHaveCount(antes);

    await page.keyboard.press('Control+Shift+Z');
    await expect(page.getByRole('status').filter({ hasText: 'Se rehizo' })).toBeVisible();
    await expect(page.locator('.task-card')).toHaveCount(antes + 1);
  });

  test('los botones de deshacer y rehacer reflejan la disponibilidad del historial', async ({
    page,
  }) => {
    await irA(page, '/tablero');

    // Ámbito a la barra: el aviso de completar también añade un botón «Deshacer».
    const historial = page.locator('[data-menu="history"]');
    const deshacer = historial.getByRole('button', { name: /^deshacer$/i });
    const rehacer = historial.getByRole('button', { name: /^rehacer$/i });
    await expect(deshacer).toBeDisabled();
    await expect(rehacer).toBeDisabled();

    const pendiente = page.locator('.task-card:not(.task-card--done)').first();
    await pendiente.locator('.task-card__menu-trigger').click();
    await page.getByRole('menuitem', { name: /^completar$/i }).click();

    await expect(deshacer).toBeEnabled();
    await deshacer.click();
    await expect(rehacer).toBeEnabled();
  });

  test('eliminar una tarea avisa con «Deshacer» y la trae de vuelta', async ({ page }) => {
    await irA(page, '/tablero');
    const antes = await page.locator('.task-card').count();
    const tarjeta = page.locator('.task-card').first();
    const titulo = (await tarjeta.locator('h3').innerText()).trim();

    await tarjeta.locator('.task-card__menu-trigger').click();
    await page.getByRole('menuitem', { name: /eliminar/i }).click();
    await page.getByRole('button', { name: /eliminar la tarea/i }).click();
    await expect(page.locator('.task-card')).toHaveCount(antes - 1);

    const aviso = page.getByRole('status').filter({ hasText: 'eliminada' });
    await expect(aviso).toBeVisible();
    await aviso.getByRole('button', { name: /deshacer/i }).click();

    await expect(page.locator('.task-card')).toHaveCount(antes);
    await expect(page.locator('.task-card', { hasText: titulo })).toHaveCount(1);
  });
});

test.describe('hoja de atajos', () => {
  test.use({ viewport: VIEWPORTS.escritorio });

  test('lista los atajos nuevos de la paleta y del historial', async ({ page }) => {
    await irA(page, '/tablero');
    await page.keyboard.press('?');

    const hoja = page.locator('[role="dialog"]:visible').first();
    await expect(hoja).toContainText('Abrir la paleta de comandos');
    await expect(hoja).toContainText('Deshacer');
    await expect(hoja).toContainText('Rehacer');
  });
});
