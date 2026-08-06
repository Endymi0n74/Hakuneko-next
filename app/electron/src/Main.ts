import path from 'path';
import fs from 'fs/promises';
import { pathToFileURL } from 'url';
import { app, shell } from 'electron';
import { Command } from 'commander';
import { IPC } from './ipc/InterProcessCommunication';
import { ApplicationWindow } from './ipc/ApplicationWindow';
import { FetchProvider } from './ipc/FetchProvider';
import { InitializeMenu } from './Menu';
import { BloatGuard } from './ipc/BloatGuard';
import { RemoteBrowserWindowController } from './ipc/RemoteBrowserWindow';
import { RPCServer } from '../../src/rpc/Server';
import { RemoteProcedureCallManager } from './ipc/RemoteProcedureCallManager';
import { RemoteProcedureCallContract } from './ipc/RemoteProcedureCallContract';
import { LoadWindowState, TrackWindowState } from './WindowState';

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

/**
 * Only allow navigating away to http(s)/mailto targets,
 * opened in the operating system default browser.
 */
function IsSafeExternalURL(url: string): boolean {
    try {
        return ['http:', 'https:', 'mailto:'].includes(new URL(url).protocol);
    } catch {
        return false;
    }
}

type CLIOptions = {
    origin?: string;
};

app.commandLine.appendSwitch('allow-running-insecure-content');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

function ParseCLI(): CLIOptions {
    try {
        const argv = new Command()
            .allowUnknownOption(true)
            .allowExcessArguments(true)
            .option(
                '--origin [url]',
                'custom location from which the web-app shall be loaded'
            )
            .parse(process.argv, { from: 'electron' });

        return argv.opts<CLIOptions>();
    } catch {
        return {};
    }
}

type Manifest = {
    url?: string;
    'user-agent'?: string;
    'user-data-dir'?: string;
};

async function LoadManifest(): Promise<Manifest> {
    const file = path.resolve(app.getAppPath(), 'package.json');
    const content = await fs.readFile(path.normalize(file), {
        encoding: 'utf-8'
    });

    return JSON.parse(content) as Manifest;
}

async function SetupUserDataDirectory(manifest: Manifest): Promise<void> {
    const userDataDir = manifest['user-data-dir'];

    if(userDataDir) {
        app.setPath(
            'userData',
            path.isAbsolute(userDataDir)
                ? userDataDir
                : path.resolve(path.dirname(app.getPath('exe')), userDataDir)
        );
    }
}

async function CreateApplicationWindow(): Promise<ApplicationWindow> {
    const savedState = await LoadWindowState();

    const win = new ApplicationWindow({
        show: false,
        width: savedState.width ?? 1280,
        height: savedState.height ?? 800,
        minWidth: 760,
        minHeight: 520,
        ...Number.isFinite(savedState.x) && Number.isFinite(savedState.y)
            ? {
                x: savedState.x,
                y: savedState.y
            }
            : {
                center: true
            },
        frame: false,
        transparent: true,
        webPreferences: {
            sandbox: false,
            webSecurity: false,
            contextIsolation: true,
            nodeIntegration: false,
            nodeIntegrationInWorker: false,
            nodeIntegrationInSubFrames: false,
            disableBlinkFeatures: 'AutomationControlled',
            preload: path.resolve(app.getAppPath(), 'preload.js')
        }
    });

    win.setMenuBarVisibility(false);

    win.webContents.setWindowOpenHandler(({ url }) => {
        if(IsSafeExternalURL(url)) {
            shell.openExternal(url).catch(error => console.warn(error));
        }

        return {
            action: 'deny'
        };
    });

    win.webContents.on(
        'did-fail-load',
        (
            event,
            errorCode,
            errorDescription,
            validatedURL
        ) => {
            console.error('Failed to load application window:', {
                errorCode,
                errorDescription,
                validatedURL
            });
        }
    );

    win.webContents.on(
        'console-message',
        (
            event,
            level,
            message,
            line,
            sourceId
        ) => {
            console.log('Renderer:', {
                level,
                message,
                line,
                sourceId
            });
        }
    );

    TrackWindowState(win);

    if(savedState.maximized) {
        win.maximize();
    }

    win.on('closed', () => app.quit());

    return win;
}

