#!/usr/bin/env node
/**
 * Keeps a single, coherent version number across the whole monorepo.
 *
 * The root package.json is the source of truth. Running this script bumps it
 * (patch by default) and writes the exact same version into every workspace
 * package.json that ships as part of the application (web, electron, nw),
 * so `app.getVersion()` (Electron/NW.js), the web build, and `package.json`
 * always agree on the current build number.
 *
 * Usage:
 *   node scripts/version-bump.mjs                 # 1.0.0 -> 1.0.1 (patch)
 *   node scripts/version-bump.mjs minor            # 1.0.1 -> 1.1.0
 *   node scripts/version-bump.mjs major            # 1.1.0 -> 2.0.0
 *   node scripts/version-bump.mjs 1.2.3            # set an explicit version
 *
 * Also available as: npm run version:bump
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Every package.json that must always carry the same, current app version.
const targets = [
    'package.json',
    'web/package.json',
    'app/electron/package.json',
    'app/nw/package.json',
];

function ParseSemver(version) {
    const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version ?? '');
    if (!match) {
        throw new Error(`Not a valid "major.minor.patch" version: "${version}"`);
    }
    const [ , major, minor, patch ] = match;
    return { major: Number(major), minor: Number(minor), patch: Number(patch) };
}

function NextVersion(current, bump) {
    if (/^\d+\.\d+\.\d+$/.test(bump)) {
        return bump;
    }
    const { major, minor, patch } = ParseSemver(current);
    switch (bump) {
    case 'major': return `${major + 1}.0.0`;
    case 'minor': return `${major}.${minor + 1}.0`;
    case 'patch':
    default: return `${major}.${minor}.${patch + 1}`;
    }
}

function ReadJSON(file) {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function WriteJSON(file, data) {
    // Keep the file's existing 4-space style and trailing newline.
    fs.writeFileSync(file, JSON.stringify(data, null, 4) + '\n', 'utf-8');
}

const bumpArg = process.argv[2] ?? 'patch';
const rootFile = path.join(rootDir, targets[0]);
const rootPackage = ReadJSON(rootFile);
const previousVersion = rootPackage.version ?? '1.0.0';
const nextVersion = NextVersion(previousVersion, bumpArg);

for (const relativeFile of targets) {
    const file = path.join(rootDir, relativeFile);
    if (!fs.existsSync(file)) {
        continue;
    }
    const data = ReadJSON(file);
    data.version = nextVersion;
    WriteJSON(file, data);
    console.log(`${relativeFile}: ${previousVersion} -> ${nextVersion}`);
}
