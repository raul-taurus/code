#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = require("os");
const crypto_1 = require("crypto");
const child_process_1 = require("child_process");
class AwsSsoCred {
    parseProfileName(m) {
        if (m.startsWith('profile ')) {
            return m.replace('profile ', '');
        }
        if (m === 'default') {
            return m;
        }
        throw new Error(`Failed to parse profile name \`${m}\` `);
    }
    parseProfileSection(m) {
        return Array.from(m.matchAll(/(.+?)\s*=\s*(.+?)\s+/g))
            .reduce((o, m) => (o[m[1]] = m[2], o), {});
    }
    parseConfigFile(configFile) {
        const configText = (0, fs_1.readFileSync)(configFile).toString();
        return Array.from(configText.matchAll(/\[([^\]]+)\]\s*([^\[]+)/g))
            .reduce((o, m) => {
            const profileName = this.parseProfileName(m[1]);
            const profile = this.parseProfileSection(m[2]);
            o[profileName] = profile;
            return o;
        }, {});
    }
    sortKeys(o) {
        return Object.entries(o)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .reduce((n, p) => (n[p[0]] = p[1], n), {});
    }
    sha1(data) {
        const hash = (0, crypto_1.createHash)('sha1');
        hash.update(data);
        return hash.copy().digest('hex');
    }
    readCredCache(profile) {
        const credCacheArgs = JSON.stringify(this.sortKeys({
            'startUrl': profile.sso_start_url,
            'roleName': profile.sso_role_name,
            'accountId': profile.sso_account_id,
        }));
        const credCacheKey = this.sha1(credCacheArgs);
        const credCacheFile = (0, path_1.join)((0, os_1.homedir)(), '.aws', 'cli', 'cache', `${credCacheKey}.json`);
        const credCache = JSON.parse((0, fs_1.readFileSync)(credCacheFile).toString());
        return credCache;
    }
    main(...args) {
        const configFilePath = (0, path_1.join)((0, os_1.homedir)(), '.aws', 'config');
        if (!(0, fs_1.existsSync)(configFilePath)) {
            console.error(`File \`${configFilePath}\` not found`);
            return;
        }
        const config = this.parseConfigFile(configFilePath);
        const profile = config[args[0]];
        const { Credentials: cred } = this.readCredCache(profile);
        const target = args[1] ? `profile.${args[1]}` : 'default';
        (0, child_process_1.execSync)(`
aws configure set ${target}.aws_access_key_id ${cred.AccessKeyId}
aws configure set ${target}.aws_secret_access_key ${cred.SecretAccessKey}
aws configure set ${target}.aws_session_token ${cred.SessionToken}
`);
    }
}
const [, , ...args] = process.argv;
new AwsSsoCred().main(...args);
