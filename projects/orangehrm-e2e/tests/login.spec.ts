import { expect, test } from '../fixtures/baseTest.js';
import { LoginPage } from '../pages/LoginPage.js';

test('login page is reachable', async ({ page, environment, getCredential }) => {
  const loginPage = new LoginPage(page);
  const credential = getCredential('admin');

  await loginPage.goto(environment.baseURL ?? '');
  await loginPage.login(credential.username ?? '', credential.password ?? '');

  expect(await loginPage.getErrors()).toBeTruthy();
});
