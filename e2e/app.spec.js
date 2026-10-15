import { expect, test } from '@playwright/test';

const PASSWORD = 'Mercatora#2026';

async function login(page, email) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
}

test.describe('public site', () => {
  test('home, directory search and filters', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Everything you love');
    await page.getByRole('link', { name: 'Browse stores' }).click();
    await expect(page).toHaveURL(/\/stores/);
    await expect(page.getByText(/33 stores/)).toBeVisible();

    await page.getByLabel('Search stores').fill('coffee');
    await expect(page.getByRole('heading', { name: 'Third Wave Roasters' })).toBeVisible();
    await expect(page.getByText(/1 store$/)).toBeVisible();

    await page.getByRole('button', { name: 'Clear filters' }).click();
    await page.getByRole('button', { name: 'Electronics' }).click();
    await expect(page.getByRole('heading', { name: 'Voltix' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Kaveri Loom' })).toHaveCount(0);
    await expect(page).toHaveURL(/cat=Electronics/);
  });

  test('a shop page shows products, hours, contact and reviews', async ({ page }) => {
    await page.goto('/stores');
    await page.getByRole('heading', { name: 'Kaveri Loom' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Kaveri Loom' })).toBeVisible();
    await expect(page.getByText('Kanchipuram silk saree, wine and gold')).toBeVisible();
    await expect(page.getByText('Opening hours')).toBeVisible();
    await expect(page.getByText('Sold out').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Reviews' })).toBeVisible();
    await expect(page.getByText('Reply from Kaveri Loom')).toBeVisible();
  });

  test('floor map selects a store and deep links work', async ({ page }) => {
    await page.goto('/map');
    await page.getByRole('button', { name: /Kaveri Loom, Fashion, unit G-02/ }).click();
    await expect(page.getByRole('heading', { name: 'Kaveri Loom' })).toBeVisible();
    await page.getByRole('link', { name: /Visit store page/ }).click();
    await expect(page).toHaveURL(/\/stores\//);

    await page.getByRole('link', { name: 'Show on the floor map' }).click();
    await expect(page).toHaveURL(/floor=G&shop=/);
    await page.getByRole('tab', { name: 'Second Floor' }).click();
    await expect(page.getByRole('button', { name: /Masala Library, Dining/ })).toBeVisible();
  });

  test('offers, events and visit pages', async ({ page }) => {
    await page.goto('/whats-on');
    await expect(page.getByRole('heading', { name: 'Festive Fortnight' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Monsoon Sale' })).toHaveCount(0); // ended
    await expect(page.getByRole('heading', { name: /Draft: New Year/ })).toHaveCount(0); // unpublished
    await page.getByRole('tab', { name: /Events/ }).click();
    await expect(page.getByRole('heading', { name: 'Diwali Lights Weekend' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Festive Fortnight' })).toHaveCount(0);

    await page.goto('/visit');
    await expect(page.getByRole('heading', { name: 'Parking' })).toBeVisible();
    await expect(page.getByText('1,200')).toBeVisible();
  });

  test('guests keep favourites on the device and the bag asks them to sign in', async ({ page }) => {
    await page.goto('/stores');
    await page.getByRole('button', { name: 'Save Lumen Beauty to favourites' }).click();
    await page.goto('/favorites');
    await expect(page.getByRole('heading', { name: 'Lumen Beauty' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Lumen Beauty' })).toBeVisible();

    await page.goto('/stores');
    await page.getByRole('heading', { name: 'Voltix' }).click();
    await page.getByRole('button', { name: /65 W GaN charger/ }).first().click();
    await page.getByRole('button', { name: /Reserve for/ }).click();
    await expect(page.getByRole('dialog', { name: 'Your bag' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in to reserve' })).toBeVisible();
  });

  test('unknown routes and stores show friendly pages', async ({ page }) => {
    await page.goto('/nope');
    await expect(page.getByRole('heading', { name: /leads nowhere/ })).toBeVisible();
    await page.goto('/stores/does-not-exist');
    await expect(page.getByText('We could not find that store')).toBeVisible();
  });

  test('theme toggle switches and persists', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Switch to dark theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});

test.describe('access control', () => {
  test('guests are sent to sign in for the console and reservations', async ({ page }) => {
    await page.goto('/console');
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/reservations');
    await expect(page).toHaveURL(/\/login/);
  });

  test('shoppers cannot open the console', async ({ page }) => {
    await login(page, 'shopper@mercatora.test');
    await page.goto('/console');
    await expect(page.getByRole('heading', { name: 'Staff area' })).toBeVisible();
  });

  test('owners only see their own store and no admin pages', async ({ page }) => {
    await login(page, 'owner.kaveri@mercatora.test');
    await expect(page).toHaveURL(/\/console/);
    await page.goto('/console/stores');
    await expect(page.getByText('Kaveri Loom').first()).toBeVisible();
    await expect(page.getByText('Voltix')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Onboard store' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Audit log' })).toHaveCount(0);
    await page.goto('/console/audit');
    await expect(page.getByRole('heading', { name: 'Staff area' })).toBeVisible();
  });

  test('wrong password shows a clear error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('shopper@mercatora.test');
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('alert')).toContainText('do not match');
  });
});

test.describe('reserve and pick up, end to end', () => {
  test.describe.configure({ mode: 'serial' });
  let code;

  test('a shopper reserves an item from a store', async ({ page }) => {
    await login(page, 'shopper@mercatora.test');
    await page.goto('/stores');
    await page.getByRole('heading', { name: 'Kaveri Loom' }).click();
    await page.getByRole('button', { name: /Men's bandhgala jacket/ }).first().click();
    await page.getByRole('button', { name: /Reserve for/ }).click();

    const bag = page.getByRole('dialog');
    await expect(bag.getByText("Men's bandhgala jacket, ivory")).toBeVisible();
    await bag.getByRole('button', { name: 'Continue to pickup details' }).click();
    await bag.getByLabel('Phone number').fill('+91 98200 55555');
    await bag.getByRole('button', { name: /^Reserve/ }).click();

    await expect(bag.getByText(/1 reservation sent/)).toBeVisible();
    code = (await bag.locator('p.display').first().textContent()).trim();
    expect(code).toMatch(/^[A-Z2-9]{6}$/);
    await bag.getByRole('button', { name: 'View my reservations' }).click();
    await expect(page).toHaveURL(/\/reservations/);
    await expect(page.getByText(code)).toBeVisible();
    await expect(page.getByText('Waiting for the store to confirm.').first()).toBeVisible();
  });

  test('the store owner confirms it, stock is held, then hands it over', async ({ page }) => {
    await login(page, 'owner.kaveri@mercatora.test');

    const stockOf = async () => {
      await page.goto('/console/products');
      await page.getByLabel('Search products').fill('bandhgala');
      const row = page.getByRole('row', { name: /bandhgala/ });
      await expect(row).toBeVisible();
      return Number((await row.getByLabel(/^Decrease stock/).locator('xpath=following-sibling::span').textContent()).trim());
    };
    const before = await stockOf();

    await page.goto('/console/reservations');
    const card = page.locator('li', { hasText: 'bandhgala' }).first();
    await card.getByRole('button', { name: /Confirm and set aside/ }).click();
    await page.getByRole('dialog').getByRole('textbox').fill('Set aside at the counter.');
    await page.getByRole('dialog').getByRole('button', { name: /Confirm and set aside/ }).click();
    await expect(page.getByText(/Confirmed: Ananya Rao/)).toBeVisible();

    expect(await stockOf()).toBe(before - 1);

    await page.goto('/console/reservations');
    await page.getByRole('tab', { name: /In progress/ }).click();
    const open = page.locator('li', { hasText: 'bandhgala' }).first();
    await open.getByRole('button', { name: 'Mark ready' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Mark ready' }).click();
    await expect(page.getByText(/Ready for pickup: Ananya Rao/)).toBeVisible();

    // a wrong code is refused, the right one completes the handover
    await page.getByRole('tab', { name: /In progress/ }).click();
    await page.locator('li', { hasText: 'bandhgala' }).first().getByRole('button', { name: 'Hand over' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Pickup code').fill('WRONG1');
    await dialog.getByRole('button', { name: 'Hand over' }).click();
    await expect(dialog.getByText('That code does not match')).toBeVisible();
    await dialog.getByLabel('Pickup code').fill(code.toLowerCase());
    await dialog.getByRole('button', { name: 'Hand over' }).click();
    await expect(page.getByText(/Collected: Ananya Rao/)).toBeVisible();
  });

  test('the shopper sees it collected', async ({ page }) => {
    await login(page, 'shopper@mercatora.test');
    await page.goto('/reservations');
    // collected reservations move to Past and no longer show the pickup code
    const past = page.getByRole('region', { name: 'Past' });
    const card = past.locator('li', { hasText: "Men's bandhgala jacket" }).first();
    await expect(card.getByText('Collected', { exact: true }).first()).toBeVisible();
    await expect(card.getByText('Set aside at the counter.')).toBeVisible();
    await expect(page.getByText(code)).toHaveCount(0);
  });

  test('a shopper can withdraw a request that is still waiting', async ({ page }) => {
    await login(page, 'shopper@mercatora.test');
    await page.goto('/reservations');
    const requested = page.locator('li', { hasText: 'KV7P2M' });
    await requested.getByRole('button', { name: 'Cancel request' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel reservation' }).click();
    await expect(page.getByText('Reservation cancelled.')).toBeVisible();
  });
});

test.describe('reviews', () => {
  test('a shopper rates a store and can edit it', async ({ page }) => {
    await login(page, 'shopper@mercatora.test');
    await page.goto('/stores');
    await page.getByRole('heading', { name: 'Denim & Thread' }).click();
    await page.getByRole('radio', { name: '5 stars' }).click();
    await page.getByLabel(/Your thoughts/).fill('Perfect fit, free hemming was a bonus.');
    await page.getByRole('button', { name: 'Post review' }).click();
    await expect(page.getByRole('paragraph').filter({ hasText: 'Perfect fit, free hemming was a bonus.' })).toBeVisible();
    await page.getByRole('button', { name: 'Edit', exact: true }).click();
    await page.getByRole('radio', { name: '4 stars' }).click();
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Your review was updated.')).toBeVisible();
  });

  test('the owner replies and an admin can hide it', async ({ page, browser }) => {
    await login(page, 'owner.kaveri@mercatora.test');
    await page.goto('/console/reviews');
    await page.getByRole('tab', { name: /Awaiting reply/ }).click();
    await page.getByRole('button', { name: 'Reply' }).first().click();
    await page.getByLabel('Your reply').fill('Thank you for visiting.');
    await page.getByRole('button', { name: 'Post reply' }).click();
    await expect(page.getByText('Reply posted.')).toBeVisible();

    const admin = await browser.newPage();
    await login(admin, 'admin@mercatora.test');
    await admin.goto('/console/reviews');
    await admin.getByRole('button', { name: 'Hide' }).first().click();
    await expect(admin.getByText('Review hidden.')).toBeVisible();
    await admin.close();
  });
});

test.describe('admin console', () => {
  test('onboards a store, it appears publicly, then archive hides it', async ({ page }) => {
    await login(page, 'admin@mercatora.test');
    await page.goto('/console/stores');
    await page.getByRole('button', { name: 'Onboard store' }).click();
    const drawer = page.getByRole('dialog');

    await drawer.getByRole('button', { name: 'Onboard store' }).click(); // submit empty
    await expect(drawer.getByText('Give the store a name.')).toBeVisible();

    await drawer.getByLabel(/Store name/).fill('E2E Boutique');
    await drawer.getByLabel(/Category/).selectOption('Fashion');
    await drawer.getByLabel(/^Unit/).selectOption({ index: 1 });
    await drawer.getByLabel('Tagline').fill('Created by the test suite.');
    await drawer.getByRole('button', { name: 'Onboard store' }).click();
    await expect(page.getByText('E2E Boutique is onboarded.')).toBeVisible();
    await expect(page.getByRole('row', { name: /E2E Boutique/ })).toBeVisible();

    await page.goto('/stores?q=E2E');
    await expect(page.getByRole('heading', { name: 'E2E Boutique' })).toBeVisible();

    await page.goto('/console/stores');
    await page.getByLabel('Archive E2E Boutique').click();
    await page.getByRole('dialog').getByRole('button', { name: 'Archive' }).click();
    await expect(page.getByText('Store archived.')).toBeVisible();
    await page.goto('/stores?q=E2E');
    await expect(page.getByText('No stores match')).toBeVisible();

    await page.goto('/console/stores');
    await page.getByLabel('Delete E2E Boutique').click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete everything' }).click();
    await expect(page.getByText(/E2E Boutique deleted/)).toBeVisible();
  });

  test('adds a product and adjusts stock inline', async ({ page }) => {
    await login(page, 'owner.voltix@mercatora.test');
    await page.goto('/console/products');
    await page.getByRole('button', { name: 'Add product' }).click();
    const drawer = page.getByRole('dialog');
    await drawer.getByRole('button', { name: 'Add product' }).click();
    await expect(drawer.getByText('Give the product a name.')).toBeVisible();
    await drawer.getByLabel(/Product name/).fill('USB-C cable, 2 m');
    await drawer.getByLabel(/Price/).fill('799');
    await drawer.getByLabel(/^Stock/).fill('3');
    await drawer.getByRole('button', { name: 'Add product' }).click();
    await expect(page.getByText('Product added.')).toBeVisible();

    const row = page.getByRole('row', { name: /USB-C cable/ });
    await row.getByLabel(/Increase stock/).click();
    await expect(row.getByText('4', { exact: true })).toBeVisible();
    await expect(row.getByText('4', { exact: true })).toBeVisible();
  });

  test('changes a role and writes to the audit log', async ({ page }) => {
    await login(page, 'admin@mercatora.test');
    await page.goto('/console/users');
    await page.getByLabel('Change access for Rohit Verma').click();
    await page.getByRole('dialog').getByLabel('Role').selectOption('owner');
    await page.getByRole('dialog').getByText('Pages & Paper').click();
    await page.getByRole('button', { name: 'Save access' }).click();
    await expect(page.getByText(/Rohit Verma is now store owner/)).toBeVisible();

    await page.goto('/console/audit');
    await expect(page.getByText('USER_ACCESS_CHANGED').first()).toBeVisible();
    await expect(page.getByText(/rohit@mercatora.test is now owner/)).toBeVisible();
  });

  test('saves mall settings that show on the visit page', async ({ page }) => {
    await login(page, 'admin@mercatora.test');
    await page.goto('/console/settings');
    await page.getByLabel('Rates').fill('Free for the first 3 hours with any purchase.');
    await page.getByRole('button', { name: 'Save settings' }).click();
    await expect(page.getByText('Mall settings saved.')).toBeVisible();
    await page.goto('/visit');
    await expect(page.getByText('Free for the first 3 hours with any purchase.')).toBeVisible();
  });
});

test('registering creates a shopper account', async ({ page }) => {
  await page.goto('/register');
  const email = `new.${Date.now()}@mercatora.test`;
  await page.getByLabel('Full name').fill('New Shopper');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('short');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByText('Use at least 8 characters.')).toBeVisible();
  await page.getByLabel('Password').fill('LongEnough#1');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL('/');
  await page.getByRole('button', { name: 'Account menu' }).click();
  await expect(page.getByText('New Shopper').first()).toBeVisible();
  await expect(page.getByText('Shopper', { exact: true })).toBeVisible();
});
