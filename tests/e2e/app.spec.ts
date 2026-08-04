import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function selectCity(page: Page, query: string, label: string) {
  const city = page.getByRole('combobox', { name: 'City' });
  await city.fill(query);
  await expect(page.getByRole('option', { name: label })).toBeVisible();
  await city.press('Enter');
}

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => document.querySelector('main')?.dataset.hydrated === 'true');
}

test('serves bundled HUD rents without an upstream API', async ({ request }) => {
  const response = await request.get('/api/fmr?state=12&county=057');
  expect(response.ok()).toBe(true);
  expect(await response.json()).toMatchObject({
    ok: true,
    r1: expect.any(Number),
    r2: expect.any(Number),
    year: 'FY2026',
    bundled: true
  });
});

test('validates bundled HUD lookup FIPS and handles missing counties', async ({ request }) => {
  const malformed = await request.get('/api/fmr?state=1&county=57');
  expect(malformed.status()).toBe(400);

  const missing = await request.get('/api/fmr?state=99&county=999');
  expect(missing.ok()).toBe(true);
  expect(await missing.json()).toEqual({ ok: false, reason: 'not-found' });
});

test.beforeEach(async ({ page }) => {
  await page.route('**/api/city-suggest**', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ suggestions: [] })
    })
  );
  await page.route('https://*.basemaps.cartocdn.com/**', (route) => route.abort());
  await page.goto('/');
  await waitForHydration(page);
});

test('supports keyboard city selection and salary results', async ({ page }) => {
  const city = page.getByRole('combobox', { name: 'City' });
  await city.click();
  await city.pressSequentially('New York', { delay: 20 });
  await expect(page.getByRole('option', { name: 'New York, NY' })).toBeVisible();
  await expect(city).toHaveAttribute('aria-activedescendant', 'city-option-0');
  await city.press('Enter');
  await page.getByLabel('Annual salary', { exact: true }).fill('100000');
  await expect(page.getByRole('heading', { name: 'New York, NY' })).toBeVisible();
  await expect(
    page.locator('[data-testid="fact"]').getByText('Estimated median 1BR rent', { exact: true })
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'City snapshot' })).toBeVisible();
  await expect(page.getByText('Median household income', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: '2020–2024 ACS 5-year estimates ↗' })).toBeVisible();
});

test('credits the bundled Apartment List estimates', async ({ page }) => {
  const source = page.getByRole('link', { name: 'Apartment List Rent Estimates' });
  await expect(source).toHaveAttribute(
    'href',
    'https://www.apartmentlist.com/research/category/data-rent-estimates'
  );
  await expect(page.locator('footer')).toContainText('© Apartment List, Inc.');
});

test('has no serious accessibility violations in populated state', async ({ page }) => {
  const city = page.getByRole('combobox', { name: 'City' });
  await city.click();
  await city.pressSequentially('Tampa', { delay: 20 });
  await expect(page.getByRole('option', { name: 'Tampa, FL' })).toBeVisible();
  await city.press('Enter');
  await page.getByLabel('Annual salary', { exact: true }).fill('80000');
  await expect(page.getByRole('heading', { name: 'Tampa, FL' })).toBeVisible();
  // Result/side cards fade in via an entrance animation; wait for them to reach
  // full opacity so axe measures settled colors rather than mid-fade contrast.
  await page.waitForFunction(() =>
    [
      ...document.querySelectorAll('[data-testid="results"] > *, [data-testid="sidebar"] > *')
    ].every((el) => getComputedStyle(el).opacity === '1')
  );
  const results = await new AxeBuilder({ page }).exclude('.leaflet-control-container').analyze();
  expect(
    results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))
  ).toEqual([]);
});

test('does not overflow a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const city = page.getByRole('combobox', { name: 'City' });
  await city.click();
  await city.pressSequentially('Tampa', { delay: 20 });
  await expect(page.getByRole('option', { name: 'Tampa, FL' })).toBeVisible();
  await city.press('Enter');
  await page.getByLabel('Annual salary', { exact: true }).fill('80000');
  const widths = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth
  }));
  expect(widths.scroll).toBe(widths.client);
});

