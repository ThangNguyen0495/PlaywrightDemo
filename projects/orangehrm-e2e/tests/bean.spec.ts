import { expect, test } from '../fixtures/baseTest.js';

test('bean context is preloaded in base test', async ({ environment, getCredential }) => {
  const credential = getCredential('admin');

  expect(environment.baseURL).toContain('orangehrmlive.com');
  expect(credential.username).toBe('Admin');
});
