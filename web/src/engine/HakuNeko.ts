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
import { ChapterMonitor } from './library/ChapterMonitor';

export class HakuNeko {

    readonly #storageController: StorageController;
    readonly #settingsManager: SettingsManager;
    readonly #featureFlags: FeatureFlags;
    readonly #pluginController: PluginController;
    readonly #bookmarkPlugin: BookmarkPlugin;
    readonly #itemflagManager: ItemflagManager;
    readonly #downloadManager: DownloadManager;
    readonly #pastedClipboardURL = new Observable<URL>(null);
    readonly #chapterMonitor: ChapterMonitor;

    constructor() {
        this.#storageController = CreateStorageController();
        this.#settingsManager = new SettingsManager(this.#storageController);
        this.#featureFlags = new FeatureFlags(this.#settingsManager);
        this.#pluginController = new PluginController(
            this.#storageController,
            this.#settingsManager
        );
        this.#bookmarkPlugin = new BookmarkPlugin(
            this.#storageController,
            this.#pluginController,
            new InteractiveFileContentProvider()
        );
        this.#itemflagManager = new ItemflagManager(this.#storageController);
        this.#downloadManager = new DownloadManager(this.#storageController);

        this.#chapterMonitor = new ChapterMonitor(
            this.#bookmarkPlugin,
            this.#settingsManager,
            {
                onNewContent: async statuses => {
                    if(statuses.length === 0) {
                        return;
                    }

                    const scope = this.SettingsManager.OpenScope();

                    if(!scope.Get<Check>(
                        GlobalKey.AutoDownloadNewContent
                    ).Value) {
                        return;
                    }

                    const bookmarkKeys = new Set(
                        statuses.map(status => status.bookmarkKey)
                    );

                    this.ChapterMonitor.RecordEvent({
                        timestamp: new Date(),
                        type: 'auto-download-started',
                        message:
                            `Téléchargement automatique de `
                            + `${statuses.length} série(s) démarré`
                    });

                    try {
                        const report =
                            await this.BookmarkPlugin.AutoDownloadNewContent(
                                scope.Get<Numeric>(
                                    GlobalKey.AutoDownloadNewContentMaxItems
                                ).Value,
                                scope.Get<Check>(
                                    GlobalKey.AutoDownloadIgnoreSpecials
                                ).Value,
                                scope.Get<Numeric>(
                                    GlobalKey.AutoDownloadDelay
                                ).Value,
                                bookmarkKeys
                            );

                        const skippedCount =
                            report.skippedSpecials
                            + report.skippedByLimit;

                        this.ChapterMonitor.RecordAutoDownloadReport(
                            report.chaptersQueued,
                            skippedCount
                        );

                        this.ChapterMonitor.RecordEvent({
                            timestamp: new Date(),
                            type: 'auto-download-finished',
                            queuedCount: report.chaptersQueued,
                            skippedCount,
                            message:
                                `${report.chaptersQueued} chapitre(s) `
                                + `ajouté(s) à la file`
                                + (
                                    skippedCount > 0
                                        ? `, ${skippedCount} ignoré(s)`
                                        : ''
                                )
                        });

                        await this.ShowAutoDownloadNotification(
                            statuses.length,
                            report.chaptersQueued,
                            skippedCount,
                            report.errors
                        );
                    } catch(error) {
                        const message = error instanceof Error
                            ? error.message
                            : String(error);

                        this.ChapterMonitor.RecordEvent({
                            timestamp: new Date(),
                            type: 'auto-download-error',
                            message
                        });

                        throw error;
                    }
                }
            }
        );

        SetupFetchProvider(this.#featureFlags);
    }

    public async Initialze(frontends: IFrontendInfo[]): Promise<void> {
        await CreateBloatGuard().Initialize();
        await this.FeatureFlags.Initialize();
        await InitGlobalSettings(this.SettingsManager, frontends);
        CreateRemoteProcedureCallManager(this.#settingsManager);
        CreateRemoteProcedureCallContract();
        this.#chapterMonitor.Initialize();
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

    public get ChapterMonitor(): ChapterMonitor {
        return this.#chapterMonitor;
    }

    public get PastedClipboardURL(): Observable<URL> {
        return this.#pastedClipboardURL;
    }

    private async ShowAutoDownloadNotification(
        seriesCount: number,
        queuedCount: number,
        skippedCount: number,
        errorCount: number
    ): Promise<void> {
        if(!('Notification' in globalThis)) {
            return;
        }

        try {
            let permission = Notification.permission;

            if(permission === 'default') {
                permission = await Notification.requestPermission();
            }

            if(permission !== 'granted') {
                return;
            }

            const details = [
                `${seriesCount} série(s) mise(s) à jour`,
                `${queuedCount} chapitre(s) ajouté(s)`
            ];

            if(skippedCount > 0) {
                details.push(`${skippedCount} ignoré(s)`);
            }

            if(errorCount > 0) {
                details.push(`${errorCount} erreur(s)`);
            }

            new Notification(
                'HakuNeko Next — Surveillance terminée',
                {
                    body: details.join(' · '),
                    tag: 'hakuneko-monitoring',
                    silent: false
                }
            );
        } catch(error) {
            console.warn(
                '[HakuNeko] Unable to display notification',
                error
            );
        }
    }
}
