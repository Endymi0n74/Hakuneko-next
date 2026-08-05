import { ClearInterval, SetInterval } from '../BackgroundTimers';
import { Observable, ObservableArray, ObservableMap } from '../Observable';
import type { Bookmark } from '../providers/Bookmark';
import type { BookmarkPlugin } from '../providers/BookmarkPlugin';
import type { MediaChild } from '../providers/MediaPlugin';
import type { Check, Numeric, SettingsManager } from '../SettingsManager';
import { Key as GlobalKey } from '../SettingsGlobal';
import type { LibraryEvent } from './models/LibraryEvent';
import type { LibraryHistoryEntry } from './models/LibraryHistory';
import {
    LibraryStatusKind,
    type LibrarySeriesStatus
} from './models/LibraryStatus';
import type { LibrarySummary } from './models/LibrarySummary';

function GetMediaTitle(entry?: MediaChild): string | undefined {
    if(entry && 'Title' in entry && typeof entry.Title === 'string') {
        return entry.Title;
    }

    return undefined;
}

function CreateEmptySummary(): LibrarySummary {
    return {
        total: 0,
        checking: 0,
        upToDate: 0,
        newContent: 0,
        errors: 0,
        newChapterCount: 0
    };
}

export type ChapterMonitorOptions = {
    readonly onNewContent?: (
        statuses: ReadonlyArray<LibrarySeriesStatus>
    ) => Promise<void>;
};

/**
 * Periodically checks bookmarked series and exposes reactive state that can
 * later be consumed by a monitoring page.
 *
 * Chapter detection itself remains based on HakuNeko's existing bookmark and
 * item-flag systems. This class only orchestrates checks and exposes results.
 */
export class ChapterMonitor {

    public readonly Statuses =
        new ObservableMap<string, LibrarySeriesStatus>(new Map());

    public readonly History =
        new ObservableArray<LibraryHistoryEntry>([]);

    public readonly Events =
        new ObservableArray<LibraryEvent>([]);

    public readonly IsRunning =
        new Observable<boolean>(false);

    public readonly LastChecked =
        new Observable<Date | null>(null);

    public readonly Summary =
        new Observable<LibrarySummary>(CreateEmptySummary());

    #intervalID?: number;
    #initialized = false;

    constructor(
        private readonly bookmarks: BookmarkPlugin,
        private readonly settings: SettingsManager,
        private readonly options: ChapterMonitorOptions = {}
    ) {}

    /**
     * Subscribe to settings and start the automatic scheduler when enabled.
     * Multiple calls are ignored.
     */
    public Initialize(): void {
        if(this.#initialized) {
            return;
        }

        this.#initialized = true;

        const scope = this.settings.OpenScope();

        scope
            .Get<Check>(GlobalKey.CheckNewContent)
            .Subscribe(() => this.Schedule());

        scope
            .Get<Numeric>(GlobalKey.CheckNewContentPeriod)
            .Subscribe(() => this.Schedule());

        this.Schedule();
    }

