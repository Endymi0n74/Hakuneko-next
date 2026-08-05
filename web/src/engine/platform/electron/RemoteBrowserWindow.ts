import type {
    BrowserWindowConstructorOptions,
    LoadURLOptions
} from 'electron';
import {
    Observable,
    type IObservable
} from '../../Observable';
import type {
    IRemoteBrowserWindow
} from '../RemoteBrowserWindow';
import type { IPC } from '../InterProcessCommunication';
import {
    RemoteBrowserWindowController as Channels
} from '../../../../../app/src/ipc/Channels';

export default class RemoteBrowserWindow
implements IRemoteBrowserWindow {

    private windowID = Number.NaN;

    /*
     * Loading about:blank is only used to initialise the DevTools protocol
     * before registering a preload source. Its DOMReady event must not be
     * forwarded to FetchProviderCommon, otherwise the real scraper script is
     * executed against the blank page and the window is closed too early.
     */
    private suppressDOMReady = false;

    private readonly domReady =
        new Observable<void, RemoteBrowserWindow>(
            null,
            this
        );

    public get DOMReady():
    IObservable<void, RemoteBrowserWindow> {
        return this.domReady;
    }

    private readonly beforeWindowNavigate =
        new Observable<URL, RemoteBrowserWindow>(
            null,
            this
        );

    public get BeforeWindowNavigate():
    IObservable<URL, RemoteBrowserWindow> {
        return this.beforeWindowNavigate;
    }

    private readonly beforeFrameNavigate =
        new Observable<URL, RemoteBrowserWindow>(
            null,
            this
        );

    public get BeforeFrameNavigate():
    IObservable<URL, RemoteBrowserWindow> {
        return this.beforeFrameNavigate;
    }

    constructor(
        private readonly ipc:
            IPC<Channels.App, Channels.Web>
    ) {
        this.ipc.Listen(
            Channels.Web.OnDomReady,
            this.OnDomReady.bind(this)
        );

        this.ipc.Listen(
            Channels.Web.OnBeforeNavigate,
            this.OnBeforeNavigate.bind(this)
        );
    }

    private async OnDomReady(
        windowID: number
    ): Promise<void> {
        if(
            windowID === this.windowID
            && !this.suppressDOMReady
        ) {
            this.domReady.Dispatch();
        }
    }

    private async OnBeforeNavigate(
        windowID: number,
        url: string,
        isMainFrame: boolean,
        isSameDocument: boolean
    ): Promise<void> {
        if(
            windowID === this.windowID
            && url.startsWith('http')
            && !isSameDocument
        ) {
            if(isMainFrame) {
                this.beforeWindowNavigate.Value =
                    new URL(url);
            } else {
                this.beforeFrameNavigate.Value =
                    new URL(url);
            }
        }
    }

    public async Open(
        request: Request,
        show: boolean = false,
        preload: string = ''
    ) {
        const openOptions:
            BrowserWindowConstructorOptions = {
                show,
                width: 1280,
                height: 800,
                center: true,
                webPreferences: {
                    sandbox: true,
                    webSecurity: true,
                    contextIsolation: false,
                    nodeIntegration: false,
                    nodeIntegrationInWorker: false,
                    nodeIntegrationInSubFrames: true,
                    backgroundThrottling: false,
                    disableBlinkFeatures:
                        'AutomationControlled',
                }
            };

        this.windowID =
            await this.ipc.Send<number>(
                Channels.App.OpenWindow,
                JSON.stringify(openOptions)
            );

        if(preload) {
            this.suppressDOMReady = true;

            try {
                await this.ipc.Send<void>(
                    Channels.App.LoadURL,
                    this.windowID,
                    'about:blank',
                    JSON.stringify({})
                );

                await this.SendDebugCommand(
                    'Page.enable'
                );

                await this.SendDebugCommand(
                    'Page.addScriptToEvaluateOnNewDocument',
                    {
                        source: preload
                    }
                );
            } finally {
                this.suppressDOMReady = false;
            }
        }

        const loadOptions: LoadURLOptions = {
            userAgent: navigator.userAgent,
            httpReferrer: request.referrer,
        };

        if(request.headers) {
            loadOptions.extraHeaders =
                Array.from(
                    request.headers,
                    ([key, value]) =>
                        `${key}: ${value}`
                ).join('\n');
        }

        await this.ipc.Send<void>(
            Channels.App.LoadURL,
            this.windowID,
            request.url,
            JSON.stringify(loadOptions)
        );
    }

    public async Close(): Promise<void> {
        if(!isNaN(this.windowID)) {
            return this.ipc.Send<void>(
                Channels.App.CloseWindow,
                this.windowID
            );
        }
    }

    public async Show(): Promise<void> {
        return this.ipc.Send<void>(
            Channels.App.SetVisibility,
            this.windowID,
            true
        );
    }

    public async Hide(): Promise<void> {
        return this.ipc.Send<void>(
            Channels.App.SetVisibility,
            this.windowID,
            false
        );
    }

    public async ExecuteScript<
        T extends void | JSONElement
    >(
        script: string = ''
    ): Promise<T> {
        return this.ipc.Send<T>(
            Channels.App.ExecuteScript,
            this.windowID,
            script
        );
    }

    public async SendDebugCommand<
        T extends void | JSONElement
    >(
        method: string,
        parameters?: JSONObject
    ): Promise<T> {
        return this.ipc.Send<T>(
            Channels.App.SendDebugCommand,
            this.windowID,
            method,
            parameters
        );
    }
}
