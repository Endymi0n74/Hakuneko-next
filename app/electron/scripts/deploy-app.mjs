import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import extract from 'extract-zip';
import { download } from '../../tools.mjs';

const pkgFile = 'package.json';
const pkgConfig = JSON.parse(await fs.readFile(pkgFile, 'utf8'));

const dirRes = path.join('..', 'res');
const dirApp = path.join('.', 'build');
const dirOut = path.join('.', 'bundle');

const electronVersion = pkgConfig.devDependencies.electron;

/**
 * Download and extract an Electron runtime for the requested target.
 */
async function redist(
    version,
    platform,
    architecture
) {
    const base =
        `electron-v${version}-${platform}-${architecture}`;

    const archive = `${base}.zip`;

    const sourceFile =
        `https://github.com/electron/electron/releases/download/`
        + `v${version}/${archive}`;

    const tmpFile = path.resolve(
        os.tmpdir(),
        archive
    );

    const runtimeDirectory = path.resolve(
        os.tmpdir(),
        base
    );

    try {
        await fs.access(tmpFile);
    } catch {
        console.log(
            'Downloading:',
            sourceFile,
            '=>',
            '$TMP/' + path.basename(tmpFile)
        );

        await download(sourceFile, tmpFile);
    }

    console.log(
        'Extracting:',
        '$TMP/' + path.basename(tmpFile),
        '=>',
        '$TMP/' + path.basename(runtimeDirectory)
    );

    await fs.rm(runtimeDirectory, {
        force: true,
        recursive: true
    });

    await extract(tmpFile, {
        dir: runtimeDirectory
    });

    return runtimeDirectory;
}

await fs.mkdir(dirOut, {
    recursive: true
});

if(process.platform === 'darwin') {
    const bundler = await import('./bundle-app-dmg.mjs');

    let runtime = await redist(
        electronVersion,
        process.platform,
        'x64'
    );

    await bundler.bundle(
        dirApp,
        dirRes,
        runtime,
        dirOut
    );

    runtime = await redist(
        electronVersion,
        process.platform,
        'arm64'
    );

    await bundler.bundle(
        dirApp,
        dirRes,
        runtime,
        dirOut
    );
}

if(process.platform === 'win32') {
    const {
        buildWindowsDistribution
    } = await import('../../packaging/windows.mjs');

    for(const architecture of [
        'ia32',
        'x64',
        'arm64'
    ]) {
        const runtime = await redist(
            electronVersion,
            process.platform,
            architecture
        );

        await buildWindowsDistribution({
            applicationSourceDirectory: dirApp,
            resourcesDirectory: dirRes,
            runtimeDirectory: runtime,
            outputDirectory: dirOut,
            packageConfig: pkgConfig,
            architecture
        });
    }
}

if(process.platform === 'linux') {
    const bundler = await import('./bundle-app-snap.mjs');

    const runtime = await redist(
        electronVersion,
        process.platform,
        'x64'
    );

    await bundler.bundle(
        dirApp,
        dirRes,
        runtime,
        dirOut
    );
}