    /**
     * Stop the current automatic scheduler without changing user settings.
     */
    public Stop(): void {
        if(this.#intervalID !== undefined) {
            ClearInterval(this.#intervalID);
            this.#intervalID = undefined;
        }
    }

    /**
     * Run a complete check immediately.
     *
     * A second request is ignored while a check is already running.
     */
    public async CheckNow(): Promise<void> {
        if(this.IsRunning.Value) {
            return;
        }

        this.IsRunning.Value = true;
        this.PushEvent({
            timestamp: new Date(),
            type: 'check-started',
            message: 'Vérification de la bibliothèque démarrée'
        });

        const newContent: LibrarySeriesStatus[] = [];

        try {
            for(const bookmark of this.bookmarks.Entries.Value) {
                const status = await this.CheckBookmark(bookmark);

                if(status.status === LibraryStatusKind.NewContent) {
                    newContent.push(status);
                }
            }

            const checkedAt = new Date();
            this.LastChecked.Value = checkedAt;
            this.UpdateSummary();

            if(newContent.length > 0) {
                await this.options.onNewContent?.(newContent);
            }

            this.PushEvent({
                timestamp: checkedAt,
                type: 'check-finished',
                message: newContent.length > 0
                    ? `${newContent.length} série(s) avec du nouveau contenu`
                    : 'Bibliothèque à jour'
            });
        } finally {
            this.IsRunning.Value = false;
        }
    }

    public ClearHistory(): void {
        this.History.Value = [];
    }

    public ClearEvents(): void {
        this.Events.Value = [];
    }

    private Schedule(): void {
        this.Stop();

        const scope = this.settings.OpenScope();

        if(!scope.Get<Check>(GlobalKey.CheckNewContent).Value) {
            return;
        }

        void this.CheckNow();

        const minutes = Math.max(
            scope.Get<Numeric>(GlobalKey.CheckNewContentPeriod).Value,
            1
        );

        void SetInterval(
            () => void this.CheckNow(),
            minutes * 60 * 1000
        ).then(id => {
            this.#intervalID = id;
        });
    }

    private async CheckBookmark(
        bookmark: Bookmark
    ): Promise<LibrarySeriesStatus> {
        const previous = this.Statuses.Value.get(bookmark.StorageKey);

        this.SetStatus({
            bookmarkKey: bookmark.StorageKey,
            title: bookmark.Title,
            websiteID: bookmark.Parent.Identifier,
            status: LibraryStatusKind.Checking,
            lastChecked: previous?.lastChecked,
            knownChapterCount:
                previous?.knownChapterCount
                ?? bookmark.Entries.Value.length,
            newChapterCount: previous?.newChapterCount ?? 0,
            lastKnownChapter: previous?.lastKnownChapter
        });

        try {
            await bookmark.Update();
            await HakuNeko.ItemflagManager.LoadContainerFlags(bookmark);

            const newEntries = await bookmark.GetUnflaggedContent();
            const latest =
                GetMediaTitle(bookmark.Entries.Value.at(0))
                ?? GetMediaTitle(bookmark.Entries.Value.at(-1));

            const statusKind = newEntries.length > 0
                ? LibraryStatusKind.NewContent
                : LibraryStatusKind.UpToDate;

            const checkedAt = new Date();

            const status: LibrarySeriesStatus = {
                bookmarkKey: bookmark.StorageKey,
                title: bookmark.Title,
                websiteID: bookmark.Parent.Identifier,
                status: statusKind,
                lastChecked: checkedAt,
                knownChapterCount: bookmark.Entries.Value.length,
                newChapterCount: newEntries.length,
                lastKnownChapter: latest
            };

            this.SetStatus(status);

            this.PushHistory({
                timestamp: checkedAt,
                bookmarkKey: bookmark.StorageKey,
                title: bookmark.Title,
                status: statusKind,
                newChapterCount: newEntries.length,
                message: newEntries.length > 0
                    ? `${newEntries.length} nouveau(x) chapitre(s) détecté(s)`
                    : 'Aucun nouveau chapitre'
            });

            if(newEntries.length > 0) {
                this.PushEvent({
                    timestamp: checkedAt,
                    type: 'new-content',
                    bookmarkKey: bookmark.StorageKey,
                    title: bookmark.Title,
                    newChapterCount: newEntries.length,
                    message:
                        `${bookmark.Title} : `
                        + `${newEntries.length} nouveau(x) chapitre(s)`
                });
            }

            return status;
        } catch(error) {
            const checkedAt = new Date();
            const message = error instanceof Error
                ? error.message
                : String(error);

            const status: LibrarySeriesStatus = {
                bookmarkKey: bookmark.StorageKey,
                title: bookmark.Title,
                websiteID: bookmark.Parent.Identifier,
                status: LibraryStatusKind.Error,
                lastChecked: checkedAt,
                knownChapterCount:
                    previous?.knownChapterCount
                    ?? bookmark.Entries.Value.length,
                newChapterCount: previous?.newChapterCount ?? 0,
                lastKnownChapter: previous?.lastKnownChapter,
                error: message
            };

            this.SetStatus(status);

            this.PushHistory({
                timestamp: checkedAt,
                bookmarkKey: bookmark.StorageKey,
                title: bookmark.Title,
                status: LibraryStatusKind.Error,
                newChapterCount: 0,
                message
            });

            this.PushEvent({
                timestamp: checkedAt,
                type: 'error',
                bookmarkKey: bookmark.StorageKey,
                title: bookmark.Title,
                message
            });

            console.warn(
                `[HakuNeko] Monitoring failed for "${bookmark.Title}"`,
                error
            );

            return status;
        }
    }

    private SetStatus(status: LibrarySeriesStatus): void {
        this.Statuses.Set(status.bookmarkKey, status);
        this.UpdateSummary();
    }

    private UpdateSummary(): void {
        const summary = CreateEmptySummary();

        for(const status of this.Statuses.Value.values()) {
            summary.total++;

            switch(status.status) {
                case LibraryStatusKind.Checking:
                    summary.checking++;
                    break;

                case LibraryStatusKind.UpToDate:
                    summary.upToDate++;
                    break;

                case LibraryStatusKind.NewContent:
                    summary.newContent++;
                    summary.newChapterCount += status.newChapterCount;
                    break;

                case LibraryStatusKind.Error:
                    summary.errors++;
                    break;
            }
        }

        this.Summary.Value = summary;
    }

    private PushHistory(entry: LibraryHistoryEntry): void {
        this.History.Unshift(entry);

        if(this.History.Value.length > 250) {
            this.History.Value = this.History.Value.slice(0, 250);
        }
    }

    private PushEvent(event: LibraryEvent): void {
        this.Events.Unshift(event);

        if(this.Events.Value.length > 100) {
            this.Events.Value = this.Events.Value.slice(0, 100);
        }
    }
}
