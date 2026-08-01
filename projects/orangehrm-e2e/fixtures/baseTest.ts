import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';
import { expect, test as base } from '@playwright/test';

import type { Credential, Environment } from '@core-playwright/core';

interface BeanFixtures {
  environment: Environment;
  getCredential: (id: string) => Credential;
}

const BEAN_CONFIG = {
  stg: '.env-stg',
  qat: '.env-qat',
} as const;

const BEAN_KEYS = {
  environment: {
    BASE_URL: 'BASE_URL',
  },
  admin: {
    username: 'ADMIN_USERNAME',
    password: 'ADMIN_PASSWORD',
  },
  qatUser1: {
    username: 'USER_1_USERNAME',
    password: 'USER_1_PASSWORD',
  },
} as const;

function resolveProfilePath(profile: string): string {
  const configPath = BEAN_CONFIG[profile as keyof typeof BEAN_CONFIG];

  if (!configPath) {
    throw new Error(`[Fixture] Unknown profile "${profile}".`);
  }

  return configPath;
}

const profile = process.env.env ?? 'qat';
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configDir = path.resolve(projectRoot, 'config');
const envFilePath = path.resolve(configDir, resolveProfilePath(profile));
const variables = dotenv.parse(fs.readFileSync(envFilePath));

const environment: Environment = {
  baseURL: variables[BEAN_KEYS.environment.BASE_URL],
};

const credentials: Record<string, Credential> = {
  admin: {
    username: variables[BEAN_KEYS.admin.username],
    password: variables[BEAN_KEYS.admin.password],
  },
  qatUser1: {
    username: variables[BEAN_KEYS.qatUser1.username],
    password: variables[BEAN_KEYS.qatUser1.password],
  },
};

export const test = base.extend<BeanFixtures>({
  environment: async ({}, use) => {
    await use(environment);
  },
  getCredential: async ({}, use) => {
    await use((id: string) => {
      const credential = credentials[id];

      if (!credential) {
        throw new Error(`[Fixture] Credential "${id}" not found.`);
      }

      return credential;
    });
  },
});

export { expect };