test('enforces the five-city comparison limit', async ({ page }) => {
  await page.getByLabel('Annual salary', { exact: true }).fill('100000');
  for (const [query, label] of [
    ['Tampa', 'Tampa, FL'],
    ['New York', 'New York, NY'],
    ['Austin', 'Austin, TX'],
    ['Boston', 'Boston, MA'],
    ['Miami', 'Miami, FL']
  ]) {
    await selectCity(page, query, label);
    await page.getByRole('button', { name: '+ Compare' }).click();
  }
  await selectCity(page, 'Seattle', 'Seattle, WA');
  await expect(page.getByRole('button', { name: '+ Compare' })).toBeDisabled();
  await expect(page.getByText('5 / 5', { exact: true })).toBeVisible();
});

test('keeps the current comparison set when navigating back through cities', async ({ page }) => {
  await page.getByLabel('Annual salary', { exact: true }).fill('80000');
  await expect.poll(() => new URL(page.url()).searchParams.get('salary')).toBe('80000');

  await selectCity(page, 'Tampa', 'Tampa, FL');
  await page.getByRole('button', { name: '+ Compare' }).click();
  await expect
    .poll(() => new URL(page.url()).searchParams.getAll('compare'))
    .toEqual(['Tampa, FL']);

  await selectCity(page, 'Austin', 'Austin, TX');
  await page.getByRole('button', { name: '+ Compare' }).click();
  await expect
    .poll(() => new URL(page.url()).searchParams.getAll('compare'))
    .toEqual(['Tampa, FL', 'Austin, TX']);

  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Tampa, FL' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove Tampa, FL' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove Austin, TX' })).toBeVisible();
});

test('keeps newly selected cities when opening the detailed comparison', async ({ page }) => {
  await page.getByLabel('Annual salary', { exact: true }).fill('60000');
  await selectCity(page, 'Denver', 'Denver, CO');
  await page.getByRole('button', { name: '+ Compare' }).click();
  await selectCity(page, 'Nashville', 'Nashville, TN');
  await page.getByRole('button', { name: '+ Compare' }).click();

  await page.getByRole('link', { name: 'Detailed comparison →' }).click();
  await expect(page).toHaveURL(/\/compare$/);
  await expect(page.getByRole('heading', { name: 'Denver, CO' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Nashville, TN' })).toBeVisible();
  await expect(page.getByText('$78 under budget', { exact: true })).toHaveCSS(
    'color',
    'rgb(20, 123, 59)'
  );
  const oneBedroomRow = page.getByRole('row', {
    name: '1BR rent $1,422/mo $1,216/mo',
    exact: true
  });
  await expect(oneBedroomRow.locator('td[data-tone="best"]')).toContainText('$1,216/mo');
  await expect(oneBedroomRow.locator('td[data-tone="worst"]')).toContainText('$1,422/mo');

  await page.setViewportSize({ width: 734, height: 969 });
  const highlightTops = await page.evaluate(() =>
    [...document.querySelectorAll('[data-testid="highlights"] > div')].map((element) =>
      Math.round(element.getBoundingClientRect().top)
    )
  );
  expect(new Set(highlightTops).size).toBe(1);

  await page.setViewportSize({ width: 390, height: 844 });
  const highlightWidths = await page.locator('[data-testid="highlights"]').evaluate((element) => ({
    client: element.clientWidth,
    scroll: element.scrollWidth
  }));
  expect(highlightWidths.scroll).toBe(highlightWidths.client);

  const denverScenario = page.locator('[data-testid="scenario"]').filter({ hasText: 'Denver, CO' });
  await expect(denverScenario).toHaveCount(1);
  await denverScenario.getByRole('link', { name: 'Denver, CO', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Denver, CO' })).toBeVisible();
  await expect(page.getByLabel('Annual salary', { exact: true })).toHaveValue('60,000');
});

test('exposes map markers to the keyboard', async ({ page }) => {
  await selectCity(page, 'Tampa', 'Tampa, FL');
  await page.getByLabel('Annual salary', { exact: true }).fill('80000');
  const marker = page.getByRole('button', {
    name: 'New York, NY, 1 bedroom $2,443, over budget'
  });
  // Selecting a city recenters the map on it, so a far-away marker like New York
  // starts off-screen (Leaflet culls off-viewport markers). Zoom out until it's
  // in view before exercising keyboard access.
  const zoomOut = page.getByRole('button', { name: 'Zoom out' });
  for (let i = 0; i < 5 && !(await marker.isVisible()); i++) {
    await zoomOut.click();
  }
  await expect(marker).toBeVisible();
  await marker.press('Enter');
  await expect(page.getByRole('heading', { name: 'New York, NY' })).toBeVisible();
});

test('labels HUD data as Fair Market Rent', async ({ page }) => {
  await page.route('**/api/city-suggest**', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        suggestions: [{ label: 'Ithaca, NY', city: 'Ithaca', state: 'NY', lat: 42.44, lng: -76.5 }]
      })
    })
  );
  await page.route('**/api/geocode**', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, stateFips: '36', countyFips: '109', county: 'Tompkins' })
    })
  );
  await page.route('**/api/fmr**', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        r1: 1400,
        r2: 1700,
        county: 'Tompkins County',
        year: 'FY2026',
        bundled: true
      })
    })
  );
  await page.route('**/api/population**', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, pop: 32108, name: 'Ithaca', source: 'simplemaps' })
    })
  );
  await selectCity(page, 'Ithaca', 'Ithaca, NY');
  await page.getByLabel('Annual salary', { exact: true }).fill('80000');
  await expect(
    page.locator('[data-testid="fact"]').getByText('1BR Fair Market Rent', { exact: true })
  ).toBeVisible();
  await expect(page.getByText('Tompkins County area · FY2026', { exact: true })).toBeVisible();
  await expect(
    page.locator('[data-testid="fact"]').getByText('Population', { exact: true })
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'City snapshot' })).toHaveCount(0);
});

