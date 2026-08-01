import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface Environment {
  baseURL: string | undefined;
}

export interface Credential {
  username: string | undefined;
  password: string | undefined;
}

export interface Config {
  environment: Environment;
  credentials: Record<string, Credential>;
}

export interface EnvironmentKeyMap {
  baseURL: string;
}

export interface CredentialKeyMap {
  username: string;
  password: string;
}

export interface BeanLoaderOptions {
  profile: string;
  profileFiles: Record<string, string>;
  environmentKeys: EnvironmentKeyMap;
  credentialKeys: Record<string, CredentialKeyMap>;
  variables?: Record<string, string | undefined>;
}

export interface BeanContext {
  readonly profile: string;
  readonly environment: Environment;
  readonly credentials: Readonly<Record<string, Credential>>;
  readonly config: Config;
  getEnvironment(): Environment;
  getCredential(id: string): Credential;
  getConfig(): Config;
}

function parseDotEnv(filePath: string): Record<string, string | undefined> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`[BeanLoader] Env file not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  return Object.fromEntries(
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=');
        if (index === -1) {
          return ['', ''];
        }
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      })
      .filter(([key]) => key.length > 0),
  );
}

function buildEnvironment(
  variables: Record<string, string | undefined>,
  keys: EnvironmentKeyMap,
): Environment {
  return {
    baseURL: variables[keys.baseURL],
  };
}

function buildCredential(
  variables: Record<string, string | undefined>,
  keys: CredentialKeyMap,
): Credential {
  return {
    username: variables[keys.username],
    password: variables[keys.password],
  };
}

export function loadBeanContext(
  metaUrl: string,
  options: BeanLoaderOptions,
): BeanContext {
  const profile = options.variables?.env ?? options.profile;
  const profileFile = options.profileFiles[profile];

  if (!profileFile) {
    throw new Error(`[BeanLoader] No env file configured for profile "${profile}".`);
  }

  const resolvedEnvFile = path.isAbsolute(profileFile)
    ? profileFile
    : path.resolve(path.dirname(fileURLToPath(metaUrl)), profileFile);
  const fileVariables = parseDotEnv(resolvedEnvFile);
  const variables = {
    ...fileVariables,
    ...options.variables,
  };

  const environment = buildEnvironment(variables, options.environmentKeys);
  const credentials: Record<string, Credential> = {};

  for (const [id, keys] of Object.entries(options.credentialKeys)) {
    credentials[id] = buildCredential(variables, keys);
  }

  const config: Config = {
    environment,
    credentials,
  };

  return {
    profile,
    environment,
    credentials,
    config,
    getEnvironment(): Environment {
      return environment;
    },
    getCredential(id: string): Credential {
      const credential = credentials[id];

      if (!credential) {
        throw new Error(`[BeanLoader] Credential bean with id="${id}" not found.`);
      }

      return credential;
    },
    getConfig(): Config {
      return config;
    },
  };
}
