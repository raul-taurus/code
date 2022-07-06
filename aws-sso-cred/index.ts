#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { createHash } from 'crypto';
import { execSync } from 'child_process';

type AwsConfig = {
  [key: string]: SsoProfile;
}

type SsoCredCache = {
  ProviderType: 'sso';
  Credentials: {
    AccessKeyId: string;
    SecretAccessKey: string;
    SessionToken: string;
    Expiration: Date;
  }
}

type SsoProfile = {
  sso_start_url: string;
  sso_region: string;
  sso_account_id: string;
  sso_role_name: string;
  region: string;
  output: string;
}

class AwsSsoCred {
  private parseProfileName(m: string) {
    if (m.startsWith('profile ')) {
      return m.replace('profile ', '');
    }

    if (m === 'default') {
      return m;
    }

    throw new Error(`Failed to parse profile name \`${m}\` `);
  }

  private parseProfileSection(m: string): SsoProfile {
    return Array.from(m.matchAll(/(.+?)\s*=\s*(.+?)\s+/g))
      .reduce((o, m) => (o[m[1]] = m[2], o), {} as any);
  }

  private parseConfigFile(configFile: string): AwsConfig {
    const configText = readFileSync(configFile).toString();
    return Array.from(configText.matchAll(/\[([^\]]+)\]\s*([^\[]+)/g))
      .reduce((o, m) => {
        const profileName = this.parseProfileName(m[1]);
        const profile = this.parseProfileSection(m[2]);
        o[profileName] = profile;
        return o;
      }, {} as any)
  }

  private sortKeys(o: {}) {
    return Object.entries(o)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .reduce((n, p) => (n[p[0]] = p[1], n), {} as any);
  }

  private sha1(data: string) {
    const hash = createHash('sha1');
    hash.update(data);
    return hash.copy().digest('hex');
  }

  private readCredCache(profile: SsoProfile): SsoCredCache {
    const credCacheArgs = JSON.stringify(this.sortKeys({
      'startUrl': profile.sso_start_url,
      'roleName': profile.sso_role_name,
      'accountId': profile.sso_account_id,
    }))
    const credCacheKey = this.sha1(credCacheArgs);
    const credCacheFile = join(homedir(), '.aws', 'cli', 'cache', `${credCacheKey}.json`);
    const credCache = JSON.parse(readFileSync(credCacheFile).toString());
    return credCache;
  }

  main(...args: any[]) {

    const configFilePath = join(homedir(), '.aws', 'config');
    if (!existsSync(configFilePath)) {
      console.error(`File \`${configFilePath}\` not found`)
      return
    }

    const profileName = args[0];
    execSync(`aws sts get-caller-identity --profile ${profileName}`);

    const config = this.parseConfigFile(configFilePath);
    const profile = config[profileName];
    const { Credentials: cred } = this.readCredCache(profile);

    const target = args[1] ? `profile.${args[1]}` : 'default'

    execSync(`aws configure set ${target}.aws_access_key_id ${cred.AccessKeyId}`)
    execSync(`aws configure set ${target}.aws_secret_access_key ${cred.SecretAccessKey}`)
    execSync(`aws configure set ${target}.aws_session_token ${cred.SessionToken}`)
  }
}

const [, , ...args] = process.argv
new AwsSsoCred().main(...args);
