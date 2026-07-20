import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function selectCity(page: Page, query: string, label: string) {
  const city = page.getByRole('combobox', { name: 'City' });
  await city.fill(query);
  await expect(page.getByRole('option', { name: label })).toBeVisible();
  await city.press('Enter');
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/rents', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      rows: [], reportDate: null, live: false, cached: false,
      status: 'unavailable', rowCount: 0, lastSuccessfulAt: null
    })
  }));
  await page.route('**/api/city-suggest**', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ suggestions: [] })
  }));
  await page.route('https://*.basemaps.cartocdn.com/**', (route) => route.abort());
  await page.goto('/');
  // Wait for onMount/hydration before exercising client-side event handlers.
  await expect(page.getByText('June 2026 rent snapshot · live refresh unavailable', { exact: true })).toBeVisible();
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
  await expect(page.locator('.fact').getByText('Median asking 1BR rent', { exact: true })).toBeVisible();
});

test('has no serious accessibility violations in populated state', async ({ page }) => {
  const city = page.getByRole('combobox', { name: 'City' });
  await city.click();
  await city.pressSequentially('Tampa', { delay: 20 });
  await expect(page.getByRole('option', { name: 'Tampa, FL' })).toBeVisible();
  await city.press('Enter');
  await page.getByLabel('Annual salary', { exact: true }).fill('80000');
  await expect(page.getByRole('heading', { name: 'Tampa, FL' })).toBeVisible();
  const results = await new AxeBuilder({ page }).exclude('.leaflet-control-container').analyze();
  expect(results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))).toEqual([]);
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

test('exposes map markers to the keyboard', async ({ page }) => {
  await selectCity(page, 'Tampa', 'Tampa, FL');
  await page.getByLabel('Annual salary', { exact: true }).fill('80000');
  const marker = page.getByRole('button', {
    name: 'New York, NY, 1 bedroom $4,660, over budget'
  });
  await expect(marker).toBeVisible();
  await marker.press('Enter');
  await expect(page.getByRole('heading', { name: 'New York, NY' })).toBeVisible();
});

test('labels HUD data as Fair Market Rent', async ({ page }) => {
  await page.route('**/api/city-suggest**', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ suggestions: [
      { label: 'Ithaca, NY', city: 'Ithaca', state: 'NY', lat: 42.44, lng: -76.5 }
    ] })
  }));
  await page.route('**/api/geocode**', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ ok: true, stateFips: '36', countyFips: '109', county: 'Tompkins' })
  }));
  await page.route('**/api/fmr**', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ ok: true, r1: 1400, r2: 1700, county: 'Tompkins County', year: 'FY2026', bundled: true })
  }));
  await page.route('**/api/acs**', (route) => route.fulfill({
    contentType: 'application/json', body: JSON.stringify({ ok: false })
  }));

  await selectCity(page, 'Ithaca', 'Ithaca, NY');
  await page.getByLabel('Annual salary', { exact: true }).fill('80000');
  await expect(page.locator('.fact').getByText('1BR Fair Market Rent', { exact: true })).toBeVisible();
  await expect(page.getByText('Tompkins County area · FY2026', { exact: true })).toBeVisible();
});

test('restores selected city and salary after reload', async ({ page }) => {
  await selectCity(page, 'Tampa', 'Tampa, FL');
  await page.getByLabel('Annual salary', { exact: true }).fill('80000');
  await page.reload();
  await expect(page.getByText('June 2026 rent snapshot · live refresh unavailable', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tampa, FL' })).toBeVisible();
});
