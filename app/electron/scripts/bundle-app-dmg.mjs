import path from 'node:path';
import fs from 'node:fs/promises';
import * as plist from 'plist';
import { run, wait } from '../../tools.mjs';

const pkgFile = 'package.json';
const pkgConfig = JSON.parse(
    await fs.readFile(pkgFile, 'utf8')
);

const productName =
    pkgConfig.productName
    ?? pkgConfig.title
    ?? 'HakuNeko Next';

const executableName =
    pkgConfig.executableName
    ?? productName;

const safeProductName = productName
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '');

const bundleIdentifier =
    pkgConfig.bundleIdentifier
    ?? 'io.github.Endymi0n74.HakuNekoNext';

/**
 * Bundle a clean macOS disk image.
 *
 * No application or volume name is hard-coded in AppleScript. The DMG layout
 * script receives both names as arguments, so future branding changes do not
 * break the build.
 */
export async function bundle(
    blinkApplicationSourceDirectory,
    blinkApplicationResourcesDirectory,
    blinkDeploymentTemporaryDirectory,
    blinkDeploymentOutputDirectory
) {
    await bundleApp(
        blinkApplicationSourceDirectory,
        blinkDeploymentTemporaryDirectory
    );

    await replaceIcons(
        blinkApplicationResourcesDirectory,
        blinkDeploymentTemporaryDirectory
    );

    await replacePlist(
        blinkDeploymentTemporaryDirectory
    );

    await cleanup(
        blinkDeploymentTemporaryDirectory
    );

    await createDiskImage(
        blinkApplicationResourcesDirectory,
        blinkDeploymentTemporaryDirectory,
        blinkDeploymentOutputDirectory
    );
}

async function bundleApp(
    blinkApplicationSourceDirectory,
    blinkDeploymentTemporaryDirectory
) {
    const target = path.join(
        blinkDeploymentTemporaryDirectory,
        'Electron.app',
        'Contents',
        'Resources',
        'app'
    );

    await fs.cp(
        blinkApplicationSourceDirectory,
        target,
        { recursive: true }
    );
}

async function replaceIcons(
    blinkApplicationResourcesDirectory,
    blinkDeploymentTemporaryDirectory
) {
    const source = path.join(
        blinkApplicationResourcesDirectory,
        process.platform,
        'app.iconset'
    );

    const target = path.join(
        blinkDeploymentTemporaryDirectory,
        'Electron.app',
        'Contents',
        'Resources',
        'electron.icns'
    );

    await run(
        `iconutil --convert icns --output '${target}' '${source}'`
    );
}

async function replacePlist(
    blinkDeploymentTemporaryDirectory
) {
    const applicationDirectory = path.join(
        blinkDeploymentTemporaryDirectory,
        'Electron.app'
    );

    const binary = path.join(
        applicationDirectory,
        'Contents',
        'MacOS',
        'Electron'
    );

    const finalBinary = path.join(
        applicationDirectory,
        'Contents',
        'MacOS',
        executableName
    );

    const file = path.join(
        applicationDirectory,
        'Contents',
        'Info.plist'
    );

    const xml = await fs.readFile(file, 'utf8');
    const meta = plist.parse(xml);

    meta.CFBundleExecutable = executableName;
    meta.CFBundleName = productName;
    meta.CFBundleDisplayName = productName;
    meta.CFBundleIdentifier = bundleIdentifier;
    meta.CFBundleVersion = pkgConfig.version;
    meta.CFBundleShortVersionString = pkgConfig.version;

    await fs.writeFile(
        file,
        plist.build(meta),
        'utf8'
    );

    await fs.rename(binary, finalBinary);
}

async function cleanup(
    blinkDeploymentTemporaryDirectory
) {
    const entries = await fs.readdir(
        blinkDeploymentTemporaryDirectory
    );

    for(const entry of entries) {
        if(entry === 'Electron.app') {
            continue;
        }

        await fs.rm(
            path.join(
                blinkDeploymentTemporaryDirectory,
                entry
            ),
            {
                force: true,
                recursive: true
            }
        );
    }

    await fs.rm(
        `${blinkDeploymentTemporaryDirectory}.dmg`,
        { force: true }
    );

    const sourceApplication = path.join(
        blinkDeploymentTemporaryDirectory,
        'Electron.app'
    );

    const finalApplication = path.join(
        blinkDeploymentTemporaryDirectory,
        `${productName}.app`
    );

    await fs.rename(
        sourceApplication,
        finalApplication
    );

    await run(
        `xattr -r -c '${finalApplication}'`
    );

    await run(
        `chmod -R +X '${finalApplication}'`
    );
}

function getArchitecture(
    blinkDeploymentTemporaryDirectory
) {
    const directoryName = path.basename(
        blinkDeploymentTemporaryDirectory
    );

    const architecture = directoryName
        .split('-')
        .at(-1);

    return architecture === 'arm64'
        ? 'ARM64'
        : architecture ?? 'unknown';
}

async function createDiskImage(
    blinkApplicationResourcesDirectory,
    blinkDeploymentTemporaryDirectory,
    blinkDeploymentOutputDirectory
) {
    const poster = path.join(
        blinkApplicationResourcesDirectory,
        process.platform,
        'setup.png'
    );

    const layoutScript = path.resolve(
        '..',
        'packaging',
        'macos-layout.applescript'
    );

    const imagesDirectory = path.join(
        blinkDeploymentTemporaryDirectory,
        '.images'
    );

    await fs.mkdir(
        imagesDirectory,
        { recursive: true }
    );

    await fs.cp(
        poster,
        path.join(
            imagesDirectory,
            'setup.png'
        )
    );

    const writableImage =
        `${blinkDeploymentTemporaryDirectory}.dmg`;

    await run(
        `hdiutil create `
        + `-volname '${productName}' `
        + `-srcfolder '${blinkDeploymentTemporaryDirectory}' `
        + `-fs 'HFS+' `
        + `-fsargs '-c c=64,a=16,e=16' `
        + `-format 'UDRW' `
        + `'${blinkDeploymentTemporaryDirectory}'`
    );

    await run(
        `hdiutil attach `
        + `-readwrite `
        + `-noverify `
        + `-noautoopen `
        + `'${writableImage}'`
    );

    await wait(5000);

    try {
        await run(
            `osascript `
            + `'${layoutScript}' `
            + `'${productName}' `
            + `'${productName}.app'`
        );

        await run('sync');
        await wait(3000);
    } finally {
        await run(
            `hdiutil detach '/Volumes/${productName}'`
        );

        await wait(3000);
    }

    const architecture = getArchitecture(
        blinkDeploymentTemporaryDirectory
    );

    const artifact = path.join(
        blinkDeploymentOutputDirectory,
        `${safeProductName}-v${pkgConfig.version}`
        + `-macOS-${architecture}.dmg`
    );

    await fs.rm(
        artifact,
        { force: true }
    );

    await run(
        `hdiutil convert `
        + `'${writableImage}' `
        + `-format 'UDZO' `
        + `-imagekey zlib-level=9 `
        + `-o '${artifact}'`
    );

    console.log(
        'Created macOS distribution:',
        artifact
    );
}
