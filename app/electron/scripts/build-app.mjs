import path from 'node:path';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

const electronDirectory = path.resolve(currentDirectory, '..');
const repositoryDirectory = path.resolve(electronDirectory, '..', '..');

const electronPackageFile = path.resolve(
    electronDirectory,
    'package.json'
);

const rootPackageFile = path.resolve(
    repositoryDirectory,
    'package.json'
);

const buildDirectory = path.resolve(
    electronDirectory,
    'build'
);

const webDirectory = path.resolve(
    repositoryDirectory,
    'web'
);

const webBuildDirectory = path.resolve(
    webDirectory,
    'build'
);

const packagedWebDirectory = path.resolve(
    buildDirectory,
    'web'
);

function run(
    command,
    args,
    cwd,
    env = process.env
) {
    return new Promise((resolve, reject) => {
        const child = spawn(
            command,
            args,
            {
                cwd,
                env,
                shell: process.platform === 'win32',
                stdio: 'inherit'
            }
        );

        child.once('error', reject);

        child.once('exit', code => {
            if(code === 0) {
                resolve();
                return;
            }

            reject(
                new Error(
                    `${command} ${args.join(' ')} failed with exit code ${code}`
                )
            );
        });
    });
}

async function readJSON(file) {
    const content = await fs.readFile(
        file,
        {
            encoding: 'utf-8'
        }
    );

    return JSON.parse(content);
}

async function exists(file) {
    try {
        await fs.access(file);
        return true;
    } catch {
        return false;
    }
}

async function purgeBuildDirectory() {
    console.log(
        `Cleaning Electron build directory: ${buildDirectory}`
    );

    await fs.rm(
        buildDirectory,
        {
            recursive: true,
            force: true
        }
    );

    await fs.mkdir(
        buildDirectory,
        {
            recursive: true
        }
    );
}

async function buildWebApplication() {
    console.log('Building web application for Electron...');

    await fs.rm(
        webBuildDirectory,
        {
            recursive: true,
            force: true
        }
    );

    await run(
        'npm',
        [
            'run',
            'build'
        ],
        webDirectory,
        {
            ...process.env,
            BUILD_TARGET: 'electron'
        }
    );

    const webIndexFile = path.resolve(
        webBuildDirectory,
        'index.html'
    );

    if(!await exists(webIndexFile)) {
        throw new Error(
            [
                'The web application build completed,',
                'but index.html was not generated.',
                `Expected file: ${webIndexFile}`
            ].join(' ')
        );
    }

    console.log(
        `Web application generated: ${webIndexFile}`
    );
}

async function copyWebApplication() {
    console.log(
        `Copying web application to: ${packagedWebDirectory}`
    );

    await fs.rm(
        packagedWebDirectory,
        {
            recursive: true,
            force: true
        }
    );

    await fs.cp(
        webBuildDirectory,
        packagedWebDirectory,
        {
            recursive: true
        }
    );

    const packagedIndexFile = path.resolve(
        packagedWebDirectory,
        'index.html'
    );

    if(!await exists(packagedIndexFile)) {
        throw new Error(
            `Packaged web application is missing: ${packagedIndexFile}`
        );
    }
}

async function createElectronManifest() {
    console.log('Creating packaged Electron manifest...');

    const rootPackage = await readJSON(
        rootPackageFile
    );

    const electronPackage = await readJSON(
        electronPackageFile
    );

    const previousManifestFile = path.resolve(
        buildDirectory,
        'package.json'
    );

    let previousManifest = {};

    try {
        previousManifest = await readJSON(
            previousManifestFile
        );
    } catch {
        previousManifest = {};
    }

    const manifest = {
        name: electronPackage.name,
        version:
            electronPackage.version
            ?? rootPackage.version
            ?? '0.0.0',
        title:
            electronPackage.title
            ?? rootPackage.title
            ?? 'HakuNeko',
        description:
            electronPackage.description
            ?? rootPackage.description,
        license:
            electronPackage.license
            ?? rootPackage.license,
        type: 'commonjs',
        main: electronPackage.main ?? 'main.js',
        'user-data-dir':
            electronPackage['user-data-dir']
            ?? null,
        'user-agent':
            previousManifest['user-agent']
            ?? electronPackage['user-agent']
            ?? null,
        dependencies:
            electronPackage.dependencies
            ?? {}
    };

    await fs.writeFile(
        previousManifestFile,
        JSON.stringify(
            manifest,
            null,
            4
        ),
        {
            encoding: 'utf-8'
        }
    );

    console.log(
        `Packaged manifest created: ${previousManifestFile}`
    );
}

async function installProductionDependencies() {
    console.log(
        'Installing packaged Electron production dependencies...'
    );

    await run(
        'npm',
        [
            'install',
            '--omit=dev',
            '--allow-git=all',
            '--no-audit',
            '--no-fund'
        ],
        buildDirectory,
        {
            ...process.env,
            NPM_CONFIG_ALLOW_GIT: 'all'
        }
    );
}

async function verifyPreparedBuild() {
    const requiredFiles = [
        path.resolve(
            buildDirectory,
            'package.json'
        ),
        path.resolve(
            packagedWebDirectory,
            'index.html'
        )
    ];

    for(const file of requiredFiles) {
        if(!await exists(file)) {
            throw new Error(
                `Required packaged file is missing: ${file}`
            );
        }
    }

    console.log('Electron build preparation completed.');
}

async function main() {
    await purgeBuildDirectory();
    await buildWebApplication();
    await copyWebApplication();
    await createElectronManifest();
    await installProductionDependencies();
    await verifyPreparedBuild();
}

main().catch(error => {
    console.error(
        'Failed to prepare Electron build:',
        error
    );

    process.exitCode = 1;
});