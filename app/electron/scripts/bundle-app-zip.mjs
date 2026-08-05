import path from 'node:path';
import fs from 'node:fs/promises';
import { run } from '../../tools.mjs';

const pkgFile = 'package.json';
const pkgConfig = JSON.parse(await fs.readFile(pkgFile));
const productName = pkgConfig.productName ?? pkgConfig.title ?? 'HakuNeko Next';
const executableName = pkgConfig.executableName ?? productName;
const safeProductName = productName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');

/**
 * Bundle Portable Binary for Windows
 * See: https://www.electronjs.org/docs/latest/tutorial/application-distribution#manual-packaging
 */
export async function bundle(blinkApplicationSourceDirectory, blinkApplicationResourcesDirectory, blinkDeploymentTemporaryDirectory, blinkDeploymentOutputDirectory) {
    await bundleApp(blinkApplicationSourceDirectory, blinkDeploymentTemporaryDirectory);
    await makePortable(blinkDeploymentTemporaryDirectory);
    await updateBinary(blinkApplicationResourcesDirectory, blinkDeploymentTemporaryDirectory);
    await createZipArchive(blinkDeploymentTemporaryDirectory, blinkDeploymentOutputDirectory);
}

async function bundleApp(blinkApplicationSourceDirectory, blinkDeploymentTemporaryDirectory) {
    const target = path.join(blinkDeploymentTemporaryDirectory, 'resources', 'app');
    await fs.cp(blinkApplicationSourceDirectory, target, { recursive: true });
}

async function makePortable(blinkDeploymentTemporaryDirectory) {
    const userdata = path.join(blinkDeploymentTemporaryDirectory, 'userdata');
    await fs.mkdir(userdata, { recursive: true });

    const pkgfile = path.join(blinkDeploymentTemporaryDirectory, 'resources', 'app', 'package.json');
    const pkg = JSON.parse(await fs.readFile(pkgfile, 'utf8'));
    pkg['user-data-dir'] = 'userdata';
    pkg.title = productName;
    pkg.productName = productName;

    await fs.writeFile(pkgfile, JSON.stringify(pkg, null, 4));
}

async function updateBinary(blinkApplicationResourcesDirectory, blinkDeploymentTemporaryDirectory) {
    const binary = path.join(blinkDeploymentTemporaryDirectory, 'electron.exe');
    const icon = path.join(blinkApplicationResourcesDirectory, process.platform, 'app.ico');
    const rcedit = path.join(blinkApplicationResourcesDirectory, process.platform, 'rcedit64.exe');
    const finalBinary = path.join(blinkDeploymentTemporaryDirectory, `${executableName}.exe`);

    const command = [
        rcedit,
        `"${binary}"`,
        `--set-version-string "ProductName" "${productName}"`,
        `--set-version-string "CompanyName" "HakuNeko Next"`,
        `--set-version-string "LegalCopyright" "${new Date().getFullYear()}"`,
        `--set-version-string "FileDescription" "${pkgConfig.description}"`,
        `--set-version-string "InternalName" "${executableName}"`,
        `--set-version-string "OriginalFilename" "${executableName}.exe"`,
        `--set-file-version "${pkgConfig.version}"`,
        `--set-product-version "${pkgConfig.version}"`,
        `--set-icon "${icon}"`
    ].join(' ');

    await run(command);
    await fs.rename(binary, finalBinary);
}

async function createZipArchive(blinkDeploymentTemporaryDirectory, blinkDeploymentOutputDirectory) {
    const platformName = 'Windows';
    const architecture = path.basename(blinkDeploymentTemporaryDirectory).split('-').at(-1);
    const normalizedArchitecture = architecture === 'ia32'
        ? 'x86'
        : architecture === 'arm64'
            ? 'ARM64'
            : architecture;

    const artifactName = `${safeProductName}-v${pkgConfig.version}-${platformName}-${normalizedArchitecture}.zip`;
    const artifact = path.join(blinkDeploymentOutputDirectory, artifactName);

    await fs.rm(artifact, { force: true });

    const command = `powershell "Compress-Archive -Path '${blinkDeploymentTemporaryDirectory}' -DestinationPath '${artifact}' -Force"`;
    await run(command);
}