function CheckHostPermission(url: string, appURI: URL): boolean {
    try {
        const requestedURI = new URL(url);

        if(appURI.protocol === 'file:') {
            return requestedURI.protocol === 'file:';
        }

        return requestedURI.hostname === appURI.hostname;
    } catch {
        return false;
    }
}

function UpdatePermissions(
    session: Electron.Session,
    appURI: URL
): void {
    session.setPermissionCheckHandler(
        (
            webContents,
            permission,
            requestingOrigin
        ) => CheckHostPermission(requestingOrigin, appURI)
    );

    session.setPermissionRequestHandler(
        (
            webContents,
            permission,
            callback,
            details
        ) => {
            callback(CheckHostPermission(details.requestingUrl, appURI));
        }
    );

    /*
     * TODO: Remove this workaround when the Electron issue is resolved:
     * https://github.com/electron/electron/issues/41957
     */
    session.on(
        'file-system-access-restricted',
        (
            event,
            details,
            callback
        ) => {
            callback(
                CheckHostPermission(details.origin, appURI)
                    ? 'allow'
                    : 'deny'
            );
        }
    );
}

/**
 * Finds the web application's index.html inside the packaged application.
 *
 * Several paths are checked so the Electron bundle can work regardless of
 * whether the deployment script copies the web build into "web", "dist",
 * "public", or directly into the application root.
 */
async function FindPackagedWebApplication(): Promise<string> {
    const appPath = app.getAppPath();
    const resourcesPath = process.resourcesPath;

    const candidates = [
        path.resolve(appPath, 'web', 'index.html'),
        path.resolve(appPath, 'dist', 'index.html'),
        path.resolve(appPath, 'public', 'index.html'),
        path.resolve(appPath, 'index.html'),

        path.resolve(resourcesPath, 'web', 'index.html'),
        path.resolve(resourcesPath, 'dist', 'index.html'),
        path.resolve(resourcesPath, 'app', 'web', 'index.html'),
        path.resolve(resourcesPath, 'app', 'dist', 'index.html'),
        path.resolve(resourcesPath, 'app', 'index.html')
    ];

    for(const candidate of candidates) {
        try {
            await fs.access(candidate);
            console.log(`Packaged web application found: ${candidate}`);
            return candidate;
        } catch {
            // Try the next candidate.
        }
    }

    throw new Error(
        [
            'Unable to locate the packaged web application.',
            'The Electron bundle must contain an index.html file.',
            'Searched paths:',
            ...candidates.map(candidate => `- ${candidate}`)
        ].join('\n')
    );
}

async function OpenWindow(): Promise<void> {
    try {
        InitializeMenu();

        const argv = ParseCLI();
        const manifest = await LoadManifest();

        await SetupUserDataDirectory(manifest);

        app.userAgentFallback =
            manifest['user-agent']
            ?? app.userAgentFallback
                .split(/\s+/)
                .filter(segment => !/(hakuneko|electron)/i.test(segment))
                .join(' ');

        await app.whenReady();

        const win = await CreateApplicationWindow();
        const ipc = new IPC(win.webContents);

        const rpc = new RPCServer(
            '/hakuneko',
            new RemoteProcedureCallContract(
                ipc,
                win.webContents
            )
        );

        new RemoteProcedureCallManager(rpc, ipc);
        new FetchProvider(ipc, win.webContents);
        new RemoteBrowserWindowController(ipc);
        new BloatGuard(ipc, win.webContents);

        win.RegisterChannels(ipc);

        /*
         * Determine the final application URL first, then configure
         * permissions for that URL.
         */
        let applicationURI: URL;

        if(argv.origin) {
            applicationURI = new URL(argv.origin);
            UpdatePermissions(
                win.webContents.session,
                applicationURI
            );

            await win.loadURL(applicationURI.href);
        } else if(!app.isPackaged && manifest.url) {
            applicationURI = new URL(manifest.url);
            UpdatePermissions(
                win.webContents.session,
                applicationURI
            );

            await win.loadURL(applicationURI.href);
        } else {
            const indexPath = await FindPackagedWebApplication();
            applicationURI = pathToFileURL(indexPath);

            UpdatePermissions(
                win.webContents.session,
                applicationURI
            );

            await win.loadFile(indexPath);
        }
    } catch(error) {
        console.error('Failed to start HakuNeko-Next:', error);
        app.quit();
    }
}

OpenWindow();
