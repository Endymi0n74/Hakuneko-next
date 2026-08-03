import { Initialize as InitGlobalSettings, Key as GlobalKey } from './SettingsGlobal';
import { Tags } from './Tags';
import { PluginController } from './PluginController';
import { BookmarkPlugin } from './providers/BookmarkPlugin';
import { ItemflagManager } from './ItemflagManager';
import { CreateStorageController, type StorageController } from './StorageController';
import { InteractiveFileContentProvider } from './InteractiveFileContentProvider';
import { SettingsManager, type Check, type Numeric } from './SettingsManager';
import { FeatureFlags } from './FeatureFlags';
import { DownloadManager } from './DownloadManager';
import { CreateBloatGuard } from './platform/BloatGuard';
import { SetupFetchProvider } from './platform/FetchProvider';
import { CreateRemoteProcedureCallManager } from './platform/RemoteProcedureCallManager';
import { CreateRemoteProcedureCallContract } from './platform/RemoteProcedureCallContract';
import type { IFrontendInfo } from '../frontend/IFrontend';
import { Observable } from './Observable';
import { SetInterval, ClearInterval } from './BackgroundTimers';

export class HakuNeko {

    readonly #storageController: StorageController;
    readonly #settingsManager: SettingsManager;
    readonly #featureFlags: FeatureFlags;
    readonly #pluginController: PluginController;
    readonly #bookmarkPlugin: BookmarkPlugin;
    readonly #itemflagManager: ItemflagManager;
    readonly #downloadManager: DownloadManager;
    readonly #pastedClipboardURL = new Observable<URL>(null);
    #newContentCheckIntervalID?: number;

    constructor() {
        this.#storageController = CreateStorageController();
        this.#settingsManager = new SettingsManager(this.#storageController);
        this.#featureFlags = new FeatureFlags(this.#settingsManager);
        this.#pluginController = new PluginController(this.#storageController, this.#settingsManager);
        this.#bookmarkPlugin = new BookmarkPlugin(this.#storageController, this.#pluginController, new InteractiveFileContentProvider());
        this.#itemflagManager = new ItemflagManager(this.#storageController);
        this.#downloadManager = new DownloadManager(this.#storageController);
        SetupFetchProvider(this.#featureFlags);
    }

    public async Initialze(frontends: IFrontendInfo[]): Promise<void> {
        await CreateBloatGuard().Initialize();
        await this.FeatureFlags.Initialize();
        await InitGlobalSettings(this.SettingsManager, frontends);
        CreateRemoteProcedureCallManager(this.#settingsManager);
        CreateRemoteProcedureCallContract();
        // Preload bookmarks flags to show content to view, then keep re-checking periodically for as long as enabled
        const scope = this.SettingsManager.OpenScope();
        const settingCheckNewContent = scope.Get<Check>(GlobalKey.CheckNewContent);
        const settingCheckNewContentPeriod = scope.Get<Numeric>(GlobalKey.CheckNewContentPeriod);
        settingCheckNewContent.Subscribe(() => this.#ScheduleNewContentCheck());
        settingCheckNewContentPeriod.Subscribe(() => this.#ScheduleNewContentCheck());
        this.#ScheduleNewContentCheck();

    }

    async #PerformNewContentCheck(): Promise<void> {
        try {
            await this.BookmarkPlugin.RefreshAllFlags();
            const autoDownloadNewContent = this.SettingsManager.OpenScope().Get<Check>(GlobalKey.AutoDownloadNewContent).Value;
            if (autoDownloadNewContent) {
                const maxItemsPerBookmark = this.SettingsManager.OpenScope().Get<Numeric>(GlobalKey.AutoDownloadNewContentMaxItems).Value;
                const ignoreSpecials = this.SettingsManager.OpenScope().Get<Check>(GlobalKey.AutoDownloadIgnoreSpecials).Value;
                const delayMs = this.SettingsManager.OpenScope().Get<Numeric>(GlobalKey.AutoDownloadDelay).Value;
                await this.BookmarkPlugin.AutoDownloadNewContent(maxItemsPerBookmark, ignoreSpecials, delayMs);
            }
        } catch (error) {
            console.warn(error);
        }
    }

    /**
     * (Re-)schedule the recurring new-content check based on the current {@link GlobalKey.CheckNewContent}
     * and {@link GlobalKey.CheckNewContentPeriod} settings. Safe to call repeatedly (e.g. whenever either
     * setting changes) - it always clears any previously running timer first.
     */
    #ScheduleNewContentCheck(): void {
        if (this.#newContentCheckIntervalID !== undefined) {
            ClearInterval(this.#newContentCheckIntervalID);
            this.#newContentCheckIntervalID = undefined;
        }
        const scope = this.SettingsManager.OpenScope();
        const enabled = scope.Get<Check>(GlobalKey.CheckNewContent).Value;
        if (!enabled) {
            return;
        }
        // Run once immediately ...
        this.#PerformNewContentCheck();
        // ... then keep repeating on the configured period
        const periodMinutes = scope.Get<Numeric>(GlobalKey.CheckNewContentPeriod).Value;
        SetInterval(() => this.#PerformNewContentCheck(), Math.max(periodMinutes, 1) * 60 * 1000).then(id => this.#newContentCheckIntervalID = id);
    }

    public get Tags() {
        return Tags;
    }

    public get PluginController(): PluginController {
        return this.#pluginController;
    }

    public get FeatureFlags(): FeatureFlags {
        return this.#featureFlags;
    }

    public get SettingsManager(): SettingsManager {
        return this.#settingsManager;
    }

    public get BookmarkPlugin(): BookmarkPlugin {
        return this.#bookmarkPlugin;
    }

    public get ItemflagManager(): ItemflagManager {
        return this.#itemflagManager;
    }

    public get DownloadManager(): DownloadManager {
        return this.#downloadManager;
    }

    public get PastedClipboardURL(): Observable<URL> {
        return this.#pastedClipboardURL;
    }
}