test('restores selected city and salary after reload', async ({ page }) => {
  await selectCity(page, 'Tampa', 'Tampa, FL');
  await page.getByLabel('Annual salary', { exact: true }).fill('80000');
  // State is mirrored into the URL, so the reload restores from the query string.
  await expect.poll(() => new URL(page.url()).searchParams.get('city')).toBe('Tampa, FL');
  await expect.poll(() => new URL(page.url()).searchParams.get('salary')).toBe('80000');
  await page.reload();
  await waitForHydration(page);
  await expect(page.getByRole('heading', { name: 'Tampa, FL' })).toBeVisible();
});

test('restores state from a deep link with no stored data', async ({ page, context }) => {
  // A shared link opened on a fresh device: no localStorage to fall back on.
  await context.clearCookies();
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?salary=80000&city=Tampa%2C+FL&compare=Austin%2C+TX');
  await waitForHydration(page);
  await expect(page.getByRole('heading', { name: 'Tampa, FL' })).toBeVisible();
  await expect(page.getByLabel('Annual salary', { exact: true })).toHaveValue('80,000');
  await expect(page.getByText('Austin, TX')).toBeVisible();
});

test('re-resolves an off-list city from deep-linked coordinates', async ({ page }) => {
  await page.route('**/api/geocode**', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, stateFips: '36', countyFips: '109', county: 'Tompkins' })
    })
  );
  await page.route('**/api/fmr**', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        r1: 1400,
        r2: 1700,
        county: 'Tompkins County',
        year: 'FY2026',
        bundled: true
      })
    })
  );
  await page.goto('/?salary=80000&city=Ithaca%2C+NY&lat=42.44&lng=-76.5');
  await waitForHydration(page);
  await expect(page.getByRole('heading', { name: 'Ithaca, NY' })).toBeVisible();
  await expect(
    page.locator('[data-testid="fact"]').getByText('1BR Fair Market Rent', { exact: true })
  ).toBeVisible();
});
