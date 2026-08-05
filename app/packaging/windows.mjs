import path from 'node:path';
import fs from 'node:fs/promises';
import { run } from '../tools.mjs';
import {
    createWindowsArtifactName,
    normalizeArchitecture,
    sanitizeProductName
} from './naming.mjs';
import { createWindowsZip } from './archive.mjs';

async function prepareApplicationPackage(applicationDirectory, productName) {
    const packageFile = path.join(
        applicationDirectory,
        'resources',
        'app',
        'package.json'
    );

    const packageConfig = JSON.parse(
        await fs.readFile(packageFile, 'utf8')
    );

    packageConfig.title = productName;
    packageConfig.productName = productName;
    packageConfig['user-data-dir'] = 'userdata';

    await fs.writeFile(
        packageFile,
        JSON.stringify(packageConfig, null, 4),
        'utf8'
    );

    await fs.mkdir(
        path.join(applicationDirectory, 'userdata'),
        { recursive: true }
    );
}

async function updateWindowsExecutable(
    applicationDirectory,
    resourcesDirectory,
    packageConfig,
    productName
) {
    const sourceExecutable = path.join(
        applicationDirectory,
        'electron.exe'
    );

    const executableName =
        packageConfig.executableName
        ?? productName;

    const targetExecutable = path.join(
        applicationDirectory,
        `${executableName}.exe`
    );

    const icon = path.join(
        resourcesDirectory,
        'win32',
        'app.ico'
    );

    const rcedit = path.join(
        resourcesDirectory,
        'win32',
        'rcedit64.exe'
    );

    const command = [
        rcedit,
        `"${sourceExecutable}"`,
        `--set-version-string "ProductName" "${productName}"`,
        `--set-version-string "CompanyName" "HakuNeko Next"`,
        `--set-version-string "LegalCopyright" "${new Date().getFullYear()}"`,
        `--set-version-string "FileDescription" "${packageConfig.description}"`,
        `--set-version-string "InternalName" "${executableName}"`,
        `--set-version-string "OriginalFilename" "${executableName}.exe"`,
        `--set-file-version "${packageConfig.version}"`,
        `--set-product-version "${packageConfig.version}"`,
        `--set-icon "${icon}"`
    ].join(' ');

    await run(command);
    await fs.rename(sourceExecutable, targetExecutable);
}

/**
 * Assemble a clean Windows distribution.
 *
 * The downloaded Electron directory is only used as an input. The final
 * archive always contains a top-level folder named after the product:
 *
 * HakuNeko Next/
 *   HakuNeko Next.exe
 *   resources/
 *   locales/
 *   ...
 */
export async function buildWindowsDistribution({
    applicationSourceDirectory,
    resourcesDirectory,
    runtimeDirectory,
    outputDirectory,
    packageConfig,
    architecture
}) {
    const productName =
        packageConfig.productName
        ?? packageConfig.title
        ?? 'HakuNeko Next';

    const normalizedArchitecture =
        normalizeArchitecture(architecture);

    const safeProductName =
        sanitizeProductName(productName);

    const stagingRoot = path.join(
        outputDirectory,
        '.staging',
        `${safeProductName}-${normalizedArchitecture}`
    );

    const applicationDirectory = path.join(
        stagingRoot,
        productName
    );

    const artifact = path.join(
        outputDirectory,
        createWindowsArtifactName(
            productName,
            packageConfig.version,
            normalizedArchitecture
        )
    );

    await fs.rm(stagingRoot, {
        force: true,
        recursive: true
    });

    await fs.mkdir(outputDirectory, {
        recursive: true
    });

    try {
        // Copy the runtime under the final product folder name.
        await fs.cp(
            runtimeDirectory,
            applicationDirectory,
            { recursive: true }
        );

        // Copy the compiled application into Electron's resources/app.
        await fs.cp(
            applicationSourceDirectory,
            path.join(
                applicationDirectory,
                'resources',
                'app'
            ),
            { recursive: true }
        );

        await prepareApplicationPackage(
            applicationDirectory,
            productName
        );

        await updateWindowsExecutable(
            applicationDirectory,
            resourcesDirectory,
            packageConfig,
            productName
        );

        await createWindowsZip(
            applicationDirectory,
            artifact
        );

        console.log(
            'Created Windows distribution:',
            artifact
        );
    } finally {
        await fs.rm(stagingRoot, {
            force: true,
            recursive: true
        });
    }

    return artifact;
}
